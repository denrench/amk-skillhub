# PROJECT AUDIT — AMK SkillHub (2026-11-27)

## 1. Структура и состояние проекта
- **Репозиторий:** `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub` (резервный тег `backup-pre-optimization` на коммите `f071372`).
- **Страницы (20 HTML):** `index.html`, `tasks.html`, `lesson_player.html`, `simulator.html`, `profile.html`, `teacher.html`, `admin.html`, `auth.html`, `learn.html`, `tools.html`, `features.html`, `about.html`, `career.html`, `mission.html`, `pricing.html`, `reviews.html`, `student.html`, `student-workspace.html`, `verify.html`, `gradebook.html`.
- **Backend:** `server.py` (Flask + SQLite), 39 автотестов (`tests/test_m1_foundation.py`, `tests/test_m2_m6_comprehensive.py`) — все 39 проходят.

## 2. Выявленные пробелы по этапам
1. **3D-модели (Этап 1):** В `js/pro-workshop-25.js` обновлены 10/25 моделей (Автомеханика 5 + Автоэлектрика 5). Оставшиеся 15 моделей (IT/Веб-дизайн 5, Графический дизайн 5, HVAC 5) используют старые `.glb` (`it-*.glb`, `design-*.glb`, `hvac-*.glb`), отсутствует селектор качества (`Auto / Low / Medium / High / Ultra`).
2. **Производительность JS (Этап 2):** `js/courses-catalog.js` (~805 КБ) и `js/topic-games-60.js` (~685 КБ) суммарно занимают ~1,49 МБ и грузятся целиком.
3. **Локализация (Этап 3):** `locales/ru.json` и `locales/kk.json` содержат по 198 ключей; требуется расширение ключей для 3D-контролов, `gradebook.html` и проверка динамических элементов.
4. **Мобильная адаптация (Этап 4):** Требуется автоматический аудит ширины `320px–1920px` (приоритет `375px`) на отсутствие `scrollWidth > clientWidth` и наложений 3D-панели.
5. **Визуальное объединение (Этап 5):** `gradebook.html` сейчас является заглушкой-редиректом на 18 строк; на `tasks.html`, `simulator.html`, `profile.html`, `teacher.html`, `tools.html`, `admin.html` отсутствует единый `<footer>`.
