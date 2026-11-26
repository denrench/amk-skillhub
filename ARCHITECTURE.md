# SYSTEM ARCHITECTURE — AMK SKILLHUB × NYVOR

## 1. High-Level Overview
AMK SkillHub × NyVor is a local-first, zero-CDN educational platform powered by:
- **Backend**: Python Flask (`server.py` / `app.py`) serving REST APIs (`/api/auth/*`, `/api/sync/*`, `/api/ai/tutor`, `/api/code/execute`, `/api/certificates/verify/*`, `/api/analytics/*`, `/api/teacher/*`) with SQLite WAL storage (`database.db`).
- **Frontend**: 20 modular HTML5 pages, local CSS architecture (`css/tailwind.min.css`, `css/workshop.css`, `css/style.css`, `css/photoreal-tools.css`, compiled into `css/app.min.css`), and vanilla ES6 modules.
- **3D & Simulation Layer**: Three.js r128 + `GLTFLoader` + `DRACOLoader` (`js/photoreal-showcase.js`, `js/three-viewer.js`) + deterministic physics engine (`js/physics-engine.js`) + 5-specialty interactive workbenches (`js/interactive-simulators.js`, `js/lesson-interactives.js`, `js/topic-game-engine.js`).
- **Brand & Localization Layer**: `config/branding.json`, `js/theme.js` (3 themes: `neon`, `graphite`, `light` + splash intro + mobile navigation drawer), `js/i18n.js` (`locales/ru.json`, `locales/kk.json`).
