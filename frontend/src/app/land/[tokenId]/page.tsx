"use client";

import { use, useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { LandRegistryABI, CONTRACT_ADDRESS } from "@/lib/contracts/LandRegistryABI";
import { FiMapPin, FiHash, FiUser, FiClock, FiFileText, FiArrowRight } from "react-icons/fi";
import Link from "next/link";

const ParcelStatus = ["Pending", "Approved", "Rejected", "Under Dispute"];
const statusBadge: Record<number, string> = {
    0: "badge-pending",
    1: "badge-approved",
    2: "badge-rejected",
    3: "badge-dispute",
};

export default function LandDetailPage({ params }: { params: Promise<{ tokenId: string }> }) {
    const { tokenId } = use(params);

    const { data: parcel, isLoading } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LandRegistryABI,
        functionName: "getLandDetails",
        args: [BigInt(tokenId)],
    });

    const { data: history } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LandRegistryABI,
        functionName: "getOwnershipHistory",
        args: [BigInt(tokenId)],
    });

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: "flex", justifyContent: "center", paddingTop: "6rem" }}>
                <div className="spinner" style={{ width: "40px", height: "40px" }} />
            </div>
        );
    }

    if (!parcel) {
        return (
            <div className="page-container" style={{ textAlign: "center", paddingTop: "6rem" }}>
                <h2>Land Parcel Not Found</h2>
                <p style={{ color: "var(--color-text-muted)", marginTop: "1rem" }}>
                    Token #{tokenId} does not exist on-chain. It may not have been approved yet.
                </p>
                <Link href="/land/search" className="btn-primary" style={{ textDecoration: "none", marginTop: "1.5rem", display: "inline-flex" }}>
                    Search Land Records
                </Link>
            </div>
        );
    }

    const p = parcel as any;

    return (
        <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 className="section-title" style={{ marginBottom: "0.25rem" }}>
                        Land Parcel #{tokenId}
                    </h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        Survey Number: {p.surveyNumber}
                    </p>
                </div>
                <span className={`badge ${statusBadge[Number(p.status)] || "badge-pending"}`} style={{ fontSize: "0.85rem", padding: "6px 16px" }}>
                    {ParcelStatus[Number(p.status)]}
                </span>
            </div>

            {/* Details Card */}
            <div className="glass-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
                    Parcel Details
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                            <FiHash size={14} /> Survey Number
                        </div>
                        <div style={{ fontWeight: 600 }}>{p.surveyNumber}</div>
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                            <FiMapPin size={14} /> Location
                        </div>
                        <div style={{ fontWeight: 600 }}>{p.location}</div>
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                            📐 Area
                        </div>
                        <div style={{ fontWeight: 600 }}>{Number(p.area).toLocaleString()} sq. meters</div>
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                            <FiUser size={14} /> Current Owner
                        </div>
                        <div style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600 }}>
                            {p.owner}
                        </div>
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                            <FiClock size={14} /> Registered At
                        </div>
                        <div style={{ fontWeight: 600 }}>
                            {Number(p.registeredAt) > 0
                                ? new Date(Number(p.registeredAt) * 1000).toLocaleString()
                                : "N/A"}
                        </div>
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "4px" }}>
                            <FiFileText size={14} /> Documents
                        </div>
                        <a
                            href={`https://ipfs.io/ipfs/${p.documentsCID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-primary-light)", textDecoration: "none", fontWeight: 600 }}
                        >
                            View on IPFS →
                        </a>
                    </div>
                </div>
            </div>

            {/* Ownership History */}
            <div className="glass-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
                    Ownership History
                </h3>
                {history && (history as any[]).length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {(history as any[]).map((record: any, i: number) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    padding: "1rem",
                                    borderRadius: "12px",
                                    background: "rgba(99, 102, 241, 0.05)",
                                    border: "1px solid var(--color-border)",
                                }}
                            >
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        background: "var(--gradient-primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600 }}>
                                        {record.owner}
                                    </div>
                                    <div style={{ display: "flex", gap: "1rem", color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
                                        <span>Type: {record.txType}</span>
                                        <span>From: {new Date(Number(record.from) * 1000).toLocaleDateString()}</span>
                                        {Number(record.to) > 0 && (
                                            <span>To: {new Date(Number(record.to) * 1000).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                                {Number(record.to) === 0 && (
                                    <span className="badge badge-approved">Current</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: "var(--color-text-muted)" }}>No ownership history available on-chain.</p>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link href={`/transfer?tokenId=${tokenId}`} className="btn-primary" style={{ textDecoration: "none" }}>
                    <FiArrowRight /> Initiate Transfer
                </Link>
                <Link href="/land/search" className="btn-secondary" style={{ textDecoration: "none" }}>
                    Back to Search
                </Link>
            </div>
        </div>
    );
}
