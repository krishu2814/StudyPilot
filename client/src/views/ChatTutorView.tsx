import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  BookOpen,
  Sparkles,
  Layers,
  MessageSquare,
} from "lucide-react";
import { apiRequest } from "../api/client.ts";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  metadata?: any;
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
}

export const ChatTutorView: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSubjects = async () => {
    try {
      const data = await apiRequest<{ subjects: Subject[] }>("/subjects");
      setSubjects(data.subjects || []);
    } catch {}
  };

  const fetchConversations = async () => {
    try {
      const data = await apiRequest<{ conversations: Conversation[] }>("/conversations");
      setConversations(data.conversations || []);
      if (data.conversations && data.conversations.length > 0 && !activeConversationId) {
        setActiveConversationId(data.conversations[0].id);
      }
    } catch {}
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const data = await apiRequest<{
        conversation: { id: string; title: string; messages: Message[] };
      }>(`/conversations/${convId}`);

      setMessages(data.conversation.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleCreateNewSession = async () => {
    try {
      const data = await apiRequest<{ conversation: Conversation }>("/conversations", {
        method: "POST",
        body: JSON.stringify({ title: "New Study Session" }),
      });

      setConversations((prev) => [data.conversation, ...prev]);
      setActiveConversationId(data.conversation.id);
    } catch (err: any) {
      alert(err.message || "Failed to create session");
    }
  };

  const handleDeleteSession = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this study conversation?")) return;

    try {
      await apiRequest(`/conversations/${convId}`, { method: "DELETE" });
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConversationId === convId) {
        setActiveConversationId(updated[0]?.id || null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete conversation");
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt || inputQuestion).trim();
    if (!text || sending) return;

    let targetConvId = activeConversationId;
    if (!targetConvId) {
      // Auto create conversation if none active
      try {
        const data = await apiRequest<{ conversation: Conversation }>("/conversations", {
          method: "POST",
          body: JSON.stringify({ title: text.slice(0, 30) }),
        });
        targetConvId = data.conversation.id;
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
      } catch {
        return;
      }
    }

    const optimisticUserMsg: Message = {
      id: `temp-${Date.now()}`,
      sender: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInputQuestion("");
    setSending(true);

    try {
      const data = await apiRequest<{
        userMessage: Message;
        assistantMessage: Message;
      }>(`/conversations/${targetConvId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: text,
          subjectId: selectedSubjectId || undefined,
        }),
      });

      setMessages((prev) => [...prev.filter((m) => m.id !== optimisticUserMsg.id), data.userMessage, data.assistantMessage]);
    } catch (err: any) {
      alert(err.message || "Failed to get AI tutor response");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "24px",
        height: "calc(100vh - 120px)",
      }}
    >
      {/* Left Sidebar: Session List */}
      <div
        className="glass-card"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "18px 16px",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Conversations</h3>
          <button onClick={handleCreateNewSession} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {conversations.length === 0 ? (
            <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No past conversations. Click "New Chat" to start!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    background: isActive ? "var(--primary-light)" : "transparent",
                    color: isActive ? "var(--primary)" : "var(--text-primary)",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "var(--bg-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <MessageSquare size={16} color={isActive ? "var(--primary)" : "var(--text-muted)"} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.title || "Study Session"}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(conv.id, e)}
                    className="btn btn-ghost"
                    style={{ padding: "4px", color: "var(--text-muted)" }}
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div
        className="glass-card"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "20px 24px",
          background: "var(--bg-surface)",
        }}
      >
        {/* Chat Control Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-full)",
                background: "var(--primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Socratic AI Tutor</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Active learning assistant with multi-provider LLM failover
              </p>
            </div>
          </div>

          {/* RAG Context Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={16} color="var(--text-muted)" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="input-field"
              style={{ padding: "6px 10px", fontSize: "0.82rem", width: "auto" }}
            >
              <option value="">All Uploaded Subjects (Global)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {messages.length === 0 && !loadingMessages ? (
            <div style={{ margin: "auto", textAlign: "center", maxWidth: "450px", padding: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  margin: "0 auto 16px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={28} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>How can I help you learn today?</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                Ask me to explain any difficult concept from your uploaded course materials using analogies and practice questions.
              </p>

              {/* Suggestion Chips */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "20px" }}>
                {[
                  "Explain 3NF Normalization with a simple analogy",
                  "What is the difference between TCP and UDP?",
                  "Test my knowledge on Database Indexing",
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.82rem", padding: "8px 14px", textAlign: "left", justifyContent: "flex-start" }}
                  >
                    💡 {promptText}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === "user";
              const sources = msg.metadata?.usedSources as string[] | undefined;
              const provider = msg.metadata?.provider as string | undefined;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--primary-gradient)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "14px 18px",
                      borderRadius: "var(--radius-lg)",
                      background: isUser ? "var(--primary)" : "var(--bg-subtle)",
                      color: isUser ? "#ffffff" : "var(--text-primary)",
                      boxShadow: isUser ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "var(--shadow-sm)",
                      borderTopRightRadius: isUser ? "4px" : "var(--radius-lg)",
                      borderTopLeftRadius: !isUser ? "4px" : "var(--radius-lg)",
                      fontSize: "0.925rem",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {msg.content}

                    {/* Source Citations */}
                    {sources && sources.length > 0 && (
                      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(0, 0, 0, 0.08)", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <BookOpen size={12} /> Sources:
                        </span>
                        {sources.map((src, idx) => (
                          <span key={idx} className="badge badge-primary" style={{ fontSize: "0.68rem" }}>
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {provider && (
                      <div style={{ marginTop: "6px", textAlign: "right" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>via {provider}</span>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-secondary)",
                        flexShrink: 0,
                      }}
                    >
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--primary-gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Bot size={16} />
              </div>
              <div
                style={{
                  padding: "12px 18px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                }}
              >
                Generating Socratic explanation grounded in your notes...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <input
            type="text"
            className="input-field"
            placeholder="Ask your AI Tutor about any topic or concept..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !inputQuestion.trim()} className="btn btn-primary" style={{ padding: "0 20px" }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
