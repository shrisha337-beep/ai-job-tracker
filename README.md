# AI Job Application Tracker

> AI-powered job application tracking built with Next.js 16, PostgreSQL (Prisma), and OpenAI GPT-4o.

🔗 **Live Demo**: _Coming soon_  
📁 **Repo**: https://github.com/shrisha337-beep/ai-job-tracker

---

## Features

- 🔐 **Google OAuth** login (one-click)
- 📋 **Kanban Board** — drag-and-drop pipeline (Bookmarked → Offer)
- 🤖 **AI JD Parser** — paste a URL or job description, extract 12+ fields instantly
- ⚡ **Resume Match Score** — upload resume, get AI match score + gap analysis per job
- 📊 **Insights Dashboard** — response rates, skill demand charts, activity timeline
- 📱 **Mobile responsive** — works on any device

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + custom design system |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 (Google OAuth) |
| AI | OpenAI GPT-4o (structured outputs) |
| Deploy | Vercel + Neon (PostgreSQL) |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or free [Neon](https://neon.tech) account)
- OpenAI API key
- Google OAuth credentials

### Setup

```bash
# Clone the repo
git clone https://github.com/shrisha337-beep/ai-job-tracker.git
cd ai-job-tracker/job-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `OPENAI_API_KEY` | OpenAI API key |

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push and open a PR

## License

MIT
