# 🎓 StudyPilot — Personal AI Learning Agent

> **An intelligent, Socratic AI learning companion built with Multi-Provider LLM Fallbacks, pgvector RAG semantic search, adaptive active recall quizzes, and real-time mastery analytics.**

---

## 🌟 Key Features

### 1. 🤖 Socratic AI Chat Tutor
- **Active Learning Methodology**: Guides students through tough concepts using analogies, step-by-step breakdowns, and active recall checks rather than giving direct spoon-fed answers.
- **RAG-Grounded Answers**: Fetches relevant notes from uploaded study materials and cites exact sources.
- **Rich Markdown Formatting**: Renders formatted comparison tables, code blocks, and highlighted `### 🎯 Active Learning Check` callout cards.

### 2. ⚡ Multi-Provider LLM Fallback Pipeline
- Automatic failover: **Google Gemini (`gemini-3.6-flash`) ➔ Groq (`openai/gpt-oss-120b`) ➔ OpenAI (`gpt-4o`) ➔ Offline Mock**.
- Guarantees zero downtime even during rate limits (429), server errors (503), or quota expirations.

### 3. 📚 Smart Document Ingestion & pgvector RAG
- Supports **PDF**, **Markdown (`.md`)**, and **Plain Text (`.txt`)** study notes.
- Automatic text extraction, semantic sentence chunking, and 768-dimensional vector embeddings with `gemini-embedding-001`.
- Fast cosine similarity vector queries stored directly in PostgreSQL with `pgvector`.

### 4. 🧠 Adaptive Active Recall & Quiz Engine
- Generates targeted conceptual and numerical questions tailored to specific subjects and topics.
- Multi-tier difficulty levels (*Beginner*, *Intermediate*, *Advanced*).
- AI diagnostic evaluation: Scores open-ended answers and pinpoints conceptual weak spots.

### 5. 📊 Knowledge Mastery Dashboard & Study Logger
- Real-time mastery dials (0–100%) computed per topic based on quiz performance.
- Automated **Weak Topics Radar** to alert students about concepts needing revision.
- Focus study session timer with logged notes and time tracking.

### 6. ✨ Student-Friendly Web Interface
- Modern light glassmorphism design built with React 18, Vite, Vanilla CSS design tokens, and Lucide icons.
- Instant 1-Click Demo Login to explore features immediately.

---

## 🏗️ System Architecture & Tech Stack

```
   ┌────────────────────────────────────────────────────────┐
   │             React 18 + Vite Web Client                 │
   │  (Dashboard, Socratic Chat, Quiz Arena, Materials)    │
   └──────────────────────────┬─────────────────────────────┘
                              │ HTTP / REST (/api)
   ┌──────────────────────────▼─────────────────────────────┐
   │             Node.js + Express TypeScript API           │
   │     Auth Middleware │ Controllers │ Services │ Repos   │
   └──────┬───────────────────┬──────────────────────┬──────┘
          │                   │                      │
   ┌──────▼──────┐     ┌──────▼──────┐        ┌──────▼──────┐
   │ PostgreSQL  │     │ LLM Manager │        │ Embeddings  │
   │  + pgvector │     │ (Multi-LLM) │        │ (Gemini 768)│
   │  (Docker)   │     │Gemini/Groq/OAI│      │             │
   └─────────────┘     └─────────────┘        └─────────────┘
```

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, Multer, `pdf-parse`.
- **Frontend**: React 18, Vite, Vanilla CSS Tokens, Lucide React.
- **Database**: PostgreSQL 17 with `pgvector` extension.
- **AI Models**: Google Gemini (`gemini-3.6-flash`, `gemini-embedding-001`), Groq SDK (`openai/gpt-oss-120b`), OpenAI SDK (`gpt-4o`).
- **Testing**: Jest with `--experimental-vm-modules` (13 test suites, 108 tests passing).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/)

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/krishu2814/StudyPilot.git
cd StudyPilot

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```env
PORT=8000
DATABASE_URL="postgresql://studypilot:studypilot123@localhost:5433/studypilot_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"

# LLM Provider Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start Database & Push Schema
```bash
# Start PostgreSQL with pgvector container
docker compose up -d

# Sync Prisma database schema
npx prisma db push
```

### 5. Launch Servers
In two separate terminals:

```bash
# Terminal 1: Start Backend API (http://localhost:8000)
npm run dev

# Terminal 2: Start Frontend Web App (http://localhost:5173)
npm run client:dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser and click **"1-Click Demo Student"** to get started!

---

## 🧪 Testing & Verification

### Automated Test Suite
Run the 108 unit and integration tests:
```bash
npm test
```

### End-to-End System Audit
Run the live end-to-end integration test against the database and AI engine:
```bash
npx tsx scratch/test_e2e_full.ts
```

### Postman Collection
Import `StudyPilot.postman_collection.json` into Postman to test all REST endpoints with automated JWT handling.

---

## 🔮 Future Improvements (Roadmap)

- 🎙️ **Voice & Audio Socratic Tutor**: Real-time bidirectional voice interactions using Gemini Live WebSockets.
- 📇 **Spaced Repetition Flashcards**: Automated flashcard generation with SM-2 spaced repetition scheduling.
- 🎥 **Video & Lecture Ingestion**: Transcribe YouTube lectures and generate timestamped study notes.
- ✍️ **Handwritten Notes & LaTeX OCR**: Visual recognition of handwritten math and chemical equations.
- 👥 **Peer Study Arena**: Live collaborative quiz battles and shared study rooms.

---

## 📄 License
MIT License © 2026 StudyPilot. Built for students worldwide.
