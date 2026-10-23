<div align="center">

# Campus Career Copilot

### AI-Powered Placement Prep, MCP Server & Job Tracking Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Groq](https://img.shields.io/badge/Groq-LLM_Provider-F55036?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PC9zdmc+&logoColor=white)](https://console.groq.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Manage your entire job search pipeline — from bookmarking roles to landing offers — with an interactive Kanban board, an AI assistant that calls 8 domain tools, adaptive DSA practice with Leitner spaced repetition, and a Model Context Protocol server for IDE integrations.**

[Report Bug](https://github.com/shrisha337-beep/ai-job-tracker/issues) · [Request Feature](https://github.com/shrisha337-beep/ai-job-tracker/issues)

</div>

---

## System Architecture

```mermaid
graph TB
    subgraph Client["Browser / Mobile Client"]
        UI["Next.js App Router<br/>React + Tailwind CSS"]
        Chat["Assistant Chat Panel<br/>SSE Streaming"]
    end

    subgraph Edge["Vercel Edge / Node.js Runtime"]
        Auth["NextAuth.js<br/>Google OAuth"]
        API["API Routes"]
        MCP["MCP Server<br/>/api/mcp<br/>Streamable HTTP"]
        ChatRoute["Chat Route<br/>/api/assistant/chat"]
    end

    subgraph AI["AI Agent Loop"]
        LLM["Groq LLM<br/>openai/gpt-oss-120b"]
        Tools["Tool Registry<br/>8 Domain Tools"]
        Grading["Grading Service<br/>Zod + Keyword Fallback"]
    end

    subgraph Services["Domain Services"]
        Resume["Resume Service<br/>Skill Extraction"]
        Internship["Internship Service<br/>Multi-Factor Ranking"]
        Tracker["Tracker Service<br/>Application Pipeline"]
        Planner["Planner Service<br/>Adaptive Scheduling"]
        Practice["Practice Service<br/>Leitner Spaced Repetition"]
        Progress["Progress Service<br/>Readiness Scoring"]
    end

    subgraph Data["Data Layer"]
        Prisma["Prisma ORM v7<br/>pg driver adapter"]
        DB[("Neon PostgreSQL<br/>Serverless")]
        Taxonomy["taxonomy.json<br/>Skills + Questions"]
        Listings["Seeded Listings<br/>30+ Internships"]
    end

    UI --> Auth
    UI --> API
    Chat --> ChatRoute
    ChatRoute --> LLM
    LLM -->|"tool_calls"| Tools
    Tools -->|"tool results"| LLM
    LLM -->|"final response"| ChatRoute
    Tools --> Services
    MCP --> Tools
    Services --> Prisma
    Prisma --> DB
    Resume --> Taxonomy
    Practice --> Taxonomy
    Internship --> Listings
    Grading --> LLM

    style Client fill:#1a1a2e,stroke:#e94560,color:#eee
    style Edge fill:#16213e,stroke:#0f3460,color:#eee
    style AI fill:#0f3460,stroke:#533483,color:#eee
    style Services fill:#533483,stroke:#e94560,color:#eee
    style Data fill:#1a1a2e,stroke:#e94560,color:#eee
```

---

## Agent Tool-Call Loop

Every chat message triggers a multi-step agent loop. The LLM decides which tools to invoke, executes them server-side, and synthesizes a final response.

```mermaid
sequenceDiagram
    participant U as User
    participant C as Chat Route
    participant L as Groq LLM
    participant T as Tool Registry
    participant S as Services
    participant D as Neon DB

    U->>C: POST /api/assistant/chat
    C->>C: Authenticate (NextAuth)
    C->>C: Load cross-session memory
    C->>L: System prompt + conversation + user message

    loop Up to 5 tool iterations
        L-->>C: tool_calls (e.g. resume_analyzer)
        C->>T: Execute tool handler
        T->>S: Delegate to domain service
        S->>D: Query / Mutate
        D-->>S: Result
        S-->>T: Structured response
        T-->>C: text + card payload
        C-->>U: SSE: tool_call + tool_result events
        C->>L: Append assistant + tool messages
    end

    L-->>C: Final text response
    C-->>U: SSE: delta + done events
    C->>D: Persist assistant message
```

---

## Data Flow: 4-Step Demo

The core demo follows a student through four steps — from resume upload to adaptive DSA practice.

```mermaid
flowchart LR
    subgraph Step1["Step 1: Resume Analysis"]
        R["Upload Resume"] --> EX["Extract Skills<br/>via taxonomy.json"]
        EX --> SC["Scorecard<br/>Score + Grade + Gaps"]
    end

    subgraph Step2["Step 2: Internship Search"]
        SC --> RANK["Multi-Factor Ranking"]
        RANK --> TOP["Top 5 Listings<br/>Match + Urgency + Fit"]
    end

    subgraph Step3["Step 3: Track & Plan"]
        TOP --> ADD["Add to Tracker<br/>BOOKMARKED"]
        ADD --> PLAN["14-Day Study Plan<br/>DSA + Application Tasks"]
    end

    subgraph Step4["Step 4: DSA Practice"]
        PLAN --> NEXT["Next Question<br/>Weakness-First Selection"]
        NEXT --> EVAL["Evaluate Answer<br/>LLM Grading + Fallback"]
        EVAL --> ADAPT["Adapt Plan<br/>Leitner + EMA Mastery"]
        ADAPT -.->|"Loop"| NEXT
    end

    style Step1 fill:#1a1a2e,stroke:#e94560,color:#eee
    style Step2 fill:#16213e,stroke:#0f3460,color:#eee
    style Step3 fill:#0f3460,stroke:#533483,color:#eee
    style Step4 fill:#533483,stroke:#e94560,color:#eee
```

---

## Amazon Hackathon (20-23 Oct 2026)

This repository is being extended during the Amazon Hackathon (Alexa+ simulated track, AWS Builder, Open Source). The pre-hackathon state is tagged as [`v1-baseline`](../../tree/v1-baseline). Every change made during the hackathon is logged with commit references in [`HACKATHON_CHANGELOG.md`](HACKATHON_CHANGELOG.md).

---

## MCP Server — Stage 1 Evidence

Campus Career Copilot exposes an official Model Context Protocol (MCP) server over **Streamable HTTP** at `/api/mcp`, implementing protocol specification **`2025-11-25`** via `@modelcontextprotocol/sdk`.

```mermaid
flowchart LR
    IDE["IDE / MCP Client"] -->|"Bearer Token"| MCP["/api/mcp<br/>Streamable HTTP"]
    MCP -->|"tools/list"| REG["Tool Registry<br/>8 Tools"]
    MCP -->|"tools/call"| EXEC["Tool Execution"]
    EXEC --> SVC["Domain Services"]
    SVC --> DB[("Neon PostgreSQL")]
    EXEC -->|"text + card"| MCP
    MCP -->|"JSON-RPC Response"| IDE

    style IDE fill:#1a1a2e,stroke:#e94560,color:#eee
    style MCP fill:#0f3460,stroke:#533483,color:#eee
```

<details>
<summary>Smoke Test Output</summary>

```text
================================================================================
 Campus Career Copilot — MCP Streamable HTTP Smoke Test
================================================================================
SDK Supported Protocol Versions: ["2025-11-25","2025-06-18","2025-03-26","2024-11-05","2024-10-07"]

[1/4] Verifying 401 Unauthorized for unauthenticated requests...
    Status received: 401 Unauthorized
    [PASS] Unauthenticated request rejected with HTTP 401

[2/4] Provisioning judge token and establishing Streamable HTTP transport...
    [PASS] MCP Protocol version 2025-11-25 successfully negotiated

[3/4] Calling tools/list...
    Tools found (8): resume_analyzer, internship_search, tracker_add,
    tracker_list, study_plan, dsa_next, dsa_evaluate, progress_summary
    [PASS] All 8 tools registered and exposed over MCP

[4/4] Executing tool call: dsa_next...
    Card type: "quiz_card"
    [PASS] Tool execution succeeded with structured output

================================================================================
 ALL MCP SMOKE TESTS PASSED SUCCESSFULLY
================================================================================
```

</details>

**Judge Evaluation Commands:**

```bash
npx tsx scripts/mint-demo-token.ts      # Mint a 60-day Bearer token
npx tsx scripts/reset-demo-user.ts      # Clean demo data before judging
npx tsx scripts/mcp-smoke.ts            # Run smoke tests (supports MCP_URL=...)
```

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Tool Registry](#tool-registry)
- [Ranking Algorithm](#ranking-algorithm)
- [Quick Start](#quick-start)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment-to-vercel)
- [Mobile App (Android)](#mobile-app-android-apk)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| **Google OAuth Login** | One-click Google sign-in via NextAuth.js |
| **Interactive Kanban Board** | Drag-and-drop pipeline: *Bookmarked, Applied, Screening, Interview, Offer, Rejected* (`@dnd-kit`) |
| **AI Assistant Chat** | Streaming chat panel with 8 domain tools, cross-session memory, and structured card outputs |
| **MCP Server** | Model Context Protocol endpoint at `/api/mcp` for IDE and agent integrations |
| **Resume Skill Extraction** | Upload PDF/TXT resumes; auto-detects skills against a 50+ skill taxonomy |
| **Multi-Factor Internship Ranking** | Ranks 30+ seeded listings by skill match, role fit, work-mode preference, and deadline urgency |
| **Adaptive Study Planner** | Generates daily plans with DSA, revision, resume, and application deadline tasks |
| **Leitner Spaced Repetition** | DSA mastery tracking with 5-box system, exponential moving average, and automatic replanning |
| **LLM-Graded Code Evaluation** | Groq-powered grading with Zod validation, keyword fallback on failure, and clamped 0-1 scores |
| **Insights Dashboard** | Stats cards with application counts, response rates, match scores, and per-status breakdowns |
| **Premium Dark UI** | 1,100+ line CSS design system with glassmorphism, gradient accents, and micro-animations |
| **Interactive Moire Hero** | Mathematical grating wave background with pointer tracking and drift physics |
| **Mobile Responsive** | Fully responsive design across all screen sizes |
| **Android APK** | Native wrapper via Capacitor |

---

## Tech Stack

<table>
  <tr>
    <td align="center" width="96">
      <a href="https://nextjs.org/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="48" height="48" alt="Next.js" />
      </a>
      <br><sub><b>Next.js 16</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://www.typescriptlang.org/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
      </a>
      <br><sub><b>TypeScript</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://react.dev/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React" />
      </a>
      <br><sub><b>React 19</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://tailwindcss.com/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48" alt="Tailwind CSS" />
      </a>
      <br><sub><b>Tailwind v4</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://www.prisma.io/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg" width="48" height="48" alt="Prisma" />
      </a>
      <br><sub><b>Prisma v7</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://www.postgresql.org/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="48" height="48" alt="PostgreSQL" />
      </a>
      <br><sub><b>PostgreSQL</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="96">
      <a href="https://console.groq.com/">
        <img src="https://img.shields.io/badge/G-F55036?style=flat-square" width="48" height="48" alt="Groq" />
      </a>
      <br><sub><b>Groq LLM</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://neon.tech/">
        <img src="https://img.shields.io/badge/N-4169E1?style=flat-square" width="48" height="48" alt="Neon" />
      </a>
      <br><sub><b>Neon DB</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://vercel.com/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg" width="48" height="48" alt="Vercel" />
      </a>
      <br><sub><b>Vercel</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://next-auth.js.org/">
        <img src="https://img.shields.io/badge/NA-000?style=flat-square" width="48" height="48" alt="NextAuth" />
      </a>
      <br><sub><b>NextAuth.js</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://vitest.dev/">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitest/vitest-original.svg" width="48" height="48" alt="Vitest" />
      </a>
      <br><sub><b>Vitest</b></sub>
    </td>
    <td align="center" width="96">
      <a href="https://capacitorjs.com/">
        <img src="https://img.shields.io/badge/C-119EFF?style=flat-square" width="48" height="48" alt="Capacitor" />
      </a>
      <br><sub><b>Capacitor</b></sub>
    </td>
  </tr>
</table>

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Runtime** | Next.js 16 (App Router, Turbopack) | SSR, API routes, SSE streaming |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Styling** | Tailwind CSS v4 + custom design system | Glassmorphism, animations, dark mode |
| **Database** | PostgreSQL on Neon | Serverless, auto-scaling |
| **ORM** | Prisma v7 with `pg` driver adapter | Type-safe queries, migrations |
| **Auth** | NextAuth.js v4 (Google OAuth) | Session-based authentication |
| **LLM** | Groq (OpenAI-compatible API) | Chat completions, DSA grading |
| **State** | Zustand + React Query | Client-side state + server cache |
| **DnD** | `@dnd-kit/core` + `@dnd-kit/sortable` | Kanban drag-and-drop |
| **Charts** | Recharts | Dashboard visualizations |
| **PDF** | `pdf-parse` | Resume text extraction |
| **Mobile** | Capacitor | Android native wrapper |
| **Testing** | Vitest | Unit + integration tests (302 unit, 17 integration) |

---

## Tool Registry

All 8 tools are shared between the Assistant Chat route and the MCP server. Each tool returns a human-readable `text` field (fed back to the LLM) and a `structured.card` payload (rendered on the frontend).

```mermaid
graph LR
    subgraph Tools["8 Domain Tools"]
        T1["resume_analyzer"]
        T2["internship_search"]
        T3["tracker_add"]
        T4["tracker_list"]
        T5["study_plan"]
        T6["dsa_next"]
        T7["dsa_evaluate"]
        T8["progress_summary"]
    end

    subgraph Cards["Frontend Cards"]
        C1["resume_scorecard"]
        C2["internship_list"]
        C3["tracker_card"]
        C4["tracker_board"]
        C5["plan_card"]
        C6["quiz_card"]
        C7["eval_card"]
        C8["progress_card"]
    end

    T1 --> C1
    T2 --> C2
    T3 --> C3
    T4 --> C4
    T5 --> C5
    T6 --> C6
    T7 --> C7
    T8 --> C8

    style Tools fill:#0f3460,stroke:#533483,color:#eee
    style Cards fill:#533483,stroke:#e94560,color:#eee
```

| Tool | Input | Output |
|:-----|:------|:-------|
| `resume_analyzer` | — | Scorecard: score/100, grade, matched skills, priority gaps |
| `internship_search` | optional filters | Top 5 ranked listings with 4 sub-scores |
| `tracker_add` | listing ID or slug | Add listing to BOOKMARKED pipeline |
| `tracker_list` | — | Current tracked applications |
| `study_plan` | days, hours/day | Adaptive daily plan with DSA + application tasks |
| `dsa_next` | — | Next practice question (weakness-first selection) |
| `dsa_evaluate` | question ID, answer (max 4000 chars) | Graded scores + mastery update + plan adaptation |
| `progress_summary` | — | Overall readiness: resume, applications, DSA mastery |

---

## Ranking Algorithm

Internship ranking uses a weighted composite of four normalized sub-scores:

```mermaid
flowchart TB
    subgraph Inputs["Scoring Inputs"]
        SKILLS["Skill Match<br/>Jaccard Similarity<br/>resume vs listing"]
        ROLE["Role Fit<br/>Tag overlap with<br/>user preferences"]
        MODE["Mode Fit<br/>Remote / Hybrid / Onsite<br/>preference match"]
        URGENCY["Deadline Urgency<br/>Inverse time decay<br/>sqrt normalization"]
    end

    subgraph Weights["Composite Formula"]
        W["totalRank =<br/>0.40 * match +<br/>0.15 * roleFit +<br/>0.15 * modeFit +<br/>0.30 * urgency"]
    end

    subgraph Output["Result"]
        SORTED["Sorted Listings<br/>Top 5 returned"]
    end

    SKILLS --> W
    ROLE --> W
    MODE --> W
    URGENCY --> W
    W --> SORTED

    style Inputs fill:#1a1a2e,stroke:#e94560,color:#eee
    style Weights fill:#0f3460,stroke:#533483,color:#eee
    style Output fill:#533483,stroke:#e94560,color:#eee
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/shrisha337-beep/ai-job-tracker.git
cd ai-job-tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)

# 4. Set up the database
npx prisma migrate dev
npx prisma generate

# 5. Seed internship listings and DSA questions
npx tsx prisma/seed.ts

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

> [!TIP]
> Create a free serverless PostgreSQL database at [neon.tech](https://neon.tech) and copy the connection string into `DATABASE_URL`.

---

## Database Schema

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Application : creates
    User ||--o{ Resume : uploads
    User ||--o| UserProfile : has
    User ||--o{ ChatSession : starts
    User ||--o{ TopicMastery : tracks
    User ||--o{ PracticeAttempt : submits
    User ||--o{ StudyPlan : owns
    ChatSession ||--o{ ChatMessage : contains
    StudyPlan ||--o{ StudyTask : schedules
    Question ||--o{ PracticeAttempt : tested_in
    Listing ||--o{ Application : tracked_via

    Application {
        string id PK
        string status
        json parsedJD
        float matchScore
        json matchAnalysis
    }
    Resume {
        string id PK
        text rawText
        string[] parsedSkills
        boolean isActive
    }
    Listing {
        string id PK
        string slug UK
        string[] skills
        datetime deadline
    }
    Question {
        string id PK
        string slug UK
        string topic
        enum difficulty
        json rubric
    }
    TopicMastery {
        string topic
        float mastery
        int box
        datetime nextReviewAt
    }
    StudyPlan {
        float hoursPerDay
        boolean active
    }
    StudyTask {
        date date
        enum kind
        int minutes
        boolean done
    }
```

---

## API Routes

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/applications` | Create a new job application |
| `GET` | `/api/applications` | List user applications (search, filter, pagination) |
| `PATCH` | `/api/applications` | Update application fields |
| `DELETE` | `/api/applications` | Delete an application |
| `POST` | `/api/ai/parse-jd` | AI job description parser |
| `POST` | `/api/ai/match-score` | AI resume-to-JD match scorer |
| `POST` | `/api/resume` | Upload a resume (PDF or TXT) |
| `GET` | `/api/resume` | List user resumes |
| `POST` | `/api/assistant/chat` | Streaming assistant chat (SSE) |
| `POST` | `/api/mcp` | MCP server endpoint (Streamable HTTP) |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth.js handler |

> [!IMPORTANT]
> All API routes (except auth) require an authenticated session. Unauthenticated requests receive `401 Unauthorized`.

---

## Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | [neon.tech](https://neon.tech) |
| `NEXTAUTH_SECRET` | Session encryption key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) | Your deployment URL |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Same as above |
| `OPENAI_API_KEY` | Groq API key (OpenAI-compatible) | [console.groq.com](https://console.groq.com/) |
| `OPENAI_BASE_URL` | Groq endpoint URL | `https://api.groq.com/openai/v1` |
| `OPENAI_MODEL` | Model identifier | `openai/gpt-oss-120b` |

A ready-to-copy template lives in [`.env.example`](.env.example).

<details>
<summary>Example .env.local</summary>

```env
# Database
DATABASE_URL="postgresql://user:password@ep-example.us-east-2.aws.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"

# Groq LLM (OpenAI-compatible)
OPENAI_API_KEY="gsk_your-groq-api-key-here"
OPENAI_BASE_URL="https://api.groq.com/openai/v1"
OPENAI_MODEL="openai/gpt-oss-120b"
```

</details>

---

## Deployment to Vercel

```mermaid
flowchart LR
    GH["GitHub Repo"] -->|"git push"| V["Vercel"]
    V -->|"Build"| NX["Next.js Build"]
    NX -->|"Deploy"| PROD["Production"]
    PROD --> NEON[("Neon PostgreSQL")]
    PROD --> GROQ["Groq API"]

    style GH fill:#1a1a2e,stroke:#e94560,color:#eee
    style V fill:#000,stroke:#fff,color:#fff
    style PROD fill:#0f3460,stroke:#533483,color:#eee
```

1. **Push** your code to GitHub.
2. **Import** the repository on [vercel.com](https://vercel.com).
3. **Add environment variables** in the Vercel Dashboard (Settings > Environment Variables).
4. **Set `NEXTAUTH_URL`** to your Vercel production URL.
5. **Deploy** — Vercel builds and deploys automatically on every push.

> [!TIP]
> Add `https://your-app.vercel.app/api/auth/callback/google` to your Google OAuth Authorized Redirect URIs.

---

## Mobile App (Android APK)

The mobile app is a native Android wrapper built with [Capacitor](https://capacitorjs.com/) that loads the deployed web app.

### Prerequisites

- Node.js 18+
- Android Studio with Android SDK (API Level 36)
- A physical Android device or emulator

### Build Steps

```bash
# 1. Update capacitor.config.json with your Vercel URL
# 2. Sync web assets
npx cap sync

# 3. Open in Android Studio
npx cap open android

# 4. Build > Build APK(s) > app-debug.apk
```

The APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

<details>
<summary>Detailed Android Setup Guide</summary>

**Step 1:** Download and install [Android Studio](https://developer.android.com/studio).

**Step 2:** Set the SDK path in `android/local.properties`:

| OS | Default SDK Path |
|----|-----------------|
| **Windows** | `C:\Users\<username>\AppData\Local\Android\Sdk` |
| **macOS** | `~/Library/Android/sdk` |
| **Linux** | `~/Android/Sdk` |

**Step 3:** Update `capacitor.config.json`:

```json
{
  "server": {
    "url": "https://your-actual-vercel-url.vercel.app"
  }
}
```

**Step 4:** Build from command line (alternative):

```bash
cd android
./gradlew assembleDebug   # macOS/Linux
gradlew.bat assembleDebug  # Windows
```

**Step 5:** Install via ADB:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

</details>

---

## Tests

Tests use [Vitest](https://vitest.dev/). Unit tests run without a database or LLM; integration tests use a live Neon database.

```bash
npm test                # 302 unit tests
npm run test:integration # 17 integration tests (requires DATABASE_URL)
```

| Suite | Tests | Coverage |
|-------|:-----:|----------|
| `algorithms/matching` | 184 | Skill extraction, ID/name mapping, scoreMatch, rankListings |
| `algorithms/planner` | 18 | Study plan generation, application tasks, replanning |
| `algorithms/practice` | 18 | Weakness-first selection, Leitner box advancement |
| `algorithms/ranking` | 15 | Multi-factor ranking, sub-score normalization |
| `algorithms/progress` | 6 | Readiness scoring |
| `auth/route-guard` | 33 | Protected routes redirect, APIs return 401 |
| `auth/safe-callback` | 6 | OAuth callback safety |
| `auth/auth-config` | 2 | Google-only provider |
| `data/seed-integrity` | 11 | Taxonomy + seed data consistency |
| `tools/tools` | 7 | Tool registry completeness, userId isolation |
| `lib/time` | 2 | Time utilities |
| **services/grading** | 7 | LLM grading, Zod validation, keyword fallback |
| **services/services** | 10 | Full demo-path integration (resume > search > track > plan > DSA) |

---

## Troubleshooting

<details>
<summary><strong>"Invalid redirect_uri" during Google login</strong></summary>

Add these URIs to your Google Cloud Console OAuth credentials:
- `http://localhost:3000/api/auth/callback/google` (dev)
- `https://your-app.vercel.app/api/auth/callback/google` (production)

</details>

<details>
<summary><strong>Prisma: "Can't reach database server"</strong></summary>

- Verify `DATABASE_URL` includes `?sslmode=require` for Neon.
- Check that your Neon database is not suspended (free-tier auto-suspends on inactivity).
- Test: `npx prisma db pull`

</details>

<details>
<summary><strong>Chat returns rate limit errors</strong></summary>

Groq free tier has an 8,000 TPM limit. The provider automatically retries with dynamic backoff (up to 30s). If you see persistent 429 errors, wait 60s between requests or upgrade your Groq plan.

</details>

<details>
<summary><strong>Android app shows blank screen</strong></summary>

- Verify `server.url` in `capacitor.config.json` matches your live Vercel deployment.
- Run `npx cap sync` after changes.
- Rebuild the APK.

</details>

---

## Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/your-feature`
3. **Commit** with [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m 'feat: add feature'`
4. **Push** and open a Pull Request

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `refactor:` | Code refactoring |
| `test:` | Tests |
| `chore:` | Maintenance |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">

[Back to Top](#campus-career-copilot)

</div>
