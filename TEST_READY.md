# TEST_READY.md — Dual-Track E2E Opaque-Box Test Suite Readiness

**Project:** AMK SkillHub / EduSpace 3.0  
**Repository:** `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub`  
**Status:** **READY FOR MILESTONE & M7 VALIDATION**  
**Prepared By:** `test_writer_e2e` (2026-11-17T05:45:00Z)

---

## 1. Test Runner

The E2E suite is implemented in **Python 3.12.10 (`unittest` / `pytest`-compatible) + Selenium 4.52.0 (headless Google Chrome)** with strict `%TEMP%` SQLite database cloning and ephemeral localhost port isolation (`tests/e2e/harness.py`, `tests/e2e/_server_boot.py`).

### Primary Commands
```powershell
# Fast smoke verification (isolated %TEMP% DB + Chrome WebDriver):
python tests/e2e/run_e2e.py --smoke

# Individual tiers:
python tests/e2e/run_e2e.py --tier 1
python tests/e2e/run_e2e.py --tier 2
python tests/e2e/run_e2e.py --tier 3
python tests/e2e/run_e2e.py --tier 4

# Full Dual-Track E2E Suite with structured JSON & Markdown reports:
python tests/e2e/run_e2e.py --tier all --json-out "$env:TEMP\amk_e2e_report.json" --md-out "$env:TEMP\amk_e2e_report.md"
```

### Isolation Guarantees
- Clones `database.db` into `%TEMP%\amk_e2e_db_*` per test class and cleans up on teardown (`repo/database.db` SHA-256 verified unchanged).
- Runs `server.py` on dynamic free port `127.0.0.1:<port>` with `RENDER`/`HOSTED`/`DATABASE_URL`/`MAIL_API_KEY`/`SMTP_PASSWORD` unset (and LLM keys stripped by default for deterministic `503 BLOCKED` verification).
- Redirects server stdout/stderr to a temporary log file (`server.log`) in `%TEMP%` to prevent Windows pipe buffer deadlocks.
- Captures failure screenshots automatically to `%TEMP%\amk_e2e_screenshots\`.

---

## 2. Coverage Summary

| Tier | File | Scope | Implemented Cases | Target Minimum |
|---|---|---|---:|---:|
| **Tier 1** | `tests/e2e/test_tier1_features.py` | Core Feature & Happy-Path Verification (12 groups × >= 5) | **62** | 60 |
| **Tier 2** | `tests/e2e/test_tier2_boundaries.py` | Boundary, Negative, RBAC, XSS/CSRF & Error Handling (12 groups × >= 5) | **62** | 60 |
| **Tier 3** | `tests/e2e/test_tier3_pairwise.py` | Cross-Feature Pairwise Combinations | **16** | 15 |
| **Tier 4** | `tests/e2e/test_tier4_scenarios.py` | Real-World E2E Scenarios (all 5 tracks + Teacher + Admin + Mobile) | **8** | 8 |
| **Total** | **`tests/e2e/`** | **Complete Opaque-Box E2E Suite** | **148** | **143** |

### Baseline Smoke Execution (`python tests/e2e/run_e2e.py --smoke`)
- **Result:** `total=7 passed=5 failed=2 errors=0 skipped=0 duration=62.91s` (`DB_UNCHANGED=True`)
- **Passed:** `test_auth_readiness_local_no_otp_required`, `test_courses_api_returns_5_specialties_with_20_lessons`, `test_3d_showcase_renders_webgl_canvas_on_index`, `test_ai_chat_returns_503_blocked_without_api_key`, `test_unauthenticated_protected_endpoints_return_401`.
- **Expected Pre-M1/M2 Baseline Failures:** `test_all_20_html_pages_load_http_200_zero_severe_errors` and `test_guest_learn_page_has_zero_401_console_errors` fail honestly because guest visits to `learn.html`, `mission.html`, `teacher.html`, `admin.html`, `gradebook.html`, and `verify.html` currently emit unguarded `401`/`404` requests on page load (pending `T-M1-10` / M2 completion).

---

## 3. Feature Checklist

- [x] **G01 — Auth, Roles & Optional Local Email OTP:** Readiness contract, OTP-optional student/teacher registration, session lifecycle, CSRF token exposure, no plaintext `localStorage` passwords, weak-password/duplicate-email/RBAC/rate-limit boundaries (`12` Tier 1–2 tests + `T3`/`T4`).
- [x] **G02 — 5-Specialty Catalog, 20-Module Curriculum & Video Player:** `100` lessons/tasks health parity, `20` modules/specialty, Lesson 20 access, `<video>` `.mp4`/`.jpg`/`.vtt` readiness, zero `cdn.tailwindcss.com`, Pro lock & invalid cert boundaries (`11` Tier 1–2 tests + `T3`/`T4`).
- [x] **G03 — Student / Teacher / Admin Portals, XSS & RBAC Gates:** Live portal rendering, teacher grading, fake `'48'` KPI guard, cross-user IDOR, teacher group isolation, CSRF/Origin enforcement, stored XSS escape, SQLi fuzz safety (`10` Tier 1–2 tests + `T3`/`T4`).
- [x] **G04 — 3D Automechanic Workshop, Graphics Profiles & Disposal:** WebGL canvas init, `EduWorkshop3D.mount`, `LOW`/`BALANCED`/`ULTRA` switching & fallback, tool/disassembly DAG persistence & invalid-order/wrong-tool rejection, disposal API (`10` Tier 1–2 tests + `T3`/`T4`).
- [x] **G05 — Deterministic 5-Specialty Physics Simulators (`EduPhysics`):** Graphic Design WCAG 2.1, Autoelectric DC Ohm/Kirchhoff, HVAC multi-refrigerant P-T (`R134a`/`R410A`), Automechanic spiral torque-angle, Web-dev layout AST + degenerate/overflow boundaries (`10` Tier 1–2 tests + `T4`).
- [x] **G06 — 4 Student Tools Persistence:** Search, GPA Calculator, Task Hub, Study Timer/Notes + `/api/tools/state` reload persistence + XSS/empty/extreme bounds (`10` Tier 1–2 tests + `T3`/`T4`).
- [x] **G07 — Real Lesson & 3D-Aware LLM AI Mentor:** Explicit `503 BLOCKED` (`AI_PROVIDER_UNCONFIGURED`) across `/api/ai/chat`, `/api/ai/tutor`, `/api/ai/review_submission`, `/api/ai/generate_lesson`, UI `BLOCKED` banner, 3D/lesson context payload verification, XSS & auth gates (`10` Tier 1–2 tests + `T3`).
- [x] **G08 — Interactive Skill Map DAG:** 20 nodes/specialty, initial root unlock vs downstream prerequisite locks, UI rendering, progression update, achievements metadata, SQLi/auth boundaries (`10` Tier 1–2 tests + `T3`/`T4`).
- [x] **G09 — Practical Missions (All 5 Specializations):** Stage save/submit & ledger XP across `it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic` + XP idempotency, empty answer, IDOR, auth boundaries (`10` Tier 1–2 tests + `T3`/`T4`).
- [x] **G10 — Automatic Student Portfolio:** Live DB aggregation (`/api/portfolio/me`), privacy & consent gates (`is_public` + `consent_granted`), `show_grades` masking, valid `%PDF-1.` binary export, UI rendering (`10` Tier 1–2 tests + `T3`/`T4`).
- [x] **G11 — Practical 3D Exams & Teacher Review:** Signed `attempt_nonce`, telemetry event log, deterministic server rubric grading + `error_log_json`, forged score/nonce & replay rejection, teacher group-isolated review (`10` Tier 1–2 tests + `T3`/`T4`).
- [x] **G12 — Unified Design System, Responsive (`1440×900` & `390×844`) & `RU`/`KK` i18n:** All 20 HTML pages HTTP 200 & console error sweep, `light`/`graphite`/`neon` themes, `RU`/`KK` toggle persistence, mobile `scrollWidth <= 390`, `header <= 72px`, `.theme-switch` fit, single `<h1>`, guest gates (`11` Tier 1–2 tests + `T3`/`T4`).
