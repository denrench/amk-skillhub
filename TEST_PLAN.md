# TEST_PLAN.md — AMK SkillHub / EduSpace 3.0

**Repository:** `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub`  
**Authority:** `.agents/teamwork/ORIGINAL_REQUEST.md`, `PROJECT.md`, `MASTER_PLAN.md`

---

## 1. Test Environment & Tooling Reality

### 1.1 Available Local Runtime & Tooling
| Component | Status | Usage in Test Plan |
|---|---|---|
| **Python** | `Python 3.12.10`, `pip 25.0.1` | Primary test runner (`pytest` / `unittest`), API tests, physics/PG unit tests |
| **Flask / Backend Deps** | `Flask 3.1.3`, `flask-cors 6.0.5`, `Werkzeug 3.1.9`, `pg8000 1.31.6`, `cryptography 50.0.2` | In-process/ephemeral Flask WSGI test server on dynamic localhost port |
| **Browser Automation** | `selenium 4.52.0` + Google Chrome + Microsoft Edge | Real browser E2E, DOM/XSS, WebGL `renderer.info.memory`, CDP mobile `390×844` & desktop `1440×900` checks, screenshots |
| **Database (Local)** | Python built-in `sqlite3` + `database.db` | **Strict Isolation:** Every test run clones `database.db` into `%TEMP%` (`EDUSPACE_DB_PATH` override) and deletes it on teardown. Repo `database.db` MUST remain untouched. |
| **Locale & Asset Tools** | `scripts/check_locales.py`, PowerShell `Get-FileHash`, `pillow 12.3.0` | RU/KK key parity, GLB SHA-256 uniqueness, screenshot capture |

### 1.2 Absent Tooling & External Blockers (Explicitly Tracked)
- **Playwright & Node.js / npm:** **ABSENT** locally (`node` not installed, `playwright` not installed). All browser E2E & CDP responsive checks use **Python 3.12 + Selenium 4 + Chrome/Edge**.
- **PostgreSQL & Docker & `psycopg2-binary` & `gunicorn`:** **ABSENT** locally (`psql`, Docker Desktop, and `DATABASE_URL` unavailable). Live PostgreSQL runtime tests are marked **`BLOCKED`** locally unless a PG instance is supplied; schema DDL parity (`migrate_to_postgres.py` vs `server.py`) and PG `IntegrityError` + `conn.rollback()` paths MUST still be verified via static inspection and mocked-PG unit tests.
- **LLM API Keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`):** **ABSENT** locally. Live third-party LLM output verification is **`BLOCKED`** unless a key is provided via env or UI session input; missing-key `503 BLOCKED` responses and mocked HTTP transport tests MUST still pass 100%.
- **SMTP / Resend (`MAIL_API_KEY`, `SMTP_PASSWORD`):** **ABSENT** locally. Live external email delivery is **`BLOCKED`**; local registration & reset MUST succeed with email OTP disabled/optional.
- **Render Deployment (`https://amk-skillhub.onrender.com`):** Outdated relative to local `main` (`tasks_total: 50`, `/api/auth/readiness` returns `404`). Remote deployment checks are **`BLOCKED`** because local development does not push or deploy to Render.

---

## 2. Test Suites & Verification Matrix

### 2.1 API, RBAC & Security Regression Suite (M1, M6, Tier 5)
| Test Case ID | Attack / Verification Vector | Expected Result |
|---|---|---|
| `SEC-T01` | **Unauthenticated IDOR Sweep:** Anonymous `PUT /api/user/profile`, `POST /api/courses/enroll`, `GET /api/billing/status?user_id=1`, `POST /api/billing/checkout`, `GET /api/mission/state?user_id=1`, `POST /api/mission/save_stage`, `POST /api/mission/submit`, `GET/POST /api/daily_quests`, `GET /api/demo/status`, `POST /api/ai/chat` | HTTP `401 Unauthorized` on every endpoint |
| `SEC-T02` | **Cross-User IDOR Sweep:** Authenticated Student A targets Student B's `user_id` on profile update, mission state/save/submit, portfolio settings, or billing | HTTP `403 Forbidden` (or target parameter ignored in favor of `g.current_user['id']`) |
| `SEC-T03` | **Role Escalation & Stale Session:** Student calls `/api/demo/reset`, `/api/admin/*`, `/api/teacher/*`; Admin demotes user in DB while user holds old session cookie, then user calls privileged endpoint | `403` for student; `401`/`403` immediately after `session_version` bump |
| `SEC-T04` | **Teacher Group Isolation:** `hvac` teacher queries `/api/teacher/matrix`, `/api/teacher/stats`, `/api/teacher/exams/review` | Returns ONLY assigned `hvac` group students; accessing `it` student/submission returns `403` |
| `SEC-T05` | **Stored & DOM XSS:** Inject `<img src=x onerror="window.__xss=1">` and `<svg onload="window.__xss=2">` into `lesson_player.html` AI Tutor prompt, `simulator.html` chat, `task_submissions` comment, `full_name`, and mission text | `window.__xss === undefined`, zero requests to `/x`, payload rendered as escaped literal text |
| `SEC-T06` | **CSRF & Origin Enforcement:** State-changing `POST`/`PUT`/`DELETE` without `X-CSRF-Token` or with foreign `Origin: https://evil.example` | HTTP `403 Forbidden`; `OPTIONS` from `https://denrench.github.io` returns `200/204` with `Access-Control-Allow-Credentials: true` |
| `SEC-T07` | **Rate Limiting:** 46 rapid `POST /api/auth/login` (and `/api/auth/register`, `/api/auth/send_code`, `/api/ai/chat`) requests from same IP | HTTP `429 Too Many Requests` triggered before request 46 |
| `SEC-T08` | **SQLi & Secret Hygiene:** SQLi fuzz payloads (`' OR 1=1 --`, `1; DROP TABLE users;--`) on search/query params; static grep for hardcoded passwords/personal emails/URL API keys (`?key=`); `HOSTED=1` without `SESSION_SECRET` | Parameterized queries return safe 200/400/404 with intact DB; 0 leaked secrets; fail-closed startup when `HOSTED=1` & `SESSION_SECRET` unset |
| `SEC-T09` | **Anti-Tampering & Integrity:** Forge `score: 100` / `autotest_total: 5` on `/api/tasks/submit`; replay/forge `attempt_nonce` on `/api/exams/submit`; call `/api/certificate/verify?cert=1` on student with 0 passed modules | Client `score` ignored; forged exam nonce rejected (`400`/`403`); cert verify rejects sequential ID (`400`/`404`) and never fabricates `92.4`/`VALID` |
| `SEC-T10` | **PostgreSQL Parity & Rollback:** Inspect DDL parity of all tables in `migrate_to_postgres.py` vs `server.py`; unit-test `award_xp()` & `daily_quests()` under simulated PG `IntegrityError` | `conn.rollback()` invoked cleanly; no `InFailedSqlTransaction`; 100 tasks/lessons seeded |

### 2.2 Curriculum, Auth & Core Functionality Suite (M1, M2)
| Test Case ID | Verification Scope | Expected Result |
|---|---|---|
| `CUR-T01` | **Optional Local Email OTP Registration:** Register brand-new student & teacher (with valid teacher code) via `auth.html` with empty `verification_code` | HTTP `201`, session persisted across reload, zero plaintext password in `localStorage` |
| `CUR-T02` | **12->20 Curriculum Alignment:** Advance study day to 20, fetch `/api/courses`, `/api/health`, `/api/tasks?specialty=it`, `/api/lessons?specialty=it`, submit lesson 13 & lesson 20 | `total_lessons: 20`, `tasks_total: 100`, `lessons_total: 100`, lesson 20 unlocks and saves progress |
| `CUR-T03` | **Video Player Integration:** Open Block 3 in `lesson_player.html` across `it`, `automechanic`, `hvac`; switch to "Видео-обзор урока" tab | `<video>` loads `.mp4`, poster `.jpg`, `<track>` `.vtt`, `video.readyState >= 2`, `video.error === null` |
| `CUR-T04` | **i18n & Theme Parity:** Toggle `RU`/`KZ` across primary pages (`scripts/check_locales.py` + Selenium); toggle `light`/`graphite`/`neon` themes | `0` missing locale keys; theme persists across reload; WCAG AA contrast `>= 4.5:1` on text & cards |
| `CUR-T05` | **Catalog Lazy-Splitting & CSS Bundle:** Block `cdn.tailwindcss.com`, measure JS bytes on `index.html` vs `lesson_player.html`, load all 5 courses | `0` `cdn.tailwindcss.com` requests; `>= 70%` JS reduction on non-player pages; all 100 lessons load cleanly |

### 2.3 Deterministic Physics Correctness Suite (M4)
Automated Python/Selenium test runner evaluating `window.EduPhysics` against published engineering standards:
- **Graphic Design (WCAG 2.1):** `#000000` on `#FFFFFF` -> `21.00 : 1 (AAA)`; `#777777` on `#FFFFFF` -> `4.47 : 1` (fails AA normal, passes AA large); changing colors dynamically recomputes ratio (never static `12.5 : 1`).
- **Autoelectric (Ohm/Kirchhoff DC):** `12.6V` source across known resistor/load network returns exact nodal voltages & currents (`±0.01V`/`±0.01A`); injecting open-circuit or short-to-ground fault changes node readings deterministically (zero `Math.random()`).
- **HVAC (NIST/ASHRAE P-T Splines):** `R134a`, `R410A`, `R32`, `R600a` at known low/high pressures compute accurate saturation temperatures (`±0.5°C`), superheat (`T_suction - T_sat_low`), subcooling (`T_sat_high - T_liquid`), and COP trend.
- **Automechanic (Torque-Angle Spiral):** 10-bolt head pattern requires center-out spiral sequence across Stage 1 (`30 Nm`), Stage 2 (`60 Nm`), Stage 3 (`+90°`); out-of-order or over-torqued bolt triggers warpage/yield fault.
- **Web-dev (`it`):** Flexbox/Grid evaluator computes real layout rules against target geometry spec.

### 2.4 3D WebGL, Graphics Profiles & Memory Leak Suite (M3, M6)
- **GLB Uniqueness & Size (`3D-01`, `3D-02`):** `Get-FileHash assets\models\*.glb -Algorithm SHA256` -> **25 unique hashes** (`hvac-chiller.glb` != `mech-cylinder.glb`); oversized models optimized (`<= 2 MB` target).
- **Graphics Profiles (`3D-05`):** Toggling `LOW` -> `BALANCED` -> `ULTRA` updates `renderer.getPixelRatio()` (`1.0` / `<=1.5` / `<=2.0`), `renderer.shadowMap.enabled` (`false` / `true` / `true`), and Bloom pass state.
- **Memory Leak Sweep (`3D-04`):** Execute **10 consecutive mount/unmount cycles** in Chrome on `index.html` (`PhotorealShowcase`), `lesson_player.html` (`EduSpace3D`), and `simulator.html` (`EduWorkshop3D`), sampling `renderer.info.memory.geometries` and `renderer.info.memory.textures` after each cycle -> **0 monotonic growth**.
- **Reference 3D Automechanic Workshop (`3D-03`):** Use `Raycaster` to select named parts, verify wrong-order disassembly rejection, select `socket_set`/`torque_wrench`, perform valid step sequence, reload page, and assert persisted `disassembled_parts` via `/api/workshop/state`.

### 2.5 Responsive Desktop (`1440×900`) & Mobile (`390×844`) Audit (M2, E2E Tier 4)
Automated Selenium CDP sweep across **all 20 HTML pages**:
- **Desktop (`1440×900`):** `0` JS uncaught exceptions, `0` unexpected `4xx/5xx` console errors, `scrollWidth <= 1440`, `document.querySelectorAll('h1').length === 1` (on content pages), no elements outside `<body>`.
- **Mobile (`390×844`):** `document.documentElement.scrollWidth <= 390`, `header.getBoundingClientRect().height <= 72` (collapsed navbar), `.theme-switch` bounding box `right <= 390` and visible when opened, no clipped/overlapping buttons.

### 2.6 AI Mentor, Tools, Skill Map, Missions, Portfolio & 3D Exams (M4, M5)
- **4 Student Tools (`TLS-01`):** Search, GPA calculator, Task Hub, Study Timer/Notes — create/edit items, reload page, assert DB persistence via `/api/tools/state`.
- **AI Mentor (`AI-01..03`):** Without key -> explicit `503 BLOCKED` banner (zero canned replies); with mocked transport or supplied test key -> verifies request payload contains `course_slug`, `lesson_id`, `selected_part`, `disassembled_parts`, and `recent_errors`.
- **Skill Map & 5 Missions (`SKM-01`):** Locked downstream node rejects premature unlock; completing prerequisite unlocks mission; completing mission in each of the 5 specialties (`it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic`) updates DB & `xp_transactions`.
- **Automatic Portfolio (`PRT-01`):** Private portfolio returns `403/404` on `/api/portfolio/public/<slug>`; enabling `is_public + consent_granted` serves public view respecting `show_grades`; `/api/portfolio/export.pdf` returns valid `%PDF-1.` stream.
- **Practical 3D Exams & Teacher Review (`EXM-01`):** Complete Automechanic 3D exam with 1 intentional mistake -> server calculates exact deducted score and populates `error_log_json`; Teacher (assigned group) inspects error log and approves/reviews; other-group teacher gets `403`.

---

## 3. Dual-Track E2E Methodology (Tiers 1–4 + Tier 5 Adversarial)

- **E2E Track (Opaque-Box, Requirement-Driven):** Implemented in `tests/e2e/` strictly from `ORIGINAL_REQUEST.md` acceptance criteria (`TEST_INFRA.md` & `TEST_READY.md` document setup and readiness):
  - **Tier 1 (Smoke):** All 20 HTML pages load cleanly, 0 severe console errors, valid DOM structure, single CSS bundle (`0` CDN Tailwind).
  - **Tier 2 (Core Flows):** Registration without email OTP, role login (student/teacher/admin), 20-module progression, video player, RU/KK i18n, 3 themes, 4 student tools persistence.
  - **Tier 3 (Deep Interactive):** 3D Automechanic workshop disassembly/assembly + persistence, Graphics profiles, all 5 physics simulators, AI Mentor `BLOCKED`/context, Skill Map, 5-track missions, Portfolio privacy + PDF, Practical 3D Exam + Teacher Review.
  - **Tier 4 (Responsive & Recovery):** `390×844` mobile & `1440×900` desktop geometry across all 20 pages, offline/401/403 recovery without fake KPIs or silent mock bypasses.
- **M7 Phase 1:** Achieve **100% pass** across Tiers 1–4.
- **M7 Phase 2 (Tier 5 White-Box Adversarial Hardening):** Target known code boundaries (`tests/e2e/test_tier5_adversarial.py` + `tests/unit/test_physics_and_pg.py`) — IDOR mutations, forged exam scores, replayed nonces, XSS vectors, CSRF bypasses, rate-limit floods, stale `session_version`, cross-group teacher access, SQLi fuzzing, and mocked PG `IntegrityError` rollback.

---

## 4. 25-Point Final Release Audit Checklist (Phase 12)

Every item in `FINAL_RELEASE_REPORT.md` MUST carry an explicit status of **`PASS`**, **`FAIL`**, or **`BLOCKED`** backed by direct command output, file path, or screenshot. **Rule:** `PRODUCTION READY` MUST NOT be assigned if ANY item is `FAIL` or if ANY mandatory requirement is `BLOCKED`.

| # | Audit Criterion | Verification Method | Strict Rule |
|---|---|---|---|
| 1 | Stage 0–12 Documentation Suite Complete (`AUDIT_REPORT`, `MASTER_PLAN`, `ARCHITECTURE`, `DESIGN_SYSTEM`, `3D_ASSET_MANIFEST`, `TEST_PLAN`, `IMPLEMENTATION_LOG`, `PROJECT`, `FINAL_RELEASE_REPORT`) | File existence & schema check | `PASS` only if all 9 docs populated accurately |
| 2 | Zero Critical/High Auth & IDOR Vulnerabilities (`SEC-01..04`) | `pytest` Tier 5 IDOR matrix | `PASS` if 100% return 401/403 |
| 3 | Local Registration & Login Without Mandatory Email OTP (`BE-02`, `FE-CRIT-02`) | Selenium registration + reload test | `PASS` if works locally with blank OTP |
| 4 | Role-Based Access Control & Stale Session Invalidation (`SEC-06`) | `pytest` role & `session_version` tests | `PASS` if demoted cookie returns 401/403 |
| 5 | Teacher Group Isolation & Canonical Slugs (`BE-10`, `COV-02`) | `pytest` cross-group teacher matrix | `PASS` if zero cross-specialty leakage |
| 6 | Rate Limiting (`/api/auth/*`, `/api/ai/*`), CSRF & CORS (`BE-08`, `BE-09`, `SEC-05`) | `pytest` 429 burst + CSRF 403 + OPTIONS | `PASS` if all 3 controls enforced |
| 7 | Zero Stored/DOM XSS Sinks (`FE-CRIT-01`, `SEC-07`) | Selenium XSS payload injection | `PASS` if `window.__xss === undefined` |
| 8 | Secret Hygiene & Fail-Closed Production Config (`SEC-08`, `BE-16`) | Static scan + `HOSTED=1` startup test | `PASS` if 0 hardcoded creds/emails |
| 9 | 12->20 Curriculum Alignment Across All 5 Tracks (`COV-01`, `BE-11`) | API + Selenium lesson 13 & 20 tests | `PASS` if `total_lessons == 20`, `tasks_total == 100` |
| 10 | XP Ledger, Leaderboard & Certificate Integrity (`BE-12`, `BE-13`) | `pytest` ledger/cert checks (no `92.4` fake) | `PASS` if zero double-count / fake grades |
| 11 | PostgreSQL Parity (`migrate_to_postgres.py`, `conn.rollback()`, live PG DB) | DDL/mock tests + live PG check | **`BLOCKED`** locally if PG/Docker absent (`PASS` only if live PG verified) |
| 12 | Unified Design System (`light`/`graphite`/`neon`) & Single CSS Bundle (`cdn.tailwindcss.com` = 0) | Static grep + offline CSS + contrast audit | `PASS` if 0 CDN scripts & all 3 themes pass |
| 13 | Desktop (`1440×900`) & Mobile (`390×844`) Responsive Parity (All 20 Pages) | Selenium CDP geometry audit + screenshots | `PASS` if `scrollWidth <= 390` & `hdrH <= 72` |
| 14 | Lesson Video Player (`assets/lesson-intros/*` + VTT) | Selenium `<video>` readyState test | `PASS` if plays with captions & 0 errors |
| 15 | Multilingual `i18n.js` (`RU`/`KK`) Across All Active Pages | `check_locales.py` + Selenium toggle | `PASS` if 0 missing keys & UI switches |
| 16 | JS Catalog Lazy-Splitting & Asset Optimization (`PERF-02`) | Chrome network byte transfer check | `PASS` if non-player JS drops `>= 70%` |
| 17 | 3D Asset Deduplication (25 Unique GLB Hashes) & Optimization (`3D-01`, `3D-02`) | `Get-FileHash` + browser load | `PASS` if 25 unique hashes & size target met |
| 18 | `LOW`/`BALANCED`/`ULTRA` Profiles & Zero WebGL Memory Leaks (`3D-04`, `3D-05`) | 10-cycle `renderer.info.memory` sweep | `PASS` if 0 monotonic geometry/texture growth |
| 19 | Reference 3D Automechanic Workshop (Disassembly/Assembly, Tools, Persistence) | Selenium 3D interaction + reload check | `PASS` if DAG, tools & DB state verified |
| 20 | Deterministic Physics Simulators Across All 5 Specializations (`SIM-01`) | Engineering reference unit suite | `PASS` if 0 `Math.random()` mocks & exact values |
| 21 | 4 Student Tools Persisted via Backend (`TLS-01`) | API + Selenium reload persistence | `PASS` if all 4 tools save & reload |
| 22 | Real Lesson & 3D-Aware LLM AI Mentor (`AI-01..03`) | Mock/code check + live LLM env check | **`BLOCKED`** for live LLM if API keys unset (`PASS` for `503 BLOCKED` & context payload; never fake fallback) |
| 23 | Interactive Skill Map DAG & Practical Missions Across All 5 Specializations | API + Selenium 5-track mission run | `PASS` if prerequisite locks & 5 missions pass |
| 24 | Automatic Student Portfolio (Privacy, Consent Public Link, Real PDF Export) | API privacy + `%PDF-1.` binary check | `PASS` if private=403/404, consent works, valid PDF |
| 25 | Practical 3D Exams (Anti-Tamper, Error Log, Teacher Review) & Local Git Commit (No Push) + Render Check | Tier 5 anti-tamper + teacher review + `git status` | Local exam/commit `PASS`; live Render sync noted **`BLOCKED`** unless deployed |
