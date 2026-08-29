import React, { useEffect, useState } from "react";
import { Sparkles, Activity, Plus } from "lucide-react";
import { ActiveTab } from "./Sidebar.tsx";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [apiOnline, setApiOnline] = useState<boolean>(true);

  useEffect(() => {
    fetch("/health")
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(false));
  }, []);

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: { title: "Study Dashboard", subtitle: "Track your mastery, review weak concepts, and study smarter." },
    chat: { title: "Socratic AI Tutor", subtitle: "Ask anything grounded in your uploaded course materials." },
    quizzes: { title: "Active Recall & Quizzes", subtitle: "Generate adaptive quizzes with instant AI grading and feedback." },
    documents: { title: "Study Materials", subtitle: "Upload notes, textbooks, and inspect semantic vector search." },
    subjects: { title: "Subjects & Topics", subtitle: "Organize your curriculum and track mastery by topic." },
    sessions: { title: "Study Log", subtitle: "Track your focus sessions, duration, and learning summaries." },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header
      style={{
        padding: "20px 36px",
        background: "var(--bg-surface-translucent)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)" }}>{current.title}</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{current.subtitle}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Status Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "var(--radius-full)",
            background: apiOnline ? "var(--accent-emerald-light)" : "var(--accent-rose-light)",
            color: apiOnline ? "var(--accent-emerald)" : "var(--accent-rose)",
            fontSize: "0.78rem",
            fontWeight: "700",
          }}
        >
          <Activity size={14} />
          <span>{apiOnline ? "AI Engine Active" : "Backend Offline"}</span>
        </div>

        {/* Quick Action Buttons */}
        {activeTab !== "quizzes" && (
          <button
            onClick={() => setActiveTab("quizzes")}
            className="btn btn-primary"
            style={{ padding: "8px 16px", fontSize: "0.875rem" }}
          >
            <Sparkles size={16} />
            <span>Practice Quiz</span>
          </button>
        )}

        {activeTab !== "chat" && (
          <button
            onClick={() => setActiveTab("chat")}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.875rem" }}
          >
            <Plus size={16} />
            <span>Ask Tutor</span>
          </button>
        )}
      </div>
    </header>
  );
};
