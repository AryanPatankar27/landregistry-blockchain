"use client";

import { useAccount } from "wagmi";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { FiMap, FiSend, FiAlertTriangle, FiPlus, FiClock, FiCheck, FiX } from "react-icons/fi";

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const { user, token } = useAppStore();
    const [dashData, setDashData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            loadDashboard();
        } else {
            setLoading(false);
        }
    }, [token]);

    const loadDashboard = async () => {
        try {
            const endpoint =
                user?.role === "REGISTRAR" || user?.role === "ADMIN"
                    ? "/dashboard/registrar"
                    : "/dashboard/owner";
            const data = await api(endpoint, { token: token! });
            setDashData(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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

    const isRegistrar = user?.role === "REGISTRAR" || user?.role === "ADMIN";

    return (
        <div className="page-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="section-title" style={{ marginBottom: "0.25rem" }}>
                        {isRegistrar ? "Registrar Dashboard" : "My Dashboard"}
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
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
            ) : isRegistrar && dashData ? (
                <>
                    {/* Registrar Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                        <div className="stat-card">
                            <div className="stat-value">{dashData.stats?.registrations || 0}</div>
                            <div className="stat-label">Pending Registrations</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{dashData.stats?.transfers || 0}</div>
                            <div className="stat-label">Pending Transfers</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{dashData.stats?.disputes || 0}</div>
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
                                            <th>Status</th>
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
                                                    {p.owner?.slice(0, 8)}...{p.owner?.slice(-4)}
                                                </td>
                                                <td><span className="badge badge-pending">Pending</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : dashData ? (
                <>
                    {/* Owner Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                        <div className="stat-card">
                            <div className="stat-value">{dashData.totalParcels || 0}</div>
                            <div className="stat-label">Total Parcels</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{dashData.recentTransfers?.length || 0}</div>
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
                </>
            ) : (
                <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
                    <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                        Sign in with your wallet to see your dashboard.
                    </p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                        Your wallet is connected. Please authenticate via the SIWE flow.
                    </p>
                </div>
            )}
        </div>
    );
}
