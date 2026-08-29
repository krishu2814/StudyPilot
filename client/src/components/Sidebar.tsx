import React from "react";
import {
  LayoutDashboard,
  BotMessageSquare,
  Sparkles,
  FileText,
  FolderKanban,
  Clock,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

export type ActiveTab = "dashboard" | "chat" | "quizzes" | "documents" | "subjects" | "sessions";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "dashboard" as ActiveTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "chat" as ActiveTab, label: "AI Tutor Chat", icon: BotMessageSquare, badge: "Socratic" },
    { id: "quizzes" as ActiveTab, label: "Active Recall", icon: Sparkles, badge: "AI Quiz" },
    { id: "documents" as ActiveTab, label: "Study Materials", icon: FileText },
    { id: "subjects" as ActiveTab, label: "Subjects & Topics", icon: FolderKanban },
    { id: "sessions" as ActiveTab, label: "Study Log", icon: Clock },
  ];

  return (
    <aside
      style={{
        width: "280px",
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100vh",
        padding: "24px 18px",
        zIndex: 20,
      }}
    >
      <div>
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", padding: "0 8px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-md)",
              background: "var(--primary-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 8px 20px rgba(99, 102, 241, 0.35)",
            }}
          >
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              StudyPilot
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600" }}>AI Learning Agent</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: isActive ? "var(--primary-light)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.925rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  textAlign: "left",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-subtle)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={20} color={isActive ? "var(--primary)" : "var(--text-secondary)"} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "var(--radius-full)",
                      background: isActive ? "rgba(99, 102, 241, 0.2)" : "rgba(14, 165, 233, 0.15)",
                      color: isActive ? "var(--primary)" : "var(--accent-cyan)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div
        style={{
          background: "var(--bg-subtle)",
          padding: "12px 14px",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, #a5b4fc, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "0.9rem",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "Student"}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="btn btn-ghost"
          style={{ padding: "6px", borderRadius: "var(--radius-sm)" }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
