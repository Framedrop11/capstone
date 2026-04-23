"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loanApi, authApi } from "@/lib/api";
import Layout from "@/components/Layout";

const GRADE_COLORS = {
  A: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7", label: "Excellent" },
  B: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d", label: "Good" },
  C: { bg: "#fed7aa", text: "#9a3412", border: "#fb923c", label: "Fair" },
  D: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5", label: "Poor" },
};

export default function BorrowerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    incomeAnnual: "", loanAmount: "", employmentLength: "", creditHistoryAge: "",
    homeOwnershipStatus: "RENT", occupationType: "salaried", geographyTier: "Tier-2", existingEMI: "",
  });
  const [prediction, setPrediction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeExplainTab, setActiveExplainTab] = useState("drivers");
  const [fightLoading, setFightLoading] = useState(false);
  const [fightResult, setFightResult] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authApi.me();
        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true); setPrediction(null); setFightResult(null);
    try {
      const data = await loanApi.apply({
        incomeAnnual: parseFloat(formData.incomeAnnual),
        loanAmount: parseFloat(formData.loanAmount),
        employmentLength: parseInt(formData.employmentLength),
        creditHistoryAge: parseInt(formData.creditHistoryAge),
        homeOwnershipStatus: formData.homeOwnershipStatus,
        occupationType: formData.occupationType,
        geographyTier: formData.geographyTier,
        existingEMI: parseFloat(formData.existingEMI) || 0,
      });
      setPrediction(data.prediction);
    } catch (err) {
      if (err.message === "Authentication required") router.push("/login");
      else setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFightRejection = async () => {
    if (!prediction) return;
    setFightLoading(true);
    try {
      const features = {};
      if (prediction.debug_features) {
        Object.assign(features, prediction.debug_features);
      }
      const result = await loanApi.fight({
        features,
        current_pd: prediction.modelPdScore
      });
      setFightResult(result);
    } catch (err) {
      console.error("Fight rejection error:", err);
    } finally {
      setFightLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--navy-200)", borderTopColor: "var(--navy-600)", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const grade = prediction?.modelRiskGrade;
  const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.D;
  const pdPct = prediction ? (prediction.modelPdScore * 100).toFixed(1) : null;

  const selectStyle = {
    width: "100%",
    padding: "0.5rem 0.875rem",
    background: "white",
    border: "1px solid var(--border-default)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    height: "2.375rem",
    outline: "none",
    cursor: "pointer",
  };

  const tabStyle = (isActive) => ({
    padding: "0.5rem 1rem",
    background: "none",
    border: "none",
    borderBottom: isActive ? "2px solid var(--navy-600)" : "2px solid transparent",
    color: isActive ? "var(--navy-900)" : "var(--text-muted)",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  });

  return (
    <Layout>
      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 3, height: 20, background: "linear-gradient(180deg, var(--navy-600), var(--gold-400))", borderRadius: 9999 }} />
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--navy-900)" }}>
            Loan Assessment
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginLeft: 13 }}>
          Welcome back, <strong style={{ color: "var(--navy-700)" }}>{user?.name}</strong> · Enter your details to check eligibility
        </p>
      </div>

      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "0.875rem 1rem", marginBottom: "1.25rem",
          color: "#991b1b", fontSize: "0.875rem", display: "flex", gap: 8, alignItems: "flex-start"
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>

        {/* ── Application Form ── */}
        <div style={{
          background: "white",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(13,20,38,0.06)",
        }}>
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--navy-50)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 14,
            }}>📋</div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--navy-900)", fontSize: "0.9rem" }}>Loan Details</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Enter your financial information</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Annual Income (₹)
                </label>
                <input className="input-minimal" type="number" name="incomeAnnual" value={formData.incomeAnnual} onChange={handleChange} required placeholder="600000" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Loan Amount (₹)
                </label>
                <input className="input-minimal" type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange} required placeholder="200000" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Employment (years)
                </label>
                <input className="input-minimal" type="number" name="employmentLength" value={formData.employmentLength} onChange={handleChange} required min="0" placeholder="3" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Credit History (months)
                </label>
                <input className="input-minimal" type="number" name="creditHistoryAge" value={formData.creditHistoryAge} onChange={handleChange} required min="0" placeholder="36" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Home Ownership
                </label>
                <select name="homeOwnershipStatus" value={formData.homeOwnershipStatus} onChange={handleChange} style={selectStyle}>
                  <option value="RENT">Rent</option>
                  <option value="OWN">Own</option>
                  <option value="MORTGAGE">Mortgage</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Occupation
                </label>
                <select name="occupationType" value={formData.occupationType} onChange={handleChange} style={selectStyle}>
                  <option value="salaried">Salaried</option>
                  <option value="gig">Gig</option>
                  <option value="freelance">Freelance</option>
                  <option value="self-employed">Self-employed</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Geography Tier
                </label>
                <select name="geographyTier" value={formData.geographyTier} onChange={handleChange} style={selectStyle}>
                  <option value="Tier-1">Tier 1 (Metro)</option>
                  <option value="Tier-2">Tier 2 (Urban)</option>
                  <option value="Tier-3">Tier 3 (Rural)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
                  Existing EMI (₹/mo)
                </label>
                <input className="input-minimal" type="number" name="existingEMI" value={formData.existingEMI} onChange={handleChange} placeholder="0" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginTop: "0.25rem",
                background: submitting
                  ? "rgba(22,49,99,0.5)"
                  : "linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)",
                border: "none", borderRadius: 8, color: "white",
                fontSize: "0.875rem", fontWeight: 600, fontFamily: "inherit",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {submitting ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                  Processing...
                </>
              ) : "Check Eligibility →"}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </form>
        </div>

        {/* ── Results Panel ── */}
        <div style={{
          background: "white",
          border: "1px solid var(--border-subtle)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(13,20,38,0.06)",
        }}>
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--navy-50)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #d4a017, #e8b923)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0d1426", fontSize: 14,
            }}>📊</div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--navy-900)", fontSize: "0.9rem" }}>Risk Assessment</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>AI-powered credit analysis</div>
            </div>
          </div>

          <div style={{ padding: "1.5rem" }}>
            {prediction ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* Grade + PD */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "1.5rem",
                  padding: "1.25rem",
                  background: gradeColor.bg,
                  border: `2px solid ${gradeColor.border}`,
                  borderRadius: 12,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "white",
                    border: `3px solid ${gradeColor.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.75rem", fontWeight: 800, color: gradeColor.text,
                    flexShrink: 0,
                  }}>
                    {grade}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: gradeColor.text, marginBottom: 4 }}>
                      Risk Grade · {gradeColor.label}
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: gradeColor.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {pdPct}%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: gradeColor.text, opacity: 0.75, marginTop: 2 }}>
                      Probability of Default
                    </div>
                  </div>
                </div>

                {/* PD Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Default Risk</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy-900)" }}>{pdPct}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--navy-100)", borderRadius: 9999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${prediction.modelPdScore * 100}%`,
                      background: grade === "A" ? "#10b981" : grade === "B" ? "#f59e0b" : grade === "C" ? "#f97316" : "#ef4444",
                      borderRadius: 9999,
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>0% (Safe)</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>100% (High Risk)</span>
                  </div>
                </div>

                {/* EL Breakdown */}
                <div style={{ background: "var(--navy-50)", border: "1px solid var(--navy-100)", borderRadius: 10, padding: "1rem 1.25rem" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Expected Loss Breakdown
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    {[
                      { label: "PD", value: `${pdPct}%` },
                      { label: "×", value: null },
                      { label: "LGD", value: `50%` },
                      { label: "×", value: null },
                      { label: "EAD", value: `₹${parseFloat(formData.loanAmount || 0).toLocaleString("en-IN")}` },
                    ].map((item, i) => item.value ? (
                      <div key={i} style={{
                        background: "white", border: "1px solid var(--border-subtle)",
                        borderRadius: 6, padding: "0.3rem 0.6rem", textAlign: "center",
                      }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--navy-800)" }}>{item.value}</div>
                      </div>
                    ) : (
                      <span key={i} style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "1rem" }}>×</span>
                    ))}
                    <span style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "1rem" }}>=</span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--navy-200)", paddingTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Expected Loss</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy-900)", letterSpacing: "-0.03em" }}>
                      ₹{prediction.expectedLoss?.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                      Statistical expected loss per this application
                    </div>
                  </div>
                </div>

                {/* Grade messages */}
                {grade === "D" && (
                  <div style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 8, padding: "0.875rem 1rem",
                    color: "#991b1b", fontSize: "0.8rem", display: "flex", gap: 8,
                  }}>
                    <span>⚠</span>
                    <span>Your application requires improvement. See recommendations below.</span>
                  </div>
                )}

                {grade === "A" && (
                  <div style={{
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: 8, padding: "0.875rem 1rem",
                    color: "#166534", fontSize: "0.8rem", display: "flex", gap: 8,
                  }}>
                    <span>✓</span>
                    <span>Excellent profile. Strong likelihood of approval at competitive rates.</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>📈</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 500 }}>
                  Submit your application to see the assessment
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 6, opacity: 0.7 }}>
                  Powered by AI · Results in seconds
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* EXPLAINABILITY SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {prediction && (
        <div style={{ marginTop: "2rem" }}>
          {/* Explainability Card */}
          <div style={{
            background: "white",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(13,20,38,0.06)",
          }}>
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-subtle)",
              background: "linear-gradient(135deg, var(--navy-50) 0%, #f8fafc 100%)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, var(--gold-500), var(--gold-300))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#0d1426", fontSize: 14,
              }}>🔍</div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--navy-900)", fontSize: "0.9rem" }}>Explainability Analysis</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Understand what drives your risk assessment</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ 
              display: "flex", 
              gap: "0.5rem", 
              padding: "0.75rem 1.5rem 0 1.5rem",
              borderBottom: "1px solid var(--border-subtle)",
            }}>
              <button onClick={() => setActiveExplainTab("drivers")} style={tabStyle(activeExplainTab === "drivers")}>
                Key Drivers
              </button>
              <button onClick={() => setActiveExplainTab("features")} style={tabStyle(activeExplainTab === "features")}>
                All Features
              </button>
              <button onClick={() => setActiveExplainTab("roadmap")} style={tabStyle(activeExplainTab === "roadmap")}>
                Improvement Plan
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              {/* Key Drivers Tab */}
              {activeExplainTab === "drivers" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {prediction.shapValues?.top_3_drivers?.length > 0 ? (
                    prediction.shapValues.top_3_drivers.map((driver, idx) => (
                      <div key={idx} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "1rem 1.25rem",
                        background: driver.direction === "increases" ? "#fef2f2" : "#f0fdf4",
                        border: `1px solid ${driver.direction === "increases" ? "#fecaca" : "#bbf7d0"}`,
                        borderRadius: 10,
                      }}>
                        <div>
                          <div style={{ 
                            fontWeight: 600, 
                            color: "var(--navy-900)", 
                            fontSize: "0.9rem",
                            textTransform: "capitalize",
                            marginBottom: 4,
                          }}>
                            {driver.feature.replace(/_/g, " ")}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {driver.direction === "increases" ? "Increases" : "Decreases"} default risk
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: driver.direction === "increases" ? "#dc2626" : "#16a34a",
                            letterSpacing: "-0.03em",
                          }}>
                            {driver.direction === "increases" ? "+" : "-"}
                            {(driver.magnitude * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Impact on PD
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      Feature importance data not available
                    </div>
                  )}
                </div>
              )}

              {/* All Features Tab */}
              {activeExplainTab === "features" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {prediction.shapValues?.feature_importance ? (
                    Object.entries(prediction.shapValues.feature_importance).map(([feature, value]) => (
                      <div key={feature}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ 
                            fontSize: "0.8rem", 
                            fontWeight: 500, 
                            color: "var(--navy-700)",
                            textTransform: "capitalize",
                          }}>
                            {feature.replace(/_/g, " ")}
                          </span>
                          <span style={{ 
                            fontSize: "0.8rem", 
                            fontWeight: 600,
                            color: value > 0 ? "#dc2626" : "#16a34a",
                          }}>
                            {value > 0 ? "+" : ""}{(value * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div style={{ height: 6, background: "var(--navy-100)", borderRadius: 9999, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${Math.min(Math.abs(value) * 200, 100)}%`,
                            background: value > 0 ? "#ef4444" : "#10b981",
                            borderRadius: 9999,
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      Feature data not available
                    </div>
                  )}
                </div>
              )}

              {/* Roadmap Tab */}
              {activeExplainTab === "roadmap" && (
                <div>
                  {grade === "D" ? (
                    <>
                      <div style={{
                        background: "var(--navy-50)",
                        border: "1px solid var(--navy-200)",
                        borderRadius: 10,
                        padding: "1rem 1.25rem",
                        marginBottom: "1.5rem",
                      }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--navy-900)", marginBottom: 6 }}>
                          90-Day Improvement Plan
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "var(--navy-700)", marginBottom: 8 }}>
                          Current PD: {(prediction.modelPdScore * 100).toFixed(1)}% → Target: below 35%
                        </div>
                        <div style={{ height: 6, background: "var(--navy-200)", borderRadius: 9999 }}>
                          <div style={{
                            height: "100%",
                            width: `${(prediction.modelPdScore * 100)}%`,
                            background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)",
                            borderRadius: 9999,
                          }} />
                        </div>
                      </div>

                      <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
                        <div style={{
                          position: "absolute",
                          left: 7,
                          top: 8,
                          bottom: 8,
                          width: 2,
                          background: "var(--navy-200)",
                        }} />
                        {[
                          { week: 1, action: "Reduce credit card balances", impact: "-5% PD", time: "1-2 weeks" },
                          { week: 4, action: "Make all payments on time", impact: "-8% PD", time: "4 weeks" },
                          { week: 8, action: "Pay down existing loans", impact: "-12% PD", time: "8 weeks" },
                          { week: 12, action: "Re-apply with improved profile", impact: "Ready for approval", time: "12 weeks" },
                        ].map((step, idx) => (
                          <div key={idx} style={{ position: "relative", marginBottom: idx < 3 ? "1.25rem" : 0 }}>
                            <div style={{
                              position: "absolute",
                              left: "-1.5rem",
                              top: 6,
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              background: "white",
                              border: "2px solid var(--navy-400)",
                              zIndex: 1,
                            }} />
                            <div style={{
                              background: "white",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: 10,
                              padding: "1rem 1.25rem",
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, color: "var(--navy-900)", fontSize: "0.9rem" }}>
                                  Week {step.week}
                                </span>
                                <span style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  background: "#dbeafe",
                                  color: "#1e40af",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: 9999,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.04em",
                                }}>
                                  {step.impact}
                                </span>
                              </div>
                              <p style={{ fontSize: "0.875rem", color: "var(--navy-700)", marginBottom: 4 }}>
                                {step.action}
                              </p>
                              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                ⏱ {step.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#d1fae5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 1rem",
                      }}>
                        <span style={{ fontSize: "1.5rem", color: "#065f46" }}>✓</span>
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--navy-900)", fontSize: "1rem", marginBottom: 4 }}>
                        Your profile is on track!
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Maintain good financial habits to keep your score strong.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fight Rejection Card (only for Grade D) */}
          {grade === "D" && (
            <div style={{
              marginTop: "1.5rem",
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              border: "1px solid #fca5a5",
              borderRadius: 12,
              padding: "1.5rem",
            }}>
              {!fightResult ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#991b1b", fontSize: "1rem", marginBottom: 4 }}>
                      Want to improve faster?
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#7f1d1d" }}>
                      Get a personalized recommendation to boost your approval chances
                    </div>
                  </div>
                  <button
                    onClick={handleFightRejection}
                    disabled={fightLoading}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: fightLoading ? "#9ca3af" : "#dc2626",
                      border: "none",
                      borderRadius: 8,
                      color: "white",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: fightLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {fightLoading ? (
                      <>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                        Analyzing...
                      </>
                    ) : (
                      <>⚡ Fight Rejection →</>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>🎯</span>
                    <span style={{ fontWeight: 700, color: "#065f46", fontSize: "1rem" }}>Recommendation Ready</span>
                  </div>
                  <p style={{ fontSize: "0.95rem", color: "#065f46", marginBottom: "1rem", lineHeight: 1.5 }}>
                    {fightResult.message}
                  </p>
                  {fightResult.action && (
                    <div style={{
                      background: "white",
                      borderRadius: 8,
                      padding: "1rem",
                      display: "inline-block",
                    }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        Expected Improvement
                      </div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#065f46" }}>
                        -{(fightResult.action.expected_pd_improvement * 100).toFixed(1)}% PD
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                        {fightResult.action.current_grade} → {fightResult.action.projected_grade}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}