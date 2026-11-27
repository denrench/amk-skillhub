# LOCALIZATION REPORT — AMK SkillHub (РУС / ҚАЗ)

- **Файлы локализации:** `locales/ru.json` (198 ключей), `locales/kk.json` (198 ключей).
- **Расхождения между `ru.json` и `kk.json`:** 0 (100% паритет ключей).
- **Проверка казахских символов:** в `locales/kk.json` корректно используются специфические символы `Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, І` и подключаются локальные шрифты `Inter` с поддержкой кириллицы (`inter-cyrillic-400.woff2`, `inter-cyrillic-700.woff2`).
- **Атрибут `lang` и переключение без перезагрузки:** `js/i18n.js` обновляет `document.documentElement.lang`, `localStorage`, текстовые узлы, `placeholder`, `title`, `aria-label` и `data-tooltip`.
- **Новые страницы:** в переработанном `gradebook.html` (Этап 5) подключены `js/i18n.js` и двуязычные RU/KK-подписи.
