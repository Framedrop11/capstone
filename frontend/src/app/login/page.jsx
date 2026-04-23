"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      if (data.user.role === "Admin") router.push("/dashboard/admin");
      else if (data.user.role === "Analyst") router.push("/dashboard/analyst");
      else router.push("/dashboard/borrower");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1e 0%, #111d3a 50%, #0d1426 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 20% 80%, rgba(42,64,128,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212,160,23,0.1) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      {/* Grid lines */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #e8b923 0%, #d4a017 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: "#0d1426",
            margin: "0 auto 12px",
            boxShadow: "0 8px 24px rgba(232,185,35,0.4)",
          }}>
            CS
          </div>
          <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, marginBottom: 4, letterSpacing: "-0.02em" }}>
            ClearScore
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Credit Rehabilitation Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ color: "white", fontSize: "1.1rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.01em" }}>
            Welcome back
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
            Sign in to access your credit dashboard
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              color: "#fca5a5",
              fontSize: "0.8rem",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 500, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "white",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(232,185,35,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 500, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "white",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(232,185,35,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginTop: "0.5rem",
                background: loading ? "rgba(212,160,23,0.5)" : "linear-gradient(135deg, #e8b923 0%, #d4a017 100%)",
                border: "none",
                borderRadius: 8,
                color: "#0d1426",
                fontSize: "0.875rem",
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
              Don't have an account?{" "}
            </span>
            <Link href="/register" style={{ color: "#e8b923", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
              Create one
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1.5rem" }}>
          {["🔒 Secured", "✦ Transparent", "⚖ Fair"].map((t) => (
            <span key={t} style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
