# BUG TRACKER — AMK SKILLHUB × NYVOR

| Bug ID | Severity | Location | Description | Resolution | Status |
|---|---|---|---|---|---|
| BUG-01 | High | `features.html`, `about.html`, `pricing.html`, `reviews.html`, `verify.html`, `career.html` | Desktop `<nav class="hidden md:flex">` hidden at 1440px width | Added `@media (min-width: 768px) { .md\:flex { display: flex !important; } }` in `css/photoreal-tools.css` | `VERIFIED` |
| BUG-02 | High | `auth.html` | Dark-theme form labels (`Почта`, `Пароль`) dark on dark card; inputs blinding white | Added `:root[data-theme="neon"/"graphite"] .fields label` and `.fields input` rules | `VERIFIED` |
| BUG-03 | High | `learn.html` | `#academy-course-meter` stayed bright white (`#f8fafc`) with `#1e293b` text in dark themes | Updated `js/academy.js` and `css/photoreal-tools.css` to use `var(--ink)` and `var(--bg-elev)` | `VERIFIED` |
| BUG-04 | Medium | `index.html`, `learn.html`, `auth.html`, `features.html`, `about.html` | Missing mobile burger menu button (`☰`) at 375px/390px | Implemented `buildMobileNavToggle()` in `js/theme.js` + `.amk-mobile-burger-btn` CSS | `VERIFIED` |
| BUG-05 | Medium | `index.html` | `.amk-btn-ghost` (`Войти →`) low contrast in light theme | Styled `:root[data-theme="light"] .amk-btn-ghost` with `#1e293b` ink and subtle border | `VERIFIED` |
| BUG-06 | Medium | `tasks.html` | Duplicate «Начать урок 1» buttons and non-standard language switcher | Differentiated header CTA (`Открыть плеер модуля №1`) and unified `.lang-switch` (`РУС / ҚАЗ`) | `VERIFIED` |
| BUG-07 | Medium | `lesson_player.html` | `API-ключ` button in AI Tutor drawer exposed to regular students | Added `hidden` class (`#lp-ai-key-trigger`), revealed only on HTTP 503 | `VERIFIED` |
| BUG-08 | Medium | `verify.html` | Old `E EDU SPACE` header, `gradebook.html` link, misaligned `🔍` icon | Unified header to `AMK SkillHub × NyVor`, removed `gradebook.html`, fixed `inset-y-0 flex items-center` | `VERIFIED` |
| BUG-09 | Medium | `about.html`, `features.html`, `pricing.html`, `reviews.html` | Outdated module counts (`50 модулей`, `10 модулей`) and email in footers | Updated to `100 уроков / по 20 модулей`, removed all unconfirmed emails | `VERIFIED` |
| BUG-10 | Medium | `simulator.html` | `Math.random()` used in multimeter and HVAC gauge quick tools | Replaced with deterministic `window.EduPhysics` solver calls | `VERIFIED` |
| BUG-11 | Low | `index.html` | 8 unused Three.js post-processing shader `<script>` tags loaded on startup | Removed unused shader script tags | `VERIFIED` |
