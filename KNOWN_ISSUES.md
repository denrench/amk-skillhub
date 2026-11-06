# EDU SPACE LMS — KNOWN ISSUES & ENVIRONMENT CONSTRAINTS

**Platform:** Алматинский многопрофильный колледж (АМК) — EduSpace / SkillHub  
**Updated:** 2026-11-06  

---

## 1. External Service Constraints
- **Live SMTP Server:** If `SMTP_PASSWORD` / `SMTP_USER` environment variables are not supplied, the server operates in Dev Preview mode, printing the 6-digit OTP code to the server console log for verification. This ensures 100% testability in local and offline environments without breaking the user registration or password reset flows.
- **Production PostgreSQL Database:** When `DATABASE_URL` is configured (e.g. on Render.com or local Postgres), the backend automatically engages the PostgreSQL adapter with SSL; in local offline development, it falls back to the local SQLite database (`database.db`) with zero schema discrepancies.

## 2. Active Remediations In Progress
- Resolving P0 access control flaws where anonymous requests bypass teacher and admin checks.
- Adding idempotent `xp_transactions` ledger to eliminate gamification farming.
- Integrating submission return for revision workflow.
- Designing responsive and unified futuristic cybernetic design system across all 17 platform views.
