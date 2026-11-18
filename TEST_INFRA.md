# TEST_INFRA.md — Dual-Track E2E Opaque-Box Test Infrastructure

**Project:** AMK SkillHub / EduSpace 3.0  
**Repository:** `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub`  
**Scope Authority:** `.agents/teamwork/ORIGINAL_REQUEST.md` & `PROJECT.md`

---

## 1. Test Philosophy

1. **Requirement-Driven Opaque-Box Testing:**  
   All E2E test cases in `tests/e2e/` are derived strictly from `.agents/teamwork/ORIGINAL_REQUEST.md` (Requirements `R1`–`R5` & Acceptance Criteria) and `PROJECT.md` (`Feature Inventory` & `Interface Contracts`). Tests interact with the application through real HTTP endpoints and a real headless Google Chrome browser (`Selenium 4`), never importing Flask route internals or patching implementation bugs to pass.
2. **Zero Facade / Zero Mock Cheating:**  
   Every test asserts real observable behavior: DOM state, CSS layout geometry, WebGL canvas/memory telemetry, deterministic physics equations, HTTP status codes, and database persistence across full page reloads. Unconfigured external services (e.g., missing LLM API keys) are explicitly tested for honest `503 BLOCKED` reporting rather than faked passes.
3. **Strict Environment & Database Isolation:**  
   Every test class or session clones `database.db` into a unique temporary directory under `%TEMP%` (`EDUSPACE_DB_PATH` + `server.DB_PATH` override) and launches `server.py` on a dynamically allocated ephemeral localhost port (`127.0.0.1:<free_port>`). The repository's `database.db` is **never** mutated.
4. **Honest Baseline & Progressive Verification:**  
   Tests covering unimplemented milestone features (`M1`–`M5`) fail honestly with clear assertion messages until their target milestone is delivered. Passing status requires genuine satisfaction of the contract.

---

## 2. Feature Inventory (Mapped to `PROJECT.md` & `ORIGINAL_REQUEST.md`)

| Group ID | Feature Group | `PROJECT.md` Feature IDs | `ORIGINAL_REQUEST.md` Refs | E2E Coverage |
|---|---|---|---|---|
| **G01** | Auth, Roles, Optional Local Email OTP & Session Security | `FEAT-01`, `FEAT-02`, `FEAT-03`, `FEAT-04` | `R2`, `R5` | `TestT1Group01*`, `TestT2Group01*`, `T3`, `T4` |
| **G02** | 5-Specialty Catalog, 20-Module Curriculum & Video Player | `FEAT-05`, `FEAT-12`, `FEAT-14` | `R2`, `R5` | `TestT1Group02*`, `TestT2Group02*`, `T3`, `T4` |
| **G03** | Student / Teacher / Admin Portals, XSS & RBAC Gates | `FEAT-01`, `FEAT-03`, `FEAT-07`, `FEAT-08`, `FEAT-09` | `R2`, `R5` | `TestT1Group03*`, `TestT2Group03*`, `T3`, `T4` |
| **G04** | 3D Automechanic Workshop, GLBs, Graphics Profiles (`LOW`/`BALANCED`/`ULTRA`) & Disposal | `FEAT-15`, `FEAT-16`, `FEAT-17`, `FEAT-18` | `R3`, `R5` | `TestT1Group04*`, `TestT2Group04*`, `T3`, `T4` |
| **G05** | Deterministic 5-Specialty Physics Simulators (`EduPhysics`) | `FEAT-19` | `R3` | `TestT1Group05*`, `TestT2Group05*`, `T3`, `T4` |
| **G06** | 4 Student Tools Persistence (Search, GPA, Task Hub, Study Timer/Notes) | `FEAT-20` | `R3` | `TestT1Group06*`, `TestT2Group06*`, `T3`, `T4` |
| **G07** | Real Lesson & 3D-Aware LLM AI Mentor (`503 BLOCKED` / Context Contract) | `FEAT-21` | `R3` | `TestT1Group07*`, `TestT2Group07*`, `T3` |
| **G08** | Interactive Skill Map DAG (20 Nodes/Specialty, Prerequisites, Achievements) | `FEAT-22` | `R4` | `TestT1Group08*`, `TestT2Group08*`, `T3`, `T4` |
| **G09** | Practical Missions Across All 5 Specializations | `FEAT-23` | `R4` | `TestT1Group09*`, `TestT2Group09*`, `T3`, `T4` |
| **G10** | Automatic Student Portfolio (Privacy, Consent Public Link, Real PDF Export) | `FEAT-24` | `R4` | `TestT1Group10*`, `TestT2Group10*`, `T3`, `T4` |
| **G11** | Practical 3D Exams, Anti-Tamper Scoring, Error Log & Teacher Review | `FEAT-25` | `R4`, `R5` | `TestT1Group11*`, `TestT2Group11*`, `T3`, `T4` |
| **G12** | Unified Design System (`light`/`graphite`/`neon`), Responsive (`1440×900` & `390×844`), `RU`/`KK` i18n | `FEAT-10`, `FEAT-11`, `FEAT-13`, `FEAT-26` | `R2`, `R5` | `TestT1Group12*`, `TestT2Group12*`, `T3`, `T4` |

*Note on External Blockers:* PostgreSQL (`psql`/Docker absent locally), SMTP/Resend live email delivery, live Render deployment checks, and live third-party LLM output (when API keys are unset) are explicitly tracked as environment `BLOCKED` items per `TEST_PLAN.md §1.2`.

---

## 3. Test Architecture

```
tests/e2e/
├── __init__.py
├── _server_boot.py          # Isolated Flask subprocess entry point using %TEMP% DB clone
├── harness.py               # TempDatabaseClone, IsolatedServer, Chrome driver factory (Desktop/Mobile CDP),
│                            # ConsoleAndNetworkCollector, ApiClient (with CSRF support), screenshot-on-failure
├── conftest_e2e.py          # Pytest-compatible fixtures + shared E2E harness exports
├── run_e2e.py               # CLI runner (--tier 1|2|3|4|all, --smoke, --json-out, --md-out)
├── test_tier1_features.py   # Tier 1: Core feature & happy-path verification (62 checks)
├── test_tier2_boundaries.py # Tier 2: Boundary, negative, security & error-handling checks (61 checks)
├── test_tier3_pairwise.py   # Tier 3: Cross-feature pairwise integration tests (16 checks)
└── test_tier4_scenarios.py  # Tier 4: Full end-to-end real-world journeys (8 scenarios)
```

### Runtime Stack
- **Language & Runner:** Python 3.12.10 `unittest` (with `pytest`-compatible naming and `conftest_e2e.py` fixtures).
- **Browser Automation:** `selenium 4.52.0` + headless Google Chrome (`--headless=new`, `--enable-webgl`, `--use-gl=angle`, `--use-angle=swiftshader` fallback).
- **Viewports:** Desktop `1440×900` and Mobile CDP Emulation `390×844` (`deviceScaleFactor=3`, `mobile=True`, `touch=True`).
- **Network Interception:** Chrome DevTools Protocol (`Network.setBlockedURLs`, `Performance` / browser console logs) to verify zero CDN dependencies (`cdn.tailwindcss.com`) and capture uncaught JS/HTTP errors.
- **Screenshot-on-Failure:** Saved automatically to `%TEMP%/amk_e2e_screenshots/` with test name and UTC timestamp.

---

## 4. Real-World Application Scenarios (Tier 4)

1. **`automechanic` Full Journey:** Register student without email OTP -> complete lesson & video overview -> 3D workshop tool selection & disassembly with reload persistence -> practical mission -> 3D practical exam -> Skill Map + XP + PDF portfolio export.
2. **`autoelectric` Diagnostic Journey:** Register student -> Ohm/Kirchhoff DC circuit & fault diagnosis in simulator -> `autoelectric` mission -> practical exam -> portfolio verification.
3. **`hvac` Thermodynamic Journey:** Register student -> `R410A`/`R134a` P-T superheat/subcooling calculations -> `hvac` mission -> Skill Map unlock & XP verification.
4. **`it` Web-Dev Journey:** Register student -> access 20-module curriculum through lesson 20 -> Flexbox/Grid layout evaluation -> `it` mission -> portfolio aggregation.
5. **`graphic_design` WCAG & Consent Portfolio Journey:** Register student -> WCAG 2.1 contrast simulator -> `graphic_design` mission -> privacy settings (`is_public` + `consent_granted` + `show_grades`) -> public portfolio URL & PDF export.
6. **Teacher Grading & Exam Review Workflow:** Teacher logs in -> views assigned group students -> grades task submission -> inspects student 3D exam `error_log_json` -> approves review; verifies cross-specialty isolation.
7. **Admin Governance Workflow:** Admin logs in -> checks live platform KPIs -> updates user role -> inspects audit logs -> verifies stale `session_version` cookie invalidation.
8. **Mobile Multilingual Accessibility Journey (`390×844`):** Guest opens mobile `index.html` -> switches `KK` locale & `neon` theme -> uses mobile drawer -> registers/logs in -> persists Student Tools (Task Hub & Notes) across reload with `scrollWidth <= 390` and `header <= 72px`.

---

## 5. Coverage Thresholds

| Tier | Description | Target Minimum | Implemented | Pass Criteria (M7 Gate) |
|---|---|---:|---:|---|
| **Tier 1** | Core Features (12 groups × >= 5 checks) | 60 | 62 | 100% Pass |
| **Tier 2** | Boundaries & Negative Cases (12 groups × >= 5 checks) | 60 | 61 | 100% Pass |
| **Tier 3** | Cross-Feature Pairwise Combinations | 15 | 16 | 100% Pass |
| **Tier 4** | Real-World End-to-End Scenarios | 8 | 8 | 100% Pass |
| **Total** | **Opaque-Box E2E Suite** | **143** | **147** | **100% Pass (0 skips except documented external `BLOCKED`)** |
