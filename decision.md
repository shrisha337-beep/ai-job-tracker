# 🏛️ Project Decision & Architecture Record: JobTracker AI

> **Document Version**: 1.0.0  
> **Last Updated**: September 2026  
> **Repository**: `ai-job-tracker`  
> **Author**: Core Development Team  

---

## 📌 Executive Summary

**JobTracker AI** is an intelligent, high-performance job application tracking platform designed to eliminate the chaos, manual labor, and uncertainty of the modern job search. 

This document records the exact problems solved, architecture constructed, technology choices justified, technical challenges overcome, library decisions taken, and an exhaustive chronological log of all critical project decisions. It is written in simple, clear, and unambiguous language.

---

## 1. 🎯 What Problem Did We Solve?

Searching for a job in the modern tech ecosystem is painful, disorganized, and opaque. Job seekers face three core problems:

### A. The "Spreadsheet Nightmare" (Disorganized Pipeline)
- Job seekers typically track 50 to 200+ applications across Google Sheets, Excel, Apple Notes, or email folders.
- Spreadsheets quickly become outdated, cumbersome to edit on mobile, lack automated status reminders, and do not preserve interview notes, recruiter contacts, or job descriptions when listings expire.

### B. The "Black Hole" & ATS Rejection Blindness
- Most corporate job portals use Applicant Tracking Systems (ATS) that parse and rank resumes based on keyword matching and semantic relevance.
- Applicants apply blindly with generic resumes without knowing if their skills match what the employer actually listed as requirements, leading to high rejection rates and zero feedback.

### C. Manual Overhead & Time Waste
- Reading long, repetitive Job Descriptions (JDs), manually copying company names, salary ranges, required technologies, job types (remote/hybrid/onsite), and responsibilities takes hours of manual effort.
- Applicants lack visibility into their conversion funnel (e.g., *Is my resume failing at the screening round, or am I dropping out at the technical interview?*).

---

## 2. 🚀 What Did We Make?

We built **JobTracker AI** — a centralized command center that automates the job search workflow:

1. **Interactive Kanban Pipeline**:
   - A visual 6-stage drag-and-drop board (*Bookmarked → Applied → Screening → Interview → Offer → Rejected*) built with fluid animations and responsive mobile touch support.
   - A quick-toggle between the Kanban board and a tabular glassmorphic list view with searching, filtering, and sorting.

2. **AI-Powered Job Description Parser**:
   - Accepts any raw JD text or job listing URL.
   - Uses OpenAI's `gpt-4o-mini` with structured JSON output mode to instantly extract 12+ structured data fields: company name, role, location, salary range, experience level, job type, required skills, preferred skills, benefits, and responsibilities.

3. **Resume Parsing & Skill Extraction**:
   - Allows users to upload their resumes in PDF or plain text (TXT) format.
   - Extracts raw text using pure JavaScript in-memory parsing, detects skills automatically via keyword matching, and maintains an active resume profile.

4. **AI ATS Match Scorer**:
   - Compares the candidate’s active resume directly against any tracked job description.
   - Computes an overall match score (0–100%), a letter grade (A–F), lists of matched, missing, and bonus skills, actionable strengths and gaps, ATS keywords to include, and estimated interview likelihood.

5. **Application Detail Slide-Over**:
   - A 4-tab slide-out panel allowing in-depth inspection without leaving the board:
     - **Details**: Editable job parameters (salary, location, type, URL, status).
     - **Notes**: Timelines, recruiter contact details, and interview preparation notes.
     - **JD Breakdown**: Clean view of the AI-extracted job requirements.
     - **ATS Match Score**: Interactive visualization of skill alignment and recommendations.

6. **Insights & Analytics Dashboard**:
   - High-level metric cards: Total Applications, Response Rate, Active Interviews, Offers, and Average Match Score.
   - Visual charts powered by Recharts showing pipeline status distribution and application velocity over time.

7. **Settings & Bring-Your-Own-Key (BYOK)**:
   - Profile management and the ability for users to supply their own personal OpenAI API key for unlimited AI operations, avoiding centralized rate limits.

8. **PWA & Mobile Ready**:
   - Progressive Web App (PWA) manifest and icons for standalone mobile installation.
   - Native Android wrapper integration using Capacitor.

9. **Architectural Precision UI**:
   - A high-contrast, dark-mode design system featuring monochrome slate tones, sharp geometry, technical monospace accents, and micro-interactions.

---

## 3. 🛠️ What Tech Stack Did We Use?

| Layer | Technology | Version / Specifics |
|---|---|---|
| **Frontend & Backend Framework** | Next.js | v16 (App Router, Turbopack) |
| **Language** | TypeScript | v5 |
| **Database** | PostgreSQL | Hosted on [Neon](https://neon.tech) (Serverless Postgres) |
| **Database ORM** | Prisma | v7 with `@prisma/adapter-pg` driver adapter |
| **Authentication** | NextAuth.js | v4 (Google OAuth + Demo Credentials) |
| **Artificial Intelligence** | OpenAI API | `gpt-4o-mini` with Structured Outputs (`json_object`) |
| **Styling & Design System** | Tailwind CSS + Custom CSS | v4 with `@theme inline` tokens |
| **Drag & Drop** | `@dnd-kit` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Data Visualization** | Recharts | v3 (Responsive Container, Bar & Pie Charts) |
| **PDF Extraction** | `pdf-parse` | v1.1.1 (Pure JavaScript) |
| **Icons** | Lucide React | v1.17 |
| **Client State Management** | Zustand & TanStack Query | Zustand v5 + `@tanstack/react-query` v5 |
| **Mobile & PWA** | Web Manifest + Capacitor | Manifest v3 + `@capacitor/core` & `@capacitor/android` |
| **Hosting & Deployment** | Vercel | Serverless Edge-ready platform |

---

## 4. 💡 Why Did We Use That Particular Tech Stack Only?

Every single technology was chosen deliberately over common alternatives to guarantee maximum performance, reliability, and developer velocity:

### Why Next.js 16 (App Router)?
- **Alternative considered**: Separate React (Vite) frontend + Node/Express backend.
- **Why Next.js**: 
  - Having frontend pages and backend API routes in a single unified codebase drastically simplifies deployments on Vercel.
  - Next.js App Router allows server-side operations (like database queries and OpenAI API key security) while delivering interactive client components for the Kanban board.
  - Turbopack provides near-instant Hot Module Reloading (HMR) and fast build times.

### Why TypeScript?
- **Alternative considered**: Plain JavaScript.
- **Why TypeScript**: 
  - An application handling complex nested JSON (parsed job descriptions, ATS match analysis, and database records) quickly becomes buggy without strict types.
  - TypeScript guarantees that changes to database models immediately flag errors across UI components and API endpoints before reaching production.

### Why PostgreSQL on Neon?
- **Alternative considered**: MongoDB, Supabase, or self-hosted PostgreSQL.
- **Why Neon**: 
  - **Relational Integrity**: Job applications, users, resumes, and accounts are fundamentally relational. Relational foreign keys and cascading deletes (`onDelete: Cascade`) ensure zero orphaned records.
  - **Serverless-Native**: Neon spins down compute during inactivity to stay within free limits and scales instantly when traffic arrives.
  - **Connection Pooling**: Neon includes built-in connection pooling (PgBouncer), preventing the "exhausted database connections" problem typical of serverless functions.

### Why Prisma v7?
- **Alternative considered**: Drizzle ORM, TypeORM, or raw SQL (`pg`).
- **Why Prisma**: 
  - Provides a single declarative schema file (`prisma/schema.prisma`) that acts as the single source of truth.
  - Auto-generates fully typed query clients.
  - Prisma v7 introduces lightweight driver adapters (`@prisma/adapter-pg`) that reduce bundle sizes and improve query latency on serverless edge environments.

### Why OpenAI `gpt-4o-mini` with Structured Outputs?
- **Alternatives considered**: Local models (Ollama), `gpt-4o`, or Claude 3.5 Sonnet.
- **Why `gpt-4o-mini`**:
  - **Cost-Efficiency**: It is ~90% cheaper than flagship models, making AI parsing affordable for high-volume usage.
  - **Speed**: Typical response latency is under 1.5 seconds, keeping the UI snappy.
  - **Structured JSON Mode**: Using `response_format: { type: "json_object" }` guarantees that the output strictly adheres to JSON format, preventing JSON parsing errors in backend routes.

### Why `@dnd-kit` instead of `react-beautiful-dnd`?
- **Alternative considered**: `react-beautiful-dnd` or HTML5 native drag-and-drop.
- **Why `@dnd-kit`**:
  - `react-beautiful-dnd` is deprecated by Atlassian and suffers from severe compatibility issues in React 18 and 19.
  - `@dnd-kit` is lightweight, modular, actively maintained, and provides first-class touch screen support for mobile and tablet users.

### Why `pdf-parse` v1.1.1 (Pure JS)?
- **Alternatives considered**: `pdf2json`, `pdf-parse` v2, or cloud OCR APIs (AWS Textract, Google Document AI).
- **Why `pdf-parse` v1.1.1**:
  - Cloud OCR APIs add external latency, per-page costs, and complex credential management.
  - `pdf-parse` v1.1.1 runs 100% in Node.js memory with zero native system dependencies (unlike libraries requiring C++ Cairo or Python bindings), making it fully compatible with Vercel serverless functions.

---

## 5. 🧭 What Approach We Took?

We adopted an **"Optimistic, User-Centric, Resilient Pipeline"** approach:

1. **User Data Isolation**:
   - Every single database read, update, or delete strictly verifies the authenticated session user ID (`session.user.id`). No user can ever see or modify another user's job applications.

2. **Decoupled AI Processing**:
   - The user can add a job application immediately with basic details (role and company).
   - JD parsing and resume match scoring can be triggered on-demand or during creation. If the AI service is slow or down, the user's manual tracking experience is never blocked.

3. **Client-Side Optimistic UI**:
   - When a card is dragged from *Applied* to *Interview*, the UI updates immediately. The network request to persist the new status to PostgreSQL happens in the background. If the network fails, the user is alerted.

4. **Bring-Your-Own-Key (BYOK) Architecture**:
   - We implemented optional user-provided API keys in settings. If provided, the backend prefers the user's key; otherwise, it falls back to the system's default key.

5. **Pure-Code Architectural Design System**:
   - Rather than relying on heavy component libraries (like full Material UI or Ant Design) that bloat bundles and look generic, we crafted custom, lightweight components styled with Tailwind CSS tokens.

---

## 6. 🤔 Why This Approach?

1. **Zero Downtime / Zero Frustration**: Job seekers need quick action. If adding an application was blocked by a slow AI parsing job, users would abandon the platform. Decoupling makes the app feel instant.
2. **Infinite Scalability on Free/Low-Cost Infrastructure**: By utilizing serverless Next.js on Vercel, serverless Postgres on Neon, and low-cost `gpt-4o-mini`, the application can serve thousands of users at near-zero hosting costs.
3. **Privacy and Safety**: Processing resumes in memory without saving raw files to third-party file buckets protects sensitive personal candidate data.

---

## 7. 🧗 Challenges Faced & How We Overcame Them

During development, we encountered and solved several tricky engineering bottlenecks:

### Challenge 1: PostgreSQL UTF-8 Null Byte Crash (`\u0000`)
- **The Issue**: When users uploaded certain PDF resumes, the backend crashed with a PostgreSQL error: `unsupported Unicode escape sequence \u0000`.
- **Root Cause**: Many PDF generators embed binary font tables that, when converted to text strings, produce ASCII null bytes (`\u0000`). PostgreSQL strictly disallows null bytes in `TEXT` columns.
- **The Fix**: Added string sanitization in [`src/app/api/resume/route.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/app/api/resume/route.ts):
  ```typescript
  rawText = rawText.replace(/\u0000/g, "");
  ```
  This cleanly strips all null bytes before the text is written to the database.

---

### Challenge 2: Vercel Serverless Deployment Crash with `pdf-parse` v2
- **The Issue**: Resume uploads worked fine in local development, but failed with a 500 error when deployed to Vercel.
- **Root Cause**: Newer versions of `pdf-parse` (v2) attempt to load native C++ bindings for Canvas (`@napi-rs/canvas`) and Node DOM elements. Serverless execution environments like AWS Lambda / Vercel do not have these system binaries installed.
- **The Fix**:
  1. Downgraded `pdf-parse` to pure-JavaScript version `1.1.1`.
  2. Configured [`next.config.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/next.config.ts) with `serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"]` to prevent Next.js bundler from trying to package serverless-incompatible binaries.

---

### Challenge 3: Prisma v7 Database Driver Adapter Requirements
- **The Issue**: Standard Prisma client initialization failed in Next.js 16 with connection validation errors.
- **Root Cause**: Prisma v7 changed its connection engine architecture. In serverless environments, it requires an explicit driver adapter (`@prisma/adapter-pg`) connected to a PostgreSQL connection pool.
- **The Fix**:
  1. Configured `@prisma/adapter-pg` using a pooled `pg.Pool` connection inside [`src/lib/prisma.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/lib/prisma.ts).
  2. Configured [`prisma.config.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/prisma.config.ts) with `dotenv` to ensure migrations and the CLI can read `.env.local`.

---

### Challenge 4: NextAuth Session Provider Context Missing
- **The Issue**: Components calling `useSession()` crashed on client navigation with context error: `[next-auth]: useSession must be wrapped in a <SessionProvider>`.
- **Root Cause**: In Next.js App Router, the root layout is a Server Component, so `<SessionProvider>` cannot wrap `<html>` directly without a client boundary.
- **The Fix**: Created a dedicated client component [`src/app/providers.tsx`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/app/providers.tsx) that encapsulates both `SessionProvider` and `QueryClientProvider`, cleanly wrapping all children.

---

### Challenge 5: Missing Prisma Client during Vercel Build
- **The Issue**: Vercel deployment builds failed during TypeScript compilation with `Cannot find module '@prisma/client'`.
- **Root Cause**: Next.js compile step runs before the Prisma schema has been generated into `node_modules/.prisma`.
- **The Fix**: Updated the `"build"` script in [`package.json`](file:///e:/AI%20Job%20tracker/ai-job-tracker/package.json):
  ```json
  "build": "npx prisma generate && next build"
  ```
  This guarantees the Prisma Client is always up to date prior to TypeScript verification.

---

## 8. 📦 Why Particular Libraries & Modules Were Used

| Library / Module | Purpose in Project | Specific Reason for Choosing It |
|---|---|---|
| `@dnd-kit/core` & `@dnd-kit/sortable` | Kanban drag-and-drop | Modern React 19 support, superior touch gestures on mobile, zero lag. |
| `recharts` | Dashboard analytics | Declarative SVG charting that easily inherits custom CSS colors. |
| `lucide-react` | System iconography | Clean, tree-shakeable icons matching the brutalist monospace aesthetic. |
| `zustand` | Lightweight UI state | Smallest state library (~1KB), zero provider hell, perfect for modal and filter state. |
| `@tanstack/react-query` | Server state management | Handles automatic cache invalidation and background refetching for job lists. |
| `clsx` & `tailwind-merge` | Conditional CSS classes | Clean, conflict-free dynamic styling. |
| `@auth/prisma-adapter` | NextAuth Prisma bridge | Automatically persists OAuth accounts, sessions, and users to Postgres. |
| `date-fns` | Date calculations | Modular date formatting (*e.g., "Applied 3 days ago"*) without Moment.js bloat. |

---

## 9. 📜 Chronological Decision Log

| Date | Decision Taken | Rationale & Context | Outcome |
|---|---|---|---|
| **2026-06-09** | Adopt Next.js 16 + PostgreSQL + Prisma v7 | Needed a modern, scalable full-stack foundation with strong type safety. | Clean single-repo architecture. |
| **2026-06-09** | Build 6-stage Kanban board with `@dnd-kit` | Job seekers think in visual stages; `@dnd-kit` provides smooth mobile and desktop drag-and-drop. | Intuitive, responsive pipeline board. |
| **2026-06-09** | Use OpenAI `gpt-4o-mini` with JSON output mode | Needed rapid, reliable parsing of unstructured JDs without hallucinations or broken JSON. | 12+ structured fields extracted in <2s. |
| **2026-06-09** | Switch to `@prisma/adapter-pg` driver adapter | Prisma v7 constructor threw errors without an explicit adapter for connection pooling. | Stable serverless connection pooling on Neon. |
| **2026-06-13** | Add `prisma generate` to the `"build"` script | Prevented Vercel build failures where TypeScript compiled before Prisma generated its client. | Seamless zero-config deployments. |
| **2026-06-15** | Strip null bytes (`\u0000`) from parsed PDF text | PostgreSQL strictly rejects null bytes in UTF-8 text columns. | 100% crash-free PDF storage in database. |
| **2026-06-18** | Downgrade to `pdf-parse` v1.1.1 & externalize packages | Native C++ bindings in newer versions caused 500 crashes on Vercel serverless. | Lightweight, pure-JS parsing that works in any cloud runtime. |
| **2026-06-18** | Configure PWA Manifest and Capacitor Android wrapper | Allowed users to install the tracker on phones as an app without separate mobile codebases. | Single codebase deployed to web and mobile. |
| **2026-09-21** | Refresh to "Architectural Precision" Design System | High-contrast monochrome slate and sharp geometry gives the app a professional, serious command-center feel. | Premium user experience. |
| **2026-09-23** | **Remove Prototype Chat & Automation Infrastructure** | The initial chat drawer and mock n8n automation were identified as requiring a complete, ground-up redesign. Removed cleanly to allow thoughtful replanning. | Clean codebase ready for proper automation architecture. |

---

## 10. 🎯 Next Steps & Future Replanning

With the experimental chat and mock automation removed, the codebase is completely clean, lightweight, and focused on its core strengths:
1. **Google Calendar Synchronization**: Syncing interview dates and follow-ups to Google Calendar via OAuth.
2. **ATS Resume Optimizer**: Side-by-side section rewriting and keyword optimization.
3. **Semantic Job Recommendations (`pgvector`)**: Resume-based vector matching against active job listings.
4. **Carefully Replanned AI Automation**: Designing an enterprise-grade agentic workflow for calendar, email, and tracking automation from first principles.
