"use client";

import Layout from "@/components/Layout";

export default function AnalystDashboard() {
  return (
    <Layout>
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 3, height: 20, background: "linear-gradient(180deg, var(--navy-600), var(--gold-400))", borderRadius: 9999 }} />
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--navy-900)" }}>
            Portfolio Analytics
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginLeft: 13 }}>
          Risk distribution · Model performance · Fairness audit
        </p>
      </div>

      <div style={{
        background: "white",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "3rem 2rem",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(13,20,38,0.06)",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
        <h2 style={{ color: "var(--navy-800)", fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>
          Analyst Dashboard
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Portfolio analytics, model comparison, and fairness metrics coming soon.
        </p>
      </div>
    </Layout>
  );
}
