# Hackathon Changelog

> Amazon Hackathon · Alexa+ (simulated) track + AWS Builder + Open Source  
> Deadline: Fri 23 Oct 2026, 11:59 PM IST

This file tracks every significant update made during the hackathon period (20–23 Oct 2026). Each entry links to the commit that introduced the change. The pre-hackathon state is tagged `v1-baseline`.

---

## Tue 20 Oct 2026

### MG0: Housekeeping + Auth Hardening — commit [`4918166`](../../commit/4918166)

**Security**
- **Removed the email-only Credentials provider.** Anyone could sign in (and auto-create an account) by typing any email address. Google OAuth is now the only login path. ([`src/lib/auth.ts`](src/lib/auth.ts), [`src/app/login/page.tsx`](src/app/login/page.tsx))
- **Fixed a route guard bypass.** The auth proxy treated `"/"` as a public *prefix*, so every route matched and nothing was protected. `"/"` now matches exactly, other public paths match by path segment, and unauthenticated API calls return `401` JSON instead of an HTML redirect. ([`src/proxy.ts`](src/proxy.ts))

**Repo housekeeping**
- Added MIT [`LICENSE`](LICENSE).
- Added [`.env.example`](.env.example) with instructions for every variable, including the new AWS Bedrock settings.
- README: removed the dead demo link and the outdated n8n roadmap, fixed the clone path and project tree, added hackathon context, Bedrock env vars and a Tests section.
- Removed internal planning docs from the repo and its history; they are now in `.gitignore`.
- Started this changelog.

**Testing**
- Added Vitest (`npm test`).

| Suite | Tests | Result |
|-------|------:|:------:|
| `tests/auth/route-guard.test.ts` — protected pages redirect to `/login` with `callbackUrl`; protected APIs return `401`; public paths and static files pass; session cookies (dev + `__Secure-`) are accepted; regression cases for the `"/"` prefix bypass | 31 | ✅ |
| `tests/auth/auth-config.test.ts` — Google is the only provider; JWT sessions; custom `/login` page | 2 | ✅ |
| **Total** | **33** | **✅ 33/33** |

Also verified: `tsc --noEmit` clean, ESLint clean on changed files.

---

## Wed 21 Oct 2026

### MG1: Schema + Seed — commit [`2269ea9`](../../commit/2269ea9)

**Data Model & Database**
- **Extended Prisma schema (`prisma/schema.prisma`)** with the Campus Career Pilot domain models:
  - `UserProfile`: student branch, year, CGPA, target roles, placement drive date, daily study hours, preferred work mode.
  - `ChatSession` & `ChatMessage`: multi-turn session persistence with role (`USER`, `ASSISTANT`, `TOOL`) and structured `toolCalls` storage.
  - `Question`: DSA question bank with topics, difficulty, prompt, company tags, and deterministic grading rubrics.
  - `TopicMastery`: Leitner box (0–4) revision tracking, mastery score (0–1), review timestamps, and attempt counters.
  - `PracticeAttempt`: student answer submissions, rubric score breakdowns, and composite score `r`.
  - `Listing`: Indian internship listings with required/preferred skills, role tags, illustrative stipends, and deadlines.
  - `StudyPlan` & `StudyTask`: adaptive daily schedule breakdown (`DSA`, `REVISION`, `RESUME`, `APPLICATION`).
  - Linked `Application` to `Listing` via optional `listingId`.
- **Database Migration:** Applied schema migration to Neon PostgreSQL (`prisma/migrations/20261020180000_campus_career_pilot/migration.sql`), including idempotent enums and drift guard for `User.theme`.

**Taxonomy & Seed Data**
- **Canonical Taxonomy (`src/data/taxonomy.json`):** 153 skills categorized across 18 domains with aliases for keyword extraction, plus 8 canonical DSA topics with curriculum weights.
- **Seeded 40 Internship Listings (`prisma/seed-data/listings.ts`):** Hand-written listings across SDE, frontend, backend, fullstack, data, ML, mobile, cloud, QA, security, embedded, and product roles in Indian tech hubs with standard attribution.
- **Seeded 60 DSA Questions (`prisma/seed-data/questions.ts`):** High-frequency interview problems across the 8 topics, complete with time/space complexity targets, evaluation criteria, and edge cases.
- **Seed Script (`prisma/seed.ts`):** Idempotent upsert script using `@prisma/adapter-pg` pool and relative IST deadline calculation.

**Testing**
- Added `tests/data/seed-integrity.test.ts` (9 tests verifying taxonomy structure, slug uniqueness, skill resolution, rubric completeness, and deadline date calculations).

| Suite | Tests | Result |
|-------|------:|:------:|
| `tests/auth/route-guard.test.ts` — protected pages, API 401s, public routes, cookie verification | 31 | ✅ |
| `tests/auth/auth-config.test.ts` — Google OAuth only, JWT sessions, custom login page | 2 | ✅ |
| `tests/data/seed-integrity.test.ts` — taxonomy, 40 listings, 60 questions & rubric integrity | 9 | ✅ |
| **Total** | **42** | **✅ 42/42** |

Also verified: `tsc --noEmit` clean (0 errors), database migration deployed and seed executed successfully on Neon PostgreSQL.

---

*Entries will be added as work progresses through MG2–MG8.*
