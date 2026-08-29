import React, { useState, useEffect } from "react";
import {
  FileUp,
  FileText,
  Trash2,
  Search,
  BookOpen,
  Sparkles,
  Layers,
} from "lucide-react";
import { apiRequest } from "../api/client.ts";

interface Subject {
  id: string;
  name: string;
}

interface DocumentItem {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  subject?: { id: string; name: string };
  createdAt: string;
  _count?: { chunks: number };
}

interface SearchResultChunk {
  chunkId: string;
  documentTitle: string;
  topicName?: string;
  content: string;
  similarity: number;
}

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Semantic Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResultChunk[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [docsData, subsData] = await Promise.all([
        apiRequest<{ documents: DocumentItem[] }>("/documents"),
        apiRequest<{ subjects: Subject[] }>("/subjects"),
      ]);
      setDocuments(docsData.documents || []);
      setSubjects(subsData.subjects || []);
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (docTitle.trim()) formData.append("title", docTitle.trim());
    if (selectedSubjectId) formData.append("subjectId", selectedSubjectId);

    try {
      const token = localStorage.getItem("studypilot_token");
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload document");
      }

      setUploadSuccess(`"${json.data.document.title}" uploaded & vectorized successfully!`);
      setSelectedFile(null);
      setDocTitle("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete document "${title}"? This will remove all associated vector chunks.`)) return;

    try {
      await apiRequest(`/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete document");
    }
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const data = await apiRequest<{ results: SearchResultChunk[] }>("/search/semantic", {
        method: "POST",
        body: JSON.stringify({
          query: searchQuery.trim(),
          limit: 4,
          minSimilarity: 0.1,
        }),
      });

      setSearchResults(data.results || []);
    } catch (err: any) {
      alert(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Upload Zone & Vector Search Top Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Upload Card */}
        <div className="glass-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileUp size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Upload Study Material</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Supports PDF, Markdown, and TXT files</p>
            </div>
          </div>

          {uploadSuccess && (
            <div style={{ padding: "10px 14px", background: "var(--accent-emerald-light)", color: "var(--accent-emerald)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", fontWeight: "600", marginBottom: "14px" }}>
              ✅ {uploadSuccess}
            </div>
          )}

          <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label className="input-label">Select File (.pdf, .txt, .md)</label>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file && !docTitle) {
                    setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
                required
                className="input-field"
                style={{ padding: "8px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label className="input-label">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems Notes"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Assign Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="input-field"
                >
                  <option value="">No Subject (General)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="btn btn-primary"
              style={{ marginTop: "4px" }}
            >
              {uploading ? "Chunking & Vectorizing Notes..." : "Upload & Vectorize Notes"}
              <FileUp size={16} />
            </button>
          </form>
        </div>

        {/* Semantic Search Card */}
        <div className="glass-card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--accent-cyan-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Semantic Vector Search</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Test cosine similarity against your knowledge base</p>
            </div>
          </div>

          <form onSubmit={handleSemanticSearch} style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search concepts, e.g. 'How does paging work in OS?'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={searching || !searchQuery.trim()} className="btn btn-secondary" style={{ flexShrink: 0 }}>
              <Search size={16} />
              <span>Search</span>
            </button>
          </form>

          {/* Search Result Items */}
          <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {searchResults.length === 0 && !searching ? (
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                Enter a query above to see semantic vector chunks retrieved by pgvector.
              </p>
            ) : (
              searchResults.map((res) => (
                <div key={res.chunkId} style={{ padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ color: "var(--primary)" }}>{res.documentTitle}</strong>
                    <span className="badge badge-primary" style={{ fontSize: "0.68rem" }}>
                      {Math.round(res.similarity * 100)}% Match
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)" }}>{res.content.slice(0, 160)}...</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Document Library Table */}
      <div className="glass-card" style={{ padding: "24px 28px" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "16px" }}>Your Knowledge Base ({documents.length} Documents)</h3>

        {documents.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <FileText size={36} color="var(--text-muted)" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No documents uploaded yet. Upload your first PDF or lecture notes above!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-sm)", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>{doc.title}</h4>
                    <div style={{ display: "flex", gap: "8px", marginTop: "2px", alignItems: "center" }}>
                      <span className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>{doc.fileType}</span>
                      {doc.subject && <span className="badge badge-primary" style={{ fontSize: "0.65rem" }}>{doc.subject.name}</span>}
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="btn btn-ghost"
                  style={{ color: "var(--accent-rose)", padding: "6px" }}
                  title="Delete Document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
