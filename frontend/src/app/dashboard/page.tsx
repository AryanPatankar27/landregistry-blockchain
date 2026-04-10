"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { readContract } from "@wagmi/core";
import { sepolia } from "wagmi/chains";
import { LandRegistryABI, CONTRACT_ADDRESS } from "@/lib/contracts/LandRegistryABI";
import { config } from "@/lib/wagmi";
import { useAppStore } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    FiMap, FiPlus, FiClock, FiCheck, FiX, FiAlertTriangle,
    FiUsers, FiActivity, FiSend
} from "react-icons/fi";

export default function DashboardPage() {
    const { address, isConnected, chainId } = useAccount();
    const { switchChainAsync } = useSwitchChain();
    const { user, token } = useAppStore();

    const [dashData, setDashData] = useState<any>(null);
    const [adminData, setAdminData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionTokenId, setActionTokenId] = useState<number | null>(null);

    const { writeContract, data: txHash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    const isRegistrar = user?.role === "REGISTRAR" || user?.role === "ADMIN";
    const isAdmin = user?.role === "ADMIN";

    const loadDashboard = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        try {
            const endpoint = isRegistrar ? "/dashboard/registrar" : "/dashboard/owner";
            const [main, admin] = await Promise.all([
                api(endpoint, { token }),
                isAdmin ? api("/dashboard/admin", { token }).catch(() => null) : Promise.resolve(null),
            ]);
            setDashData(main.data);
            if (admin) setAdminData(admin.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [token, isRegistrar, isAdmin]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Reload after a transaction confirms
    useEffect(() => {
        if (txConfirmed) {
            toast.success("Transaction confirmed!");
            loadDashboard();
        }
    }, [txConfirmed]);

    const ensureSepolia = async () => {
        if (chainId !== sepolia.id) {
            toast.loading("Switching to Sepolia…", { id: "switch" });
            await switchChainAsync({ chainId: sepolia.id });
            toast.dismiss("switch");
        }
    };

    /**
     * Resolve the real on-chain tokenId for a parcel.
     * The backend may store tokenId=0 when registration is cached before the receipt arrives.
     * We look it up by surveyNumber from the contract in that case.
     */
    const resolveTokenId = async (p: any): Promise<number> => {
        if (p.tokenId && p.tokenId > 0) return p.tokenId;
        if (!p.surveyNumber) throw new Error("Cannot resolve tokenId: no surveyNumber");

        toast.loading("Looking up token ID on-chain…", { id: "resolve" });
        try {
            const realId = await readContract(config, {
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: LandRegistryABI,
                functionName: "getTokenIdBySurvey",
                args: [p.surveyNumber],
            }) as bigint;
            toast.dismiss("resolve");

            if (!realId || realId === 0n) {
                throw new Error(`Survey "${p.surveyNumber}" not found on-chain yet — the registration tx may not be confirmed.`);
            }
            return Number(realId);
        } catch (e: any) {
            toast.dismiss("resolve");
            throw e;
        }
    };

    const handleApprove = async (p: any) => {
        try {
            await ensureSepolia();

            // Resolve the correct on-chain tokenId (handles tokenId=0 in DB)
            const realTokenId = await resolveTokenId(p);
            const storedTokenId = p.tokenId; // may be 0

            setActionTokenId(realTokenId);
            toast.loading("Approving land registration…", { id: "approve" });

            writeContract(
                {
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: LandRegistryABI,
                    functionName: "approveLand",
                    args: [BigInt(realTokenId)],
                    gas: BigInt(250_000),
                },
                {
                    onSuccess: async () => {
                        toast.success("Approval submitted! Waiting for confirmation…", { id: "approve" });
                        if (token) {
                            try {
                                // Update backend: fix tokenId=0 to real value and mark APPROVED
                                await api(`/land/${storedTokenId}/status`, {
                                    method: "PATCH",
                                    token,
                                    body: {
                                        status: "APPROVED",
                                        newTokenId: storedTokenId === 0 ? realTokenId : undefined,
                                    },
                                });
                            } catch (e) { /* non-blocking */ }
                        }
                    },
                    onError: (err) => {
                        const msg = err.message || "";
                        const revert = msg.match(/reason: (.+?)(?:\n|$)/)?.[1];
                        toast.error("Approval failed: " + (revert || msg.slice(0, 100)), { id: "approve" });
                        setActionTokenId(null);
                    },
                }
            );
        } catch (e: any) {
            toast.error(e.message || "Failed to approve");
            setActionTokenId(null);
        }
    };

    const handleReject = async (p: any) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            await ensureSepolia();
            const realTokenId = await resolveTokenId(p);
            const storedTokenId = p.tokenId;

            setActionTokenId(realTokenId);
            toast.loading("Rejecting registration…", { id: "reject" });
            writeContract(
                {
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: LandRegistryABI,
                    functionName: "rejectLand",
                    args: [BigInt(realTokenId), reason],
                    gas: BigInt(80_000),
                },
                {
                    onSuccess: async () => {
                        toast.success("Rejection submitted!", { id: "reject" });
                        if (token) {
                            try {
                                await api(`/land/${storedTokenId}/status`, {
                                    method: "PATCH",
                                    token,
                                    body: {
                                        status: "REJECTED",
                                        newTokenId: storedTokenId === 0 ? realTokenId : undefined,
                                    },
                                });
                            } catch (e) { /* non-blocking */ }
                        }
                    },
                    onError: (err) => {
                        toast.error("Rejection failed: " + err.message.slice(0, 80), { id: "reject" });
                        setActionTokenId(null);
                    },
                }
            );
        } catch (e: any) {
            toast.error(e.message || "Failed to reject");
            setActionTokenId(null);
        }
    };

    const handleApproveTransfer = async (tokenId: number) => {
        try {
            await ensureSepolia();
            setActionTokenId(tokenId);
            toast.loading("Approving transfer…", { id: "xfer" });
            writeContract(
                {
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: LandRegistryABI,
                    functionName: "approveTransfer",
                    args: [BigInt(tokenId)],
                    gas: BigInt(200_000),
                },
                {
                    onSuccess: () => toast.success("Transfer approved!", { id: "xfer" }),
                    onError: (err) => {
                        toast.error("Failed: " + err.message.slice(0, 80), { id: "xfer" });
                        setActionTokenId(null);
                    },
                }
            );
        } catch (e: any) {
            toast.error(e.message || "Failed");
            setActionTokenId(null);
        }
    };

    if (!isConnected) {
        return (
            <div className="page-container" style={{ textAlign: "center", paddingTop: "6rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Connect Your Wallet</h2>
                <p style={{ color: "var(--color-text-muted)" }}>
                    Please connect your wallet to access the dashboard.
                </p>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="page-container" style={{ textAlign: "center", paddingTop: "6rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Sign In Required</h2>
                <p style={{ color: "var(--color-text-muted)" }}>
                    Click <strong>Sign In</strong> in the navbar to authenticate with your wallet.
                </p>
            </div>
        );
    }

    const isBusy = isPending || isConfirming;

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="section-title" style={{ marginBottom: "0.25rem" }}>
                        {isAdmin ? "Admin Dashboard" : isRegistrar ? "Registrar Dashboard" : "My Dashboard"}
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        Welcome back, {address?.slice(0, 6)}…{address?.slice(-4)}
                        {user?.role && (
                            <span style={{ marginLeft: "8px", opacity: 0.7 }}>({user.role})</span>
                        )}
                    </p>
                </div>
                <Link href="/land/register" className="btn-primary" style={{ textDecoration: "none" }}>
                    <FiPlus /> Register New Land
                </Link>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                    <div className="spinner" style={{ width: "40px", height: "40px" }} />
                </div>
            ) : (
                <>
                    {/* ──── ADMIN analytics ──── */}
                    {isAdmin && adminData && (
                        <div style={{ marginBottom: "2.5rem" }}>
                            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-muted)" }}>
                                Platform Overview
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                                <div className="stat-card">
                                    <div className="stat-value">{adminData.totalParcels ?? 0}</div>
                                    <div className="stat-label"><FiMap size={13} style={{ marginRight: 4 }} />Total Parcels</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{adminData.totalTransfers ?? 0}</div>
                                    <div className="stat-label"><FiSend size={13} style={{ marginRight: 4 }} />Total Transfers</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{adminData.totalUsers ?? 0}</div>
                                    <div className="stat-label"><FiUsers size={13} style={{ marginRight: 4 }} />Registered Users</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{adminData.totalDisputes ?? 0}</div>
                                    <div className="stat-label"><FiAlertTriangle size={13} style={{ marginRight: 4 }} />Total Disputes</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── REGISTRAR / ADMIN ──── */}
                    {isRegistrar && dashData ? (
                        <>
                            {/* Pending stats */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                                <div className="stat-card">
                                    <div className="stat-value">{dashData.stats?.registrations ?? 0}</div>
                                    <div className="stat-label">Pending Registrations</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{dashData.stats?.transfers ?? 0}</div>
                                    <div className="stat-label">Pending Transfers</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{dashData.stats?.disputes ?? 0}</div>
                                    <div className="stat-label">Open Disputes</div>
                                </div>
                            </div>

                            {/* Pending Registrations */}
                            <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontSize: "1.1rem" }}>
                                    <FiClock /> Pending Registrations
                                </h3>
                                {dashData.pendingRegistrations?.length === 0 ? (
                                    <p style={{ color: "var(--color-text-muted)", padding: "1rem 0" }}>No pending registrations.</p>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Token ID</th>
                                                    <th>Survey No.</th>
                                                    <th>Location</th>
                                                    <th>Area (sq.m)</th>
                                                    <th>Owner</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashData.pendingRegistrations?.map((p: any) => (
                                                    <tr key={p.id}>
                                                        <td style={{ fontFamily: "monospace" }}>#{p.tokenId}</td>
                                                        <td>{p.surveyNumber}</td>
                                                        <td>{p.location}</td>
                                                        <td>{p.area}</td>
                                                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                            {p.owner?.slice(0, 8)}…{p.owner?.slice(-4)}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                <button
                                                                    className="btn-success"
                                                                    style={{ padding: "5px 10px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}
                                                                    disabled={isBusy}
                                                                    onClick={() => handleApprove(p)}
                                                                >
                                                                    {isBusy && actionTokenId !== null ? (
                                                                        <div className="spinner" style={{ width: "12px", height: "12px" }} />
                                                                    ) : (
                                                                        <FiCheck size={12} />
                                                                    )}
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    className="btn-danger"
                                                                    style={{ padding: "5px 10px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}
                                                                    disabled={isBusy}
                                                                    onClick={() => handleReject(p)}
                                                                >
                                                                    <FiX size={12} /> Reject
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

                            {/* Pending Transfers */}
                            {dashData.pendingTransfers?.length > 0 && (
                                <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontSize: "1.1rem" }}>
                                        <FiSend /> Pending Transfers
                                    </h3>
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Token ID</th>
                                                    <th>From</th>
                                                    <th>To</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashData.pendingTransfers?.map((t: any) => (
                                                    <tr key={t.id}>
                                                        <td style={{ fontFamily: "monospace" }}>#{t.tokenId}</td>
                                                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                            {t.fromAddress?.slice(0, 8)}…{t.fromAddress?.slice(-4)}
                                                        </td>
                                                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                            {t.toAddress?.slice(0, 8)}…{t.toAddress?.slice(-4)}
                                                        </td>
                                                        <td><span className="badge badge-pending">{t.status}</span></td>
                                                        <td>
                                                            {t.status === "BUYER_ACCEPTED" && (
                                                                <button
                                                                    className="btn-success"
                                                                    style={{ padding: "5px 10px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}
                                                                    disabled={isBusy}
                                                                    onClick={() => handleApproveTransfer(t.tokenId)}
                                                                >
                                                                    <FiCheck size={12} /> Approve Transfer
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Open Disputes */}
                            {dashData.pendingDisputes?.length > 0 && (
                                <div className="glass-card" style={{ padding: "1.5rem" }}>
                                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontSize: "1.1rem" }}>
                                        <FiAlertTriangle style={{ color: "var(--color-warning)" }} /> Open Disputes
                                    </h3>
                                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                                        Go to <Link href="/disputes" style={{ color: "var(--color-primary-light)" }}>Disputes page</Link> to resolve them.
                                    </p>
                                    <ul style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {dashData.pendingDisputes.map((d: any) => (
                                            <li key={d.id} style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                                                Token #{d.tokenId} — reported by {d.reporter?.slice(0, 8)}…{d.reporter?.slice(-4)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : !isRegistrar && dashData ? (
                        <>
                            {/* Owner Stats */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                                <div className="stat-card">
                                    <div className="stat-value">{dashData.totalParcels ?? 0}</div>
                                    <div className="stat-label">My Parcels</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{dashData.recentTransfers?.length ?? 0}</div>
                                    <div className="stat-label">Recent Transfers</div>
                                </div>
                            </div>

                            {/* My Parcels */}
                            <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontSize: "1.1rem" }}>
                                    <FiMap /> My Land Parcels
                                </h3>
                                {dashData.parcels?.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                                        <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                                            You haven&apos;t registered any land parcels yet.
                                        </p>
                                        <Link href="/land/register" className="btn-primary" style={{ textDecoration: "none" }}>
                                            <FiPlus /> Register Your First Land
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Token ID</th>
                                                    <th>Survey Number</th>
                                                    <th>Location</th>
                                                    <th>Area</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashData.parcels?.map((p: any) => (
                                                    <tr key={p.id}>
                                                        <td style={{ fontFamily: "monospace" }}>#{p.tokenId}</td>
                                                        <td>{p.surveyNumber}</td>
                                                        <td>{p.location}</td>
                                                        <td>{p.area} sq.m</td>
                                                        <td>
                                                            <span className={`badge badge-${p.status === "APPROVED" ? "approved" : p.status === "REJECTED" ? "rejected" : p.status === "UNDER_DISPUTE" ? "dispute" : "pending"}`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Link href={`/land/${p.tokenId}`} style={{ color: "var(--color-primary-light)", textDecoration: "none", fontSize: "0.85rem" }}>
                                                                View →
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Recent Transfers */}
                            {dashData.recentTransfers?.length > 0 && (
                                <div className="glass-card" style={{ padding: "1.5rem" }}>
                                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", fontSize: "1.1rem" }}>
                                        <FiActivity /> Recent Transfers
                                    </h3>
                                    <div style={{ overflowX: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Token ID</th>
                                                    <th>From</th>
                                                    <th>To</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashData.recentTransfers.map((t: any) => (
                                                    <tr key={t.id}>
                                                        <td style={{ fontFamily: "monospace" }}>#{t.tokenId}</td>
                                                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                            {t.fromAddress?.slice(0, 8)}…{t.fromAddress?.slice(-4)}
                                                        </td>
                                                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                                                            {t.toAddress?.slice(0, 8)}…{t.toAddress?.slice(-4)}
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-${t.status === "COMPLETED" ? "approved" : t.status === "REJECTED" ? "rejected" : "pending"}`}>
                                                                {t.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
                            <p style={{ color: "var(--color-text-muted)" }}>No data available yet.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
