"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useAppStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { FiHome, FiMap, FiSend, FiShield, FiGrid, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";

export default function Navbar() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { user, logout } = useAppStore();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Home", icon: <FiHome /> },
        { href: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
        { href: "/land/register", label: "Register Land", icon: <FiMap /> },
        { href: "/land/search", label: "Search", icon: <FiMap /> },
        { href: "/transfer", label: "Transfers", icon: <FiSend /> },
        { href: "/disputes", label: "Disputes", icon: <FiShield /> },
    ];

    const handleConnect = () => {
        connect({ connector: injected() });
    };

    const handleDisconnect = () => {
        disconnect();
        logout();
    };

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "rgba(15, 15, 35, 0.85)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid var(--color-border)",
            }}
        >
            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    padding: "0 2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "72px",
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        textDecoration: "none",
                        color: "inherit",
                    }}
                >
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "var(--gradient-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                        }}
                    >
                        🏔️
                    </div>
                    <span
                        style={{
                            fontSize: "1.3rem",
                            fontWeight: 800,
                            background: "var(--gradient-primary)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        TerraChain
                    </span>
                </Link>

                {/* Desktop Links */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                    className="hidden md:flex"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "10px",
                                fontSize: "0.88rem",
                                fontWeight: 500,
                                textDecoration: "none",
                                color:
                                    pathname === link.href
                                        ? "var(--color-primary-light)"
                                        : "var(--color-text-muted)",
                                background:
                                    pathname === link.href
                                        ? "rgba(99, 102, 241, 0.1)"
                                        : "transparent",
                                transition: "all 0.2s",
                            }}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Wallet */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {user && (
                        <span
                            className="badge badge-approved"
                            style={{ fontSize: "0.7rem" }}
                        >
                            {user.role}
                        </span>
                    )}
                    {isConnected ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                                style={{
                                    padding: "8px 14px",
                                    borderRadius: "10px",
                                    background: "rgba(99, 102, 241, 0.1)",
                                    border: "1px solid var(--color-border)",
                                    fontSize: "0.85rem",
                                    color: "var(--color-primary-light)",
                                    fontFamily: "monospace",
                                }}
                            >
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <button
                                onClick={handleDisconnect}
                                style={{
                                    padding: "8px",
                                    borderRadius: "10px",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                    color: "var(--color-danger)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <FiLogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn-primary" onClick={handleConnect}>
                            Connect Wallet
                        </button>
                    )}

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-text)",
                            cursor: "pointer",
                            fontSize: "1.3rem",
                        }}
                    >
                        {mobileOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <div
                    style={{
                        padding: "1rem 2rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        borderTop: "1px solid var(--color-border)",
                    }}
                    className="md:hidden"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 16px",
                                borderRadius: "10px",
                                textDecoration: "none",
                                color:
                                    pathname === link.href
                                        ? "var(--color-primary-light)"
                                        : "var(--color-text-muted)",
                                background:
                                    pathname === link.href
                                        ? "rgba(99, 102, 241, 0.1)"
                                        : "transparent",
                            }}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
