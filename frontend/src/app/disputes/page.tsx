"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { LandRegistryABI, CONTRACT_ADDRESS } from "@/lib/contracts/LandRegistryABI";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { FiAlertTriangle, FiHash, FiUpload, FiCheck, FiX } from "react-icons/fi";

export default function DisputesPage() {
    const { address, isConnected, chainId } = useAccount();
    const { token, user } = useAppStore();
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
    const { switchChainAsync } = useSwitchChain();

    const [form, setForm] = useState({ tokenId: "", evidenceCID: "" });
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const isRegistrar = user?.role === "REGISTRAR" || user?.role === "ADMIN";

    useEffect(() => {
        if (token && isRegistrar) {
            loadDisputes();
        }
    }, [token]);

    const loadDisputes = async () => {
        setLoading(true);
        try {
            const data = await api("/disputes/pending", { token: token! });
            setDisputes(data.disputes || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRaise = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.tokenId || !form.evidenceCID) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            if (chainId !== sepolia.id) {
                toast.loading("Switching to Sepolia...", { id: "dispute" });
                await switchChainAsync({ chainId: sepolia.id });
            }

            toast.loading("Raising dispute on-chain...", { id: "dispute" });

            writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: LandRegistryABI,
                functionName: "raiseDispute",
                args: [BigInt(form.tokenId), form.evidenceCID],
                gas: BigInt(150_000),
            }, {
                onSuccess: async () => {
                    toast.success("Dispute raised! The parcel is now frozen.", { id: "dispute" });

                    if (token) {
                        try {
                            await api("/disputes", {
                                method: "POST",
                                token,
                                body: {
                                    tokenId: form.tokenId,
                                    evidenceCID: form.evidenceCID,
                                },
                            });
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    setForm({ tokenId: "", evidenceCID: "" });
                },
                onError: (error) => {
                    toast.error("Failed: " + error.message.slice(0, 100), { id: "dispute" });
                },
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to raise dispute");
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h1 className="section-title">Dispute Management</h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "2.5rem" }}>
                Raise a dispute against a land record or resolve existing disputes. Disputed parcels are frozen until resolved.
            </p>

            {/* Raise Dispute Form */}
            <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem", fontSize: "1.1rem" }}>
                    <FiAlertTriangle size={18} style={{ color: "var(--color-warning)" }} /> Raise a Dispute
                </h3>
                <form onSubmit={handleRaise} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                            <FiHash size={14} /> Token ID
                        </label>
                        <input
                            value={form.tokenId}
                            onChange={(e) => setForm({ ...form, tokenId: e.target.value })}
                            placeholder="Token ID of the disputed parcel"
                            className="input-field"
                            required
                            type="number"
                            min="1"
                        />
                    </div>
                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                            <FiUpload size={14} /> Evidence IPFS CID
                        </label>
                        <input
                            value={form.evidenceCID}
                            onChange={(e) => setForm({ ...form, evidenceCID: e.target.value })}
                            placeholder="Upload evidence to IPFS and paste CID"
                            className="input-field"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn-danger"
                        disabled={isPending || isConfirming || !isConnected}
                        style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                    >
                        {isPending || isConfirming ? (
                            <>
                                <div className="spinner" /> Processing...
                            </>
                        ) : (
                            <>
                                <FiAlertTriangle /> Raise Dispute
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Pending Disputes (Registrar view) */}
            {isRegistrar && (
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem", fontSize: "1.1rem" }}>
                        <FiAlertTriangle size={18} /> Pending Disputes
                    </h3>

                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                            <div className="spinner" style={{ width: "30px", height: "30px" }} />
                        </div>
                    ) : disputes.length === 0 ? (
                        <p style={{ color: "var(--color-text-muted)", padding: "1rem 0" }}>
                            No pending disputes.
                        </p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Token ID</th>
                                        <th>Reporter</th>
                                        <th>Evidence</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {disputes.map((d) => (
                                        <tr key={d.id}>
                                            <td style={{ fontFamily: "monospace" }}>#{d.tokenId}</td>
                                            <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                {d.reporter?.slice(0, 8)}...{d.reporter?.slice(-4)}
                                            </td>
                                            <td>
                                                <a
                                                    href={`https://ipfs.io/ipfs/${d.evidenceCID}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: "var(--color-primary-light)", textDecoration: "none" }}
                                                >
                                                    View Evidence
                                                </a>
                                            </td>
                                            <td style={{ fontSize: "0.85rem" }}>
                                                {new Date(d.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        className="btn-success"
                                                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                                        onClick={() => {
                                                            writeContract({
                                                                address: CONTRACT_ADDRESS as `0x${string}`,
                                                                abi: LandRegistryABI,
                                                                functionName: "resolveDispute",
                                                                args: [BigInt(d.tokenId), false],
                                                                gas: BigInt(100_000),
                                                            });
                                                            toast.success("Dispute cleared");
                                                        }}
                                                    >
                                                        <FiCheck size={14} /> Clear
                                                    </button>
                                                    <button
                                                        className="btn-danger"
                                                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                                        onClick={() => {
                                                            writeContract({
                                                                address: CONTRACT_ADDRESS as `0x${string}`,
                                                                abi: LandRegistryABI,
                                                                functionName: "resolveDispute",
                                                                args: [BigInt(d.tokenId), true],
                                                                gas: BigInt(100_000),
                                                            });
                                                            toast.error("Dispute upheld — parcel remains frozen");
                                                        }}
                                                    >
                                                        <FiX size={14} /> Uphold
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
