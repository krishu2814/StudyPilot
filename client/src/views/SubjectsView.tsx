import React, { useState, useEffect } from "react";
import { FolderKanban, Plus, Trash2, BookOpen, Layers } from "lucide-react";
import { apiRequest } from "../api/client.ts";

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface Subject {
  id: string;
  name: string;
  description: string | null;
  topics?: Topic[];
  _count?: { topics: number; documents: number };
}

export const SubjectsView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newSubjectName, setNewSubjectName] = useState<string>("");
  const [newSubjectDesc, setNewSubjectDesc] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // New Topic State
  const [newTopicName, setNewTopicName] = useState<string>("");
  const [newTopicDesc, setNewTopicDesc] = useState<string>("");

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ subjects: Subject[] }>("/subjects");
      setSubjects(data.subjects || []);
      if (data.subjects && data.subjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data.subjects[0].id);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const data = await apiRequest<{ subject: Subject }>("/subjects", {
        method: "POST",
        body: JSON.stringify({
          name: newSubjectName.trim(),
          description: newSubjectDesc.trim() || undefined,
        }),
      });

      setSubjects((prev) => [data.subject, ...prev]);
      setSelectedSubjectId(data.subject.id);
      setNewSubjectName("");
      setNewSubjectDesc("");
    } catch (err: any) {
      alert(err.message || "Failed to create subject");
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !newTopicName.trim()) return;

    try {
      const data = await apiRequest<{ topic: Topic }>(`/subjects/${selectedSubjectId}/topics`, {
        method: "POST",
        body: JSON.stringify({
          name: newTopicName.trim(),
          description: newTopicDesc.trim() || undefined,
        }),
      });

      setSubjects((prev) =>
        prev.map((sub) => {
          if (sub.id === selectedSubjectId) {
            return {
              ...sub,
              topics: [...(sub.topics || []), data.topic],
            };
          }
          return sub;
        })
      );

      setNewTopicName("");
      setNewTopicDesc("");
    } catch (err: any) {
      alert(err.message || "Failed to add topic");
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}" and its topics?`)) return;

    try {
      await apiRequest(`/subjects/${id}`, { method: "DELETE" });
      const updated = subjects.filter((s) => s.id !== id);
      setSubjects(updated);
      if (selectedSubjectId === id) {
        setSelectedSubjectId(updated[0]?.id || null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete subject");
    }
  };

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px" }}>
      {/* Left Column: Subject List & Create Subject */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Create Subject Card */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} color="var(--primary)" /> Add Subject
          </h3>
          <form onSubmit={handleCreateSubject} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="text"
              className="input-field"
              placeholder="Subject Name (e.g. Operating Systems)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required
            />
            <input
              type="text"
              className="input-field"
              placeholder="Description (Optional)"
              value={newSubjectDesc}
              onChange={(e) => setNewSubjectDesc(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "8px" }}>
              Create Subject
            </button>
          </form>
        </div>

        {/* Subjects List */}
        <div className="glass-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>
            All Subjects ({subjects.length})
          </h4>
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: isSelected ? "var(--primary-light)" : "var(--bg-surface)",
                  border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "var(--transition)",
                }}
              >
                <div>
                  <h5 style={{ fontSize: "0.95rem", fontWeight: "700", color: isSelected ? "var(--primary)" : "var(--text-primary)" }}>
                    {sub.name}
                  </h5>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {sub.topics?.length || 0} topics
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSubject(sub.id, sub.name);
                  }}
                  className="btn btn-ghost"
                  style={{ padding: "4px", color: "var(--accent-rose)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Topics under Selected Subject */}
      <div className="glass-card" style={{ padding: "28px 32px" }}>
        {activeSubject ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "18px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "24px" }}>
              <div>
                <span className="badge badge-primary">Subject Curriculum</span>
                <h2 style={{ fontSize: "1.6rem", fontWeight: "800", marginTop: "4px" }}>{activeSubject.name}</h2>
                {activeSubject.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "2px" }}>{activeSubject.description}</p>
                )}
              </div>
            </div>

            {/* Add Topic Form */}
            <form onSubmit={handleCreateTopic} style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              <input
                type="text"
                className="input-field"
                placeholder="New Topic Name (e.g. Memory Virtualization, BCNF, etc.)"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                <Plus size={16} />
                <span>Add Topic</span>
              </button>
            </form>

            {/* Topic Cards */}
            <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "12px" }}>
              Topics ({activeSubject.topics?.length || 0})
            </h4>

            {activeSubject.topics && activeSubject.topics.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {activeSubject.topics.map((top) => (
                  <div
                    key={top.id}
                    style={{
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Layers size={18} color="var(--primary)" />
                      <h5 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>{top.name}</h5>
                    </div>
                    {top.description && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {top.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <Layers size={36} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  No topics added to this subject yet. Add one above!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            Select or create a subject to manage its curriculum topics.
          </div>
        )}
      </div>
    </div>
  );
};
