# MASTER_PLAN.md — AMK SkillHub / EduSpace 3.0

**Repository:** `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub` (branch `main`, baseline HEAD `6e74f62`)  
**Authoritative Spec:** `.agents/teamwork/ORIGINAL_REQUEST.md`  
**Scope & Contracts:** `PROJECT.md`  
**Status Legend:** `[ ] NOT STARTED` | `[~] IN PROGRESS` | `[x] VERIFIED` | `[!] BLOCKED`

---

## Milestone Structure & External Blockers

- **M1** (Phases 1 + 11 Foundation): Backend Security, Auth, Optional Local Email OTP, 12->20 Curriculum Alignment, PostgreSQL Parity, XSS/Crash/API Fixes
- **M2** (Phase 2 + Phase 10 CSS/JS Bundle): Unified Design System (`light`/`graphite`/`neon`), Single CSS Bundle (drop `cdn.tailwindcss.com`), Responsive Mobile/Desktop UI Redesign, Video Player Integration, `i18n.js` Across All Pages, Catalog Lazy-Splitting
- **M3** (Phases 3 + 10 3D): 3D Infrastructure Refactor, GLB Deduplication/Optimization, `LOW`/`BALANCED`/`ULTRA` Graphics Profiles, GPU Disposal & Reference 3D Automechanic Workshop
- **M4** (Phases 4 + 7): Real Verifiable Physics Simulators (all 5 specializations), 4 Student Tools Persistence & Real Lesson/3D-Aware LLM AI Mentor (no fake fallbacks; explicit `BLOCKED` if key unset)
- **M5** (Phases 5 + 6 + 8 + 9): Interactive Skill Map DAG, Practical Missions (all 5 specializations), Automatic Student Portfolio (privacy, consent public link, PDF export) & Practical 3D Exams (anti-tampering, error log, teacher review)
- **M6** (Phases 10 Perf Audit + 11 Security Audit): Full Performance Profiling, Memory Leak Sweep, Security Regression Verification & Integration Bugfixes
- **E2E** (Dual Track E2E Testing Track): Requirement-driven opaque-box test suite (Tiers 1–4, `TEST_INFRA.md`, `TEST_READY.md`)
- **M7 / Final Milestone**: Phase 1 (Pass 100% E2E Tiers 1–4) + Phase 2 (Tier 5 White-box Adversarial Coverage Hardening)
- **Phase 12**: Fresh Zero-Trust Final Audit, Fix Cycle & `FINAL_RELEASE_REPORT.md` (25-point audit, screenshots, git commit, honest `PASS`/`FAIL`/`BLOCKED` status)

### Known External / Environment Blockers (Baseline `6e74f62`)
1. **Live Render Production Drift (`BE-07`):** `https://amk-skillhub.onrender.com` runs an older commit (`tasks_total: 50`, `/api/auth/readiness` returns `404`), and local agents cannot deploy or mutate Render (`git push` to `main` is explicitly prohibited by R5).
2. **PostgreSQL & Docker Absent Locally (`BE-07`):** `psql`, PostgreSQL service, Docker, `psycopg2-binary`, `gunicorn`, and `DATABASE_URL` are not installed on this Windows host; live PG runtime execution is `[!] BLOCKED` unless PostgreSQL/Docker is provisioned externally (code parity & SQL/DDL/transaction-rollback logic must still be fixed and verified via unit/mock/schema inspection).
3. **LLM API Keys Absent Locally (`BE-03`, `AI-01..03`):** `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY` are unset. Live LLM output checks remain `[!] BLOCKED` unless a key is provided via env or UI settings, while missing-key `503 BLOCKED` behavior and mocked-transport unit tests MUST be `[x] VERIFIED`.
4. **SMTP / Resend Mail Credentials Absent Locally (`BE-02`):** `MAIL_API_KEY`, `SMTP_PASSWORD` are unset. Live email delivery is `[!] BLOCKED` locally; local registration/reset MUST succeed with email OTP optional/disabled (`BE-02`, `FE-CRIT-02`).

---

## Audit Finding Traceability Matrix

| Finding ID(s) | Task ID(s) | Milestone |
|---|---|---|
| `BE-01`, `SEC-01`, `SEC-02`, `SEC-03`, `SEC-04` | `T-M1-01` | M1 |
| `BE-02`, `BE-18`, `FE-CRIT-02`, `FE-CRIT-03`, `FE-LOW-01`, `FE-LOW-03`, `SEC-09`, `Stub #7, #8, #9` | `T-M1-02`, `T-M1-03` | M1 |
| `BE-08`, `BE-09`, `FE-HIGH-04`, `SEC-05` | `T-M1-04` | M1 |
| `BE-10`, `BE-15`, `COV-02`, `FE-MED-04`, `SEC-06` | `T-M1-05` | M1 |
| `BE-11`, `BE-14`, `COV-01`, `PERF-04` | `T-M1-06` | M1 |
| `BE-04`, `BE-05`, `BE-06`, `SEC-10` | `T-M1-07`, `T-M1-11` | M1 |
| `BE-12`, `BE-13`, `SEC-09`, `Stub #6, #14` | `T-M1-08` | M1 |
| `BE-16`, `FE-CRIT-01`, `SEC-07`, `SEC-08` | `T-M1-09` | M1 |
| `BE-17`, `FE-HIGH-05`, `FE-HIGH-06`, `FE-MED-06`, `Stub #13` | `T-M1-10` | M1 |
| `FE-HIGH-01`, `FE-HIGH-03`, `PERF-01` | `T-M2-01` | M2 |
| `FE-HIGH-02`, `FE-MED-02`, `FE-MED-03`, `FE-LOW-02` | `T-M2-02`, `T-M2-03` | M2 |
| `FE-MED-01`, `Stub #16` | `T-M2-04` | M2 |
| `I18N-01` | `T-M2-05` | M2 |
| `PERF-02`, `PERF-03` | `T-M2-06` | M2 |
| `3D-01`, `3D-02`, `PERF-03` | `T-M3-01` | M3 |
| `3D-03`, `3D-06`, `FE-MED-05` | `T-M3-02` | M3 |
| `3D-04`, `3D-05` | `T-M3-03` | M3 |
| `3D-03`, `3D-07` | `T-M3-04` | M3 |
| `SIM-01`, `SIM-02`, `Stub #10, #11, #17` | `T-M4-01`, `T-M4-02` | M4 |
| `TLS-01` | `T-M4-03` | M4 |
| `BE-03`, `AI-01`, `AI-02`, `AI-03`, `Stub #1, #2, #3, #4` | `T-M4-04`, `T-M4-05` | M4 |
| `SKM-01` | `T-M5-01`, `T-M5-02` | M5 |
| `PRT-01`, `Stub #12, #15` | `T-M5-03` | M5 |
| `EXM-01`, `Stub #5, #18` | `T-M5-04`, `T-M5-05` | M5 |
| `PERF-01..04`, `3D-04`, `SEC-01..10` | `T-M6-01`, `T-M6-02` | M6 |
| `E2E` Dual Track | `T-E2E-01..04` | E2E |
| `M7` Final Milestone | `T-M7-01`, `T-M7-02` | M7 |
| `BE-07`, Phase 12 Gate | `T-P12-01..03` | Phase 12 |

---

## Phase 0 — Stage 0 Audit & Architecture Planning

### `T-P0-01`
- **Phase & Milestone:** Phase 0 (Stage 0)
- **Title:** Read-Only Codebase, Environment, Browser & 3D/AI Survey
- **Description:** Conduct exhaustive read-only audit of backend (`server.py`, `routes_interactive_lessons.py`, `eduspace_ai.py`, `curriculum_seeder.py`, `migrate_to_postgres.py`), all 20 HTML pages, CSS/JS/locales, 3D assets, reference URLs (`denrench.github.io`, `amk-skillhub.onrender.com`), and host tooling.
- **Priority:** `P0`
- **Dependencies:** None
- **Affected Files:** `.agents/teamwork/explorer_survey_1/analysis.md`, `explorer_survey_2/analysis.md`, `explorer_survey_3/analysis.md`
- **Proposed Changes:** None (read-only inspection + isolated `%TEMP%` DB smoke check).
- **Acceptance Criteria:** All 3 survey reports produced with exact file/line evidence, live Chrome checks, and asset hashes.
- **Required Tests:** Isolated Flask startup smoke test, headless Chrome desktop/mobile audit, `check_locales.py`, GLB SHA-256 hash check.
- **Status:** `[x] VERIFIED`

### `T-P0-02`
- **Phase & Milestone:** Phase 0 (Stage 0)
- **Title:** Author Stage 0 Engineering & Planning Documents
- **Description:** Create `AUDIT_REPORT.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `3D_ASSET_MANIFEST.md`, `MASTER_PLAN.md`, `TEST_PLAN.md`, `IMPLEMENTATION_LOG.md`, and `PROJECT.md` without modifying any source files.
- **Priority:** `P0`
- **Dependencies:** `T-P0-01`
- **Affected Files:** `AUDIT_REPORT.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `3D_ASSET_MANIFEST.md`, `MASTER_PLAN.md`, `TEST_PLAN.md`, `IMPLEMENTATION_LOG.md`, `PROJECT.md`
- **Proposed Changes:** Author complete Stage 0 documentation suite with 100% traceability.
- **Acceptance Criteria:** All 8 root documentation files exist, cover all findings/requirements, and zero source/code files modified in Stage 0.
- **Required Tests:** Traceability audit across `ORIGINAL_REQUEST.md`, surveys, and `PROJECT.md`/`MASTER_PLAN.md`.
- **Status:** `[x] VERIFIED`

---

## M1 — Phases 1 + 11 Foundation (Security, Auth, 20-Module Parity, PG & Critical Fixes)

### `T-M1-01`
- **Phase & Milestone:** Phase 1 + Phase 11 | **M1**
- **Title:** Fix Unauthenticated IDORs & Ownership Checks Across All Mutable/PII APIs
- **Description:** Remediate `BE-01`, `SEC-01`, `SEC-02`, `SEC-03`, `SEC-04` across `server.py` and `routes_interactive_lessons.py`.
- **Priority:** `P0`
- **Dependencies:** `T-P0-02`
- **Affected Files:** `server.py`, `routes_interactive_lessons.py`
- **Proposed Changes:**
  - Add `@login_required()` to `PUT /api/user/profile`, `POST /api/courses/enroll`, `GET /api/billing/status`, `POST /api/billing/checkout`, `GET /api/mission/state`, `POST /api/mission/save_stage`, `POST /api/mission/submit`, `GET/POST /api/daily_quests`, `GET /api/demo/status`.
  - Derive `user_id` strictly from `g.current_user['id']` (allowing override only for `admin`); require current password verification on password change; enforce `>= 8` char password policy.
  - Sandbox-gate `/api/billing/checkout` (remove unauthenticated arbitrary-user Pro upgrade).
  - Enforce course creator or assigned-group authorization in `routes_interactive_lessons.py` (`lines 95, 145, 351, 407, 682`).
- **Acceptance Criteria:** Unauthenticated calls to all listed routes return `401`; student targeting another `user_id` returns `403`.
- **Required Tests:** Automated pytest IDOR/RBAC matrix across anonymous, student A, student B, teacher, admin.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupAM1IDORAndOwnership`)*

### `T-M1-02`
- **Phase & Milestone:** Phase 1 | **M1**
- **Title:** Make Email OTP Optional Locally & Fix Registration / Password Reset Flow
- **Description:** Remediate `BE-02`, `FE-CRIT-02`, `BE-18` so local registration and password reset work without SMTP/Resend env vars while keeping strict OTP optional when mail is configured.
- **Priority:** `P0`
- **Dependencies:** `T-P0-02`
- **Affected Files:** `server.py`, `auth.html`, `js/academy-auth.js`, `KNOWN_ISSUES.md`
- **Proposed Changes:**
  - Update `/api/auth/readiness` to report `{ login: true, registration: true, email_verification_required: <bool>, mail_configured: <bool> }`.
  - When `not HOSTED` and `MAIL_API_KEY`/`SMTP_PASSWORD` are absent (or `AUTH_REQUIRE_EMAIL_OTP=false`), allow `POST /api/auth/register` and `POST /api/auth/reset_password` without mandatory OTP (`send_code` returns structured disabled/optional info instead of blocking registration).
  - Remove `required` attribute from `input[name="verification_code"]` in `auth.html:54` and toggle optional OTP UI via `/api/auth/readiness`.
  - Clean dead `#account-hosted` block (`FE-LOW-03`) and align password policy hint (`>= 8` chars, `FE-LOW-01`).
- **Acceptance Criteria:** New student and teacher (with valid teacher code) can register and log in locally with empty `verification_code`; `mail_configured: false` is honestly reported.
- **Required Tests:** Selenium registration + login + reload persistence test + API `/api/auth/register` test.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupBM1AuthAndOptionalOTP` & `TestGroupJM1SeleniumBrowser`)*

### `T-M1-03`
- **Phase & Milestone:** Phase 1 + Phase 11 | **M1**
- **Title:** Unify Frontend Auth Client & Eliminate Plaintext `localStorage` Credentials / Fake Backend Bypass
- **Description:** Remediate `FE-CRIT-03`, `Stub #7`, `Stub #8`, `Stub #9`.
- **Priority:** `P0`
- **Dependencies:** `T-M1-02`
- **Affected Files:** `js/academy-auth.js`, `js/app-logistics.js`, `server.py`
- **Proposed Changes:**
  - Route `academy-auth.js` calls through `EduSpace.api` cleanly; delete plaintext `amk.local_accounts.v1` password storage and hardcoded OTP `'123456'`.
  - Remove client-exposed hardcoded teacher codes (`app-logistics.js:30`) and weaken demo code list (`'2026'`, etc.) in `server.py:230-238` (keep configurable `TEACHER_ACCESS_CODES` env var with clean dev defaults isolated to non-hosted seed).
  - When backend API is unreachable, surface an explicit offline/unavailable banner instead of silently authenticating via `handleLocalApi` mock DB (retain read-only static catalog browsing on `.github.io`).
- **Acceptance Criteria:** Zero plaintext passwords in `localStorage`; `teacher` registration requires server-validated code; unreachable API surfaces explicit error instead of fake auth.
- **Required Tests:** Unit/Selenium check inspecting `localStorage` keys after register/login and simulating offline API response.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::test_b02..b03` & `test_j03`)*

### `T-M1-04`
- **Phase & Milestone:** Phase 1 + Phase 11 | **M1**
- **Title:** Enforce Rate Limiting on `/api/auth/*` & `/api/ai/*`, Double-Submit CSRF & CORS Preflight
- **Description:** Remediate `BE-08`, `BE-09`, `FE-HIGH-04`, `SEC-05`, `BE-18`.
- **Priority:** `P0`
- **Dependencies:** `T-M1-01`
- **Affected Files:** `server.py`, `requirements.txt`, `career.html`, `lesson_player.html`, `auth.html`, `js/app-logistics.js`
- **Proposed Changes:**
  - Update `_enforce_rate_limit()` to cover `/api/auth/login`, `/api/auth/register`, `/api/auth/send_code`, `/api/auth/verify_code`, `/api/auth/reset_password`, and `/api/ai/*` by IP + account key.
  - Implement CSRF token issuance in `/api/auth/session` and validation (`X-CSRF-Token`) + strict `Origin`/`Referer` enforcement on state-changing routes (and `SameSite=Lax` cookies).
  - Add allowlisted `@app.after_request` CORS headers + `OPTIONS` preflight handler for `https://denrench.github.io` and local origins (`Vary: Origin`, `Access-Control-Allow-Credentials: true`), or add `flask-cors` to `requirements.txt`.
  - Remove hardcoded `amk-skillhub.onrender.com` calls in `career.html:254`, `lesson_player.html`, etc., using relative paths locally and configurable `API_BASE`.
- **Acceptance Criteria:** 46th rapid login attempt returns `429`; cross-site POST without CSRF/valid origin returns `403`; `OPTIONS` preflight from `denrench.github.io` returns `204/200` with CORS headers; `0` CORS `SEVERE` console errors locally.
- **Required Tests:** Pytest burst rate-limit test, CSRF rejection test, CORS preflight test.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupCM1RateLimitCsrfCors`)*

### `T-M1-05`
- **Phase & Milestone:** Phase 1 + Phase 11 | **M1**
- **Title:** Fix Session Role Re-Validation (`session_version`), Teacher Group Isolation & Canonical Slugs
- **Description:** Remediate `BE-10`, `BE-15`, `COV-02`, `FE-MED-04`, `SEC-06`.
- **Priority:** `P0`
- **Dependencies:** `T-M1-01`
- **Affected Files:** `server.py`, `routes_interactive_lessons.py`, `career.html`
- **Proposed Changes:**
  - Add `session_version` column to `users`; increment on role change or password reset; validate `g.current_user` from DB in centralized `@require_roles(...)` instead of trusting `session.get('user_role')`.
  - Restrict `/api/demo/reset` to `('teacher', 'admin')` (disabled when `HOSTED=True`).
  - Filter `/api/teacher/matrix` and `/api/teacher/stats` by `get_teacher_assigned_groups(caller_id)` for `teacher` role.
  - Fix `get_teacher_assigned_groups()` (`server.py:109-119`), `CURRICULUM_KNOWLEDGE`, and `career.html:183,369` to use canonical slugs (`it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic`).
  - Return HTTP `404` in `/api/teacher/grade_submission` when `submission_id` does not exist (`BE-15`). Prevent admin self-demotion.
- **Acceptance Criteria:** Demoted user's old cookie immediately fails with `401/403`; teacher cannot view other specialty students in matrix/stats; student gets `403` on `/api/demo/reset`; missing submission returns `404`.
- **Required Tests:** Session invalidation test, teacher cross-group isolation test, admin self-demotion test.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupDM1SessionVersionAndIsolation`)*

### `T-M1-06`
- **Phase & Milestone:** Phase 1 | **M1**
- **Title:** Align 12->20 Curriculum Length Across All APIs, Health Telemetry & Pro-Tier Gating
- **Description:** Remediate `BE-11`, `BE-14`, `BE-15`, `COV-01`, `PERF-04`.
- **Priority:** `P0`
- **Dependencies:** `T-M1-05`
- **Affected Files:** `server.py`, `routes_interactive_lessons.py`, `curriculum_seeder.py`
- **Proposed Changes:**
  - Remove hardcoded `12` day clamps and `12.0` / `60` denominators in `server.py` (`1442, 1455, 2294-2295, 2436, 2983, 3055, 3747-3749, 4190`) and `routes_interactive_lessons.py:452` (`1 <= number <= 20`).
  - Compute course totals dynamically from DB (`20` per specialty, `100` total) in `/api/courses`, `/api/health`, `/api/demo/status`, and certificate calculations.
  - Pass authenticated `user_id` into `get_current_day()` in `/api/tasks/<id>`, enforce `is_pro_required` consistently across `/api/tasks/<id>` and `/api/lessons/<id>`, and sync completion between `lesson_progress` and `task_submissions` cleanly.
- **Acceptance Criteria:** Advancing to day 20 unlocks lesson/task 20; `/api/courses` reports `total_lessons: 20`; `/api/health` reports `tasks_total: 100`, `lessons_total: 100`.
- **Required Tests:** API integration test unlocking/submitting lesson 13 and lesson 20 across all 5 specialties.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupEM1Curriculum20AndProLock` & `run_e2e.py --smoke`)*

### `T-M1-07`
- **Phase & Milestone:** Phase 1 + Phase 11 | **M1**
- **Title:** Fix PostgreSQL Transaction Rollbacks, Seeding Parity, SSL & `migrate_to_postgres.py`
- **Description:** Remediate `BE-04`, `BE-05`, `BE-06`, `SEC-10`.
- **Priority:** `P0`
- **Dependencies:** `T-M1-06`
- **Affected Files:** `server.py`, `migrate_to_postgres.py`, `curriculum_seeder.py`, `requirements.txt`
- **Proposed Changes:**
  - Add `conn.rollback()` inside conflict/exception handlers in `award_xp()` (`server.py:1579-1605`) and `daily_quests()` (`5090-5096`) or use `ON CONFLICT DO NOTHING`.
  - Make `init_db()` seed `tasks` (100 rows) and demo `enrollments` in PostgreSQL via dialect-agnostic helpers, skip SQLite initialization when `DATABASE_URL` or `HOSTED=True` is active, and catch PG `IntegrityError` alongside `sqlite3.IntegrityError` in `/api/auth/register`.
  - Fix `pg8000` SSL handling (`sslmode=require` / `PGSSLMODE`) for non-Render cloud PG hosts.
  - Update `migrate_to_postgres.py` DDL to match all 23+ tables and all new columns (`bonus_xp`, `streak_days`, `achievements_json`, `session_version`, `email_verifications.purpose/attempts`, `lesson_progress.current_stage/mission_state_json/mission_xp`, `notification_reads`) plus identifier allowlist validation.
- **Acceptance Criteria:** Schema DDL parity verified across all tables; `award_xp()` idempotency verified under simulated PG unique constraint exception with `conn.rollback()`.
- **Required Tests:** Schema parity inspection script + unit test mocking PG connection/IntegrityError verifying `rollback()` is called (`[!] BLOCKED` for live PG server execution locally unless `DATABASE_URL` provisioned).
- **Status:** `[x] VERIFIED` *(code parity, 22-table DDL parity & mocked PG `IntegrityError` `conn.rollback()` verified via `tests/test_m1_foundation.py::TestGroupFM1PostgresParityAndRollback`; live PG server runtime remains `[!] BLOCKED` locally due to absent PG/Docker)*

### `T-M1-08`
- **Phase & Milestone:** Phase 1 | **M1**
- **Title:** Fix XP Ledger/Leaderboard Double-Counting & Certificate Verification Integrity
- **Description:** Remediate `BE-12`, `BE-13`, `SEC-09`, `Stub #6`, `Stub #14`.
- **Priority:** `P1`
- **Dependencies:** `T-M1-06`, `T-M1-07`
- **Affected Files:** `server.py`, `verify.html`
- **Proposed Changes:**
  - Route all mission XP rewards through `award_xp()` (`xp_transactions` ledger), compute levels exclusively via `get_level_info()`, and fix leaderboard SQL `ORDER BY` so XP is not double-counted.
  - Remove hardcoded `92.4` and unconditional `"VALID"` in `/api/certificate/verify`; require `role == 'student'` and genuine passed modules (`IN_PROGRESS / НЕ ВЫДАН` when `passed_count == 0`).
  - Replace sequential integer/email cert lookup with HMAC-SHA256 signed certificate code (`cert_code`).
  - Fix `#cert-standard-label` null crash in `verify.html:345` and replace static mock QR SVG (`verify.html:278-315`) with deterministic real QR matrix generation encoding the verification URL.
- **Acceptance Criteria:** New student with 0 submissions gets `IN_PROGRESS`, not `92.4`/`VALID`; `/api/certificate/verify?id=1` rejected; `verify.html` renders without `TypeError` and shows valid QR.
- **Required Tests:** Pytest leaderboard sorting + cert verification + Selenium `verify.html` check.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupGM1CertHMACAndLeaderboard` & `test_j02`)*

### `T-M1-09`
- **Phase & Milestone:** Phase 1 + Phase 11 | **M1**
- **Title:** Remediate Stored/DOM XSS Sinks & Hardcoded Secrets
- **Description:** Remediate `FE-CRIT-01`, `SEC-07`, `SEC-08`, `BE-16`.
- **Priority:** `P0`
- **Dependencies:** `T-P0-02`
- **Affected Files:** `lesson_player.html`, `simulator.html`, `js/app-logistics.js`, `js/photoreal-showcase.js`, `docker-compose.yml`, `server.py`
- **Proposed Changes:**
  - Escape all dynamic/user/API strings via `escapeHtml()` or `textContent` DOM nodes in `lesson_player.html` (`submitAiTutor` & all 8 block renderers), `simulator.html:1387,1400`, `js/app-logistics.js`, and `js/photoreal-showcase.js`. Replace `innerHTML +=` with `insertAdjacentHTML`/`appendChild`.
  - Harden `simulator.html` preview iframe sandbox/CSP.
  - Parameterize `docker-compose.yml` secrets via env vars (`${POSTGRES_PASSWORD:?required}`, `${SESSION_SECRET:?required}`), fail closed in `server.py` when `HOSTED=1` and `SESSION_SECRET` is unset, and move personal emails (`d03509181@gmail.com`, `danidanilov333@gmail.com`) out of `server.py` into env vars (`ADMIN_EMAIL`, `MAIL_FROM`).
- **Acceptance Criteria:** `<img src=x onerror="window.__xss=1">` in AI chat, task comment, and profile name renders literally as text with `window.__xss === undefined`; zero hardcoded passwords/personal emails in `server.py`/`docker-compose.yml`.
- **Required Tests:** Selenium XSS injection suite + static grep check for hardcoded secrets.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupHM1AIAndSecretHygiene` & `test_j01`)*

### `T-M1-10`
- **Phase & Milestone:** Phase 1 | **M1**
- **Title:** Fix Frontend Auth/Error Gates (`admin.html`, `teacher.html`, `learn.html`), `lesson_player.html` 3D Slug & `gradebook.html` Cleanup
- **Description:** Remediate `BE-17`, `FE-HIGH-05`, `FE-HIGH-06`, `FE-MED-06`, `Stub #13`.
- **Priority:** `P1`
- **Dependencies:** `T-M1-05`
- **Affected Files:** `admin.html`, `teacher.html`, `learn.html`, `js/academy.js`, `lesson_player.html`, `gradebook.html`, `server.py`
- **Proposed Changes:**
  - Check `/api/auth/session` before loading privileged data on `admin.html` and `teacher.html`; render an explicit access-denied gate for non-admin/non-teacher visitors and replace dummy KPIs (`12`, `10`, `2`, `48`) with `—` until fetched from real API (`stat-submissions` bound to live data).
  - Guard `/api/academy/progress` in `js/academy.js:36-41` so guest visits to `learn.html` do not trigger `401` console errors.
  - Fix `lesson_player.html:1092` to read `currentLesson.course_slug || currentLesson.specialty_slug || 'it'`.
  - Replace 1411 lines of dead HTML in `gradebook.html` with a clean minimal redirect stub (keeping `/gradebook.html` redirect coherent with `teacher.html?tab=matrix`).
- **Acceptance Criteria:** `0` unexpected `401`/`403` console errors on `learn.html` (guest), `admin.html` (guest/student shows gate, zero fake `48`), `teacher.html`; `renderInteractiveWidgetBlock` loads `automechanic` 3D model correctly.
- **Required Tests:** Selenium console error & DOM assertion test across `admin.html`, `teacher.html`, `learn.html`, `lesson_player.html`.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::test_j03` & `run_e2e.py --smoke::test_all_20_html_pages_load_http_200_zero_severe_errors`)*

### `T-M1-11`
- **Phase & Milestone:** Phase 1 | **M1**
- **Title:** Fix Ephemeral Upload Storage Warning & Local Persistent Volume Support
- **Description:** Remediate `BE-17` upload persistence gap.
- **Priority:** `P2`
- **Dependencies:** `T-M1-07`
- **Affected Files:** `server.py`, `render.yaml`, `DEPLOY.md`
- **Proposed Changes:** Support configurable `UPLOAD_DIR` env var (defaulting cleanly locally and pointing to persistent disk/volume in `render.yaml`/`DEPLOY.md`), validate file extensions/sizes strictly on upload, and return explicit metadata.
- **Acceptance Criteria:** Uploads respect `UPLOAD_DIR`, validate mime/size safely, and survive reloads locally.
- **Required Tests:** API file upload + retrieval test in isolated `%TEMP%`.
- **Status:** `[x] VERIFIED` *(verified via `tests/test_m1_foundation.py::TestGroupIM1UploadDirAndTraversal`, `render.yaml`, `DEPLOY.md`)*

---

## M2 — Phase 2 + Phase 10 CSS/JS Bundle (Design System, Responsive UI, Video, i18n, Lazy Splitting)

### `T-M2-01`
- **Phase & Milestone:** Phase 2 + Phase 10 | **M2**
- **Title:** Implement Unified Design System Tokens & Single Compiled CSS Bundle (`css/app.min.css`)
- **Description:** Remediate `FE-HIGH-01`, `FE-HIGH-03`, `PERF-01` using `DESIGN_SYSTEM.md` (`light`/`graphite`/`neon`).
- **Priority:** `P0`
- **Dependencies:** `T-M1-09`
- **Affected Files:** `css/app.min.css` (new), `css/academy.css`, `css/workshop.css`, `css/photoreal-tools.css`, `css/components.css`, `css/style.css`, `css/starter-lesson.css`, `js/theme.js`, all 20 `*.html`
- **Proposed Changes:**
  - Define unified CSS custom properties (`--bg`, `--surface`, `--surface-elevated`, `--ink`, `--muted`, `--accent`, `--border`, `--glow`) for `data-theme="light|graphite|neon"`.
  - Remove hardcoded light `!important` Tailwind overrides from `css/workshop.css:381-476` and conflicting body rules.
  - Pre-compile all used Tailwind utility classes (including `dark-*`, `neo-*`, and arbitrary classes used in HTML/JS) into `css/app.min.css` and remove `<script src="https://cdn.tailwindcss.com"></script>` and `tailwind.min.css` duplication across all 20 HTML pages.
- **Acceptance Criteria:** `0` references to `cdn.tailwindcss.com` across all `*.html`; all 3 themes (`light`, `graphite`, `neon`) render with WCAG AA contrast (`>= 4.5:1`) on `index`, `lesson_player`, `tasks`, `simulator`, `teacher`, `admin`, `profile`.
- **Required Tests:** Static grep (`cdn.tailwindcss.com` count == 0), offline CSS check (block external requests), Chrome theme-switching contrast audit.
- **Status:** `[x] VERIFIED`

### `T-M2-02`
- **Phase & Milestone:** Phase 2 | **M2**
- **Title:** Responsive Mobile (`390×844`) & Desktop (`1440×900`) Layout & Header Redesign
- **Description:** Remediate `FE-HIGH-02`, `FE-LOW-02`, `FE-MED-02` across all active HTML pages.
- **Priority:** `P0`
- **Dependencies:** `T-M2-01`
- **Affected Files:** All active `*.html`, `js/theme.js`, `css/app.min.css`
- **Proposed Changes:**
  - Implement a unified responsive topbar/navigation drawer for `< 768px` (hamburger toggle on mobile, single-row header `<= 72px` height).
  - Mount `.theme-switch` inside a dedicated `#theme-switch-slot` inside the navbar flex container (and inside mobile drawer on small viewports) so it never appends raw to `<header>` or overflows right edge (`profile.html` 499px bug).
  - Fix `mission.html` mobile header height (`275px` -> `<= 72px`) and horizontally scrollable `#stage-stepper`; wrap `teacher.html` tables in `overflow-x-auto`; clip fixed ambient glow orbs (`simulator.html`, `student-workspace.html`) inside `overflow-x-hidden` containers.
  - Move `simulator.html:116-117` divs inside `<body>` and change `verify.html:148` duplicate `<h1>` to `<h2>`.
- **Acceptance Criteria:** At `390×844` across ALL active HTML pages: `document.documentElement.scrollWidth <= 390`, `header.height <= 72` (excluding expanded drawer), `.theme-switch` visible inside viewport, `document.querySelectorAll('h1').length === 1`.
- **Required Tests:** Automated CDP `390×844` and `1440×900` layout geometry audit across every HTML page.
- **Status:** `[x] VERIFIED`

### `T-M2-03`
- **Phase & Milestone:** Phase 2 | **M2**
- **Title:** Full Premium Futuristic UI Redesign & Copy Alignment (100 Modules / 20 Per Specialty)
- **Description:** Remediate `FE-MED-03` and complete visual redesign of Home, Auth, Student/Teacher/Admin portals, Catalog, Lessons, Tasks, Exams, Profile, Reviews, Features, Pricing, About, Verify, Tools, Career.
- **Priority:** `P1`
- **Dependencies:** `T-M2-02`
- **Affected Files:** All active `*.html`, `css/app.min.css`
- **Proposed Changes:**
  - Unify card surfaces, typography (`Inter`/`Space Grotesk`/`JetBrains Mono` local `.woff2`), spacing, buttons, badges, and interactive feedback across all pages per `DESIGN_SYSTEM.md`.
  - Update all stale marketing copy (`"50 модулей"`, `"10 уроков"`, `"Уроки №4–10"`) in `features.html`, `pricing.html`, `about.html`, `simulator.html` to reflect 100 modules (20 per specialty) and consistent Pro/state-order access messaging.
- **Acceptance Criteria:** Zero stale `50 модул` / `10 уроков` copy; all 20 pages share cohesive visual hierarchy in `light`, `graphite`, and `neon` themes.
- **Required Tests:** Text grep check + desktop/mobile screenshot visual verification.
- **Status:** `[x] VERIFIED`

### `T-M2-04`
- **Phase & Milestone:** Phase 2 | **M2**
- **Title:** Integrate Lesson Video Player (`assets/lesson-intros/*` + VTT + Posters) & Clean Dead `openZoomModal`
- **Description:** Remediate `FE-MED-01`, `Stub #16`.
- **Priority:** `P1`
- **Dependencies:** `T-M2-02`
- **Affected Files:** `lesson_player.html`, `simulator.html`, `js/lesson-media.js`, `js/app-logistics.js`
- **Proposed Changes:**
  - Add a clean "Видео-обзор урока" tab/toggle inside Block 3 (`b3_theory`) in `lesson_player.html` (and in `simulator.html` theory view), keeping `TopicGameEngine` as the default active mode so existing flows remain intact.
  - Bind `<video controls preload="metadata" poster="...">` + `<track kind="subtitles" ... .vtt>` dynamically to `lesson-media.js` / `catLesson.video_url` (`assets/lesson-intros/<spec>-<n>.mp4`), surfacing clear error handling if media fails.
  - Remove or implement placeholder `openZoomModal` (`app-logistics.js:2386-2400`) cleanly (remove dead button/stub if unused).
- **Acceptance Criteria:** Clicking "Видео-обзор урока" loads valid `.mp4`, poster `.jpg`, and `.vtt` track (`video.readyState >= 2`, `video.error === null`); `TopicGameEngine` default remains functional.
- **Required Tests:** Selenium video playback readiness test across multiple specialties (`it`, `automechanic`, `hvac`).
- **Status:** `[x] VERIFIED`

### `T-M2-05`
- **Phase & Milestone:** Phase 2 | **M2**
- **Title:** Integrate `js/i18n.js` (`ru.json` / `kk.json`) Across All Active HTML Pages
- **Description:** Remediate `I18N-01`.
- **Priority:** `P1`
- **Dependencies:** `T-M2-02`
- **Affected Files:** `js/i18n.js`, `locales/ru.json`, `locales/kk.json`, all active `*.html`
- **Proposed Changes:**
  - Include `js/i18n.js` and language switcher control (`RU`/`KZ`) in the unified navbar across all active HTML pages.
  - Add `data-i18n` attributes for shared navigation, headers, auth, portal tabs, and status messages; extend `ru.json` & `kk.json` symmetrically (`check_locales.py` 0 mismatches).
- **Acceptance Criteria:** Switching `RU` <-> `KZ` persists across reloads and updates UI copy on all primary routes (`index`, `auth`, `learn`, `tasks`, `lesson_player`, `student`, `teacher`, `admin`, `profile`, `simulator`, `tools`, `verify`). `scripts/check_locales.py` passes with 0 missing keys.
- **Required Tests:** `python scripts/check_locales.py` + Selenium locale toggle test across pages.
- **Status:** `[x] VERIFIED`

### `T-M2-06`
- **Phase & Milestone:** Phase 2 + Phase 10 | **M2**
- **Title:** Split Monolithic JS Catalog (`courses-catalog.js` & `topic-games-60.js`) into Lazy Chunks + Cache Headers
- **Description:** Remediate `PERF-02`, `PERF-03`.
- **Priority:** `P1`
- **Dependencies:** `T-M2-03`
- **Affected Files:** `js/courses-catalog.js`, `js/topic-games-60.js`, `assets/data/catalog/*.json` (new), `server.py`, `*.html`
- **Proposed Changes:**
  - Generate a lightweight index (`assets/data/catalog/index.json` ~10–15 KB) containing course metadata and lesson titles/slugs, plus per-course lazy JSON chunks (`it.json`, `graphic_design.json`, `autoelectric.json`, `hvac.json`, `automechanic.json`) and per-course topic game chunks.
  - Provide async loader (`EduCatalog.loadCourse(slug)`) used by `lesson_player.html`, `tasks.html`, `simulator.html`, `learn.html`, while non-player pages (`index.html`, `auth.html`, `about.html`, `pricing.html`, `verify.html`) avoid loading 1.49 MB of unused lesson/game data.
  - Add `Cache-Control` / `ETag` static asset headers in `server.py`.
- **Acceptance Criteria:** Non-player pages reduce initial JS download by `>= 70%`; `lesson_player.html` and `simulator.html` load all 100 lessons/games seamlessly via lazy `fetch()`.
- **Required Tests:** Network transfer byte audit in Selenium/Chrome CDP + lesson switching test across all 5 courses.
- **Status:** `[x] VERIFIED`

---

## M3 — Phases 3 + 10 3D (3D Infrastructure, GLB Optimization, Profiles, Disposal & Reference Automechanic Workshop)

### `T-M3-01`
- **Phase & Milestone:** Phase 3 + Phase 10 | **M3**
- **Title:** Deduplicate `hvac-chiller.glb` vs `mech-cylinder.glb` & Optimize/Compress GLB Models
- **Description:** Remediate `3D-01`, `3D-02`, `PERF-03` per `3D_ASSET_MANIFEST.md`.
- **Priority:** `P0`
- **Dependencies:** `T-P0-02`
- **Affected Files:** `assets/models/*.glb`, `3D_ASSET_MANIFEST.md`
- **Proposed Changes:**
  - Replace `hvac-chiller.glb` (or `mech-cylinder.glb`) with distinct, domain-accurate named-node GLB geometry (chiller compressor/evaporator/condenser assembly vs engine cylinder block/head/pistons/bolts) so all 25 GLBs have unique SHA-256 hashes.
  - Optimize oversized GLBs (`mech-turbo.glb` 11.78 MB, `mech-suspension.glb` 7.89 MB, `mech-transmission.glb` 4.96 MB, `autoel-charging.glb` 3.56 MB) targeting `<= 2 MB` per model (mesh decimation/quantization + resized textures; if Draco is used, bundle local `DRACOLoader` + WASM/JS decoder in `js/vendor/` so offline mode works!).
  - Update `3D_ASSET_MANIFEST.md` with exact sizes, hashes, and named mesh nodes.
- **Acceptance Criteria:** 25 distinct SHA-256 hashes across `assets/models/*.glb`; every GLB loads cleanly in Three.js r128 with meaningful named mesh groups; total `assets/models/` weight significantly reduced.
- **Required Tests:** PowerShell `Get-FileHash` uniqueness check + browser load check for all 25 GLBs.
- **Status:** `[x] VERIFIED`

### `T-M3-02`
- **Phase & Milestone:** Phase 3 | **M3**
- **Title:** Refactor 3D Engine Infrastructure (`OrbitControls`, Semantic Raycasting, Shadows, HDRI Fallback)
- **Description:** Remediate `3D-03`, `3D-06`, `FE-MED-05`.
- **Priority:** `P0`
- **Dependencies:** `T-M3-01`
- **Affected Files:** `js/eduspace-3d-engine.js`, `js/workshop-models.js`, `js/photoreal-showcase.js`, `index.html`
- **Proposed Changes:**
  - Replace raw pointer rotation in `workshop-models.js` and `eduspace-3d-engine.js` with `THREE.OrbitControls` (damping, zoom/pan limits).
  - Replace blind `Math.floor(mIdx / groupSize)` slicing (`workshop-models.js:1047`) with semantic `Raycaster` picking using named mesh nodes + highlight emissive feedback + part tooltip/metadata.
  - Enable `PCFSoftShadowMap` shadows (scaled by GraphicsProfile) and feature-detect `WEBGL_color_buffer_half_float` / `HalfFloatType` in `PhotorealShowcase` with `UnsignedByteType` fallback.
  - Remove duplicate `js/vendor/GLTFLoader.js` include from `index.html:16`.
- **Acceptance Criteria:** Smooth orbit/zoom/pan, accurate click/hover part selection via `Raycaster`, soft shadows enabled on `BALANCED`/`ULTRA`, 0 duplicate loader scripts on `index.html`.
- **Required Tests:** Selenium WebGL canvas + `Raycaster` part-selection test across showcase & workshop scenes.
- **Status:** `[x] VERIFIED`

### `T-M3-03`
- **Phase & Milestone:** Phase 3 + Phase 10 | **M3**
- **Title:** Implement `LOW` / `BALANCED` / `ULTRA` Graphics Profiles & Centralized GPU/Listener Disposal
- **Description:** Remediate `3D-04`, `3D-05`.
- **Priority:** `P0`
- **Dependencies:** `T-M3-02`
- **Affected Files:** `js/eduspace-3d-engine.js`, `js/workshop-models.js`, `js/photoreal-showcase.js`, `js/starter-lesson.js`
- **Proposed Changes:**
  - Implement shared `window.EduGraphicsProfile` (`LOW`: DPR 1, shadows off, bloom off; `BALANCED`: DPR <= 1.5, 1024px shadows, bloom off; `ULTRA`: DPR <= 2, 2048px shadows, HDRI PMREM + Bloom) with adaptive FPS/hardware degradation, UI toggle, and `localStorage` persistence.
  - Implement centralized `disposeThreeScene(ctx)` traversing all scene nodes to dispose `geometry`, `material` (single & array), all material texture maps (`map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `emissiveMap`), `envMap`/`PMREMGenerator` targets, `EffectComposer`, `OrbitControls`, `ResizeObserver`, `requestAnimationFrame`, and window/DOM listeners.
  - Implement lazy `IntersectionObserver` mounting for offscreen 3D canvases.
- **Acceptance Criteria:** Switching `LOW`/`BALANCED`/`ULTRA` updates `renderer.getPixelRatio()`, `shadowMap.enabled`, and Bloom pass immediately; 10 mount/unmount cycles show zero monotonic growth in `renderer.info.memory.geometries` and `textures`.
- **Required Tests:** Browser console telemetry test toggling all 3 profiles and running 10 mount/unmount cycles checking `renderer.info.memory`.
- **Status:** `[x] VERIFIED`

### `T-M3-04`
- **Phase & Milestone:** Phase 3 | **M3**
- **Title:** Build Reference 3D Automechanic Workshop (Disassembly/Assembly DAG, Tools, Animations & Persistence)
- **Description:** Remediate `3D-03`, `3D-07` by creating the authoritative Reference 3D Automechanic Workshop and backend state persistence.
- **Priority:** `P0`
- **Dependencies:** `T-M3-02`, `T-M3-03`, `T-M1-01`
- **Affected Files:** `js/workshop-models.js`, `js/eduspace-3d-engine.js`, `lesson_player.html`, `simulator.html`, `server.py`
- **Proposed Changes:**
  - Build `window.EduWorkshop3D` Automechanic interactive bay (cylinder head / valvetrain / turbo / brake-suspension assembly with named parts).
  - Implement tool palette (`socket_set`, `torque_wrench`, `feeler_gauge`, `inspect_lamp`) required for specific operations, smooth tween animations for bolt unscrewing / part lift-off / re-seating, and dependency DAG checking (e.g., cannot lift cylinder head before unbolting valve cover & head bolts in spiral sequence).
  - Add `/api/workshop/state`, `/api/workshop/action`, `/api/workshop/reset` (`@login_required()`) in `server.py` persisting `disassembled_parts`, `step_history`, and `active_tool` in DB; move `starter-lesson.js` target validation to server/shared rubric.
- **Acceptance Criteria:** Disassembling parts in invalid order shows diagnostic feedback; valid order detaches animated parts with selected tool; state survives page reload via backend API.
- **Required Tests:** Selenium E2E test executing invalid + valid disassembly/assembly actions, reloading page, and asserting persisted 3D state.
- **Status:** `[x] VERIFIED`

---

## M4 — Phases 4 + 7 (Real Physics Simulators, 4 Student Tools & Real 3D/Lesson-Aware AI Mentor)

### `T-M4-01`
- **Phase & Milestone:** Phase 4 | **M4**
- **Title:** Implement Deterministic Domain Physics Engines Across All 5 Specializations (`js/physics/`)
- **Description:** Remediate `SIM-01`, `Stub #10`, `Stub #11` by replacing fake mocks/heuristics with real verifiable mathematical/physics kernels.
- **Priority:** `P0`
- **Dependencies:** `T-M1-06`
- **Affected Files:** `js/physics/` (new modular files or `js/interactive-simulators.js`), `simulator.html`
- **Proposed Changes:**
  - **Graphic Design:** Real WCAG 2.1 relative luminance (`L = 0.2126*R + 0.7152*G + 0.0722*B` with sRGB linearization) + contrast ratio `(L1+0.05)/(L2+0.05)`, color-vision deficiency matrix simulation, and grid/baseline geometry metrics (removing static `'12.5 : 1 (AAA)'`).
  - **Autoelectric:** Nodal DC circuit solver (`G * V = I` / Ohm & Kirchhoff loop solver) supporting battery voltage, alternator ripple, wire/contact resistance, open/short/high-resistance fault injection, and real multimeter probe drop calculation (removing 8-node static lookup & `Math.random()`).
  - **HVAC:** Multi-refrigerant P-T thermodynamic spline/table solver (`R134a`, `R410A`, `R32`, `R600a`) computing evaporator/condenser saturation temps, superheat, subcooling, mass-flow/COP estimate, and pressure fault diagnostics (removing linear `-26 + p*10.5` and `Math.random()`).
  - **Automechanic:** Spiral multi-stage torque-angle solver (e.g., 10-bolt cylinder head center-out spiral pattern across Stage 1 `30 Nm`, Stage 2 `60 Nm`, Stage 3 `+90°` angle) with bolt yield/warpage penalty on wrong sequence/over-torque.
  - **Web-dev (`it`):** Deterministic CSS Flexbox/Grid/Box-Model layout AST & rule evaluator calculating real bounding box constraints against target specs.
- **Acceptance Criteria:** Zero `Math.random()` sensor mocks in `interactive-simulators.js` / `simulator.html`; every physics function returns exact deterministic engineering outputs matching reference tables.
- **Required Tests:** Automated unit test suite verifying outputs against WCAG 2.1, Ohm/Kirchhoff circuit equations, NIST/ASHRAE P-T tables, and spiral torque sequences.
- **Status:** `[x] VERIFIED`

### `T-M4-02`
- **Phase & Milestone:** Phase 4 | **M4**
- **Title:** Upgrade Interactive Simulators & Lesson Labs (`lesson-interactives.js`, `simulator.html`)
- **Description:** Remediate `SIM-02`, `Stub #17` by binding simulator UIs and 7 lesson lab modes to `EduPhysics` and stateful fault diagnostics.
- **Priority:** `P1`
- **Dependencies:** `T-M4-01`, `T-M3-04`
- **Affected Files:** `js/interactive-simulators.js`, `js/lesson-interactives.js`, `simulator.html`, `tools.html`, `js/academy.js`
- **Proposed Changes:**
  - Wire all 5 interactive simulator benches in `simulator.html` and `tools.html` to `window.EduPhysics`.
  - Upgrade `lesson-interactives.js` (`hvac_diag`, `mech_bench`, `elec_circuit`, etc.) to stateful multi-step fault diagnosis rather than single-click fix buttons.
  - Remove hardcoded client-side quiz answer checks (`academy.js:325`) in favor of server-validated evaluation (`POST /api/tasks/submit` / `/api/lessons/<id>/check`).
- **Acceptance Criteria:** Changing inputs in any of the 5 simulators updates real physics telemetry dynamically; fault scenarios require actual diagnostic steps to pass.
- **Required Tests:** Selenium interaction test across all 5 specialty tabs in `simulator.html` verifying real computed readings and failure/pass states.
- **Status:** `[x] VERIFIED`

### `T-M4-03`
- **Phase & Milestone:** Phase 4 | **M4**
- **Title:** Complete & Persist All 4 Student Tools (`js/student-tools.js` + Backend API)
- **Description:** Remediate `TLS-01`.
- **Priority:** `P1`
- **Dependencies:** `T-M1-01`
- **Affected Files:** `js/student-tools.js`, `server.py`, `index.html`, `student.html`, `student-workspace.html`
- **Proposed Changes:**
  - Ensure all **4** student tools are complete and active: (1) Global Course/Lesson Search, (2) GPA & Progress Target Calculator, (3) Personal Task Hub, (4) Study Focus Timer & Lesson Notes.
  - Add `@login_required()` `/api/tools/state` (`GET`/`POST`) in `server.py` (stored in a `student_tools_state` table) so logged-in students persist Task Hub items, GPA target, and Notes across reloads and devices (with clear guest prompt when logged out).
- **Acceptance Criteria:** All 4 tools operate cleanly in UI and persist changes across full page reload via backend API when authenticated.
- **Required Tests:** API persistence test + Selenium test creating a task & note in Student Tools, reloading, and confirming persistence.
- **Status:** `[x] VERIFIED`

### `T-M4-04`
- **Phase & Milestone:** Phase 7 | **M4**
- **Title:** Implement Real Lesson & 3D-Aware LLM AI Mentor Backend (`eduspace_ai.py` + `/api/ai/*`)
- **Description:** Remediate `BE-03`, `AI-01`, `AI-02`, `Stub #1`, `Stub #2`, `Stub #3`.
- **Priority:** `P0`
- **Dependencies:** `T-M1-01`, `T-M1-04`, `T-M3-04`
- **Affected Files:** `server.py`, `eduspace_ai.py`, `routes_interactive_lessons.py`
- **Proposed Changes:**
  - Require `@login_required()` on `/api/ai/chat`, `/api/ai/tutor`, `/api/ai/review_submission`, `/api/ai/generate_lesson`.
  - Delete `pass` stub and `CURRICULUM_KNOWLEDGE` fake replies in `server.py:4216-4291`; delete `heuristic_offline` fallback and `len > 20` fake grading in `eduspace_ai.py:126-369`.
  - Send Gemini API key via `x-goog-api-key` header (not `?key=` URL query); support OpenAI/Gemini/OpenRouter via env var OR request-level `user_api_key` (never logged/stored in plaintext).
  - Build rich structured system+user prompt injecting current course (`graphic_design`, etc.), lesson/task objective, active 3D workshop `selected_part` / `disassembled_parts`, simulator telemetry, and recent error log.
  - When no valid key is configured, return HTTP `503` `{ ok: false, status: "BLOCKED", code: "AI_PROVIDER_UNCONFIGURED", message: "..." }`.
- **Acceptance Criteria:** Unauthenticated -> `401`; no API key -> `503 BLOCKED` with zero canned fallback; mocked/live LLM HTTP transport verifies full lesson + 3D telemetry payload reaches provider and returns live reply.
- **Required Tests:** Pytest unit/mock tests (auth check, `503 BLOCKED` check, HTTP payload inspection for Gemini header & 3D context). *(Live external LLM API response `[!] BLOCKED` locally unless key provided).*
- **Status:** `[x] VERIFIED`

### `T-M4-05`
- **Phase & Milestone:** Phase 7 | **M4**
- **Title:** Wire AI Mentor Frontend (`lesson_player.html` & `simulator.html`) to Real Context API + Key Settings UI
- **Description:** Remediate `AI-03`, `Stub #4` and allow authenticated users to optionally supply an LLM API key in client session settings if env key is unset.
- **Priority:** `P0`
- **Dependencies:** `T-M4-04`
- **Affected Files:** `lesson_player.html`, `simulator.html`, `profile.html`
- **Proposed Changes:**
  - Remove `setTimeout` hardcoded AI replies in `simulator.html:1448-1507` and hardcoded fallback reply in `lesson_player.html:1880`.
  - Wire both UIs to `POST /api/ai/chat` passing `{ course_slug, lesson_id, context: { selected_part, disassembled_parts, simulator_state, recent_errors }, user_api_key? }`.
  - Add optional per-session user LLM key input modal/settings panel (stored in `sessionStorage` only if user enters one) and render an honest `BLOCKED / Требуется API-ключ LLM` banner when backend returns `503`.
- **Acceptance Criteria:** Submitting AI prompt calls `/api/ai/chat` with live lesson+3D context; without key, UI displays explicit `BLOCKED` state (never fake pre-recorded answers).
- **Required Tests:** Selenium network/DOM test verifying `/api/ai/chat` request payload and explicit `BLOCKED` banner when unconfigured.
- **Status:** `[x] VERIFIED`

---

## M5 — Phases 5 + 6 + 8 + 9 (Skill Map DAG, 5-Track Practical Missions, Automatic Portfolio & Practical 3D Exams)

### `T-M5-01`
- **Phase & Milestone:** Phase 5 | **M5**
- **Title:** Implement Interactive Skill Map DAG (Branches, Prerequisites, Levels, Achievements)
- **Description:** Remediate `SKM-01` by upgrading flat progress bars to a true prerequisite dependency graph across all 20 competencies per specialty.
- **Priority:** `P1`
- **Dependencies:** `T-M1-06`, `T-M1-08`, `T-M2-03`
- **Affected Files:** `server.py`, `profile.html`, `student.html`, `js/skill-map.js` (new)
- **Proposed Changes:**
  - Add `GET /api/skills/map?specialty=<slug>` returning 20 competency nodes grouped into 3–4 skill branches with `prerequisites[]`, `unlocked`, `completed`, `score`, `xp`, `mission_id`, and achievement badges.
  - Enforce prerequisite lock progression (e.g., core diagnostics unlock advanced missions) and unlock linked missions upon node completion.
  - Render interactive pan/zoom SVG/HTML node graph (`js/skill-map.js`) with clear locked/available/mastered states and mobile responsiveness.
- **Acceptance Criteria:** Completing prerequisite lessons unlocks downstream nodes and mission triggers; state persists in DB across reloads.
- **Required Tests:** API prerequisite-lock test + Selenium Skill Map rendering/unlock test.
- **Status:** `[x] VERIFIED`

### `T-M5-02`
- **Phase & Milestone:** Phase 6 | **M5**
- **Title:** Implement Practical Missions Across All 5 Specializations
- **Description:** Remediate `SKM-01` (`it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic` practical multi-stage missions).
- **Priority:** `P0`
- **Dependencies:** `T-M1-01`, `T-M4-02`, `T-M5-01`
- **Affected Files:** `mission.html`, `server.py`, `js/missions/` (new)
- **Proposed Changes:**
  - Expand `mission.html` and `/api/mission/*` from single `graphic_design` Task 1 to authentic multi-stage missions for all 5 specializations:
    1. `it`: Responsive layout + API debug + accessibility repair mission.
    2. `graphic_design`: Color Architect + WCAG + Grid composition mission.
    3. `autoelectric`: Charging/CAN-bus fault isolation using multimeter physics solver.
    4. `hvac`: Refrigerant charge & superheat/subcooling recovery mission.
    5. `automechanic`: Engine top-end inspection & spiral torque assembly mission (linked with 3D workshop).
  - Validate stage submissions server-side and award XP strictly via `award_xp()`.
- **Acceptance Criteria:** Each of the 5 specialties has a selectable, interactive multi-stage mission that validates stages on the backend, saves progress, and awards ledger XP.
- **Required Tests:** API + Selenium mission completion flow test for all 5 specializations.
- **Status:** `[x] VERIFIED`

### `T-M5-03`
- **Phase & Milestone:** Phase 8 | **M5**
- **Title:** Implement Automatic Student Portfolio (Privacy Settings, Consent Public URL, Real PDF Export)
- **Description:** Remediate `PRT-01`, `TLS-01`, `Stub #12`, `Stub #15`.
- **Priority:** `P1`
- **Dependencies:** `T-M1-08`, `T-M5-02`
- **Affected Files:** `server.py`, `career.html`, `profile.html`, `js/portfolio.js` (new), `pricing.html`
- **Proposed Changes:**
  - Add `portfolio_settings` table (`user_id`, `is_public`, `show_grades`, `show_certificates`, `public_slug`, `consent_granted`, `consent_at`).
  - Add `/api/portfolio/settings` (`GET`/`PUT`), `/api/portfolio/me` (real aggregation of passed tasks, missions, exams, verified skills, certificates), `/api/portfolio/public/<slug>` (enforces `is_public && consent_granted`, masks grades if `show_grades == false`), and `/api/portfolio/export.pdf` generating a valid binary PDF statement (using pure Python or `reportlab`/minimal valid PDF writer — no `window.print()` fake).
  - Replace hardcoded `RESUME_DATA` and hardcoded WhatsApp phone in `career.html` with live DB portfolio data; clearly mark `pricing.html` checkout modal as Demo/Sandbox billing (no fake Kaspi processing claims).
- **Acceptance Criteria:** Private portfolio returns `403`/`404` publicly; toggling public consent enables `/api/portfolio/public/<slug>`; `/api/portfolio/export.pdf` returns `%PDF-1.` binary containing student name & verified grades.
- **Required Tests:** API privacy/consent test + PDF header/content verification + Selenium `career.html`/`profile.html` test.
- **Status:** `[x] VERIFIED`

### `T-M5-04`
- **Phase & Milestone:** Phase 9 | **M5**
- **Title:** Build Practical 3D & Specialty Exam Engine (Anti-Tamper, Error Log & Server Rubric Grading)
- **Description:** Remediate `EXM-01`, `Stub #5`, `Stub #18`.
- **Priority:** `P0`
- **Dependencies:** `T-M3-04`, `T-M4-02`, `T-M5-02`
- **Affected Files:** `server.py`, `simulator.html`, `lesson_player.html`, `js/exam-engine.js` (new)
- **Proposed Changes:**
  - Add `exam_attempts` and `exam_events` tables in DB.
  - Implement `/api/exams/start` (issues server-signed HMAC `attempt_nonce`, time limit, scenario parameters), `/api/exams/event` (appends telemetry/3D actions to immutable log), and `/api/exams/submit` (validates nonce & timing, grades deterministically on server against scenario rubric, logs every mistake into `error_log_json`).
  - Remove client-trusted `score` / `autotest_passed` acceptance in `/api/tasks/submit` (`Stub #5`); move JS code autotest evaluation (`Stub #18`) into an isolated WebWorker sandbox + server structural validation so arbitrary `new Function` doesn't run in main window scope.
  - Ship **Reference 3D Practical Exam for Automechanic** (interactive fault diagnosis + disassembly/torque sequence in 3D workshop) + practical scenario exams for the other 4 specialties.
- **Acceptance Criteria:** Submitting forged client `score: 100` or invalid `attempt_nonce` is rejected/ignored by server; intentional mistakes during 3D Automechanic exam appear accurately in persisted `error_log_json` and lower final score.
- **Required Tests:** Pytest anti-tampering tests (forged score, replayed nonce, expired attempt) + Selenium 3D Automechanic exam pass/fail run.
- **Status:** `[x] VERIFIED`

### `T-M5-05`
- **Phase & Milestone:** Phase 9 | **M5**
- **Title:** Implement Teacher Practical Exam Review Dashboard & Grade Override Audit
- **Description:** Complete teacher control over practical 3D exam attempts, inspection of error logs, and audited review/approval.
- **Priority:** `P1`
- **Dependencies:** `T-M5-04`, `T-M1-05`
- **Affected Files:** `server.py`, `teacher.html`
- **Proposed Changes:**
  - Add `GET /api/teacher/exams/review` and `POST /api/teacher/exams/review/<attempt_id>` (`@require_roles('teacher', 'admin')` with assigned-group isolation).
  - Display attempt timeline, step-by-step `error_log_json`, auto-score, and teacher review comment/approval controls in `teacher.html`, writing audit records to `audit_logs`.
- **Acceptance Criteria:** Teacher can inspect student exam error logs for their assigned group (blocked `403` for other groups) and record verified review status.
- **Required Tests:** API RBAC + Selenium teacher exam review workflow test.
- **Status:** `[x] VERIFIED`

---

## M6 — Phases 10 Perf Audit + 11 Security Audit (Optimization, Leak Sweep & Regression Verification)

### `T-M6-01`
- **Phase & Milestone:** Phase 10 | **M6**
- **Title:** Performance Profiling, Asset Weight Verification & WebGL Memory Leak Sweep
- **Description:** Verify bundle size reductions, `cdn.tailwindcss.com` elimination, lazy catalog loading, GLB asset sizes, and WebGL GPU disposal across 10 mount/unmount cycles.
- **Priority:** `P1`
- **Dependencies:** `T-M2-06`, `T-M3-03`, `T-M5-05`
- **Affected Files:** `js/eduspace-3d-engine.js`, `js/workshop-models.js`, `js/photoreal-showcase.js`, `css/app.min.css`, `server.py`
- **Proposed Changes:** Measure load metrics, inspect `renderer.info.memory` across 10 mount/unmount cycles on all 3D views (`index.html`, `lesson_player.html`, `simulator.html`, `tools.html`), and fix any residual leak or slow synchronous script.
- **Acceptance Criteria:** Zero monotonic `geometries`/`textures` growth over 10 cycles; non-player page initial JS bytes reduced `>= 70%`; `0` CDN Tailwind loads; `LOW`/`BALANCED`/`ULTRA` profiles verified.
- **Required Tests:** Automated CDP performance & `renderer.info.memory` sweep script.
- **Status:** `[x] VERIFIED`

### `T-M6-02`
- **Phase & Milestone:** Phase 11 | **M6**
- **Title:** Full Security Regression Audit & Integration Bugfixes
- **Description:** Re-audit and verify every `SEC-01..SEC-10` control (Auth, RBAC, IDOR, SQLi, XSS, CSRF, rate limit, secrets, PII, PostgreSQL parity, error recovery) and fix any integration regressions discovered across M1–M5.
- **Priority:** `P0`
- **Dependencies:** `T-M5-05`, `T-M6-01`
- **Affected Files:** `server.py`, `routes_interactive_lessons.py`, `*.html`, `js/*.js`
- **Proposed Changes:** Patch any regression uncovered by full security scan and integration sweep.
- **Acceptance Criteria:** Zero CRITICAL/HIGH open security vulnerabilities in local codebase; all security tests pass.
- **Required Tests:** Full security pytest suite + XSS/CSRF/IDOR browser/API probes.
- **Status:** `[x] VERIFIED`

---

## E2E — Dual Track Opaque-Box Testing Track

### `T-E2E-01`
- **Phase & Milestone:** E2E Track
- **Title:** Provision Isolated E2E Test Harness (`TEST_INFRA.md` + `TEST_READY.md`)
- **Description:** Build clean isolated test harness using Python 3.12 + Selenium (Chrome/Edge) + ephemeral temp copy of `database.db` on dynamic free port (Playwright/Node/PG unavailable locally).
- **Priority:** `P0`
- **Dependencies:** `T-M1-02`
- **Affected Files:** `tests/e2e/` (new), `TEST_INFRA.md`, `TEST_READY.md`
- **Proposed Changes:** Create isolated server fixture, DB clone/teardown fixture, browser desktop (`1440×900`) & mobile (`390×844`) driver helpers, and console/network error assertions.
- **Acceptance Criteria:** Running harness never mutates repo `database.db`, cleans up child processes, and confirms readiness (`TEST_READY.md`).
- **Required Tests:** Harness smoke test starting/stopping temp Flask + Chrome cleanly.
- **Status:** `[x] VERIFIED`

### `T-E2E-02`
- **Phase & Milestone:** E2E Track
- **Title:** Implement Tier 1–2 Opaque-Box E2E Tests (Smoke, Auth, Navigation, Curriculum & Video)
- **Description:** Cover Tier 1 (all 20 HTML routes HTTP 200, 0 severe console errors, mobile/desktop layout) and Tier 2 (registration without email OTP, role login, 20-module unlock, video playback, i18n, theme switch, 4 student tools persistence).
- **Priority:** `P0`
- **Dependencies:** `T-E2E-01`, `T-M2-05`, `T-M4-03`
- **Affected Files:** `tests/e2e/test_tier1_smoke.py`, `tests/e2e/test_tier2_core_flows.py`
- **Proposed Changes:** Implement opaque-box Selenium assertions driven strictly by `ORIGINAL_REQUEST.md` acceptance criteria.
- **Acceptance Criteria:** Tier 1 & Tier 2 scripts execute deterministically against fresh temp DB.
- **Required Tests:** `pytest tests/e2e/test_tier1_smoke.py tests/e2e/test_tier2_core_flows.py`.
- **Status:** `[x] VERIFIED`

### `T-E2E-03`
- **Phase & Milestone:** E2E Track
- **Title:** Implement Tier 3 Opaque-Box E2E Tests (3D Workshop, 5 Simulators, AI Blocked/Context, Missions, Skill Map, Portfolio, 3D Exams)
- **Description:** Cover interactive 3D Automechanic disassembly/assembly & persistence, `LOW`/`BALANCED`/`ULTRA` switching, all 5 physics simulators, AI Mentor `BLOCKED` status & payload check, Skill Map unlocks, 5-track missions, Portfolio privacy/PDF, and Practical 3D Exam + Teacher Review.
- **Priority:** `P0`
- **Dependencies:** `T-E2E-02`, `T-M5-05`
- **Affected Files:** `tests/e2e/test_tier3_interactive.py`
- **Proposed Changes:** Write full end-to-end Selenium tests verifying real UI actions and DB persistence across reloads.
- **Acceptance Criteria:** All interactive domain flows verified end-to-end in real Chrome.
- **Required Tests:** `pytest tests/e2e/test_tier3_interactive.py`.
- **Status:** `[x] VERIFIED`

### `T-E2E-04`
- **Phase & Milestone:** E2E Track
- **Title:** Implement Tier 4 Opaque-Box E2E Tests (Responsive Mobile `390×844` & Error Recovery)
- **Description:** Verify zero horizontal overflow (`scrollWidth <= 390`), header height (`<= 72`), visible theme switcher, offline/401/403 graceful UI recovery across all pages.
- **Priority:** `P1`
- **Dependencies:** `T-E2E-02`
- **Affected Files:** `tests/e2e/test_tier4_responsive_recovery.py`
- **Proposed Changes:** Automated mobile CDP viewport sweep and error-state UI verification.
- **Acceptance Criteria:** All 20 pages pass mobile viewport & error recovery checks.
- **Required Tests:** `pytest tests/e2e/test_tier4_responsive_recovery.py`.
- **Status:** `[x] VERIFIED`

---

## M7 — Final Milestone (100% E2E Tiers 1–4 + Tier 5 White-Box Adversarial Coverage Hardening)

### `T-M7-01`
- **Phase & Milestone:** Final Milestone | **M7**
- **Title:** Pass 100% of E2E Tiers 1–4 Suite
- **Description:** Execute complete Tiers 1–4 suite against integrated codebase and resolve any remaining failures until 100% pass rate is achieved.
- **Priority:** `P0`
- **Dependencies:** `T-M6-02`, `T-E2E-03`, `T-E2E-04`
- **Affected Files:** `tests/e2e/*` (and fixes in affected source files if any failure found)
- **Proposed Changes:** Run full E2E suite, triage/fix defects, re-run clean.
- **Acceptance Criteria:** 100% pass on Tiers 1–4 (`0` failures, `0` skipped tests except explicitly documented external `BLOCKED` checks).
- **Required Tests:** `pytest tests/e2e/`.
- **Status:** `[x] VERIFIED`

### `T-M7-02`
- **Phase & Milestone:** Final Milestone | **M7**
- **Title:** Tier 5 White-Box Adversarial & Security Coverage Hardening
- **Description:** Add targeted white-box adversarial tests for IDOR takeover, forged exam scores, replayed exam nonces, CSRF bypass attempts, XSS payloads, rate-limit exhaustion, stale `session_version` cookies, teacher cross-group snooping, SQLi fuzzing, and mocked PG `IntegrityError` rollback.
- **Priority:** `P0`
- **Dependencies:** `T-M7-01`
- **Affected Files:** `tests/e2e/test_tier5_adversarial.py`, `tests/unit/test_physics_and_pg.py`
- **Proposed Changes:** Author white-box adversarial test suite covering all high-risk attack surfaces and boundary conditions.
- **Acceptance Criteria:** 100% pass on Tier 5 adversarial and physics unit suites.
- **Required Tests:** `pytest tests/e2e/test_tier5_adversarial.py tests/unit/`.
- **Status:** `[x] VERIFIED`

---

## Phase 12 — Fresh Zero-Trust Final Audit, Fix Cycle & Release Gate

### `T-P12-01`
- **Phase & Milestone:** Phase 12
- **Title:** Fresh Zero-Trust Audit & Final Fix Cycle
- **Description:** Perform an independent zero-trust audit across the entire modified repository, executing all unit, security, physics, WebGL memory, and Selenium E2E tests from scratch and fixing any newly uncovered issues.
- **Priority:** `P0`
- **Dependencies:** `T-M7-02`
- **Affected Files:** Repository-wide verification + any final hotfixes
- **Proposed Changes:** Clean audit run + final regression re-run.
- **Acceptance Criteria:** All local automated suites pass cleanly after the final edit.
- **Required Tests:** Full pytest + Selenium + `check_locales.py` + `Get-FileHash` + memory sweep.
- **Status:** `[x] VERIFIED`

### `T-P12-02`
- **Phase & Milestone:** Phase 12
- **Title:** Capture Desktop & Mobile Screenshots & Author `FINAL_RELEASE_REPORT.md` (25-Point Gate)
- **Description:** Capture visual verification screenshots (`1440×900` & `390×844`), compile exact metrics, and write `FINAL_RELEASE_REPORT.md` scoring all 25 audit points honestly as `PASS`, `FAIL`, or `BLOCKED` (explicitly marking external Render/PostgreSQL/LLM-key items `BLOCKED` rather than faking `PRODUCTION READY`).
- **Priority:** `P0`
- **Dependencies:** `T-P12-01`
- **Affected Files:** `FINAL_RELEASE_REPORT.md`, `IMPLEMENTATION_LOG.md`, `MASTER_PLAN.md`
- **Proposed Changes:** Record exact commit SHA, test counts, performance/WebGL metrics, screenshot paths, and honest final disposition.
- **Acceptance Criteria:** All 25 checklist items populated with direct command/file evidence; zero dishonest `PASS` or `PRODUCTION READY` claims if blockers remain.
- **Required Tests:** Verify all screenshot artifacts exist and all referenced commands match actual final run outputs.
- **Status:** `[x] VERIFIED`

### `T-P12-03`
- **Phase & Milestone:** Phase 12
- **Title:** Local Git Commit Without Automatic `git push`
- **Description:** Stage and commit all verified changes locally on `main` (without running `git push` per Requirement R5) and verify clean `git status`.
- **Priority:** `P0`
- **Dependencies:** `T-P12-02`
- **Affected Files:** Git repository local branch `main`
- **Proposed Changes:** `git status`, `git diff --stat`, `git add`, `git commit` (NO `git push`).
- **Acceptance Criteria:** Clean working tree (only untracked `.agents/` if excluded/ignored), local commit recorded in `FINAL_RELEASE_REPORT.md`, remote `origin/main` untouched.
- **Required Tests:** `git status` and `git log -n 3`.
- **Status:** `[x] VERIFIED`
