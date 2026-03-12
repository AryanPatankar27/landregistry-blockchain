"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { LandRegistryABI, CONTRACT_ADDRESS } from "@/lib/contracts/LandRegistryABI";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { FiSend, FiCheck, FiHash, FiUser } from "react-icons/fi";

export default function TransferPage() {
    const { address, isConnected } = useAccount();
    const { token } = useAppStore();
    const searchParams = useSearchParams();
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const [form, setForm] = useState({
        tokenId: searchParams.get("tokenId") || "",
        buyerAddress: "",
    });

    const [acceptTokenId, setAcceptTokenId] = useState("");

    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.tokenId || !form.buyerAddress) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            toast.loading("Initiating transfer...", { id: "transfer" });

            writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: LandRegistryABI,
                functionName: "initiateTransfer",
                args: [BigInt(form.tokenId), form.buyerAddress as `0x${string}`],
            }, {
                onSuccess: async (txHash) => {
                    toast.success("Transfer initiated!", { id: "transfer" });

                    if (token) {
                        try {
                            await api("/transfer", {
                                method: "POST",
                                token,
                                body: {
                                    tokenId: form.tokenId,
                                    toAddress: form.buyerAddress,
                                    txHash,
                                },
                            });
                        } catch (e) {
                            console.error(e);
                        }
                    }
                },
                onError: (error) => {
                    toast.error("Failed: " + error.message.slice(0, 100), { id: "transfer" });
                },
            });
        } catch (error: any) {
            toast.error(error.message || "Transfer failed");
        }
    };

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptTokenId) {
            toast.error("Enter token ID");
            return;
        }

        try {
            toast.loading("Accepting transfer...", { id: "accept" });

            writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: LandRegistryABI,
                functionName: "acceptTransfer",
                args: [BigInt(acceptTokenId)],
            }, {
                onSuccess: () => {
                    toast.success("Transfer accepted!", { id: "accept" });
                },
                onError: (error) => {
                    toast.error("Failed: " + error.message.slice(0, 100), { id: "accept" });
                },
            });
        } catch (error: any) {
            toast.error(error.message || "Accept failed");
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="section-title">Land Transfers</h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "2.5rem" }}>
                Initiate or accept land ownership transfers. All transfers require registrar approval.
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
                    }}
                >
                    ✅ Transaction confirmed on-chain!
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
                {/* Initiate Transfer */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem", fontSize: "1.1rem" }}>
                        <FiSend size={18} /> Initiate Transfer
                    </h3>
                    <form onSubmit={handleInitiate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiHash size={14} /> Token ID
                            </label>
                            <input
                                value={form.tokenId}
                                onChange={(e) => setForm({ ...form, tokenId: e.target.value })}
                                placeholder="e.g., 1"
                                className="input-field"
                                required
                                type="number"
                                min="1"
                            />
                        </div>
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiUser size={14} /> Buyer Wallet Address
                            </label>
                            <input
                                value={form.buyerAddress}
                                onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
                                placeholder="0x..."
                                className="input-field"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isPending || isConfirming || !isConnected}
                            style={{ width: "100%", justifyContent: "center" }}
                        >
                            {isPending || isConfirming ? (
                                <>
                                    <div className="spinner" /> Processing...
                                </>
                            ) : (
                                <>
                                    <FiSend /> Initiate Transfer
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Accept Transfer */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem", fontSize: "1.1rem" }}>
                        <FiCheck size={18} /> Accept Transfer
                    </h3>
                    <form onSubmit={handleAccept} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                                <FiHash size={14} /> Token ID
                            </label>
                            <input
                                value={acceptTokenId}
                                onChange={(e) => setAcceptTokenId(e.target.value)}
                                placeholder="Token ID of the transfer"
                                className="input-field"
                                required
                                type="number"
                                min="1"
                            />
                        </div>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                            Accept a pending transfer request. The seller must have already initiated
                            the transfer to your wallet address.
                        </p>
                        <button
                            type="submit"
                            className="btn-success"
                            disabled={isPending || isConfirming || !isConnected}
                            style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                        >
                            {isPending || isConfirming ? (
                                <>
                                    <div className="spinner" /> Processing...
                                </>
                            ) : (
                                <>
                                    <FiCheck /> Accept Transfer
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
