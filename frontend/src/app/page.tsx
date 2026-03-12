"use client";

import Link from "next/link";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { FiShield, FiSearch, FiSend, FiArrowRight, FiLock, FiGlobe, FiZap, FiCheck } from "react-icons/fi";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();

  const features = [
    {
      icon: <FiLock size={28} />,
      title: "Immutable Records",
      description: "Every land record is stored on the blockchain — tamper-proof and permanent.",
    },
    {
      icon: <FiGlobe size={28} />,
      title: "Transparent Ownership",
      description: "Anyone can verify land ownership in real-time without intermediaries.",
    },
    {
      icon: <FiZap size={28} />,
      title: "Instant Transfers",
      description: "Transfer ownership in minutes, not weeks. Registrar approvals on-chain.",
    },
    {
      icon: <FiShield size={28} />,
      title: "Fraud Prevention",
      description: "Cryptographic proofs eliminate forged documents and double-selling.",
    },
  ];

  const steps = [
    { num: "01", title: "Connect Wallet", desc: "Link your MetaMask or any Web3 wallet to get started." },
    { num: "02", title: "Register Land", desc: "Submit your land details and documents for on-chain registration." },
    { num: "03", title: "Get Approved", desc: "A government registrar reviews and approves your registration." },
    { num: "04", title: "Own Your NFT", desc: "Your land is minted as an ERC-721 NFT — your digital deed." },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 2rem",
          background: "var(--gradient-hero)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated Background Orbs */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "15%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />

        <div style={{ maxWidth: "800px", position: "relative", zIndex: 1 }}>
          <div
            className="animate-fade-in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "50px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              marginBottom: "2rem",
              fontSize: "0.85rem",
              color: "var(--color-primary-light)",
            }}
          >
            <FiCheck size={14} /> Powered by Ethereum & Polygon
          </div>

          <h1
            className="animate-fade-in stagger-1"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1.5rem",
            }}
          >
            Land Registry on the{" "}
            <span
              style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Blockchain
            </span>
          </h1>

          <p
            className="animate-fade-in stagger-2"
            style={{
              fontSize: "1.2rem",
              color: "var(--color-text-muted)",
              maxWidth: "600px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            TerraChain replaces paper-based land registries with immutable on-chain records.
            Register, verify, and transfer ownership with full transparency.
          </p>

          <div
            className="animate-fade-in stagger-3"
            style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}
          >
            {isConnected ? (
              <>
                <Link href="/land/register" className="btn-primary" style={{ textDecoration: "none" }}>
                  Register Land <FiArrowRight />
                </Link>
                <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: "none" }}>
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <button className="btn-primary" onClick={() => connect({ connector: injected() })}>
                Connect Wallet to Start <FiArrowRight />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "2.2rem",
              fontWeight: 800,
              marginBottom: "1rem",
            }}
          >
            Why{" "}
            <span
              style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TerraChain
            </span>
            ?
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-muted)",
              maxWidth: "600px",
              margin: "0 auto 3.5rem",
              fontSize: "1.05rem",
            }}
          >
            A next-generation land registry that eliminates fraud, reduces
            bureaucracy, and gives you true ownership.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-card animate-fade-in"
                style={{
                  padding: "2rem",
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0,
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "var(--gradient-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                    color: "white",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: "0.75rem",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    lineHeight: 1.6,
                    fontSize: "0.92rem",
                  }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          padding: "6rem 2rem",
          background: "rgba(99, 102, 241, 0.03)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "2.2rem",
              fontWeight: 800,
              marginBottom: "3.5rem",
            }}
          >
            How It{" "}
            <span
              style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Works
            </span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2rem",
            }}
          >
            {steps.map((s, i) => (
              <div
                key={i}
                className="animate-fade-in"
                style={{
                  textAlign: "center",
                  opacity: 0,
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: 900,
                    background: "var(--gradient-primary)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "1rem",
                    opacity: 0.6,
                  }}
                >
                  {s.num}
                </div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "6rem 2rem", textAlign: "center" }}>
        <div
          className="glass-card"
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "3.5rem 2rem",
          }}
        >
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "1rem" }}>
            Ready to Secure Your Land?
          </h2>
          <p
            style={{
              color: "var(--color-text-muted)",
              marginBottom: "2rem",
              fontSize: "1.05rem",
            }}
          >
            Join TerraChain today and experience the future of land ownership.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/land/register" className="btn-primary" style={{ textDecoration: "none" }}>
              Register Your Land <FiArrowRight />
            </Link>
            <Link href="/land/search" className="btn-secondary" style={{ textDecoration: "none" }}>
              <FiSearch /> Search Records
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "2rem",
          textAlign: "center",
          borderTop: "1px solid var(--color-border)",
          color: "var(--color-text-muted)",
          fontSize: "0.85rem",
        }}
      >
        <p>© 2026 TerraChain. Decentralized Land Registry. Built on Polygon.</p>
      </footer>
    </div>
  );
}
