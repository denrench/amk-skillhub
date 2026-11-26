# CHANGELOG — AMK SKILLHUB × NYVOR

## [3.5.0] — 2026-11-25 — Global Autonomous Transformation (`AMK SkillHub × NyVor`)
### Added
- **NyVor Co-Branding**: Created `config/branding.json`, `assets/nyvor-logo.svg`, `assets/nyvor-monogram.svg`, skippable `1.75s` `AMK SkillHub × NyVor` splash intro (`js/theme.js`), dedicated Author & Brand section on `about.html`, and unified global footer across public pages.
- **Mobile Navigation Drawer**: Added `.amk-mobile-burger-btn` (`☰`) and `.amk-mobile-nav-sheet` on public pages at `<= 768px`.
- **Graphic Design Studio 2.0**: Added 10 commercial design presets (`Kaspi Red`, `Almaty Digital Summit`, `Qazaq Roast`, `Astana Motors EV`, `NyVor Cyber Identity`, etc.), multi-layer inspector, and real `canvas.toBlob()` binary export (`WebP`, `PNG`, `JPEG`) with `NyVor` watermark in `js/interactive-simulators.js`, `js/lesson-interactives.js`, and `js/topic-game-engine.js`.
- **19 Project Management & Architecture Documents**: Created full documentation suite in repository root.

### Fixed
- **Desktop `<nav>` Visibility**: Added responsive `@media (min-width: 768px)` rules for `.md\:flex`, `.md\:inline-flex`, `.md\:hidden` in `css/photoreal-tools.css` and `css/app.min.css`, restoring desktop navigation on `features.html`, `about.html`, `pricing.html`, `reviews.html`, `verify.html`, and `career.html`.
- **3-Theme Contrast & Readability**: Fixed `auth.html` dark-theme form labels/inputs, `learn.html` dark-theme `#academy-course-meter`, `index.html` light-theme `.amk-btn-ghost` (`Войти`), `lesson_player.html` light-theme integrity badge (`100%`), and `Выйти` buttons.
- **UI & Header Consistency**: Fixed `verify.html` header (`AMK SkillHub × NyVor`) and search icon `🔍` alignment, differentiated duplicate `tasks.html` CTA buttons, hid `API-ключ` button in `lesson_player.html` for regular students, and unified curriculum statistics (`5 специальностей · 100 уроков · по 20 модулей`).
- **Deterministic Simulators**: Replaced `Math.random()` in `simulator.html` with `window.EduPhysics` solvers.
- **Kazakh (`ҚАЗ`) Localization**: Expanded `js/i18n.js` (`SHARED_UI_PHRASES_RU_KK` and `translateSharedHeaderNodes`) to translate page headings, cards, buttons, and footers across `header`, `main`, and `footer`.

### Removed
- Removed all occurrences of unconfirmed email addresses from source code.
- Removed 8 unused Three.js post-processing shader `<script>` tags from `index.html`.
- Removed dead file `js/showcase-dioramas.js` and stray `%SystemDrive%` folder.
