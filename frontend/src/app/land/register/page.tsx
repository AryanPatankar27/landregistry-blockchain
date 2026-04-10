"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { readContract } from "@wagmi/core";
import { parseEventLogs } from "viem";
import { sepolia } from "wagmi/chains";
import { LandRegistryABI, CONTRACT_ADDRESS } from "@/lib/contracts/LandRegistryABI";
import { config } from "@/lib/wagmi";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { FiUpload, FiMapPin, FiHash, FiMaximize, FiAlertCircle } from "react-icons/fi";

interface PendingCache {
    surveyNumber: string;
    location: string;
    area: number;
    documentsCID: string;
    latitude: string | null;
    longitude: string | null;
}

export default function RegisterLandPage() {
    const { address, isConnected, chainId } = useAccount();
    const { token } = useAppStore();
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });
    const { switchChainAsync } = useSwitchChain();

    const [form, setForm] = useState({
        surveyNumber: "",
        location: "",
        area: "",
        documentsCID: "",
        latitude: "",
        longitude: "",
    });
    const [validating, setValidating] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);

    // Store form data so we can update the backend after the receipt arrives
    const pendingCacheRef = useRef<PendingCache | null>(null);

    // After on-chain confirmation: parse real tokenId from event logs, then cache in backend
    useEffect(() => {
        if (!isSuccess || !receipt || !pendingCacheRef.current || !token) return;

        const pending = pendingCacheRef.current;
        pendingCacheRef.current = null;

        const updateBackend = async () => {
            let tokenId = 0;
            try {
                // Parse LandRegistered event to get the real on-chain tokenId
                const logs = parseEventLogs({
                    abi: LandRegistryABI,
                    logs: receipt.logs,
                    eventName: "LandRegistered",
                });
                if (logs.length > 0) {
                    tokenId = Number((logs[0] as any).args.tokenId);
                }
            } catch (e) {
                console.error("Could not parse LandRegistered event:", e);
            }

            try {
                await api("/land/register", {
                    method: "POST",
                    token,
                    body: {
                        tokenId,
                        surveyNumber: pending.surveyNumber,
                        location: pending.location,
                        area: pending.area,
                        documentsCID: pending.documentsCID,
                        latitude: pending.latitude,
                        longitude: pending.longitude,
                        txHash: hash,
                    },
                });
                console.log(`Backend cached: tokenId=${tokenId}`);
            } catch (e) {
                console.error("Backend cache error:", e);
            }
        };

        updateBackend();
    }, [isSuccess, receipt, token, hash]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFieldError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError(null);

        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        // ── Client-side validation ──
        if (!form.surveyNumber.trim()) { setFieldError("Survey number is required."); return; }
        if (!form.location.trim()) { setFieldError("Location is required."); return; }
        const areaNum = parseFloat(form.area);
        if (!form.area || isNaN(areaNum) || areaNum <= 0) {
            setFieldError("Area must be a number greater than 0.");
            return;
        }
        if (!form.documentsCID.trim()) { setFieldError("Documents IPFS CID is required."); return; }

        try {
            // ── On-chain pre-flight: check survey number is not taken ──
            setValidating(true);
            toast.loading("Checking survey number on-chain…", { id: "validate" });

            let existingTokenId: bigint | undefined;
            try {
                existingTokenId = await readContract(config, {
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: LandRegistryABI,
                    functionName: "getTokenIdBySurvey",
                    args: [form.surveyNumber.trim()],
                }) as bigint;
            } catch (e) {
                console.warn("Pre-check skipped:", e);
            }
            toast.dismiss("validate");
            setValidating(false);

            if (existingTokenId && existingTokenId > 0n) {
                setFieldError(
                    `Survey number "${form.surveyNumber}" is already registered on-chain (Token #${existingTokenId.toString()}).`
                );
                return;
            }

            // ── Switch network if needed ──
            if (chainId !== sepolia.id) {
                toast.loading("Switching to Sepolia…", { id: "register" });
                await switchChainAsync({ chainId: sepolia.id });
            }

            // Store form data for backend update after receipt arrives
            pendingCacheRef.current = {
                surveyNumber: form.surveyNumber.trim(),
                location: form.location.trim(),
                area: areaNum,
                documentsCID: form.documentsCID.trim(),
                latitude: form.latitude || null,
                longitude: form.longitude || null,
            };

            toast.loading("Submitting transaction…", { id: "register" });

            writeContract(
                {
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: LandRegistryABI,
                    functionName: "registerLand",
                    args: [
                        form.surveyNumber.trim(),
                        form.location.trim(),
                        BigInt(Math.floor(areaNum)),
                        form.documentsCID.trim(),
                    ],
                    gas: BigInt(350_000),
                },
                {
                    onSuccess: () => {
                        toast.loading("Transaction submitted — waiting for confirmation…", { id: "register" });
                        // Reset form immediately so user can't double-submit
                        setForm({ surveyNumber: "", location: "", area: "", documentsCID: "", latitude: "", longitude: "" });
                    },
                    onError: (error) => {
                        pendingCacheRef.current = null;
                        const msg = error.message || "";
                        const revertMatch = msg.match(/reason: (.+?)(?:\n|$)/);
                        const userMsg = revertMatch ? revertMatch[1] : "Transaction failed — check your inputs.";
                        toast.error(userMsg, { id: "register" });
                    },
                }
            );
        } catch (error: any) {
            setValidating(false);
            pendingCacheRef.current = null;
            toast.dismiss("validate");
            toast.dismiss("register");
            if (!error?.message?.includes("rejected")) {
                toast.error(error.message || "Registration failed");
            }
        }
    };

    // Show success toast when confirmed
    useEffect(() => {
        if (isSuccess) {
            toast.success("Land registration confirmed on-chain! Awaiting registrar approval.", { id: "register" });
        }
    }, [isSuccess]);

    const isBusy = isPending || isConfirming || validating;

    return (
        <div className="page-container" style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h1 className="section-title">Register New Land</h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
                Submit your land details to register on the blockchain. A registrar will review and approve your submission.
            </p>

            {isSuccess && (
                <div
                    style={{
                        padding: "1rem 1.5rem",
                        borderRadius: "12px",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        color: "var(--color-success)",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    ✅ Land registration confirmed! Awaiting registrar approval.
                </div>
            )}

            {fieldError && (
                <div
                    style={{
                        padding: "0.85rem 1.25rem",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "var(--color-danger)",
                        marginBottom: "1.25rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        fontSize: "0.9rem",
                    }}
                >
                    <FiAlertCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
                    {fieldError}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiHash size={16} /> Survey Number *
                            </label>
                            <input name="surveyNumber" value={form.surveyNumber} onChange={handleChange}
                                placeholder="e.g., SRV-2024-001" className="input-field" required />
                        </div>

                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiMapPin size={16} /> Location *
                            </label>
                            <input name="location" value={form.location} onChange={handleChange}
                                placeholder="e.g., Village Rampur, Dist. Pune, Maharashtra" className="input-field" required />
                        </div>

                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiMaximize size={16} /> Area (sq. meters) *
                            </label>
                            <input name="area" type="number" value={form.area} onChange={handleChange}
                                placeholder="e.g., 5000" className="input-field" required min="1" step="1" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label style={{ marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600, display: "block" }}>Latitude</label>
                                <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange}
                                    placeholder="18.5204" className="input-field" />
                            </div>
                            <div>
                                <label style={{ marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600, display: "block" }}>Longitude</label>
                                <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange}
                                    placeholder="73.8567" className="input-field" />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiUpload size={16} /> Documents IPFS CID *
                            </label>
                            <input name="documentsCID" value={form.documentsCID} onChange={handleChange}
                                placeholder="e.g., QmX4zdJ..." className="input-field" required />
                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "6px" }}>
                                Upload your documents to IPFS and paste the CID here.
                            </p>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isBusy || !isConnected}
                        style={{ width: "100%", justifyContent: "center", marginTop: "2rem", padding: "14px" }}>
                        {validating ? (
                            <><div className="spinner" /> Validating…</>
                        ) : isPending ? (
                            <><div className="spinner" /> Confirm in MetaMask…</>
                        ) : isConfirming ? (
                            <><div className="spinner" /> Waiting for confirmation…</>
                        ) : (
                            <>Register Land on Blockchain</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
