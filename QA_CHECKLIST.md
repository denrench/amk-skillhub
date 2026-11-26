# QA CHECKLIST — AMK SKILLHUB × NYVOR

- [x] **Brand & Author Accuracy**: `AMK SkillHub × NyVor`, `Данилов Данил` (`Danilov Danil`), `ПО25-2Б`, `Алматинский многопрофильный колледж`, `@denrench`, `@ny.vor`.
- [x] **Email Privacy Rule**: Zero occurrences of unconfirmed owner emails in any code file.
- [x] **Curriculum Numbers**: `5 специальностей · 100 уроков · по 20 модулей · 25 3D-моделей` consistent across all pages.
- [x] **Desktop Navigation**: `<nav>` visible at `1440×900` on all public and marketing pages.
- [x] **Mobile Navigation & Viewport**: Burger button `☰` visible at `375×812` and `390×844`; `scrollWidth <= 390`; `header <= 72px`.
- [x] **3 Themes (`neon`, `graphite`, `light`)**: Form labels, progress meters, ghost buttons, and badges meet contrast requirements in all 3 themes.
- [x] **Bilingual RU/KK (`РУС / ҚАЗ`)**: `scripts/check_locales.py` passes 100% (198 keys) and `js/i18n.js` translates headers, body headings, cards, buttons, and footers.
- [x] **Graphic Design Lab**: 10 commercial presets, live layer tree, and real `canvas.toBlob()` binary export (`WebP / PNG / JPEG`) with `NyVor` watermark.
- [x] **3D Showcase & Simulators**: 5 GLB models + 25 hotspots + deterministic `EduPhysics` calculations (zero `Math.random()`).
- [x] **Repository Hygiene**: `.gitignore` blocks `.agents/`, `.env`, `.secret_key`, `%SystemDrive%/`; dead files removed.
