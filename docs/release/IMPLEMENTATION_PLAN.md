# IMPLEMENTATION PLAN — AMK SkillHub

- **Этап 0:** Полный аудит, резервный Git-тег `backup-pre-optimization`, создание плановых документов.
- **Этап 1:** Обновление оставшихся 15 3D-моделей (`it-*`, `design-*`, `hvac-*`) в `js/pro-workshop-25.js` до единого PBR-стандарта с анимациями, интерактивными деталями и селектором качества (`Auto / Low / Medium / High / Ultra`) в `js/workshop-models.js`.
- **Этап 2:** Разделение/оптимизация `js/courses-catalog.js` и `js/topic-games-60.js` по специальностям (lazy-load / per-course чанки с обратной совместимостью) + замеры до/после.
- **Этап 3:** Аудит и дополнение `locales/ru.json` и `locales/kk.json`, проверка казахских символов (`Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, І, Һ`) и отчёт `LOCALIZATION_REPORT.md`.
- **Этап 4:** Автоматический тест адаптивности (`320px`, `360px`, `375px`, `390px`, `414px`, `768px`, `1024px`, `1280px`, `1440px`, `1920px`) в Headless Chrome и устранение горизонтального скролла / наложений.
- **Этап 5:** Полноценная переработка `gradebook.html`, аудит и доводка `pricing.html` и `reviews.html`, единый `<footer>` на всех страницах.
- **Этапы 6–10:** Полный регрессионный прогон, расширенный QA-набор, публикация в `origin/main`, проверка `https://denrench.github.io/amk-skillhub/` и `FINAL_RELEASE_REPORT.md`.
