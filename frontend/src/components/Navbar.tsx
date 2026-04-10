"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import { useAppStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { FiHome, FiMap, FiSend, FiShield, FiGrid, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { SiweMessage } from "siwe";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function Navbar() {
    const { address, isConnected, chainId } = useAccount();
    const { connectAsync } = useConnect();
    const { disconnect } = useDisconnect();
    const { signMessageAsync } = useSignMessage();
    const { user, token, setUser, setToken, logout } = useAppStore();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const prevAddressRef = useRef<string | undefined>(undefined);

    const navLinks = [
        { href: "/", label: "Home", icon: <FiHome /> },
        { href: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
        { href: "/land/register", label: "Register Land", icon: <FiMap /> },
        { href: "/land/search", label: "Search", icon: <FiMap /> },
        { href: "/transfer", label: "Transfers", icon: <FiSend /> },
        { href: "/disputes", label: "Disputes", icon: <FiShield /> },
    ];

    // Clear session when MetaMask account changes
    useEffect(() => {
        if (!address) {
            prevAddressRef.current = undefined;
            return;
        }
        if (prevAddressRef.current && prevAddressRef.current.toLowerCase() !== address.toLowerCase()) {
            logout();
            toast("Wallet changed — please reconnect.", { icon: "🔄" });
        }
        prevAddressRef.current = address;
    }, [address]);

    // Clear session if stored user belongs to a different address
    useEffect(() => {
        if (isConnected && address && user) {
            if (user.walletAddress.toLowerCase() !== address.toLowerCase()) {
                logout();
            }
        }
    }, [isConnected, address]);

    const signInWithAddress = async (addr: string, chain?: number) => {
        const toastId = toast.loading("Sign the message in MetaMask…");
        try {
            const nonceData = await api("/auth/nonce");
            const message = new SiweMessage({
                domain: window.location.host,
                address: addr,
                statement: "Sign in to TerraChain Land Registry",
                uri: window.location.origin,
                version: "1",
                chainId: chain ?? chainId ?? 11155111,
                nonce: nonceData.nonce,
            });
            const messageStr = message.prepareMessage();
            const signature = await signMessageAsync({ message: messageStr });
            const authData = await api("/auth/verify", {
                method: "POST",
                body: { message: messageStr, signature },
            });
            setToken(authData.token);
            setUser(authData.user);
            toast.success(`Signed in as ${authData.user.role}`, { id: toastId });
        } catch (err: any) {
            const msg = err?.message ?? "";
            if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled")) {
                toast.error("Signature rejected — you can retry by reconnecting.", { id: toastId });
            } else {
                toast.error("Sign-in failed", { id: toastId });
                console.error(err);
            }
        }
    };

    // Single "Connect Wallet" handler — connects then immediately signs in
    const handleConnect = async () => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            // Step 1: connect wallet (MetaMask account selection popup)
            const result = await connectAsync({ connector: injected() });
            const addr = result.accounts[0];
            const chain = result.chainId;

            // Step 2: sign in with SIWE (MetaMask signature popup)
            await signInWithAddress(addr, chain);
        } catch (err: any) {
            const msg = err?.message ?? "";
            if (!msg.includes("rejected") && !msg.includes("denied") && !msg.includes("already connected")) {
                toast.error("Connection failed");
                console.error(err);
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Retry sign-in for already-connected wallet without a session
    const handleSignInRetry = async () => {
        if (!address || isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            await signInWithAddress(address);
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        logout();
    };

    const isAuthenticated = !!(token && user && address && user.walletAddress.toLowerCase() === address.toLowerCase());

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
                    style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}
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
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }} className="hidden md:flex">
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
                                color: pathname === link.href ? "var(--color-primary-light)" : "var(--color-text-muted)",
                                background: pathname === link.href ? "rgba(99, 102, 241, 0.1)" : "transparent",
                                transition: "all 0.2s",
                            }}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Wallet area */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Role badge */}
                    {isAuthenticated && user && (
                        <span className="badge badge-approved" style={{ fontSize: "0.7rem" }}>
                            {user.role}
                        </span>
                    )}

                    {isConnected ? (
                        <>
                            {/* Address chip */}
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
                                {address?.slice(0, 6)}…{address?.slice(-4)}
                            </span>

                            {/* Retry sign-in if wallet connected but no session */}
                            {!isAuthenticated && (
                                <button
                                    onClick={handleSignInRetry}
                                    disabled={isAuthenticating}
                                    className="btn-primary"
                                    style={{ fontSize: "0.82rem", padding: "8px 14px" }}
                                    title="Sign in with this wallet"
                                >
                                    {isAuthenticating ? (
                                        <div className="spinner" style={{ width: "14px", height: "14px" }} />
                                    ) : "Sign In"}
                                </button>
                            )}

                            {/* Disconnect */}
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
                                title="Disconnect wallet"
                            >
                                <FiLogOut size={16} />
                            </button>
                        </>
                    ) : (
                        /* Single button — connects wallet then signs in */
                        <button
                            className="btn-primary"
                            onClick={handleConnect}
                            disabled={isAuthenticating}
                            style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            {isAuthenticating ? (
                                <>
                                    <div className="spinner" style={{ width: "14px", height: "14px" }} />
                                    Connecting…
                                </>
                            ) : "Connect Wallet"}
                        </button>
                    )}

                    {/* Mobile toggle */}
                    <button
                        className="md:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{ background: "none", border: "none", color: "var(--color-text)", cursor: "pointer", fontSize: "1.3rem" }}
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
                                color: pathname === link.href ? "var(--color-primary-light)" : "var(--color-text-muted)",
                                background: pathname === link.href ? "rgba(99, 102, 241, 0.1)" : "transparent",
                            }}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                    {isConnected && !isAuthenticated && (
                        <button
                            onClick={() => { setMobileOpen(false); handleSignInRetry(); }}
                            className="btn-primary"
                            style={{ marginTop: "8px", justifyContent: "center" }}
                        >
                            Sign In
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}
