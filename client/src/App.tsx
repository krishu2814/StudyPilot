import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { Sidebar, ActiveTab } from "./components/Sidebar.tsx";
import { Header } from "./components/Header.tsx";
import { AuthView } from "./views/AuthView.tsx";
import { DashboardView } from "./views/DashboardView.tsx";
import { ChatTutorView } from "./views/ChatTutorView.tsx";
import { QuizArenaView } from "./views/QuizArenaView.tsx";
import { DocumentsView } from "./views/DocumentsView.tsx";
import { SubjectsView } from "./views/SubjectsView.tsx";
import { SessionLogView } from "./views/SessionLogView.tsx";

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedQuizTopic, setSelectedQuizTopic] = useState<string>("");

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "4px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>Loading StudyPilot...</h3>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleSelectTopicForQuiz = (topicName: string) => {
    setSelectedQuizTopic(topicName);
    setActiveTab("quizzes");
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="app-main">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="app-content">
          {activeTab === "dashboard" && (
            <DashboardView
              setActiveTab={setActiveTab}
              onSelectTopicForQuiz={handleSelectTopicForQuiz}
            />
          )}

          {activeTab === "chat" && <ChatTutorView />}

          {activeTab === "quizzes" && (
            <QuizArenaView initialTopic={selectedQuizTopic} />
          )}

          {activeTab === "documents" && <DocumentsView />}

          {activeTab === "subjects" && <SubjectsView />}

          {activeTab === "sessions" && <SessionLogView />}
        </div>
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
