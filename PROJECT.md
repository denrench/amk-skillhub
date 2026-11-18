# PROJECT.md — AMK SkillHub / EduSpace 3.0

**Repository:** `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub`  
**Baseline Commit:** `6e74f62` (`main`)  
**Scope Authority:** `.agents/teamwork/ORIGINAL_REQUEST.md` + Stage 0 Audits (`explorer_survey_1`, `explorer_survey_2`, `explorer_survey_3`)  
**Specializations (Canonical Slugs):** `it` (Web-разработка), `graphic_design` (Графический дизайн), `autoelectric` (Автоэлектрика), `hvac` (Холодильное оборудование / HVAC), `automechanic` (Автомеханика)

---

## Architecture

AMK SkillHub / EduSpace 3.0 is a **Python 3.12 + Flask 3.1.3** multi-page web application (MPA) serving 20 static/dynamic HTML entrypoints, modular vanilla ES/IIFE frontend scripts, Three.js (r128) WebGL scenes, and a dual-dialect SQLite/PostgreSQL persistence layer.

### Module Boundaries & Data Flow

1. **Backend Core (`server.py` + `routes_interactive_lessons.py` + `curriculum_seeder.py`)**
   - **WSGI / Routing Layer:** Flask app (`server.py`) + Blueprint `interactive_lessons_bp` (`routes_interactive_lessons.py`) serving JSON APIs under `/api/*`, health checks (`/health`, `/healthz`, `/api/health`), and static pages/assets.
   - **Security & Auth Middleware:** `@app.before_request` enforces IP+account rate limiting on `/api/auth/*` and `/api/ai/*`, origin/CSRF double-submit validation on state-changing routes, and `@app.after_request` emits explicit allowlisted CORS headers (`https://denrench.github.io`, local dev origins) with `Vary: Origin`. Centralized `@login_required()` and `@require_roles(...)` perform fresh DB lookups validating `session_version` and active status (eliminating stale cookie role persistence).
   - **Persistence Adapter:** Unified DB layer supporting SQLite (`database.db` locally; isolated temp copy in tests) and PostgreSQL (`pg8000` / `psycopg2` via `DATABASE_URL` with `sslmode=require` support). Dialect-agnostic seeding in `curriculum_seeder.py` populates all 5 courses, 5 modules, 100 lessons, and 100 tasks (20 per specialty). Explicit `conn.rollback()` guards all conflict/exception handlers.
2. **AI Service Layer (`eduspace_ai.py` + `/api/ai/*`)**
   - Strictly real LLM HTTP integration (Gemini `x-goog-api-key` header, OpenAI/OpenRouter `Authorization: Bearer`) accepting server env keys or authenticated user-supplied session/settings keys.
   - Receives structured lesson + task + 3D workshop telemetry + simulator error context.
   - Zero heuristic or canned fallbacks: returns explicit HTTP `503` (`code: "AI_PROVIDER_UNCONFIGURED"`, `status: "BLOCKED"`) when no valid API key is present.
3. **Frontend Application Shell & Design System (`css/app.min.css`, `js/theme.js`, `js/i18n.js`, `js/app-logistics.js`, `js/academy-auth.js`)**
   - Single compiled CSS bundle (`css/app.min.css`) built from unified design tokens (`DESIGN_SYSTEM.md`), eliminating `cdn.tailwindcss.com` and `!important` theme clashes across `light` (`#F2EFE9`), `graphite` (`#25262B`), and `neon` (`#0B0C10`).
   - Shared responsive navbar & theme/language switcher (`ru`/`kk` via `js/i18n.js`) adhering to mobile (`390×844`) and desktop (`1440×900`) viewport budgets.
   - Split curriculum data: lightweight catalog index (`~10 KB`) loaded eagerly, per-course lesson/game JSON chunks loaded lazily on demand.
   - Explicit backend-unavailable error surfacing (no silent plaintext `localStorage` auth bypass or fabricated local grades).
4. **3D WebGL Infrastructure (`js/eduspace-3d-engine.js`, `js/workshop-models.js`, `js/photoreal-showcase.js`, `js/starter-lesson.js`)**
   - Centralized `GraphicsProfile` (`LOW` | `BALANCED` | `ULTRA`) controlling DPR, `PCFSoftShadowMap`, HDRI PMREM (`HalfFloatType` with `UnsignedByteType` fallback), Bloom post-processing, and model LOD/compression.
   - Standardized `OrbitControls`, semantic mesh `Raycaster` selection, tool interaction (`torque_wrench`, `socket_set`, `feeler_gauge`, `multimeter`, etc.), step-locked disassembly/assembly DAG, and centralized `disposeThreeScene()` freeing geometries, materials, textures, render targets, `ResizeObserver`, and DOM listeners.
5. **Deterministic Physics Simulators (`js/interactive-simulators.js`, `js/lesson-interactives.js`, `js/physics/*`)**
   - Pure deterministic calculation kernels per specialty (Web DOM/Flex/Grid AST, WCAG 2.1 luminance & contrast, DC nodal Ohm/Kirchhoff circuit solver, multi-refrigerant ASHRAE/NIST P-T thermodynamic cycle, spiral multi-stage torque-angle solver) with zero `Math.random()` sensor mocks.
6. **Progression, Skill Map, Missions, Portfolio & 3D Exams**
   - Unified progression across all 20 modules/course (`xp_transactions` ledger -> `get_level_info()`).
   - Interactive Skill Map DAG with prerequisite locks -> unlocks Practical Missions (all 5 tracks) -> feeds Automatic Portfolio (privacy/consent flags, public read-only slug, structured PDF export) & Anti-Tamper Practical 3D Exams (server-signed nonces, deterministic rubric scoring, immutable error log, teacher review queue).

---

## Feature Inventory

Every feature from `ORIGINAL_REQUEST.md` and Stage 0 audits (`explorer_survey_1`, `explorer_survey_2`, `explorer_survey_3`) is assigned to a single primary milestone below. **Unassigned features: 0.**

| Feature ID | Feature / Defect Scope | Source Reference | Assigned Milestone |
|---|---|---|---|
| `FEAT-01` | Fix unauthenticated IDORs (`PUT /api/user/profile`, `/api/courses/enroll`, `/api/billing/*`, `/api/mission/*`, `/api/daily_quests`, `/api/demo/status`, `routes_interactive_lessons.py` ownership) | `BE-01`, `SEC-01..04`, `R2`, `R5` | **M1** |
| `FEAT-02` | Fix Auth, Optional Local Email OTP (`send_code` 503 bypass locally, `auth.html` `required` removal), Password Reset, Unify `academy-auth.js` & `app-logistics.js` (remove plaintext `localStorage` creds/hardcoded OTP `'123456'`), Password >= 8 chars | `BE-02`, `BE-18`, `FE-CRIT-02`, `FE-CRIT-03`, `FE-LOW-01`, `FE-LOW-03`, `SEC-09`, `Stub #7,#8,#9`, `R2` | **M1** |
| `FEAT-03` | Session DB Re-validation (`session_version`), Centralized `@require_roles`, Teacher Group Isolation & Canonical Slug Map (`graphic_design`), `/api/demo/reset` RBAC, `/api/teacher/grade_submission` 404 fix | `BE-10`, `BE-15`, `COV-02`, `FE-MED-04`, `SEC-06`, `R2`, `R5` | **M1** |
| `FEAT-04` | Rate Limiting on `/api/auth/*` & `/api/ai/*`, Double-Submit CSRF Token + Strict Origin Validation, CORS Preflight (`OPTIONS` + `after_request` for `denrench.github.io`) | `BE-08`, `BE-09`, `FE-HIGH-04`, `SEC-05`, `R2`, `R5` | **M1** |
| `FEAT-05` | 12->20 Curriculum Alignment (100 lessons/100 tasks across `server.py`, `routes_interactive_lessons.py`, `/api/health`, `/api/courses`, `/api/tasks/<id>`, Pro-tier consistency) | `BE-11`, `BE-14`, `BE-15`, `COV-01`, `PERF-04`, `R2` | **M1** |
| `FEAT-06` | PostgreSQL Parity (`init_db()` seeds `tasks` + `enrollments`, `conn.rollback()` in `award_xp` & `daily_quests`, `pg8000` SSL `sslmode=require`, skip local SQLite when `HOSTED`/`DATABASE_URL`, `migrate_to_postgres.py` 23-table parity) | `BE-04`, `BE-05`, `BE-06`, `R2`, `R5` | **M1** |
| `FEAT-07` | XP Ledger & Leaderboard Integrity (`award_xp` ledger for missions, `get_level_info()`, fix double-count `ORDER BY`) & Certificate Verification Integrity (remove `92.4` fake avg, HMAC cert code, fix `verify.html` crash & real QR) | `BE-12`, `BE-13`, `SEC-09`, `Stub #6,#14`, `R2` | **M1** |
| `FEAT-08` | Stored & DOM XSS Remediation (`lesson_player.html` AI tutor & 8-block renderers, `simulator.html`, `app-logistics.js`, `photoreal-showcase.js`, iframe sandbox hardening) & Secret Hygiene (`docker-compose.yml`, personal emails) | `BE-16`, `FE-CRIT-01`, `SEC-07`, `SEC-08`, `R2`, `R5` | **M1** |
| `FEAT-09` | Frontend Error/Gate Fixes (`admin.html` fake KPIs `12/10/2/48`, `teacher.html` 403 gate, `learn.html` 401 session check, `lesson_player.html:1092` `course_slug` fix, `gradebook.html` 301 vs dead 1411-line HTML) | `BE-17`, `FE-HIGH-05`, `FE-HIGH-06`, `FE-MED-06`, `Stub #13`, `R2` | **M1** |
| `FEAT-10` | Unified Design System (`light`/`graphite`/`neon` CSS variables, remove `workshop.css` `!important` overrides, single purged CSS bundle `css/app.min.css`, drop `cdn.tailwindcss.com` across all 20 HTML pages) | `FE-HIGH-01`, `FE-HIGH-03`, `PERF-01`, `R2` | **M2** |
| `FEAT-11` | Responsive Mobile (`390×844`) & Desktop (`1440×900`) UI Redesign across all active pages (navbar drawer, `.theme-switch` slot, stepper/table/glow-orb overflow fixes, valid HTML `<body>` in `simulator.html`, single `<h1>` in `verify.html`, stale `50/10` copy -> `100/20`) | `FE-HIGH-02`, `FE-MED-02`, `FE-MED-03`, `FE-LOW-02`, `R2` | **M2** |
| `FEAT-12` | Video Player Integration in `lesson_player.html` / `simulator.html` (`assets/lesson-intros/*.mp4` + `.jpg` posters + `.vtt` subtitles, optional Video Overview tab preserving `TopicGameEngine` default) & `openZoomModal` cleanup | `FE-MED-01`, `Stub #16`, `R2` | **M2** |
| `FEAT-13` | `js/i18n.js` (`ru.json`/`kk.json`) Integration Across All Active HTML Pages & Language Switcher Parity | `I18N-01`, `R2` | **M2** |
| `FEAT-14` | Catalog & Game Data Lazy-Splitting (`courses-catalog.js` 803 KB + `topic-games-60.js` 686 KB -> compact index + per-course lazy JSON chunks, static asset `Cache-Control`) | `PERF-02`, `PERF-03`, `R5` | **M2** |
| `FEAT-15` | 3D Infrastructure Refactor (`OrbitControls`, semantic mesh `Raycaster`, `PCFSoftShadowMap`, `HalfFloatType` HDRI fallback, duplicate `GLTFLoader.js` removal on `index.html`) | `3D-03`, `3D-06`, `FE-MED-05`, `R3` | **M3** |
| `FEAT-16` | GLB Asset Deduplication (`hvac-chiller.glb` vs `mech-cylinder.glb` unique SHA-256) & Compression/Lazy Loading (`<= 2 MB` target, Draco/Meshopt or optimized geometry, `IntersectionObserver` load) | `3D-01`, `3D-02`, `PERF-03`, `R3`, `R5` | **M3** |
| `FEAT-17` | Graphics Quality Profiles (`LOW` / `BALANCED` / `ULTRA`) with adaptive fallback, UI selector, `localStorage` persistence & Centralized GPU/Listener Disposal (`disposeThreeScene()`) | `3D-04`, `3D-05`, `R3`, `R5` | **M3** |
| `FEAT-18` | Reference 3D Automechanic Workshop (interactive engine/suspension/brake bay, step-locked disassembly/assembly DAG, virtual tools `torque_wrench`/`socket_set`/`feeler_gauge`, animations, server-side step validation & state persistence) | `3D-03`, `3D-07`, `R3` | **M3** |
| `FEAT-19` | Real Verifiable Physics Simulators Across All 5 Specializations (Web DOM/Flex/Grid AST, Graphic Design WCAG 2.1 luminance/colorblind/grid, Autoelectric nodal Ohm/Kirchhoff DC + faults, HVAC multi-refrigerant P-T spline superheat/subcooling/COP, Automechanic spiral multi-stage torque-angle; remove `Math.random()` & hardcoded answers) | `SIM-01`, `SIM-02`, `Stub #10,#11,#17`, `R3` | **M4** |
| `FEAT-20` | 4 Student Tools Persistence (Search, GPA/Progress Calculator, Task Hub, Study Timer/Notes Launcher persisted via authenticated backend API) | `TLS-01`, `R3` | **M4** |
| `FEAT-21` | Real Lesson & 3D-Aware LLM AI Mentor (`/api/ai/chat`, `/api/ai/tutor`, `/api/ai/review_submission`, `/api/ai/generate_lesson`; Gemini `x-goog-api-key` header + OpenAI; lesson/3D telemetry context; user-provided API key setting; remove `pass` stub, `heuristic_offline`, `setTimeout` mocks, length-only grading; explicit `503 BLOCKED` when unset) | `BE-03`, `AI-01`, `AI-02`, `AI-03`, `Stub #1..#4`, `R3` | **M4** |
| `FEAT-22` | Interactive Skill Map DAG (competency branches across 20 modules/course, levels, achievements, prerequisite locks, mission unlock triggers, persisted state) | `SKM-01`, `R4` | **M5** |
| `FEAT-23` | Practical Missions Across All 5 Specializations (`it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic` multi-stage scenarios with server verification & grading) | `SKM-01`, `R4` | **M5** |
| `FEAT-24` | Automatic Student Portfolio (`career.html` + `profile.html` live DB works/skills/grades, privacy settings `is_public`/`show_grades`, consent-gated `/portfolio/<slug>`, real structured PDF export, replace hardcoded `RESUME_DATA` & `pricing.html` mock billing disclosure) | `PRT-01`, `TLS-01`, `Stub #12,#15`, `R4` | **M5** |
| `FEAT-25` | Practical 3D Exams & Anti-Tampering (Automechanic reference 3D exam + 4 specialty practical exams, signed attempt nonce, server-side deterministic rubric grading replacing client-trusted `score`/`autotest_passed`, immutable error log, sandboxed WebWorker JS autotests, teacher exam review queue) | `EXM-01`, `Stub #5,#18`, `R4`, `R5` | **M5** |
| `FEAT-26` | Performance Profiling, WebGL Memory Leak Sweep (`renderer.info.memory` 10-cycle check), Asset Weight Verification, Security Regression Verification & Integration Bugfixes | `R5` (Phases 10–11) | **M6** |
| `FEAT-27` | Dual-Track E2E Opaque-Box Test Suite (Tiers 1–4 via Python 3.12 + Selenium Chrome/Edge + isolated SQLite DB copies, `TEST_INFRA.md`, `TEST_READY.md`) | `E2E` Track | **E2E** |
| `FEAT-28` | Final Milestone Validation: 100% Pass on E2E Tiers 1–4 + Tier 5 White-Box Adversarial Coverage Hardening (IDOR, XSS, CSRF, rate limit, exam anti-tamper, PG `InFailedSqlTransaction` unit/mock tests) | `M7` | **M7** |
| `FEAT-29` | Fresh Zero-Trust Final Audit, Fix Cycle, Screenshots, Local Git Commit (no auto `git push` to `main`) & `FINAL_RELEASE_REPORT.md` (25-point gate with honest `PASS`/`FAIL`/`BLOCKED` — external Render/PG/LLM blockers documented) | `BE-07`, `BE-17`, `R5` (Phase 12) | **Phase 12** |

---

## Milestones

| Milestone | Phases | Scope Summary | Dependencies | Status |
|---|---|---|---|---|
| **M1** | Phases 1 + 11 Foundation | Backend security/IDOR/CSRF/CORS/rate-limit, optional local email OTP, unified auth, 12->20 curriculum alignment, PostgreSQL parity + `migrate_to_postgres.py`, XSS/crash/API fixes | Stage 0 Docs | `[~] IMPLEMENTED - PENDING GATE` |
| **M2** | Phase 2 + Phase 10 CSS/JS Bundle | Unified Design System (`light`/`graphite`/`neon`), single `css/app.min.css` (drop `cdn.tailwindcss.com`), responsive `390×844` & `1440×900` UI redesign, video player integration, `i18n.js` on all pages, catalog lazy-splitting | M1 | `[ ] NOT STARTED` |
| **M3** | Phases 3 + 10 3D | 3D infrastructure refactor (`OrbitControls`, Raycaster, shadows), GLB deduplication/optimization, `LOW`/`BALANCED`/`ULTRA` graphics profiles, GPU disposal & reference 3D Automechanic Workshop | M1, M2 | `[ ] NOT STARTED` |
| **M4** | Phases 4 + 7 | Real verifiable physics simulators (all 5 specializations), 4 student tools persistence & real lesson/3D-aware LLM AI Mentor (no fake fallbacks; explicit `BLOCKED` if key unset) | M1, M3 (for 3D telemetry) | `[ ] NOT STARTED` |
| **M5** | Phases 5 + 6 + 8 + 9 | Interactive Skill Map DAG, practical missions (all 5 specializations), automatic student portfolio (privacy, consent public link, PDF export) & practical 3D exams (anti-tampering, error log, teacher review) | M1, M2, M3, M4 | `[ ] NOT STARTED` |
| **M6** | Phases 10 Perf + 11 Sec Audit | Full performance profiling, WebGL memory leak sweep, security regression verification & integration bugfixes | M1–M5 | `[ ] NOT STARTED` |
| **E2E** | Dual Track E2E | Requirement-driven opaque-box Selenium test suite (Tiers 1–4, `TEST_INFRA.md`, `TEST_READY.md`) | M1–M5 (parallelizable per milestone) | `[ ] NOT STARTED` |
| **M7** | Final Milestone | Phase 1 (100% E2E Tiers 1–4 pass) + Phase 2 (Tier 5 White-Box Adversarial Coverage Hardening) | M6, E2E | `[ ] NOT STARTED` |
| **Phase 12** | Release Gate | Fresh zero-trust final audit, fix cycle, screenshots, local commit (no `git push`) & `FINAL_RELEASE_REPORT.md` (25-point checklist) | M7 | `[ ] NOT STARTED` |

---

## Interface Contracts

### 1. Auth / Session / CSRF Contract (M1)
- **`GET /api/auth/readiness`**:
  - Returns `{ "login": true, "registration": true, "email_verification_required": false|true, "mail_configured": false|true, "hosted": false|true }`.
  - When `not HOSTED` and mail credentials absent, `email_verification_required` MUST be `false` so local registration works without SMTP/Resend.
- **`POST /api/auth/register`**:
  - Request: `{ first_name, last_name, email, password (>= 8 chars), role ("student"|"teacher"), specialty_slug, group_name?, teacher_code?, verification_code? }`.
  - Enforces `verification_code` ONLY when `email_verification_required === true`. Catches both SQLite and PostgreSQL `IntegrityError` -> HTTP `409`.
- **`POST /api/auth/login` / `GET /api/auth/session` / `POST /api/auth/logout`**:
  - Session stores `user_id` and `session_version`. Every `@login_required` / `@require_roles` re-queries `users` in DB (`session_version` mismatch -> `401`).
  - `/api/auth/session` returns `{ authenticated: true, user: {...}, csrf_token: "..." }` or `{ authenticated: false, csrf_token: "..." }`.
- **CSRF & CORS**:
  - State-changing `/api/*` requests (excluding `/api/auth/login`, `/api/auth/register`, `/api/auth/send_code`) validate `X-CSRF-Token` matching session/double-submit token (or valid allowlisted `Origin` during preflight/bootstrap) and reject mismatched origins with `403`.
  - Rate limit applies to `/api/auth/*` and `/api/ai/*` (`429` on threshold breach).

### 2. Courses / Lessons / 20-Module API Contract (M1)
- **`GET /api/courses`**: Returns all 5 specialties (`it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic`) with dynamic `total_lessons: 20` (from DB `COUNT(*)`), `completed_lessons`, `progress_percent` (`completed / 20 * 100`).
- **`GET /api/tasks?specialty=<slug>` & `GET /api/tasks/<id>`**: Returns all `1..20` tasks; `get_current_day(user_id)` supports `1..20`; Pro lock (`order_num > 3`) enforced consistently for non-Pro students on both `/api/tasks/<id>` and `/api/lessons/<id>`.
- **`POST /api/tasks/submit`**:
  - Requires `@login_required()`. Ignores client `user_id` and ignores untrusted raw `score` overrides for quiz/autotest/exam tasks; evaluates rubric/answers server-side.
- **`GET /api/health`**: Returns real DB counts (`lessons_total: 100`, `tasks_total: 100`), `database_type: "sqlite"|"postgresql"`, and explicit subsystem status (`ai: "configured"|"blocked"`, `email: "optional"|"configured"`).
- **`GET /api/certificate/verify?cert=<code>`**: Rejects raw sequential integer/email enumeration (`400`/`404`). Uses signed HMAC certificate code; returns `status: "VALID"` ONLY when `role == 'student'` and required modules are passed with genuine calculated `average_score` (never hardcoded `92.4`).

### 3. 3D Workshop & State API Contract (M3)
- **Client Engine (`window.EduWorkshop3D`)**:
  - `mount(containerEl, config)`: `{ specialty, modelId, profile ("LOW"|"BALANCED"|"ULTRA"), mode ("explore"|"disassembly"|"assembly"|"exam"), savedState?, onPartSelect?, onStepEvent?, onTelemetry? }` -> returns `{ dispose(), setProfile(p), selectTool(toolId), resetAssembly(), getStateSnapshot() }`.
  - Guarantees `dispose()` releases all `BufferGeometry`, `Material`, `Texture`, `PMREMGenerator` targets, `EffectComposer` passes, `OrbitControls`, `ResizeObserver`, and event listeners.
- **Backend Workshop State API**:
  - `GET /api/workshop/state?lesson_id=<id>&model_id=<slug>` (`@login_required()`) -> `{ disassembled_parts: [], active_tool: string, step_history: [], completed: bool, updated_at }`.
  - `POST /api/workshop/action` (`@login_required()`) -> `{ lesson_id, model_id, action ("detach"|"attach"|"torque"|"measure"), part_id, tool_id, telemetry }` -> validates against step DAG, persists state, returns `{ valid: bool, error_code?, next_allowed_parts: [], progress_pct }`.

### 4. Physics Simulators JS API Contract (M4)
- **Pure Kernel (`window.EduPhysics`)** (deterministic, zero `Math.random()`, Node/Browser/Selenium testable):
  - `EduPhysics.design.contrastRatio(fgHex, bgHex)` -> `{ ratio, aaNormal, aaLarge, aaaNormal, luminanceFg, luminanceBg }`.
  - `EduPhysics.autoelectric.solveCircuit(nodes, edges, batteryV, fault?)` -> `{ nodeVoltages, branchCurrents, totalResistance, faultDiagnosis }`.
  - `EduPhysics.hvac.cycleMetrics(refrigerant, lowBar, highBar, suctionTempC, liquidTempC)` (`R134a` | `R410A` | `R32` | `R600a`) -> `{ tSatLow, tSatHigh, superheatK, subcoolingK, copEstimate, status }`.
  - `EduPhysics.automechanic.evaluateTorqueSequence(events, specId)` -> `{ validOrder, stagesCompleted, yieldWarning, boltStates, passed }`.
  - `EduPhysics.it.evaluateLayout(cssRules, targetSpec)` -> `{ passedRules, computedRects, score }`.

### 5. AI Mentor Context API Contract (M4)
- **`POST /api/ai/chat` & `POST /api/ai/tutor`** (`@login_required()`, rate-limited):
  - Request: `{ message, course_slug, lesson_id?, task_id?, context: { block_id?, selected_part?, disassembled_parts?, simulator_state?, recent_errors?: [] }, user_api_key?, provider? }`.
  - Behavior: Uses env key (`GEMINI_API_KEY` via `x-goog-api-key` header, `OPENAI_API_KEY` via Bearer) or user-supplied key for the request (never persisted in plaintext logs).
  - Unconfigured Response (HTTP `503`): `{ ok: false, status: "BLOCKED", code: "AI_PROVIDER_UNCONFIGURED", message: "AI-наставник недоступен: не задан API-ключ LLM (укажите в настройках или переменных окружения)." }`.
- **`POST /api/ai/review_submission` & `POST /api/ai/generate_lesson`** (`@login_required()`): Same real-LLM + explicit `503 BLOCKED` contract; zero length-based or heuristic stub grading.

### 6. Student Tools, Skill Map, Missions, Portfolio & Exams API Contract (M4–M5)
- **4 Student Tools (`M4`)**: `GET/POST /api/tools/state` (`@login_required()`) persisting Search history/bookmarks, GPA target, Task Hub items, and Study Timer/Notes across sessions.
- **Skill Map DAG (`M5`)**: `GET /api/skills/map?specialty=<slug>` (`@login_required()`) -> `{ nodes: [{ id, lesson_order, title, prerequisites: [], unlocked, completed, score, xp, mission_id? }], achievements: [] }`.
- **Missions (`M5`)**: `GET /api/mission/state?specialty=<slug>&mission_id=<id>`, `POST /api/mission/save_stage`, `POST /api/mission/submit` (`@login_required()`, `user_id` strictly from `g.current_user['id']`, XP via `award_xp()`).
- **Portfolio (`M5`)**:
  - `GET/PUT /api/portfolio/settings` (`@login_required()`) -> `{ is_public, show_grades, show_certificates, public_slug, consent_granted, consent_at }`.
  - `GET /api/portfolio/me` (`@login_required()`) -> real aggregated `task_submissions`, verified skills, missions, exams.
  - `GET /api/portfolio/public/<slug>` -> `403`/`404` unless `is_public && consent_granted`; masks grades if `show_grades == false`.
  - `GET /api/portfolio/export.pdf` (`@login_required()`) -> returns `application/pdf` binary statement.
- **Practical 3D Exams (`M5`)**:
  - `POST /api/exams/start` (`@login_required()`) -> `{ attempt_id, attempt_nonce, exam_spec, rubric_steps_count, time_limit_sec }`.
  - `POST /api/exams/event` (`@login_required()`) -> appends `{ step_id, action, part_id, tool_id, telemetry, timestamp }` to immutable attempt log.
  - `POST /api/exams/submit` (`@login_required()`) -> validates `attempt_nonce`, grades deterministically on server, records `error_log_json`, creates teacher review queue entry.
  - `GET /api/teacher/exams/review` & `POST /api/teacher/exams/review/<attempt_id>` (`@require_roles('teacher', 'admin')` with group isolation).

---

## Code Layout

File ownership by milestone to prevent concurrent worker collisions:

| Path / Directory | Primary Milestone Owner | Secondary / Audit Touch | Purpose |
|---|---|---|---|
| `server.py`, `routes_interactive_lessons.py`, `curriculum_seeder.py`, `migrate_to_postgres.py`, `requirements.txt`, `docker-compose.yml` | **M1** (Auth, RBAC, 20-module, PG) | **M4** (`/api/ai/*`, `/api/tools/*`), **M5** (SkillMap, Missions, Portfolio, Exams), **M6** (Perf/Sec fixes) | Flask backend, DB schema, migrations, API routes |
| `eduspace_ai.py` | **M4** (Real LLM + `BLOCKED`) | **M6** (Audit) | Gemini/OpenAI/OpenRouter HTTP client |
| `css/*.css` -> `css/app.min.css`, `locales/*.json`, `js/theme.js`, `js/i18n.js` | **M2** (Design system, bundle, i18n) | **M6** (CSS/Perf tuning) | Unified design tokens, compiled CSS, RU/KK locales |
| `*.html` (20 pages) | **M2** (Shell, CSS, responsive, video, i18n) | **M1** (`auth.html`, `admin.html`, `verify.html`, `lesson_player.html` XSS/slug fixes), **M3** (Workshop mounts), **M4** (Sim/AI/Tools UI), **M5** (SkillMap/Missions/Portfolio/Exams UI) | MPA page templates *(M1 security/XSS patches first; M2 unified shell next; M3–M5 feature hooks sequentially)* |
| `js/academy-auth.js`, `js/app-logistics.js`, `js/academy.js`, `js/academy-student.js` | **M1** (Auth/XSS/API fixes) | **M2** (Lazy catalog calls), **M5** (Portfolio/Exam helpers) | Core frontend API/auth/session runtime |
| `js/courses-catalog.js`, `js/topic-games-60.js`, `js/academy-lessons.js`, `assets/data/catalog/*.json` | **M2** (Lazy chunk splitting) | **M1** (Canonical 20-lesson alignment) | Curriculum & topic game datasets |
| `js/eduspace-3d-engine.js`, `js/workshop-models.js`, `js/photoreal-showcase.js`, `js/starter-lesson.js`, `assets/models/*.glb`, `assets/photoreal/*` | **M3** (3D Engine, Profiles, Disposal, GLBs, Auto Workshop) | **M6** (Memory leak sweep) | Three.js WebGL scenes & GLB assets |
| `js/interactive-simulators.js`, `js/lesson-interactives.js`, `js/physics/*.js`, `js/student-tools.js` | **M4** (5 Physics engines & 4 Student tools) | **M5** (Mission/Exam adapter hooks) | Deterministic domain physics & student tools |
| `js/skill-map.js`, `js/missions/*.js`, `js/portfolio.js`, `js/exam-engine.js` *(new modular files)* | **M5** (Skill Map, Missions, Portfolio, Exams) | **M6** (Perf/Security audit) | Phase 5/6/8/9 frontend modules |
| `tests/e2e/*`, `TEST_INFRA.md`, `TEST_READY.md` | **E2E** | **M7** (Tier 5 Adversarial Hardening) | Opaque-box Selenium E2E + Adversarial test suite |
| `FINAL_RELEASE_REPORT.md`, `AUDIT_REPORT.md`, `MASTER_PLAN.md`, `TEST_PLAN.md`, `IMPLEMENTATION_LOG.md`, `PROJECT.md` | **Stage 0 / Phase 12** | Updated across milestones (`MASTER_PLAN.md`, `IMPLEMENTATION_LOG.md`) | Governance, audit, planning & release artifacts |
