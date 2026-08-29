import React, { useState, useEffect } from "react";
import { Clock, Plus, BookOpen, Calendar, CheckCircle } from "lucide-react";
import { apiRequest } from "../api/client.ts";

interface StudySession {
  id: string;
  subjectName: string;
  topicName: string;
  durationMin: number;
  summary: string | null;
  startedAt: string;
}

export const SessionLogView: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjectName, setSubjectName] = useState<string>("");
  const [topicName, setTopicName] = useState<string>("");
  const [durationMin, setDurationMin] = useState<number>(30);
  const [summary, setSummary] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const fetchSessions = async () => {
    try {
      const data = await apiRequest<{
        recentSessions: StudySession[];
      }>("/progress/dashboard");
      setSessions(data.recentSessions || []);
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !topicName.trim()) return;

    setSaving(true);
    try {
      const data = await apiRequest<{ session: StudySession }>("/progress/sessions", {
        method: "POST",
        body: JSON.stringify({
          subjectName: subjectName.trim(),
          topicName: topicName.trim(),
          durationMin,
          summary: summary.trim() || undefined,
        }),
      });

      setSessions((prev) => [data.session, ...prev]);
      setSubjectName("");
      setTopicName("");
      setSummary("");
    } catch (err: any) {
      alert(err.message || "Failed to log study session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px" }}>
      {/* Log Session Form */}
      <div className="glass-card" style={{ padding: "24px 28px", height: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--accent-cyan-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={20} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Log Study Session</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Record your focused learning intervals</p>
          </div>
        </div>

        <form onSubmit={handleLogSession} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="input-label">Subject</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Operating Systems"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Topic / Chapter</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Deadlock Detection & Recovery"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Duration (Minutes)</label>
            <input
              type="number"
              min={5}
              max={600}
              className="input-field"
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value, 10))}
              required
            />
          </div>

          <div>
            <label className="input-label">Summary / Key Insights</label>
            <textarea
              rows={3}
              className="input-field"
              placeholder="What core concepts did you grasp or solve today?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: "4px" }}>
            <Plus size={16} />
            <span>{saving ? "Saving Session..." : "Log Study Session"}</span>
          </button>
        </form>
      </div>

      {/* Sessions History */}
      <div className="glass-card" style={{ padding: "28px 32px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "18px" }}>
          Study History ({sessions.length} Sessions)
        </h3>

        {sessions.length === 0 ? (
          <div style={{ padding: "50px", textAlign: "center", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <Calendar size={36} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No study sessions logged yet. Record your focus time on the left!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {sessions.map((ses) => (
              <div
                key={ses.id}
                style={{
                  padding: "16px 20px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>{ses.topicName}</h4>
                    <span className="badge badge-primary">{ses.subjectName}</span>
                  </div>
                  {ses.summary && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px" }}>{ses.summary}</p>
                  )}
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px", display: "inline-block" }}>
                    {new Date(ses.startedAt).toLocaleDateString()} at {new Date(ses.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="badge badge-cyan" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                    ⏱️ {ses.durationMin} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
