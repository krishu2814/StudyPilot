import React, { useEffect, useState } from "react";
import {
  Trophy,
  AlertTriangle,
  Clock,
  BookOpen,
  Sparkles,
  BotMessageSquare,
  FileUp,
  ArrowRight,
  TrendingUp,
  Target,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "../api/client.ts";
import { ActiveTab } from "../components/Sidebar.tsx";
import { useAuth } from "../context/AuthContext.tsx";

interface DashboardMetrics {
  totalTopicsTracked: number;
  masteredTopics: number;
  weakTopics: number;
  overallMasteryPercentage: number;
  totalStudyMinutes: number;
}

interface WeakTopic {
  topicName: string;
  subjectName: string;
  masteryScore: number;
  weaknessNotes: string | null;
  lastStudiedAt: string;
}

interface StudySession {
  id: string;
  subjectName: string;
  topicName: string;
  durationMin: number;
  summary: string | null;
  startedAt: string;
}

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectTopicForQuiz?: (topicName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onSelectTopicForQuiz }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{
        metrics: DashboardMetrics;
        weakTopics: WeakTopic[];
        recentSessions: StudySession[];
      }>("/progress/dashboard");

      setMetrics(data.metrics);
      setWeakTopics(data.weakTopics || []);
      setSessions(data.recentSessions || []);
    } catch {
      // Set graceful initial state if no data yet
      setMetrics({
        totalTopicsTracked: 0,
        masteredTopics: 0,
        weakTopics: 0,
        overallMasteryPercentage: 0,
        totalStudyMinutes: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePracticeTopic = (topicName: string) => {
    if (onSelectTopicForQuiz) {
      onSelectTopicForQuiz(topicName);
    }
    setActiveTab("quizzes");
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          padding: "28px 32px",
          background: "linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(240, 253, 250, 0.9))",
          border: "1px solid rgba(199, 210, 254, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span className="badge badge-primary">AI Student Agent</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>• Personalized Study Plan</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Welcome back, {user?.name || "Student"}! 🎓
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "0.95rem" }}>
            Ready to test active recall or dive into your study materials today?
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setActiveTab("chat")} className="btn btn-primary">
            <BotMessageSquare size={18} />
            <span>Chat with Tutor</span>
          </button>
          <button onClick={() => setActiveTab("quizzes")} className="btn btn-secondary">
            <Sparkles size={18} color="var(--primary)" />
            <span>Take Quick Quiz</span>
          </button>
          <button onClick={fetchDashboardData} title="Refresh Data" className="btn btn-ghost" style={{ padding: "10px" }}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
        {/* Overall Mastery Ring */}
        <div className="glass-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, #e0e7ff, #ede9fe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.15)",
            }}
          >
            <Trophy size={28} color="var(--primary)" />
          </div>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>Mastery Score</p>
            <h3 style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--primary)" }}>
              {metrics?.overallMasteryPercentage ?? 0}%
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Across all subjects</span>
          </div>
        </div>

        {/* Mastered Topics */}
        <div className="glass-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-emerald-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={28} color="var(--accent-emerald)" />
          </div>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>Mastered Topics</p>
            <h3 style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--accent-emerald)" }}>
              {metrics?.masteredTopics ?? 0}
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Score ≥ 80%</span>
          </div>
        </div>

        {/* Weak Concepts */}
        <div className="glass-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-rose-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={28} color="var(--accent-rose)" />
          </div>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>Needs Review</p>
            <h3 style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--accent-rose)" }}>
              {metrics?.weakTopics ?? 0}
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Active recall priority</span>
          </div>
        </div>

        {/* Study Time */}
        <div className="glass-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-cyan-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={28} color="var(--accent-cyan)" />
          </div>
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>Total Study Time</p>
            <h3 style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--accent-cyan)" }}>
              {metrics?.totalStudyMinutes ?? 0} <span style={{ fontSize: "0.95rem" }}>min</span>
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Logged sessions</span>
          </div>
        </div>
      </div>

      {/* Main Split: Weak Concepts & Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
        {/* Weak Concepts Card */}
        <div className="glass-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-amber-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Target size={18} color="var(--accent-amber)" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Focus List & Weak Concepts</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Topics where active recall scores indicate room for improvement
                </p>
              </div>
            </div>
          </div>

          {weakTopics.length === 0 ? (
            <div
              style={{
                padding: "36px 20px",
                textAlign: "center",
                background: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <Trophy size={40} color="var(--accent-emerald)" style={{ margin: "0 auto 10px" }} />
              <h4 style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>No weak topics detected!</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Keep taking quizzes to challenge your retention and discover growth areas.
              </p>
              <button
                onClick={() => setActiveTab("quizzes")}
                className="btn btn-primary"
                style={{ marginTop: "14px", padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Take a Quiz
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {weakTopics.map((wt, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "14px 16px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {wt.topicName}
                      </span>
                      <span className="badge badge-amber" style={{ fontSize: "0.68rem" }}>
                        {wt.subjectName}
                      </span>
                    </div>
                    {wt.weaknessNotes && (
                      <p style={{ fontSize: "0.8rem", color: "var(--accent-rose)", marginTop: "4px" }}>
                        ⚠️ {wt.weaknessNotes}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--accent-amber)" }}>
                        {Math.round(wt.masteryScore * 100)}%
                      </span>
                      <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Mastery</p>
                    </div>
                    <button
                      onClick={() => handlePracticeTopic(wt.topicName)}
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      <span>Practice</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Launch Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Card 1: Chat */}
          <div
            className="glass-card"
            style={{
              padding: "20px 22px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #ffffff, #f5f3ff)",
            }}
            onClick={() => setActiveTab("chat")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BotMessageSquare size={22} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "1rem", fontWeight: "700" }}>Socratic AI Tutor</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Deep conceptual explanations with source citations
                </p>
              </div>
              <ArrowRight size={18} color="var(--primary)" />
            </div>
          </div>

          {/* Card 2: Quizzes */}
          <div
            className="glass-card"
            style={{
              padding: "20px 22px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #ffffff, #f0fdfa)",
            }}
            onClick={() => setActiveTab("quizzes")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent-cyan-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={22} color="var(--accent-cyan)" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "1rem", fontWeight: "700" }}>Adaptive AI Quiz</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Targeted active recall with automated feedback
                </p>
              </div>
              <ArrowRight size={18} color="var(--accent-cyan)" />
            </div>
          </div>

          {/* Card 3: Upload Materials */}
          <div
            className="glass-card"
            style={{
              padding: "20px 22px",
              cursor: "pointer",
              background: "linear-gradient(135deg, #ffffff, #f0fdf4)",
            }}
            onClick={() => setActiveTab("documents")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent-emerald-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileUp size={22} color="var(--accent-emerald)" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "1rem", fontWeight: "700" }}>Upload Notes & PDFs</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Build your personal vector knowledge base
                </p>
              </div>
              <ArrowRight size={18} color="var(--accent-emerald)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
