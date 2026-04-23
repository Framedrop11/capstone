"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getNavItems = () => {
    if (!user) return [];
    const items = {
      Borrower: [
        { name: "Dashboard", href: "/dashboard/borrower", icon: "◈" },
        { name: "Applications", href: "/dashboard/borrower/history", icon: "◎" },
      ],
      Analyst: [
        { name: "Portfolio", href: "/dashboard/analyst", icon: "◈" },
        { name: "Fairness", href: "/dashboard/analyst/fairness", icon: "⬡" },
      ],
      Admin: [
        { name: "Users", href: "/dashboard/admin", icon: "◈" },
        { name: "Audit", href: "/dashboard/admin/audit", icon: "◎" },
        { name: "Drift", href: "/dashboard/admin/drift", icon: "⬡" },
      ],
    };
    return items[user.role] || [];
  };

  const getRoleBadgeStyle = (role) => {
    const styles = {
      Admin:    "background:#1e3163;color:#a8badb;border:1px solid #2a4080",
      Analyst:  "background:#1c3a2a;color:#6ee7b7;border:1px solid #065f46",
      Borrower: "background:#3a1c1c;color:#fca5a5;border:1px solid #991b1b",
    };
    return styles[role] || styles.Borrower;
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "3px solid var(--navy-200)",
              borderTopColor: "var(--navy-600)",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Loading
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const navItems = getNavItems();

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(10,15,30,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
      }}>
        <div className="container-minimal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg, #e8b923 0%, #d4a017 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#0d1426",
                  boxShadow: "0 2px 8px rgba(232,185,35,0.4)",
                }}>
                  CS
                </div>
                <span style={{ fontSize: "1rem", fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>
                  ClearScore
                </span>
              </Link>

              {/* Desktop nav */}
              {user && (
                <nav style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden md:flex">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "0.375rem 0.875rem",
                          borderRadius: 6,
                          fontSize: "0.8rem",
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#e8b923" : "rgba(255,255,255,0.55)",
                          background: isActive ? "rgba(232,185,35,0.1)" : "transparent",
                          border: isActive ? "1px solid rgba(232,185,35,0.2)" : "1px solid transparent",
                          textDecoration: "none",
                          transition: "all 0.15s ease",
                          letterSpacing: "0.01em",
                        }}
                      >
                        <span style={{ fontSize: 10 }}>{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Right side */}
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Role badge */}
                <span style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: 9999,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  ...Object.fromEntries(
                    getRoleBadgeStyle(user.role).split(";").filter(Boolean).map(s => {
                      const [k, v] = s.split(":");
                      return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.trim()];
                    })
                  )
                }}>
                  {user.role}
                </span>

                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--navy-600) 0%, var(--navy-400) 100%)",
                  border: "2px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: "0.7rem", fontWeight: 700,
                }}>
                  {getInitials(user.name)}
                </div>

                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </span>

                <button
                  onClick={handleLogout}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.4)",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.target.style.color = "white"; e.target.style.borderColor = "rgba(255,255,255,0.3)"; }}
                  onMouseLeave={e => { e.target.style.color = "rgba(255,255,255,0.4)"; e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ flex: 1, padding: "2rem 0" }}>
        <div className="container-minimal">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "white",
        padding: "1rem 0",
      }}>
        <div className="container-minimal" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            © 2026 ClearScore · AI-Powered Credit Rehabilitation
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Secured · Transparent · Fair
          </span>
        </div>
      </footer>
    </div>
  );
}
