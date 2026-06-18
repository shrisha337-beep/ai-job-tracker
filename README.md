<div align="center">

# 🚀 JobTracker AI

### AI-Powered Job Application Tracking Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Manage your entire job search pipeline — from bookmarking roles to landing offers — with an interactive Kanban board, AI-powered JD parsing, and resume match scoring.**

[🌐 Live Demo](https://ai-job-tracker-demo.vercel.app) · [🐛 Report Bug](https://github.com/shrisha337-beep/ai-job-tracker/issues) · [✨ Request Feature](https://github.com/shrisha337-beep/ai-job-tracker/issues)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [📸 Screenshots](#-screenshots)
- [🛠️ Tech Stack](#️-tech-stack)
- [🧠 How the AI Features Work](#-how-the-ai-features-work)
- [⚡ Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Schema](#️-database-schema)
- [🔌 API Routes](#-api-routes)
- [🔐 Environment Variables](#-environment-variables)
- [🚀 Deployment to Vercel](#-deployment-to-vercel)
- [📱 Mobile App (Android APK)](#-mobile-app-android-apk)
- [🔧 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔑 **Google OAuth Login** | One-click Google sign-in powered by NextAuth.js — no passwords needed |
| 📋 **Interactive Kanban Board** | Drag-and-drop pipeline with 6 stages: *Bookmarked → Applied → Screening → Interview → Offer → Rejected* (built with `@dnd-kit`) |
| 🤖 **AI Job Description Parser** | Paste a URL or raw JD text — GPT-4o-mini extracts 12+ structured fields (role, company, salary, skills, responsibilities, and more) |
| 📄 **Resume Upload & Parsing** | Upload PDF or TXT resumes; extracts text and auto-detects skills via keyword matching using `pdf-parse` |
| 🎯 **AI Resume Match Scorer** | Compares your resume against a JD and returns: overall score (0–100%), letter grade (A–F), matched/missing/bonus skills, strengths, gaps, improvement suggestions, ATS keywords, and interview likelihood |
| 📊 **Insights Dashboard** | Stats cards with total applications, response rates, average match scores, and per-status breakdowns |
| 🗂️ **Application Detail Modal** | Full slide-over panel with tabs for core details, notes, JD parsing results, and ATS match analysis |
| 🔄 **List + Kanban Views** | Toggle between a glassmorphic table view and the Kanban board |
| ⚙️ **Settings Page** | Profile display, OpenAI API key configuration (bring your own key), billing/tier info |
| 🎨 **Premium Dark UI** | 1,100+ line custom CSS design system with glassmorphism, animations, and gradient accents |
| 📱 **Mobile Responsive** | Fully responsive design that works beautifully on all screen sizes |
| 🤖 **Android Mobile App** | Native Android APK via Capacitor that wraps the deployed web app |

---

## 📸 Screenshots

> Screenshots and demo GIFs are available in the repository's [`/screenshots`](./screenshots) directory. Visit the [live demo](https://ai-job-tracker-demo.vercel.app) to explore the full experience.

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + Custom CSS Design System (glassmorphism, animations) |
| **Database** | PostgreSQL (hosted on [Neon](https://neon.tech)) |
| **ORM** | Prisma v7 with `pg` driver adapter |
| **Auth** | NextAuth.js v4 (Google OAuth) |
| **AI** | OpenAI GPT-4o-mini (structured JSON outputs) |
| **State Management** | Zustand + React Query (`@tanstack/react-query`) |
| **Drag & Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **PDF Parsing** | `pdf-parse` |
| **Deployment** | Vercel (web) + Neon (database) |
| **Mobile** | Capacitor (Android native wrapper) |

---

## 🧠 How the AI Features Work

JobTracker AI uses **OpenAI's GPT-4o-mini** model with structured JSON output mode to power two core features:

### 1. Job Description Parser (`/api/ai/parse-jd`)

```mermaid
flowchart LR
    A["📋 Raw JD Text\nor URL"] --> B["API Route\n/api/ai/parse-jd"]
    B --> C["GPT-4o-mini\n(Structured Output)"]
    C --> D["Parsed JSON\n12+ Fields"]
    D --> E["💾 Stored on\nApplication Record"]
```

**How it works:**

1. The user pastes a **job description URL** or **raw text** into the parser.
2. The API route sends the text to GPT-4o-mini with a carefully crafted **system prompt** that instructs the model to extract structured fields.
3. The model returns a **JSON object** with 12+ fields, including:
   - Job title, company name, location, job type (remote/hybrid/onsite)
   - Salary range, experience level, department
   - Required skills, preferred skills, responsibilities
   - Benefits, application deadline
4. The parsed data is stored as a JSON blob on the `Application` record in PostgreSQL and displayed in the detail modal.

### 2. Resume Match Scorer (`/api/ai/match-score`)

```mermaid
flowchart LR
    A["📄 Resume Text"] --> C["GPT-4o-mini\n(Structured Output)"]
    B["📋 Parsed JD"] --> C
    C --> D["Match Analysis JSON"]
    D --> E["🎯 Score: 78%\nGrade: B+"]
```

**How it works:**

1. The user's **active resume text** (extracted from the uploaded PDF/TXT) and the **job description** are sent together to the API.
2. GPT-4o-mini receives both documents with a system prompt that instructs it to perform a **detailed comparison**.
3. The model returns a comprehensive JSON analysis:

   | Field | Example |
   |-------|---------|
   | **Overall Score** | `78` (0–100) |
   | **Grade** | `B+` (A–F scale) |
   | **Matched Skills** | `["React", "TypeScript", "Node.js"]` |
   | **Missing Skills** | `["Kubernetes", "AWS"]` |
   | **Bonus Skills** | `["GraphQL", "Docker"]` |
   | **Strengths** | Key areas where the resume excels |
   | **Gaps** | Critical areas needing improvement |
   | **Suggestions** | Actionable tips to boost the score |
   | **ATS Keywords** | Keywords to add for ATS optimization |
   | **Interview Likelihood** | `"High"`, `"Medium"`, or `"Low"` |

4. Results are stored on the `Application` record and displayed in the match analysis tab of the detail modal.

> [!NOTE]
> Both AI endpoints use **structured JSON output mode** (`response_format: { type: "json_object" }`), ensuring reliable, parseable responses every time. Users can configure their own OpenAI API key in Settings.

---

## ⚡ Quick Start

Get up and running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/shrisha337-beep/ai-job-tracker.git
cd ai-job-tracker/job-tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in your values (see Environment Variables section below)

# 4. Set up the database
npx prisma migrate dev
npx prisma generate

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google. 🎉

> [!TIP]
> Don't have a PostgreSQL database yet? Create a free serverless database in seconds at [neon.tech](https://neon.tech). Copy the connection string into your `DATABASE_URL`.

---

## 📁 Project Structure

```
job-tracker/
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 (app)/                   # Authenticated app routes
│   │   │   ├── 📂 applications/        # Kanban board + list view page
│   │   │   ├── 📂 dashboard/           # Insights dashboard
│   │   │   ├── 📂 resume/              # Resume management page
│   │   │   ├── 📂 settings/            # Settings page
│   │   │   └── 📄 layout.tsx           # App layout wrapper
│   │   ├── 📂 api/
│   │   │   ├── 📂 ai/
│   │   │   │   ├── 📂 parse-jd/        # AI JD parser endpoint
│   │   │   │   └── 📂 match-score/     # AI resume scorer endpoint
│   │   │   ├── 📂 applications/        # CRUD for job applications
│   │   │   ├── 📂 auth/                # NextAuth handler
│   │   │   └── 📂 resume/              # Resume upload endpoint
│   │   ├── 📂 login/                   # Login page
│   │   ├── 📄 page.tsx                 # Landing page
│   │   ├── 🎨 globals.css             # Design system (1,100+ lines)
│   │   ├── 📄 layout.tsx              # Root layout
│   │   └── 📄 providers.tsx           # Session provider
│   ├── 📂 components/
│   │   ├── 📂 kanban/
│   │   │   ├── AddApplicationModal.tsx
│   │   │   ├── ApplicationCard.tsx
│   │   │   ├── ApplicationDetailModal.tsx
│   │   │   ├── KanbanBoard.tsx
│   │   │   └── KanbanColumn.tsx
│   │   └── 📂 layout/
│   │       └── AppLayout.tsx
│   ├── 📂 lib/
│   │   ├── 📄 auth.ts                 # NextAuth config
│   │   ├── 📄 auth-helpers.ts         # Session helpers
│   │   └── 📄 prisma.ts              # Prisma client with pg adapter
│   └── 📂 types/
│       ├── 📄 application.ts          # App type definitions
│       └── 📄 next-auth.d.ts          # NextAuth type augmentation
├── 📂 prisma/
│   └── 📄 schema.prisma              # Database schema
├── 📂 android/                        # Capacitor Android native project
├── 📄 capacitor.config.json           # Capacitor configuration
├── 📄 package.json
├── 📄 next.config.ts
├── 📄 tsconfig.json
└── 🔒 .env.local                     # Environment variables (not committed)
```

---

## 🗄️ Database Schema

The app uses **Prisma v7** with a **PostgreSQL** database. Below are the core models:

| Model | Purpose |
|-------|---------|
| **User** | User profile, linked to Google OAuth via NextAuth |
| **Account** | OAuth provider accounts (Google) |
| **Session** | Active user sessions |
| **Application** | Job applications with status enum (`BOOKMARKED`, `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`), parsed JD data (JSON), match score, match analysis (JSON), notes, salary, location, job type |
| **Resume** | User resumes with raw text, parsed skills array, active flag |
| **VerificationToken** | Email verification tokens |

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Application : creates
    User ||--o{ Resume : uploads
    Application {
        string id PK
        string status
        json parsedJD
        float matchScore
        json matchAnalysis
        string notes
    }
    Resume {
        string id PK
        text rawText
        json skills
        boolean active
    }
```

---

## 🔌 API Routes

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/applications` | Create a new job application |
| `GET` | `/api/applications` | List user's applications (supports search, status filter, pagination) |
| `PATCH` | `/api/applications` | Update application fields (status, notes, etc.) |
| `DELETE` | `/api/applications` | Delete an application |
| `POST` | `/api/ai/parse-jd` | AI-powered job description parser |
| `POST` | `/api/ai/match-score` | AI resume-to-JD match scorer |
| `POST` | `/api/resume` | Upload a resume (PDF or TXT) |
| `GET` | `/api/resume` | List user's uploaded resumes |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth.js authentication handler |

> [!IMPORTANT]
> All API routes (except auth) require an authenticated session. Unauthenticated requests receive a `401 Unauthorized` response.

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Description | How to Get |
|----------|-------------|:----------:|
| `DATABASE_URL` | PostgreSQL connection string | Create a free database on [neon.tech](https://neon.tech) |
| `NEXTAUTH_SECRET` | Random secret for session encryption | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` for dev) | Your deployment URL |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Same as above |
| `OPENAI_API_KEY` | OpenAI API key for AI features | [platform.openai.com](https://platform.openai.com/) → API Keys |

<details>
<summary>📋 Example <code>.env.local</code> file</summary>

```env
# Database
DATABASE_URL="postgresql://user:password@ep-example-123.us-east-2.aws.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"

# OpenAI
OPENAI_API_KEY="sk-proj-your-api-key-here"
```

</details>

---

## 🚀 Deployment to Vercel

1. **Push** your code to GitHub.
2. **Import** the repository on [vercel.com](https://vercel.com).
3. **Add environment variables** in the Vercel Dashboard:
   - Go to **Settings → Environment Variables**
   - Add all six variables from the table above
4. **Set `NEXTAUTH_URL`** to your Vercel production URL (e.g., `https://your-app.vercel.app`).
5. **Deploy** — Vercel will build and deploy automatically on every push.

> [!TIP]
> Make sure your Google OAuth Authorized Redirect URIs include `https://your-app.vercel.app/api/auth/callback/google` in the Google Cloud Console.

---

## 📱 Mobile App (Android APK)

The mobile app is a **native Android wrapper** built with [Capacitor](https://capacitorjs.com/) that loads the deployed web app inside a WebView. This gives you a real Android app (`.apk`) that users can install on their phones.

### Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js 18+** installed ([download](https://nodejs.org/))
- ✅ **Android Studio** installed ([download](https://developer.android.com/studio))
- ✅ **Android SDK** installed (API Level 36 recommended)
- ✅ A **physical Android device** or an **Android emulator** set up

> [!NOTE]
> If you've never done Android development before, don't worry! Follow the step-by-step guide below. The entire process takes about 20–30 minutes, most of which is download/install time.

---

### Step 1: Install Android Studio

1. Download Android Studio from [developer.android.com/studio](https://developer.android.com/studio).
2. Run the installer and follow the setup wizard.
3. When prompted, make sure the following components are checked:
   - ☑️ Android SDK
   - ☑️ Android SDK Platform-Tools
   - ☑️ Android SDK Build-Tools
4. Complete the installation and launch Android Studio at least once (it will download additional components).

---

### Step 2: Configure the Android SDK Path

After installing Android Studio, you need to tell the project where your Android SDK is located.

**Find your SDK path:**

| OS | Default SDK Path |
|----|-----------------|
| **Windows** | `C:\Users\<username>\AppData\Local\Android\Sdk` |
| **macOS** | `~/Library/Android/sdk` |
| **Linux** | `~/Android/Sdk` |

> [!TIP]
> Not sure where your SDK is? Open Android Studio → **Settings** (or **Preferences** on Mac) → **Languages & Frameworks** → **Android SDK** → copy the **Android SDK Location** path.

**Update `android/local.properties`:**

Open (or create) the file `android/local.properties` and set the SDK path:

```properties
# Windows (use double backslashes)
sdk.dir=C\\:\\\\Users\\\\YourUsername\\\\AppData\\\\Local\\\\Android\\\\Sdk

# macOS / Linux
sdk.dir=/Users/YourUsername/Library/Android/sdk
```

---

### Step 3: Update the Vercel URL

Open `capacitor.config.json` in the project root and update `server.url` to point to your **deployed Vercel URL**:

```json
{
  "appId": "com.aijobtracker.app",
  "appName": "JobTracker AI",
  "webDir": "out",
  "server": {
    "url": "https://your-actual-vercel-url.vercel.app",
    "cleartext": true
  }
}
```

> [!WARNING]
> Replace `https://your-actual-vercel-url.vercel.app` with your real Vercel deployment URL. If this is wrong, the app will show a blank screen or an error.

---

### Step 4: Sync Capacitor

Run the following command from the project root to sync web assets with the native Android project:

```bash
npx cap sync
```

---

### Step 5: Build the APK

You have two options — use **Android Studio** (recommended for beginners) or the **command line**.

<details>
<summary>🅰️ <strong>Option A: Build with Android Studio</strong> (Recommended)</summary>

1. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```
2. **Wait for Gradle sync** to complete (you'll see a progress bar at the bottom). This may take a few minutes on the first run.
3. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. Wait for the build to finish. A notification will appear with a link to the APK.
5. The APK is generated at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

</details>

<details>
<summary>🅱️ <strong>Option B: Build from Command Line</strong></summary>

Navigate to the `android` directory and run the Gradle build:

```bash
# macOS / Linux
cd android
./gradlew assembleDebug

# Windows
cd android
gradlew.bat assembleDebug
```

The APK will be generated at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

</details>

---

### Step 6: Install the APK on Your Phone

Choose one of the following methods:

<details>
<summary>📲 <strong>Method 1: Manual Transfer</strong> (No developer tools needed)</summary>

1. **Copy the APK** (`app-debug.apk`) to your phone via USB cable, email, Google Drive, or any file transfer method.
2. On your phone, go to **Settings → Security** (or **Settings → Apps → Special Access**).
3. Enable **"Install from unknown sources"** or **"Install unknown apps"** for your file manager.
4. Open the APK file on your phone and tap **Install**.
5. Once installed, find **"JobTracker AI"** in your app drawer and open it! 🎉

</details>

<details>
<summary>⚡ <strong>Method 2: Install via ADB</strong> (Developer-friendly)</summary>

If you have **USB debugging** enabled on your phone:

1. Connect your phone to your computer via USB.
2. Authorize the computer on your phone when prompted.
3. Run:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. The app will be installed and ready to open. 🎉

> **Enable USB Debugging:** On your phone, go to **Settings → About Phone → tap "Build Number" 7 times** to enable Developer Options. Then go to **Settings → Developer Options → enable USB Debugging**.

</details>

---

## 🔧 Troubleshooting

### Common Issues

<details>
<summary>❌ <strong>"Invalid redirect_uri" error during Google login</strong></summary>

**Cause:** Your Google OAuth Authorized Redirect URIs don't match your app URL.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Click your OAuth 2.0 Client ID.
3. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://your-app.vercel.app/api/auth/callback/google` (for production)
4. Save and wait a few minutes for changes to propagate.

</details>

<details>
<summary>❌ <strong>Prisma: "Can't reach database server"</strong></summary>

**Cause:** Your `DATABASE_URL` is incorrect or the database is unreachable.

**Fix:**
1. Verify your `DATABASE_URL` in `.env.local` is correct.
2. Make sure the connection string includes `?sslmode=require` for Neon.
3. Check that your Neon database isn't suspended (free-tier databases auto-suspend after inactivity).
4. Try running `npx prisma db pull` to test the connection.

</details>

<details>
<summary>❌ <strong>AI features return errors or empty responses</strong></summary>

**Cause:** Missing or invalid OpenAI API key, or insufficient credits.

**Fix:**
1. Verify your `OPENAI_API_KEY` is set in `.env.local` (or in Settings if using the in-app config).
2. Make sure the API key starts with `sk-`.
3. Check your OpenAI account has available credits at [platform.openai.com/usage](https://platform.openai.com/usage).
4. The app uses `gpt-4o-mini` — ensure your API key has access to this model.

</details>

<details>
<summary>❌ <strong>Android build fails with "SDK location not found"</strong></summary>

**Cause:** The `android/local.properties` file is missing or has an incorrect SDK path.

**Fix:**
1. Open Android Studio → **Settings → Languages & Frameworks → Android SDK**.
2. Copy the **Android SDK Location** path.
3. Create or edit `android/local.properties` and set `sdk.dir` to that path (see [Step 2](#step-2-configure-the-android-sdk-path) above).

</details>

<details>
<summary>❌ <strong>Android app shows a blank white screen</strong></summary>

**Cause:** The `server.url` in `capacitor.config.json` is incorrect or the Vercel deployment is down.

**Fix:**
1. Open `capacitor.config.json` and verify the `server.url` matches your live Vercel deployment.
2. Test the URL in a browser to make sure it loads.
3. Run `npx cap sync` again after making changes.
4. Rebuild the APK.

</details>

<details>
<summary>❌ <strong>Drag and drop not working on the Kanban board</strong></summary>

**Cause:** Browser compatibility issue or conflicting CSS.

**Fix:**
1. Make sure you're using a modern browser (Chrome, Firefox, Edge, Safari 15+).
2. Try disabling browser extensions that might intercept drag events.
3. On mobile, touch-based drag and drop should work out of the box via `@dnd-kit`'s touch sensor.

</details>

<details>
<summary>❌ <strong>"NEXTAUTH_SECRET" error on deployment</strong></summary>

**Cause:** The `NEXTAUTH_SECRET` environment variable is not set.

**Fix:**
1. Generate a secret: `openssl rand -base64 32`
2. Add it to your Vercel environment variables (Settings → Environment Variables).
3. Redeploy the app.

</details>

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m 'feat: add your feature'
   ```
4. **Push** to your fork and **open a Pull Request**

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style / formatting |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for a hackathon**

[⬆ Back to Top](#-jobtracker-ai)

</div>
