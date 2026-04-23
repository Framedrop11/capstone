"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <style>{`
        :root {
          --navy-50: #f0f4fa;
          --navy-100: #d9e2ef;
          --navy-200: #b3c7e0;
          --navy-300: #8daad0;
          --navy-400: #668ec0;
          --navy-500: #4072b0;
          --navy-600: #26538a;
          --navy-700: #1a3a5e;
          --navy-800: #0f233b;
          --navy-900: #08101e;
          --gold-300: #f5d97a;
          --gold-400: #e8c44a;
          --gold-500: #d4a017;
          --surface: #fafbfc;
          --text-primary: #0d1426;
          --text-secondary: #2d3748;
          --text-muted: #5a6879;
          --border-subtle: #e2e8f0;
          --border-default: #cbd5e1;
        }
        
        .nav-link {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }
        .nav-link:hover {
          color: var(--navy-700);
        }
        
        .btn-primary {
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(13,20,38,0.08);
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(13,20,38,0.12);
        }
        
        .btn-primary-large {
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(13,20,38,0.1);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-primary-large:hover {
          background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(13,20,38,0.15);
        }
        
        .btn-secondary {
          padding: 0.875rem 2rem;
          background: white;
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: var(--navy-700);
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-secondary:hover {
          background: var(--navy-50);
          border-color: var(--navy-300);
        }
        
        .feature-card {
          text-align: center;
          padding: 2rem 1.5rem;
          background: white;
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          transition: all 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(13,20,38,0.08);
          border-color: var(--navy-200);
        }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "3.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ color: "white", fontSize: "0.875rem", fontWeight: 600 }}>C</span>
              </div>
              <h1 style={{ 
                fontSize: "1.25rem", 
                fontWeight: 400, 
                letterSpacing: "-0.01em",
                color: "var(--navy-900)",
              }}>
                ClearScore
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <Link href="/login" className="nav-link">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto", textAlign: "center" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{
              display: "inline-block",
              padding: "0.25rem 0.75rem",
              background: "var(--navy-50)",
              border: "1px solid var(--navy-200)",
              borderRadius: 9999,
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--navy-700)",
              marginBottom: "1.5rem",
            }}>
              AI-Powered Credit Intelligence
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: "clamp(2.5rem, 6vw, 3.75rem)", 
            fontWeight: 300, 
            letterSpacing: "-0.02em",
            color: "var(--navy-900)",
            lineHeight: 1.2,
            marginBottom: "1.5rem",
          }}>
            Credit clarity,
            <br />
            <span style={{ 
              fontWeight: 600,
              background: "linear-gradient(135deg, var(--navy-700) 0%, var(--gold-500) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              delivered simply.
            </span>
          </h1>
          
          <p style={{ 
            fontSize: "1.125rem", 
            color: "var(--text-muted)", 
            marginBottom: "2.5rem",
            lineHeight: 1.7,
            maxWidth: "42rem",
            margin: "0 auto 2.5rem",
          }}>
            Understand your credit profile with transparent AI explanations. 
            Get a clear path to approval with personalized guidance.
          </p>
          
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn-primary-large">
              Start your journey
              <span style={{ fontSize: "1.125rem" }}>→</span>
            </Link>
            
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "2rem",
          maxWidth: "48rem",
          margin: "4rem auto 0",
          padding: "2rem 0",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          {[
            { value: "2M+", label: "Loans Analyzed" },
            { value: "95%", label: "Accuracy Rate" },
            { value: "< 3s", label: "Response Time" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.02em" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "2rem",
          marginTop: "5rem",
        }}>
          {[
            {
              icon: "🔍",
              title: "Understand",
              description: "SHAP-powered explanations show exactly what affects your application.",
              gradient: "linear-gradient(135deg, var(--navy-600), var(--navy-400))",
            },
            {
              icon: "📈",
              title: "Improve",
              description: "Personalized 90-day roadmap to build your credit profile.",
              gradient: "linear-gradient(135deg, var(--gold-500), var(--gold-300))",
            },
            {
              icon: "⚖️",
              title: "Fair",
              description: "Bias monitoring ensures equitable treatment for all applicants.",
              gradient: "linear-gradient(135deg, #4a7c59, #68a678)",
            },
          ].map((feature, i) => (
            <div key={i} className="feature-card">
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: feature.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                fontSize: "1.5rem",
                boxShadow: "0 4px 8px rgba(13,20,38,0.1)",
              }}>
                {feature.icon}
              </div>
              <h3 style={{ 
                fontSize: "1.25rem", 
                fontWeight: 500, 
                color: "var(--navy-900)",
                marginBottom: "0.75rem",
              }}>
                {feature.title}
              </h3>
              <p style={{ 
                fontSize: "0.9rem", 
                color: "var(--text-muted)", 
                lineHeight: 1.6,
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "2.5rem 0",
        marginTop: "4rem",
        background: "white",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
            }} />
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--navy-900)" }}>ClearScore</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Transparent credit assessment · AI-powered insights
          </p>
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: "2rem", 
            marginTop: "1.5rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}>
            <span>© 2024 ClearScore</span>
            <span>·</span>
            <span>Privacy</span>
            <span>·</span>
            <span>Terms</span>
            <span>·</span>
            <span>Fair Lending</span>
          </div>
        </div>
      </footer>
    </div>
  );
}