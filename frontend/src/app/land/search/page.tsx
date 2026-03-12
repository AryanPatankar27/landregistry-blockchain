"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { FiSearch, FiMapPin, FiHash } from "react-icons/fi";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const data = await api(
                `/land?surveyNumber=${encodeURIComponent(query)}&location=${encodeURIComponent(query)}`
            );
            setResults(data.parcels || []);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            PENDING: "badge-pending",
            APPROVED: "badge-approved",
            REJECTED: "badge-rejected",
            UNDER_DISPUTE: "badge-dispute",
        };
        return map[status] || "badge-pending";
    };

    return (
        <div className="page-container">
            <h1 className="section-title">Search Land Records</h1>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem", maxWidth: "600px" }}>
                Search for any land parcel by survey number, location, or owner address.
                All records are verified on-chain.
            </p>

            <form onSubmit={handleSearch} style={{ marginBottom: "2.5rem" }}>
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        maxWidth: "600px",
                    }}
                >
                    <div style={{ flex: 1, position: "relative" }}>
                        <FiSearch
                            size={18}
                            style={{
                                position: "absolute",
                                left: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--color-text-muted)",
                            }}
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Survey number, location, or wallet address..."
                            className="input-field"
                            style={{ paddingLeft: "42px" }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <div className="spinner" /> : <FiSearch />}
                        Search
                    </button>
                </div>
            </form>

            {/* Results */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
                    <div className="spinner" style={{ width: "40px", height: "40px" }} />
                </div>
            ) : searched && results.length === 0 ? (
                <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
                    <p style={{ color: "var(--color-text-muted)" }}>
                        No land records found matching &quot;{query}&quot;
                    </p>
                </div>
            ) : results.length > 0 ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                        gap: "1.25rem",
                    }}
                >
                    {results.map((parcel, i) => (
                        <div
                            key={parcel.id}
                            className="glass-card animate-fade-in"
                            style={{
                                padding: "1.5rem",
                                opacity: 0,
                                animationDelay: `${i * 0.05}s`,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                        <FiHash size={14} style={{ color: "var(--color-primary-light)" }} />
                                        <span style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 600 }}>
                                            Token #{parcel.tokenId}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                                        Survey: {parcel.surveyNumber}
                                    </span>
                                </div>
                                <span className={`badge ${getStatusBadge(parcel.status)}`}>{parcel.status}</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                                <FiMapPin size={14} />
                                {parcel.location}
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                                    {parcel.area} sq.m
                                </span>
                                <Link
                                    href={`/land/${parcel.tokenId}`}
                                    style={{
                                        color: "var(--color-primary-light)",
                                        textDecoration: "none",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    View Details →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
