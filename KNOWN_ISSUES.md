# EDU SPACE LMS — KNOWN ISSUES & ENVIRONMENT CONSTRAINTS

**Platform:** Алматинский многопрофильный колледж (АМК) — EduSpace / SkillHub
**Updated:** 2026-11-17

---

## 1. External Service Constraints
- **Optional Local Email OTP (`SMTP` / `Resend`):** When `HOSTED=False` and neither `MAIL_API_KEY` nor `SMTP_PASSWORD` is configured, `email_verification_required` defaults to `false` (`/api/auth/readiness`), allowing local registration and login without SMTP/Resend credentials. Password recovery by email returns `503 MAIL_NOT_CONFIGURED` until mail credentials are provisioned (authenticated password change remains available in Profile Settings).
- **Production PostgreSQL Database:** When `DATABASE_URL` is configured, the backend engages the PostgreSQL adapter with `sslmode=require` support and skips local SQLite fallback in `HOSTED` mode. Live PostgreSQL runtime execution is blocked locally unless PostgreSQL/Docker is provisioned.
- **LLM AI Mentor:** `/api/ai/chat` returns `503 BLOCKED` (`AI_PROVIDER_UNCONFIGURED`) unless `GEMINI_API_KEY`, `OPENAI_API_KEY`, or a user-supplied session key is provided.

## 2. M1 Foundation Remediations Completed
- Enforced server-side `@login_required()` / `@require_roles(...)` with `users.session_version` DB re-validation and teacher group isolation.
- Enforced double-submit CSRF (`X-CSRF-Token`), strict `Origin` checks, allowlisted CORS preflight, and IP+account rate limiting on `/api/auth/*` and `/api/ai/*`.
- Aligned 12->20 curriculum progression (`100` lessons / `100` tasks), HMAC-SHA256 certificate verification, XP ledger idempotency, XSS sanitization, and `EDUSPACE_DB_PATH` / `UPLOAD_DIR` configurability.
