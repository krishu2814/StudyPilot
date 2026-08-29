import React, { useState } from "react";
import { GraduationCap, Sparkles, BookOpen, BrainCircuit, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error("Please enter your name");
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // Auto-register or login demo account
      try {
        await login("student@studypilot.ai", "demo12345");
      } catch {
        await register("Demo Student", "student@studypilot.ai", "demo12345");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in with demo account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #f0fdf4 100%)",
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "40px 36px",
          boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.15)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 16px",
              borderRadius: "var(--radius-lg)",
              background: "var(--primary-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 10px 25px rgba(79, 70, 229, 0.35)",
            }}
          >
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--text-primary)" }}>
            StudyPilot
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Your Intelligent Personal AI Learning Agent
          </p>
        </div>

        {/* Feature Highlights */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            marginBottom: "24px",
            padding: "12px",
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <BrainCircuit size={20} color="var(--primary)" style={{ margin: "0 auto 4px" }} />
            <p style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-primary)" }}>Socratic AI</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <Sparkles size={20} color="var(--accent-cyan)" style={{ margin: "0 auto 4px" }} />
            <p style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-primary)" }}>Active Recall</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <BookOpen size={20} color="var(--accent-emerald)" style={{ margin: "0 auto 4px" }} />
            <p style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--text-primary)" }}>RAG Notes</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-subtle)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: "9px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              background: !isRegister ? "#ffffff" : "transparent",
              color: !isRegister ? "var(--primary)" : "var(--text-secondary)",
              boxShadow: !isRegister ? "var(--shadow-sm)" : "none",
              transition: "var(--transition)",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: "9px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              background: isRegister ? "#ffffff" : "transparent",
              color: isRegister ? "var(--primary)" : "var(--text-secondary)",
              boxShadow: isRegister ? "var(--shadow-sm)" : "none",
              transition: "var(--transition)",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--accent-rose-light)",
              color: "var(--accent-rose)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: "600",
              marginBottom: "18px",
            }}
          >
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isRegister && (
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "8px" }}
          >
            {loading ? "Processing..." : isRegister ? "Create Free Account" : "Sign In to StudyPilot"}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Login Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
            <hr style={{ flex: 1, borderColor: "var(--border-subtle)", borderTop: "none" }} />
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>OR QUICK ACCESS</span>
            <hr style={{ flex: 1, borderColor: "var(--border-subtle)", borderTop: "none" }} />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn btn-secondary"
            style={{ width: "100%", padding: "10px", borderColor: "rgba(99, 102, 241, 0.3)" }}
          >
            <Sparkles size={16} color="var(--primary)" />
            <span>Try 1-Click Demo Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
