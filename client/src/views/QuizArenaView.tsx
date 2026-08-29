import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Award,
} from "lucide-react";
import { apiRequest } from "../api/client.ts";

interface Subject {
  id: string;
  name: string;
}

interface Question {
  id: string;
  questionText: string;
  difficulty: string;
  options: string[] | null;
}

interface Quiz {
  id: string;
  topicName: string;
  questions: Question[];
}

interface QuizAnswerResult {
  questionId: string;
  questionText: string;
  expectedAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  detectedWeakness: string | null;
}

interface QuizResults {
  quiz: {
    id: string;
    topicName: string;
    score: number;
    completed: boolean;
    answers: QuizAnswerResult[];
  };
  totalQuestions: number;
  correctCount: number;
  percentage: number;
}

interface QuizArenaViewProps {
  initialTopic?: string;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({ initialTopic }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [topicName, setTopicName] = useState<string>(initialTopic || "");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [questionCount, setQuestionCount] = useState<number>(3);

  // Active Quiz State
  const [generating, setGenerating] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  useEffect(() => {
    apiRequest<{ subjects: Subject[] }>("/subjects")
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let interval: any;
    if (activeQuiz && !quizResults) {
      interval = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizResults]);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    setGenerating(true);
    setQuizResults(null);
    setAnswers({});
    setSecondsElapsed(0);

    try {
      const data = await apiRequest<{ quiz: Quiz }>("/quizzes/generate", {
        method: "POST",
        body: JSON.stringify({
          topicName: topicName.trim(),
          subjectId: selectedSubjectId || undefined,
          difficulty,
          count: questionCount,
        }),
      });

      setActiveQuiz(data.quiz);
    } catch (err: any) {
      alert(err.message || "Failed to generate active recall quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    const formattedAnswers = activeQuiz.questions.map((q) => ({
      questionId: q.id,
      userAnswer: answers[q.id] || "No answer provided",
    }));

    setSubmitting(true);
    try {
      const data = await apiRequest<QuizResults>(`/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      setQuizResults(data);
    } catch (err: any) {
      alert(err.message || "Failed to evaluate quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Quiz Results View */}
      {quizResults ? (
        <div className="glass-card" style={{ padding: "32px", background: "var(--bg-surface)" }}>
          {/* Header Score Card */}
          <div
            style={{
              textAlign: "center",
              padding: "24px",
              background: "linear-gradient(135deg, #eef2ff, #f0fdf4)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(199, 210, 254, 0.8)",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 12px",
                borderRadius: "var(--radius-full)",
                background: quizResults.percentage >= 70 ? "var(--accent-emerald-light)" : "var(--accent-amber-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {quizResults.percentage >= 70 ? (
                <Award size={36} color="var(--accent-emerald)" />
              ) : (
                <Trophy size={36} color="var(--accent-amber)" />
              )}
            </div>

            <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {quizResults.percentage >= 80
                ? "Outstanding Mastery! 🌟"
                : quizResults.percentage >= 50
                ? "Good Effort! Keep Practicing 👍"
                : "Active Recall Complete 🎯"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Quiz on <strong style={{ color: "var(--primary)" }}>{quizResults.quiz.topicName}</strong>
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "16px" }}>
              <div>
                <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary)" }}>
                  {quizResults.percentage}%
                </span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Overall Score</p>
              </div>
              <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: "24px" }}>
                <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-emerald)" }}>
                  {quizResults.correctCount} / {quizResults.totalQuestions}
                </span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Correct Answers</p>
              </div>
            </div>
          </div>

          {/* Detailed Question Feedback Breakdown */}
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "16px" }}>Detailed AI Evaluation Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {quizResults.quiz.answers.map((ans, idx) => (
              <div
                key={idx}
                style={{
                  padding: "18px 20px",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${ans.isCorrect ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
                  background: ans.isCorrect ? "#f0fdf4" : "#fff1f2",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {idx + 1}. {ans.questionText}
                  </h4>
                  <span className={`badge ${ans.isCorrect ? "badge-emerald" : "badge-rose"}`} style={{ flexShrink: 0 }}>
                    {ans.isCorrect ? "Correct" : "Needs Review"}
                  </span>
                </div>

                <div style={{ marginTop: "10px", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <p>
                    <strong style={{ color: "var(--text-secondary)" }}>Your Answer: </strong>
                    <span style={{ color: ans.isCorrect ? "var(--accent-emerald)" : "var(--accent-rose)", fontWeight: "600" }}>
                      {ans.userAnswer}
                    </span>
                  </p>
                  <p>
                    <strong style={{ color: "var(--text-secondary)" }}>Expected Key Concept: </strong>
                    <span style={{ color: "var(--text-primary)" }}>{ans.expectedAnswer}</span>
                  </p>
                  <p style={{ background: "#ffffff", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(0,0,0,0.06)", marginTop: "4px" }}>
                    <strong style={{ color: "var(--primary)" }}>AI Feedback: </strong>
                    {ans.feedback}
                  </p>

                  {ans.detectedWeakness && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-rose)", fontWeight: "600", fontSize: "0.8rem", marginTop: "4px" }}>
                      <AlertTriangle size={14} />
                      <span>Diagnosed Concept Weakness: {ans.detectedWeakness}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setActiveQuiz(null);
              setQuizResults(null);
            }}
            className="btn btn-primary"
            style={{ marginTop: "24px", width: "100%", padding: "12px" }}
          >
            <RotateCcw size={18} />
            <span>Generate Another Quiz</span>
          </button>
        </div>
      ) : activeQuiz ? (
        /* 2. Active Quiz Runner */
        <div className="glass-card" style={{ padding: "28px 32px", background: "var(--bg-surface)" }}>
          {/* Quiz Status Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "16px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "24px" }}>
            <div>
              <span className="badge badge-primary">{activeQuiz.topicName}</span>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800", marginTop: "4px" }}>Active Recall Practice</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-subtle)", padding: "6px 14px", borderRadius: "var(--radius-full)", fontWeight: "700", color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
              <Clock size={16} />
              <span>{formatTime(secondsElapsed)}</span>
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {activeQuiz.questions.map((q, qIndex) => (
              <div key={q.id} style={{ padding: "20px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "var(--radius-full)", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "700" }}>
                    {qIndex + 1}
                  </span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>{q.questionText}</h4>
                </div>

                {/* Multiple Choice Options */}
                {q.options && q.options.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
                    {q.options.map((opt, optIndex) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <div
                          key={optIndex}
                          onClick={() => handleOptionSelect(q.id, opt)}
                          style={{
                            padding: "12px 16px",
                            borderRadius: "var(--radius-md)",
                            background: isSelected ? "var(--primary-light)" : "#ffffff",
                            border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                            color: isSelected ? "var(--primary)" : "var(--text-primary)",
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: "0.88rem",
                            cursor: "pointer",
                            transition: "var(--transition)",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div style={{ width: "18px", height: "18px", borderRadius: "var(--radius-full)", border: `2px solid ${isSelected ? "var(--primary)" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isSelected && <div style={{ width: "8px", height: "8px", borderRadius: "var(--radius-full)", background: "var(--primary)" }} />}
                          </div>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Open Ended Text Area */
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="Type your explanation or conceptual answer..."
                    value={answers[q.id] || ""}
                    onChange={(e) => handleOptionSelect(q.id, e.target.value)}
                    style={{ marginTop: "10px", resize: "vertical" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Submit CTA */}
          <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: "12px 28px", fontSize: "1rem" }}
            >
              {submitting ? "Evaluating Answers with AI..." : "Submit Quiz & Grade Answers"}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* 3. Quiz Configuration Form */
        <div className="glass-card" style={{ maxWidth: "680px", margin: "0 auto", width: "100%", padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-md)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={24} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "800" }}>Generate Adaptive AI Quiz</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Test your active recall with tailored conceptual and multiple-choice questions
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateQuiz} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label className="input-label">Topic / Concept to Test</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Database Normalization (1NF, 2NF, 3NF), Virtual Memory, etc."
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label className="input-label">Subject / Course (Optional)</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Any / General Topic</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="input-field"
                >
                  <option value="beginner">Beginner (Foundational)</option>
                  <option value="intermediate">Intermediate (Standard)</option>
                  <option value="advanced">Advanced (Deep Conceptual)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Question Count</label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[2, 3, 5, 8].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border: `1.5px solid ${questionCount === count ? "var(--primary)" : "var(--border-subtle)"}`,
                      background: questionCount === count ? "var(--primary-light)" : "#ffffff",
                      color: questionCount === count ? "var(--primary)" : "var(--text-primary)",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "var(--transition)",
                    }}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || !topicName.trim()}
              className="btn btn-primary"
              style={{ marginTop: "12px", padding: "12px" }}
            >
              {generating ? "Crafting Adaptive Questions..." : "Generate Active Recall Quiz"}
              <Sparkles size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
