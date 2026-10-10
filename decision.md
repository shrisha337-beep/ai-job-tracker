# 🏛️ Project Decision & Architecture Record: JobTracker AI

> **Document Version**: 2.0.0  
> **Last Updated**: October 2026  
> **Repository**: `ai-job-tracker`  
> **Author**: Core Development Team  

---

## 📌 Executive Summary

**JobTracker AI** is an intelligent, full-stack job application tracking platform that replaces chaotic spreadsheets with a visual Kanban pipeline, AI-powered job description parsing, and resume–JD match scoring. It runs as a modern progressive web application built on Next.js 16, PostgreSQL, Prisma v7, and OpenAI — deployed serverlessly on Vercel with a native Android wrapper via Capacitor.

This document records **every** important decision made during the project: the problems we identified, the solutions we designed, the technologies we chose (and why), the challenges we faced (and how we overcame them), and a chronological log of every critical turning point.

---

## 1. 🎯 Problem Statement — What Problem Were We Solving?

Searching for a job in the modern tech ecosystem is painful, disorganized, and opaque. We identified three core pain points:

### A. The "Spreadsheet Nightmare" — Disorganized Pipeline

- Job seekers typically track 50–200+ applications across Google Sheets, Excel, Apple Notes, or email folders.
- Spreadsheets quickly become outdated, are hard to edit on mobile, lack automated status transitions, and do not preserve interview notes, recruiter contacts, or full job descriptions (which often expire on portals).
- There is no visual representation of where a candidate stands across their entire funnel.

### B. The "Black Hole" — ATS Rejection Blindness

- Most corporate job portals use Applicant Tracking Systems (ATS) that parse and rank resumes based on keyword matching and semantic relevance.
- Applicants apply blindly with generic resumes, having no idea whether their skills actually match what the employer listed. This leads to high silent rejection rates and zero feedback.
- Applicants cannot answer: *"Is my resume failing at screening, or am I making it to interviews but not converting?"*

### C. Manual Overhead & Time Waste

- Reading long, repetitive Job Descriptions (JDs) and manually copying company names, salary ranges, required technologies, job types, and responsibilities takes hours of effort per week.
- There is no automated way to extract structured data from a raw JD and compare it against a resume.

---

## 2. 🚀 What Did We Build?

We built **JobTracker AI** — a centralized command center that automates the entire job search workflow:

### Feature 1: Interactive Kanban Pipeline
- A visual **6-stage drag-and-drop board**: `Bookmarked → Applied → Screening → Interview → Offer → Rejected`.
- Cards show role, company, location, salary, match score, and relative timestamp ("3 days ago").
- A **toggle between Kanban view and tabular List view** with live search, filtering, and sorting.
- Optimistic UI — dragging a card updates instantly; the backend persists asynchronously.

### Feature 2: AI-Powered Job Description Parser
- Accepts any raw JD text pasted by the user.
- Uses **OpenAI `gpt-4o-mini`** with structured JSON output mode to instantly extract 12+ fields: role title, company name, location, salary range, experience level, education requirements, employment type, required skills, preferred skills, responsibilities, company description, and perks/benefits.
- Parsed data is saved to the `Application` record and auto-fills empty fields (location, salary, job type).

### Feature 3: Resume Parsing & Skill Extraction
- Users upload resumes in **PDF** or **plain text (TXT)** format.
- Raw text is extracted using `pdf-parse` v1.1.1 (pure JavaScript, zero native dependencies).
- Skills are detected via **keyword matching** against a curated list of 40+ industry-standard technologies (JavaScript, TypeScript, React, AWS, Docker, etc.).
- The latest upload becomes the **active resume** automatically.

### Feature 4: AI ATS Match Scorer
- Compares the user's active resume against any tracked job description using OpenAI.
- Returns: **overall score (0–100%)**, letter grade (A–F), matched skills, missing skills, bonus skills, specific strengths, specific gaps, actionable suggestions, ATS keywords to add, and estimated interview likelihood.
- Score is persisted to the application and displayed on Kanban cards.

### Feature 5: Application Detail Slide-Over Modal
- A **3-tab modal** with comprehensive application management:
  - **Details Tab**: Inline-editable fields for status, location, salary, job type, source URL, and notes.
  - **JD Tab**: Collapsible sections showing parsed JD data (summary, skills, responsibilities, perks) with the ability to paste/edit raw JD text and trigger AI parsing.
  - **Match Tab**: Full match analysis visualization with collapsible sections (skill comparison, strengths, ATS keywords).

### Feature 6: Analytics Dashboard
- **4 stat cards**: Total Applications, Interviews, Offers, Response Rate.
- **Pipeline Distribution**: Horizontal bar chart showing application counts per stage.
- **Recent Updates**: Latest 5 applications with status badges and timestamps.
- **Quick Actions**: Direct links to add applications, open Kanban, upload resume, evaluate match.

### Feature 7: Settings & Configuration
- Profile management (display name).
- **Bring-Your-Own-Key (BYOK)**: Optional user-provided OpenAI API key field.
- Notification preferences (email alerts, weekly digest).
- Plan & Usage section with upgrade CTA.

### Feature 8: Dual-Theme Design System
- **Light Mode** (default): White backgrounds, slate gray surfaces, emerald green accents.
- **Dark Mode**: Near-black backgrounds, dark slate surfaces, teal/cyan accents.
- Theme synced across **three layers**: DOM class (`.dark`), `localStorage`, and database (`User.theme`).
- **Flash prevention**: Inline `<script>` in `<head>` reads `localStorage` before React hydrates.

### Feature 9: PWA & Mobile Ready
- Progressive Web App manifest with icons for standalone mobile installation.
- **Capacitor Android wrapper** (`@capacitor/android`) for native Android deployment from the same codebase.

### Feature 10: Legal Pages
- Dedicated **Privacy Policy** and **Terms of Service** pages with consistent navbar design.

### Feature 11: Interactive Moiré Field Hero Section
- An interactive mathematical grating animation (`MoireField`) built without heavy Canvas or WebGL dependencies.
- Uses composited CSS radial gradients, `requestAnimationFrame` loop, pointer tracking with natural drift and impulse physics.
- Dual-theme backdrop radial vignette ensures text legibility and contrast in both light and dark themes.
- Staggered `@keyframes hero-rise` entrance animations for headline, subline, CTAs, and feature pills.

---

## 3. 🛠️ Complete Tech Stack

| Layer | Technology | Version / Specifics |
|---|---|---|
| **Frontend & Backend Framework** | Next.js | v16.2.7 (App Router, React Server Components, Turbopack) |
| **Language** | TypeScript | v5 (Strict mode enabled) |
| **React** | React | v19.2.4 |
| **Database** | PostgreSQL | Hosted on [Neon](https://neon.tech) (Serverless Postgres) |
| **Database ORM** | Prisma | v7.8.0 with `@prisma/adapter-pg` driver adapter |
| **Database Connection** | `pg` (node-postgres) | v8.21.0 — Pooled connection via `Pool` |
| **Authentication** | NextAuth.js | v4.24.14 (Google OAuth + Demo Credentials provider) |
| **Auth Adapter** | `@auth/prisma-adapter` | v2.11.2 — Bridges NextAuth ↔ Prisma ↔ PostgreSQL |
| **Artificial Intelligence** | OpenAI API | `gpt-4o-mini` with Structured JSON Outputs (`response_format: json_object`) |
| **Styling** | Tailwind CSS v4 + Custom CSS Design System | `@theme inline` tokens, CSS custom properties, `60/30/10` color architecture |
| **CSS Processing** | `@tailwindcss/postcss` | v4 — PostCSS plugin for Tailwind v4 |
| **Drag & Drop** | `@dnd-kit` | `@dnd-kit/core` v6.3.1, `@dnd-kit/sortable` v10.0.0, `@dnd-kit/utilities` v3.2.2 |
| **Data Visualization** | Recharts | v3.8.1 (Responsive Container, BarChart, PieChart) |
| **PDF Extraction** | `pdf-parse` | v1.1.1 (Pure JavaScript, zero native deps) |
| **Icons** | Lucide React | v1.17.0 (Tree-shakeable SVG icons) |
| **HTTP Client** | Axios | v1.17.0 |
| **Date Utilities** | date-fns | v4.4.0 (`formatDistanceToNow`) |
| **Conditional CSS** | clsx | v2.1.1 |
| **Client State** | Zustand | v5.0.14 |
| **Server State** | `@tanstack/react-query` | v5.101.0 |
| **Mobile Wrapper** | Capacitor | `@capacitor/core` v8.4.0, `@capacitor/android` v8.4.0, `@capacitor/cli` v8.4.0 |
| **Environment Variables** | dotenv | v17.4.2 (for Prisma CLI `.env.local` loading) |
| **Cross-platform Scripts** | cross-env | v10.1.0 |
| **Hosting & Deployment** | Vercel | Serverless Edge-ready platform |

---

## 4. 💡 Why This Tech Stack? — Every Decision Justified

### Decision: Next.js 16 (App Router) — *not* separate React + Express

| Factor | Next.js 16 | React + Express (rejected) |
|---|---|---|
| **Codebase** | Single repo for frontend + API | Two repos, two deployments, two CI pipelines |
| **Server Components** | Database queries run server-side, no API call needed for initial page loads | Every data fetch requires a REST round-trip |
| **Deployment** | One-click Vercel deploy | Needs separate frontend hosting + backend hosting |
| **HMR Speed** | Turbopack: near-instant | Vite: fast but separate server |

**Verdict**: A job tracker is a classic full-stack CRUD app. Next.js App Router lets us write server-side data fetching (`getRequiredSession()` + `prisma.application.findMany()`) in the same file as the React page component, eliminating unnecessary API calls for initial loads while still providing API routes for client-side mutations.

### Decision: TypeScript — *not* plain JavaScript

An application handling deeply nested JSON structures (parsed JD with 12+ fields, match analysis with 10+ fields, Prisma models with nullable fields) would be **unmanageable** in plain JS. TypeScript catches type mismatches at compile time — for example, if we add a new field to `ParsedJD`, every consumer is immediately flagged.

### Decision: PostgreSQL on Neon — *not* MongoDB, Supabase, or SQLite

- **Relational Integrity**: Users → Applications → Resumes are fundamentally relational entities. `onDelete: Cascade` ensures zero orphaned records when a user is deleted.
- **Serverless-Native**: Neon auto-suspends compute during inactivity (free tier friendly) and scales transparently.
- **Built-in Connection Pooling**: Neon includes PgBouncer, preventing the "too many connections" problem that kills serverless functions.
- **PostgreSQL `TEXT` columns**: Store arbitrarily long JD text and resume content without the 16MB document limit of MongoDB.

### Decision: Prisma v7 with Driver Adapter — *not* Drizzle, TypeORM, or raw SQL

- **Single source of truth**: `schema.prisma` defines the entire database schema, generates TypeScript types, and runs migrations.
- **Type-safe queries**: `prisma.application.findMany({ where: { userId, status } })` is fully typed — no string SQL injection risk.
- **Driver Adapter**: Prisma v7's `@prisma/adapter-pg` uses the `pg` Pool directly, which works properly in serverless environments (unlike Prisma's legacy binary engine).

### Decision: NextAuth v4 with JWT Strategy — *not* Auth0, Clerk, or Firebase Auth

- **Zero vendor lock-in**: NextAuth is open-source and stores all auth data in our own PostgreSQL via `@auth/prisma-adapter`.
- **JWT Strategy**: Chosen over database sessions because serverless functions are stateless — JWT tokens are self-contained and don't require a database lookup on every request.
- **Dual Providers**: Google OAuth for production users + Credentials provider for demo/testing (email-only login, auto-creates accounts).

### Decision: OpenAI `gpt-4o-mini` with Structured JSON — *not* local models or `gpt-4o`

- **Cost**: `gpt-4o-mini` is ~90% cheaper than `gpt-4o`. For a free-tier app parsing hundreds of JDs, cost matters.
- **Speed**: Typical response in <1.5 seconds. Users won't wait 10+ seconds for a local Ollama model.
- **`response_format: json_object`**: Guarantees valid JSON output. Without this, LLMs occasionally produce markdown-wrapped JSON or invalid escaping, crashing `JSON.parse()`.
- **Temperature tuning**: `0.1` for JD parsing (deterministic extraction), `0.2` for match scoring (slight creative latitude for suggestions).

### Decision: `@dnd-kit` — *not* `react-beautiful-dnd`

- `react-beautiful-dnd` is **deprecated** by Atlassian and has severe compatibility issues with React 18+ concurrent features.
- `@dnd-kit` is modular (we only import `core`, `sortable`, `utilities`), actively maintained, and provides first-class **touch/pointer support** for mobile Kanban interaction.
- `PointerSensor` with `activationConstraint: { distance: 8 }` prevents accidental drags when users simply click a card.

### Decision: `pdf-parse` v1.1.1 — *not* v2, `pdf2json`, or cloud OCR

- `pdf-parse` v2 requires native C++ binaries (`@napi-rs/canvas`) that **do not exist** in Vercel's serverless runtime.
- Cloud OCR (AWS Textract, Google Document AI) adds external latency, per-page costs, and credential complexity.
- v1.1.1 is pure JavaScript — runs in any Node.js environment with zero system dependencies.

### Decision: Tailwind CSS v4 with `@theme inline` — *not* CSS Modules or component libraries

- **Tailwind v4**: New CSS-first configuration via `@theme inline` eliminates `tailwind.config.js` entirely. Design tokens live in CSS alongside their consumers.
- **Custom CSS properties** (`--color-background`, `--color-primary`, etc.): Enable seamless light/dark theme switching by redefining variables under `.dark`.
- **No component library** (MUI, Ant Design, Chakra): These add 200KB+ to the bundle and impose their own design language. Our design system is 16KB of hand-crafted CSS with precise editorial aesthetics.

### Decision: `date-fns` — *not* Moment.js or Day.js

- `date-fns` is tree-shakeable — we only import `formatDistanceToNow`, keeping the bundle tiny.
- Moment.js is deprecated and ships its entire locale database (~300KB).

### Decision: Lucide React — *not* Heroicons, FontAwesome, or Material Icons

- Tree-shakeable: Only imported icons are bundled (e.g., `LayoutDashboard`, `Kanban`, `FileText`).
- Clean, consistent 24px stroke design that matches our editorial aesthetic.
- TypeScript-first with proper React component types.

---

## 5. 🧭 Approach — How Did We Build It?

### Architectural Pattern: Server-First with Client Islands

```
┌─────────────────────────────────────────────────────┐
│  Next.js App Router                                  │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ Server Components │  │ Client Components ("use  │ │
│  │ (Data Fetching)   │  │  client")                │ │
│  │ • dashboard/page  │  │ • KanbanBoard            │ │
│  │ • applications/   │  │ • ApplicationDetailModal │ │
│  │   page            │  │ • ThemeProvider          │ │
│  │ • getRequired-    │  │ • AddApplicationModal    │ │
│  │   Session()       │  │ • DashboardClient        │ │
│  └──────────────────┘  └──────────────────────────┘ │
│                                                      │
│  API Routes (Serverless Functions)                   │
│  ┌──────────────────────────────────────────────────┐│
│  │ /api/applications     → CRUD                     ││
│  │ /api/applications/[id]→ GET/PATCH/DELETE          ││
│  │ /api/ai/parse-jd      → OpenAI JD extraction     ││
│  │ /api/ai/match-score   → OpenAI resume matching   ││
│  │ /api/resume           → PDF upload + skill parse  ││
│  │ /api/user/theme       → Theme CRUD               ││
│  │ /api/auth/[...next]   → NextAuth handlers        ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────┐    ┌──────────────────┐
│ PostgreSQL      │    │ OpenAI API       │
│ (Neon Serverless│    │ (gpt-4o-mini)    │
│  + Prisma v7)   │    │                  │
└─────────────────┘    └──────────────────┘
```

### Design Principles Applied

1. **User Data Isolation**: Every database query includes `userId: session.user.id` in the `WHERE` clause. No user can ever read, update, or delete another user's data.

2. **Decoupled AI Processing**: AI features (JD parsing, match scoring) are triggered on-demand, not during application creation. If OpenAI is down, users can still track jobs manually.

3. **Optimistic UI**: When dragging a Kanban card, the UI updates immediately via `setApplications()`. The `PATCH /api/applications/:id` call runs in a `useTransition`. On failure, the card reverts to its original column.

4. **Server-Side Data Fetching for Initial Loads**: Pages like `/dashboard` and `/applications` use React Server Components to query Prisma directly — no API round-trip for the initial page render.

5. **Client-Side Mutations for Interactivity**: All user-initiated mutations (add, edit, delete, drag-drop, AI triggers) go through `fetch()` calls to API routes, keeping the UI interactive.

6. **Three-Layer Theme Sync**:
   - **Layer 1**: Inline `<script>` in `<head>` reads `localStorage` before paint (prevents flash).
   - **Layer 2**: React `ThemeProvider` manages state with `useContext`.
   - **Layer 3**: `PATCH /api/user/theme` persists preference to database for cross-device sync.

---

## 6. 🤔 Why This Approach?

1. **Zero Frustration**: Job seekers need instant action. If adding an application was blocked by slow AI parsing, users would abandon the platform. Decoupled AI keeps the core experience instant.

2. **Scalable on Free Infrastructure**: Serverless Next.js on Vercel + serverless Postgres on Neon + low-cost `gpt-4o-mini` = thousands of users at near-zero hosting cost.

3. **Privacy by Design**: Resumes are processed in-memory (Node.js buffer → text extraction → database). Raw PDF files are never saved to file storage or third-party buckets.

4. **Mobile-First Responsive**: The sidebar collapses, the Kanban scrolls horizontally, modals are full-screen on mobile, and Capacitor wraps it for native Android.

---

## 7. 🧗 Challenges Faced & How We Overcame Them

### Challenge 1: PostgreSQL UTF-8 Null Byte Crash (`\u0000`)

- **Symptom**: Uploading certain PDF resumes crashed the API with: `unsupported Unicode escape sequence \u0000`.
- **Root Cause**: Many PDF generators embed binary font tables that produce null bytes when converted to text. PostgreSQL strictly disallows `\u0000` in `TEXT` columns.
- **Fix**: Added sanitization in [`resume/route.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/app/api/resume/route.ts):
  ```typescript
  rawText = rawText.replace(/\u0000/g, "");
  ```
- **Impact**: 100% crash-free PDF storage.

### Challenge 2: Vercel Serverless Crash with `pdf-parse` v2

- **Symptom**: Resume uploads worked locally but failed with 500 errors on Vercel.
- **Root Cause**: `pdf-parse` v2 attempts to load native C++ binaries (`@napi-rs/canvas`) for Canvas rendering. Vercel's serverless runtime (AWS Lambda) does not have these system libraries.
- **Fix**:
  1. Pinned `pdf-parse` to **v1.1.1** (pure JavaScript, zero native deps).
  2. Added `serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"]` to [`next.config.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/next.config.ts) to prevent the bundler from trying to inline incompatible binaries.
- **Impact**: Reliable PDF parsing in any cloud runtime.

### Challenge 3: Prisma v7 Driver Adapter Requirement

- **Symptom**: Standard `new PrismaClient()` failed with connection validation errors in Next.js 16 serverless functions.
- **Root Cause**: Prisma v7 changed its connection engine. In serverless environments, it now requires an explicit driver adapter connected to a `pg.Pool`.
- **Fix**: Configured [`prisma.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/lib/prisma.ts) with:
  ```typescript
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
  ```
- **Additional Fix**: Created [`prisma.config.ts`](file:///e:/AI%20Job%20tracker/ai-job-tracker/prisma.config.ts) with `dotenv` to load `.env.local` for CLI commands (migrations, studio).

### Challenge 4: NextAuth `<SessionProvider>` Context Error in App Router

- **Symptom**: Components using `useSession()` crashed with: `useSession must be wrapped in a <SessionProvider>`.
- **Root Cause**: Next.js App Router's root layout is a Server Component. `<SessionProvider>` is a client component and cannot directly wrap `<html>` without a client boundary.
- **Fix**: Created [`providers.tsx`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/app/providers.tsx) — a `"use client"` component that wraps children in `<SessionProvider>` + `<ThemeProvider>`. The root layout imports this as its sole client boundary.

### Challenge 5: Missing Prisma Client During Vercel Build

- **Symptom**: Vercel deployment failed with `Cannot find module '@prisma/client'`.
- **Root Cause**: TypeScript compilation runs before Prisma generates its client into `node_modules/.prisma`.
- **Fix**: Updated the `"build"` script in [`package.json`](file:///e:/AI%20Job%20tracker/ai-job-tracker/package.json):
  ```json
  "build": "npx prisma generate && next build"
  ```

### Challenge 6: Theme Flash on Page Load (FOUC)

- **Symptom**: Users on dark mode saw a brief white flash before React hydrated and applied the dark theme.
- **Root Cause**: React's `useEffect` in `ThemeProvider` runs after paint. By the time it reads `localStorage` and adds the `.dark` class, the user has already seen the light-mode default.
- **Fix**: Added an inline `<script>` in [`layout.tsx`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/app/layout.tsx) `<head>` that executes before any rendering:
  ```javascript
  try {
    const t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
  ```

### Challenge 7: Hydration Mismatch on ThemeToggle Icon

- **Symptom**: React warned about hydration mismatch because the server rendered a `<Moon>` icon but the client rendered `<Sun>` (or vice versa).
- **Root Cause**: The server doesn't know the user's theme preference (stored in `localStorage`). The icon depends on client-side state.
- **Fix**: [`ThemeToggle.tsx`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/components/layout/ThemeToggle.tsx) uses a `mounted` state set in `useEffect`. Before mount, it renders a blank `<span>` placeholder, avoiding the mismatch.

### Challenge 8: Accidental Drag When Clicking Kanban Cards

- **Symptom**: Users trying to click a card to open details accidentally started a drag operation.
- **Root Cause**: `PointerSensor` activated on the first pixel of movement.
- **Fix**: Configured `activationConstraint: { distance: 8 }` in [`KanbanBoard.tsx`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/components/kanban/KanbanBoard.tsx), requiring 8px of intentional movement before drag activates.

### Challenge 9: React 19 Ref Mutability Rule in Animation Loops

- **Symptom**: React 19 ESLint (`react-hooks/refs`) flagged `Error: Cannot access refs during render` on `live.current = { ... }` in [`moire-field.tsx`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/components/ui/moire-field.tsx).
- **Root Cause**: React 19 strictly forbids reading or writing refs during the render phase to guarantee concurrent rendering purity.
- **Fix**: Wrapped the live parameter assignment inside `useIsomorphicLayoutEffect(() => { live.current = { ... } })`, executing updates synchronously before browser paint without triggering component re-renders or breaking concurrent mode rules.

### Challenge 10: Tailwind CSS v4 Semantic Color Token Bridging

- **Symptom**: Standard shadcn utility classes (`bg-background`, `text-foreground`, `text-primary`, `border-border`) were not generated by the Tailwind v4 compiler.
- **Root Cause**: In Tailwind v4, custom CSS variables declared purely under `:root` are not automatically mapped to utility color classes unless explicitly bound inside the `@theme` or `@theme inline` block.
- **Fix**: Registered semantic color tokens (`--color-background: var(--color-background);`, `--color-primary: var(--color-primary);`, `--color-border: var(--color-border);`, etc.) inside `@theme inline` in [`globals.css`](file:///e:/AI%20Job%20tracker/ai-job-tracker/src/app/globals.css).

---

## 8. 📦 Library & Module Decision Matrix

| Library / Module | Purpose in Project | Why This Specific Library |
|---|---|---|
| **`next` v16.2.7** | Full-stack framework | App Router + RSC + Turbopack = single-repo with server-side data + client interactivity |
| **`react` v19.2.4** | UI rendering | Latest stable; required by Next.js 16 |
| **`@prisma/client` v7.8.0** | Database ORM | Type-safe queries, declarative schema, auto-generated types |
| **`@prisma/adapter-pg` v7.8.0** | Serverless DB connection | Required by Prisma v7 for connection pooling in serverless |
| **`pg` v8.21.0** | PostgreSQL driver | Direct `Pool` connection for the Prisma adapter |
| **`next-auth` v4.24.14** | Authentication | Open-source, stores in our DB, supports Google OAuth + credentials |
| **`@auth/prisma-adapter` v2.11.2** | Auth ↔ DB bridge | Auto-persists OAuth accounts, sessions, users to PostgreSQL |
| **`@dnd-kit/core` v6.3.1** | Kanban drag-and-drop | React 19 compatible, touch support, modular, actively maintained |
| **`@dnd-kit/sortable` v10.0.0** | Sortable cards in columns | Vertical list sorting strategy for cards within each Kanban column |
| **`@dnd-kit/utilities` v3.2.2** | CSS transform helpers | `CSS.Transform.toString()` for smooth drag overlay positioning |
| **`pdf-parse` v1.1.1** | PDF text extraction | Pure JS, zero native deps, works in Vercel serverless |
| **`recharts` v3.8.1** | Dashboard charts | Declarative SVG charting, inherits CSS custom properties |
| **`lucide-react` v1.17.0** | Icon system | Tree-shakeable, consistent 24px stroke, TypeScript-first |
| **`zustand` v5.0.14** | Lightweight client state | ~1KB, no provider wrapping, perfect for modal/filter toggles |
| **`@tanstack/react-query` v5.101.0** | Server state & caching | Auto cache invalidation, background refetching, stale-while-revalidate |
| **`axios` v1.17.0** | HTTP client | Interceptors, automatic JSON transforms, cleaner API than fetch |
| **`date-fns` v4.4.0** | Date formatting | `formatDistanceToNow("3 days ago")` — tree-shakeable, no Moment.js bloat |
| **`clsx` v2.1.1** | Conditional CSS classes | Clean `clsx("base", isActive && "active")` pattern |
| **`tailwind-merge` v3.5.0** | Class conflict resolution | Utility function `cn()` merges conflicting Tailwind classes safely for shadcn UI components |
| **`@capacitor/core` v8.4.0** | Mobile wrapper | Wraps the web app as a native Android app without rewriting |
| **`dotenv` v17.4.2** | Env variable loading | Loads `.env.local` for Prisma CLI commands (migrations, studio) |
| **`tailwindcss` v4** | Utility-first CSS | `@theme inline` for CSS-native design tokens, zero config file |

---

## 9. 📜 Chronological Decision Log

| # | Date | Decision | Rationale | Outcome |
|---|---|---|---|---|
| 1 | **2026-06-09** | Adopt Next.js 16 + PostgreSQL + Prisma v7 as foundation | Needed modern, scalable full-stack architecture with type safety | Clean single-repo with server components + API routes |
| 2 | **2026-06-09** | Build 6-stage Kanban board with `@dnd-kit` | Job seekers think visually; `react-beautiful-dnd` is deprecated | Intuitive drag-and-drop pipeline with mobile touch support |
| 3 | **2026-06-09** | Use OpenAI `gpt-4o-mini` with `json_object` mode | Need fast, cheap, reliable structured data extraction | 12+ fields parsed from JD in <2 seconds |
| 4 | **2026-06-09** | Choose Neon serverless PostgreSQL | Free tier with auto-suspend, built-in connection pooling | Zero-cost hosting during development, scales for production |
| 5 | **2026-06-09** | Implement Google OAuth + email-only Credentials provider | Google OAuth for production; Credentials for easy demo access | Dual login paths, auto-account creation for demo |
| 6 | **2026-06-09** | Use JWT session strategy (not database sessions) | Serverless functions are stateless — JWT avoids DB lookup per request | Faster auth checks, no session table overhead |
| 7 | **2026-06-09** | Switch to `@prisma/adapter-pg` driver adapter | Prisma v7 constructor threw errors without explicit adapter | Stable serverless connection pooling via `pg.Pool` |
| 8 | **2026-06-13** | Add `prisma generate` to `"build"` script | Vercel build failed because TypeScript compiled before Prisma generated | Seamless zero-config deployments |
| 9 | **2026-06-15** | Strip null bytes (`\u0000`) from parsed PDF text | PostgreSQL rejects null bytes in UTF-8 `TEXT` columns | 100% crash-free PDF storage |
| 10 | **2026-06-18** | Downgrade to `pdf-parse` v1.1.1 | v2's native C++ bindings crash on Vercel serverless | Pure-JS parsing works everywhere |
| 11 | **2026-06-18** | Add `serverExternalPackages` to `next.config.ts` | Prevent Next.js bundler from inlining serverless-incompatible modules | Clean builds without native binary errors |
| 12 | **2026-06-18** | Add PWA Manifest + Capacitor Android wrapper | Users wanted mobile installation without separate native apps | Single codebase → web + Android |
| 13 | **2026-06-18** | Create `prisma.config.ts` with `dotenv` | Prisma CLI couldn't read `.env.local` for migration commands | `db:migrate` and `db:studio` scripts work correctly |
| 14 | **2026-06-20** | Implement inline `<script>` for theme flash prevention | Dark mode users saw white flash before React hydrated | Zero-flash theme application |
| 15 | **2026-06-20** | Use `mounted` guard in `ThemeToggle` | Server-rendered icon didn't match client theme, causing hydration warnings | Clean hydration with placeholder |
| 16 | **2026-06-22** | Set `PointerSensor` `distance: 8` activation constraint | Users accidentally dragged cards when trying to click | Intentional drag requires 8px movement |
| 17 | **2026-06-25** | Create `providers.tsx` client wrapper | `SessionProvider` can't wrap server layout directly in App Router | Clean client boundary for auth + theme context |
| 18 | **2026-07-01** | Implement keyword-based skill extraction (not AI) | AI skill extraction would be slow and expensive for every resume upload | Instant O(n) matching against 40+ curated keywords |
| 19 | **2026-07-01** | Auto-fill application fields from parsed JD | Users shouldn't manually re-enter data AI already extracted | Location, salary, job type auto-populate from AI output |
| 20 | **2026-08-15** | Implement `proxy.ts` middleware for route protection | Needed auth check before rendering protected pages | Unauthenticated users redirected to `/login` with callback URL |
| 21 | **2026-09-21** | Refresh to "Dual-Theme Design System" with CSS custom properties | Previous design lacked dark mode; needed editorial, premium feel | 60/30/10 color architecture with light + dark themes |
| 22 | **2026-09-21** | Use `@theme inline` (Tailwind v4) instead of `tailwind.config.js` | Tailwind v4 moves configuration into CSS; cleaner, no separate config file | Design tokens live next to their consumers in `globals.css` |
| 23 | **2026-09-23** | Remove prototype Chat & Automation infrastructure | Chat drawer and mock n8n automation were premature; needed ground-up redesign | Clean, focused codebase ready for proper automation later |
| 24 | **2026-09-25** | Implement collapsible sections in ApplicationDetailModal | Long JD/match data made the modal scrolling-heavy | Users expand only sections they care about |
| 25 | **2026-10-02** | Add `.vscode/settings.json` with `css.lint.unknownAtRules: ignore` | VS Code flagged `@theme` and `@utility` as unknown CSS at-rules | Eliminated false-positive editor warnings for Tailwind v4 syntax |
| 26 | **2026-10-11** | Integrate `MoireField` interactive hero component & shadcn `cn` utility | Upgrade landing page with state-of-the-art interactive physics without heavy 3D/canvas deps | Physics-based Moiré wave hero with pointer reactivity, radial vignette, and Tailwind v4 theme token mapping |

---

## 10. 🎯 Future Roadmap

With the current architecture stable and focused, planned enhancements include:

1. **Google Calendar Sync**: OAuth-based interview date synchronization.
2. **ATS Resume Optimizer**: Side-by-side keyword optimization and section rewriting.
3. **Semantic Job Recommendations** (`pgvector`): Vector similarity matching between resume embeddings and active job listings.
4. **Enterprise Automation**: Properly architected agentic workflows for calendar, email, and tracking automation.
5. **Multi-Resume Management**: Support multiple active resumes for different job categories.
6. **Browser Extension**: One-click job capture from LinkedIn, Indeed, and Greenhouse.
