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

*Entries will be added as work progresses through MG1–MG8.*
