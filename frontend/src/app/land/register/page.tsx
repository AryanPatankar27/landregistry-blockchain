"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { LandRegistryABI, CONTRACT_ADDRESS } from "@/lib/contracts/LandRegistryABI";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { FiUpload, FiMapPin, FiHash, FiMaximize } from "react-icons/fi";

export default function RegisterLandPage() {
    const { address, isConnected } = useAccount();
    const { token } = useAppStore();
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const [form, setForm] = useState({
        surveyNumber: "",
        location: "",
        area: "",
        documentsCID: "",
        latitude: "",
        longitude: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!form.surveyNumber || !form.location || !form.area || !form.documentsCID) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            toast.loading("Submitting transaction...", { id: "register" });

            writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: LandRegistryABI,
                functionName: "registerLand",
                args: [
                    form.surveyNumber,
                    form.location,
                    BigInt(form.area),
                    form.documentsCID,
                ],
            }, {
                onSuccess: async (txHash) => {
                    toast.success("Transaction submitted!", { id: "register" });

                    // Cache in backend
                    if (token) {
                        try {
                            await api("/land/register", {
                                method: "POST",
                                token,
                                body: {
                                    tokenId: 0, // Will be updated from events
                                    surveyNumber: form.surveyNumber,
                                    location: form.location,
                                    area: form.area,
                                    documentsCID: form.documentsCID,
                                    latitude: form.latitude || null,
                                    longitude: form.longitude || null,
                                    txHash,
                                },
                            });
                        } catch (e) {
                            console.error("Backend cache error:", e);
                        }
                    }

                    setForm({
                        surveyNumber: "",
                        location: "",
                        area: "",
                        documentsCID: "",
                        latitude: "",
                        longitude: "",
                    });
                },
                onError: (error) => {
                    console.error(error);
                    toast.error("Transaction failed: " + error.message.slice(0, 100), { id: "register" });
                },
            });
        } catch (error: any) {
            toast.error(error.message || "Registration failed");
        }
    };

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
                    ✅ Land registration submitted successfully! Awaiting registrar approval.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        {/* Survey Number */}
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiHash size={16} /> Survey Number *
                            </label>
                            <input
                                name="surveyNumber"
                                value={form.surveyNumber}
                                onChange={handleChange}
                                placeholder="e.g., SRV-2024-001"
                                className="input-field"
                                required
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiMapPin size={16} /> Location *
                            </label>
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="e.g., Village Rampur, Dist. Pune, Maharashtra"
                                className="input-field"
                                required
                            />
                        </div>

                        {/* Area */}
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiMaximize size={16} /> Area (sq. meters) *
                            </label>
                            <input
                                name="area"
                                type="number"
                                value={form.area}
                                onChange={handleChange}
                                placeholder="e.g., 5000"
                                className="input-field"
                                required
                                min="1"
                            />
                        </div>

                        {/* Coordinates */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label style={{ marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600, display: "block" }}>
                                    Latitude
                                </label>
                                <input
                                    name="latitude"
                                    type="number"
                                    step="any"
                                    value={form.latitude}
                                    onChange={handleChange}
                                    placeholder="18.5204"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label style={{ marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600, display: "block" }}>
                                    Longitude
                                </label>
                                <input
                                    name="longitude"
                                    type="number"
                                    step="any"
                                    value={form.longitude}
                                    onChange={handleChange}
                                    placeholder="73.8567"
                                    className="input-field"
                                />
                            </div>
                        </div>

                        {/* Documents CID */}
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiUpload size={16} /> Documents IPFS CID *
                            </label>
                            <input
                                name="documentsCID"
                                value={form.documentsCID}
                                onChange={handleChange}
                                placeholder="e.g., QmX4zdJ..."
                                className="input-field"
                                required
                            />
                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "6px" }}>
                                Upload your documents to IPFS and paste the CID here.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isPending || isConfirming || !isConnected}
                        style={{ width: "100%", justifyContent: "center", marginTop: "2rem", padding: "14px" }}
                    >
                        {isPending || isConfirming ? (
                            <>
                                <div className="spinner" /> Processing...
                            </>
                        ) : (
                            <>Register Land on Blockchain</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
