# Полный технический аудит платформы AMK SkillHub / EduSpace 3.0 (`AUDIT_REPORT.md`)

**Репозиторий:** `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub` (ветка `main`, HEAD `6e74f62`)  
**Дата аудита (UTC):** `2026-11-17T05:20:00Z`  
**Режим:** Stage 0 Read-Only Audit (исходный код и БД не изменялись; runtime-тест backend выполнен на изолированной временной копии SQLite в `%TEMP%`, browser-проверки выполнены в headless Google Chrome на `1440×900` и CDP `390×844`)  
**Эталонные URL:**  
- `https://denrench.github.io/amk-skillhub/index.html` (HTTP 200)  
- `https://denrench.github.io/amk-skillhub/lesson_player.html` (HTTP 200, 2 `SEVERE` CORS-ошибки к Render)  
- `https://amk-skillhub.onrender.com/api/health` (HTTP 200, `tasks_total: 50` — устаревшая сборка; `/api/auth/readiness` → HTTP 404)

---

## 1. Исполнительное резюме

Платформа **AMK SkillHub / EduSpace 3.0** представляет собой монолитное Flask-приложение на **Python 3.12 + Flask 3.1.3** (`server.py`, 5 161 строка), дополненное Blueprint `routes_interactive_lessons.py` (707 строк), модулем ИИ `eduspace_ai.py` (369 строк), сидером `curriculum_seeder.py` (483 строки), скриптом миграции `migrate_to_postgres.py` (410 строк) и многостраничным фронтендом из **20 HTML-страниц**, **7 CSS-файлов**, **21 собственного JS-модуля**, **12 vendor-скриптов Three.js r128** и **2 файлов локализации** (`locales/ru.json`, `locales/kk.json` — 198/198 ключей).

Хотя базовый локальный запуск SQLite и основные страницы на десктопе работают без падений, аудит выявил **системные критические дефекты безопасности, архитектурные рассинхронизации, фейковые заглушки и визуальные конфликты**:

| Категория | CRITICAL | HIGH | MEDIUM | LOW | Всего |
|---|---:|---:|---:|---:|---:|
| Безопасность, Auth, RBAC, XSS, CSRF, Секреты (`AUD-SEC-*`) | 6 | 5 | 0 | 1 | 12 |
| Backend, PostgreSQL, Целостность данных (`AUD-BE-*`) | 4 | 5 | 3 | 1 | 13 |
| ИИ-наставник и заглушки/целостность (`AUD-AI-*` / `AUD-STUB-*`) | 5 | 8 | 4 | 0 | 17 |
| Frontend UI/UX, CSS-темы, Адаптивность, Маршруты (`AUD-FE-*`) | 0 | 4 | 5 | 3 | 12 |
| 3D-мастерская, WebGL, Ассеты (`AUD-3D-*`) | 0 | 4 | 3 | 0 | 7 |
| Симуляторы, Миссии, Карта навыков, Портфолио, Экзамены (`AUD-FEAT-*`) | 0 | 6 | 1 | 0 | 7 |
| Производительность и бандлинг (`AUD-PERF-*`) | 0 | 3 | 1 | 0 | 4 |
| Окружение и внешние блокеры (`AUD-ENV-*`) | 1 | 0 | 0 | 0 | 1 |
| **Итого уникальных (дедуплицированных) находок** | **16** | **35** | **17** | **5** | **73** |

*(Примечание: часть находок в исходных обзорах `BE-*`, `SEC-*`, `FE-*`, `AI-*`, `COV-*` и списке из 18 заглушек пересекались по корневой причине — ниже выполнена чистая дедупликация с сохранением полной 100% таблицы соответствия каждому исходному ID.)*

---

## 2. Статус локального окружения и внешние блокеры (`BLOCKED`)

Перед планированием доработки зафиксированы реальные ограничения среды выполнения (без имитации и заглушек):

| ID | Компонент / Ресурс | Текущий статус в локальной среде | Статус для проверок | Что требуется для разблокировки |
|---|---|---|---|---|
| **BLK-01** | **PostgreSQL (локальный сервер / `DATABASE_URL`)** | `psql`, `pg_isready`, служба PostgreSQL и `psycopg2-binary` **отсутствуют** (`pg8000 1.31.6` установлен, но целевого PG-инстанса нет; `DATABASE_URL` не задана). | **`BLOCKED` (Runtime PG)** | Установка PostgreSQL / запуск Docker-контейнера или передача `DATABASE_URL`. Локальная БД работает через SQLite (`database.db`, 23 таблицы). |
| **BLK-02** | **Docker & Docker Compose** | `docker` CLI и Docker Desktop **не установлены**. | **`BLOCKED`** | Установка Docker Desktop. |
| **BLK-03** | **Node.js / npm & Playwright** | `node`, `npm`, `npx playwright`, Python `playwright` **не установлены**. Для браузерных проверок доступны установленные Google Chrome, Microsoft Edge и `selenium 4.52.0`. | **`BLOCKED` (Playwright / Node tooling)** | Использовать Python `selenium 4.52.0` + Chrome/Edge CDP (доступно) либо установить Node.js + Playwright. |
| **BLK-04** | **LLM API ключи (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`)** | **Все отсутствуют** в окружении и `.env*` файлах. | **`BLOCKED` (Live LLM тест)** | Передача API-ключа через переменные окружения или настройки пользователя в UI. При отсутствии ключа ИИ обязан возвращать честный `503 / BLOCKED`, без фейковых ответов. |
| **BLK-05** | **SMTP / Resend (`MAIL_API_KEY`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`)** | **Все отсутствуют**. Сейчас `POST /api/auth/send_code` возвращает `HTTP 503`. | **`BLOCKED` (Live Email отправка)** | По требованию R2 подтверждение email остаётся отключённым/опциональным в локальной среде и не должно блокировать регистрацию и вход. |
| **BLK-06** | **Продакшн-сервер Render (`amk-skillhub.onrender.com`) и авто-push в `main`** | На Render развёрнута устаревшая сборка (`tasks_total: 50`, `/api/auth/readiness` → `404`). Доступа на деплой Render нет; `git push` в `main` запрещён (R5). | **`BLOCKED` (Remote Deploy)** | Ручной деплой на Render после локальной верификации. |

---

## 3. Дедуплицированный реестр находок

### 3.1 Безопасность, аутентификация, RBAC, XSS, CSRF и секреты (`AUD-SEC-*`)

#### `AUD-SEC-01` [CRITICAL] Неаутентифицированный IDOR и захват аккаунта (профиль, биллинг, запись на курс, миссии, квесты, демо-статус)
- **Источники:** `BE-01`, `SEC-01`, `SEC-02`, `SEC-03`, `SEC-04`
- **Файлы и строки:**
  - `server.py:2454-2507` (`PUT /api/user/profile`) — отсутствует `@login_required()`. При `session_uid is None` доверяет `user_id` из JSON (строка 2457) и позволяет перезаписать `full_name`, `group_name`, `specialty_slug` и `password_hash` (строки 2487–2492, минимум 6 символов вместо 8).
  - `server.py:2301-2322` (`POST /api/courses/enroll`) — нет проверки auth, принимает произвольный `user_id` (строка 2304), меняет `enrollments` и `users.specialty_slug`, возвращает `serialize_user(row)`.
  - `server.py:3931-3966` (`GET /api/billing/status`) и `server.py:3969-4050` (`POST /api/billing/checkout`) — нет `@login_required()`, раскрывает email/ФИО/транзакции любого `user_id` и переводит любого пользователя в `subscription_tier = 'pro'` без проверки оплаты.
  - `server.py:4467-4490, 4590-4611, 4771-4792` (`/api/mission/state`, `/api/mission/save_stage`, `/api/mission/submit`) — содержат `elif req_user_id: user_id = int(req_user_id)`.
  - `server.py:5063-5071` (`/api/daily_quests`) и `server.py:2964` (`/api/demo/status`) — доверяют `user_id` из query/JSON без сессии.
  - `routes_interactive_lessons.py:95, 145, 351, 407, 682` — любой `teacher` может редактировать/удалять любые курсы, модули и уроки или просматривать чужие сдачи без проверки авторства/назначенных групп.
- **Корневая причина:** Маршруты добавлялись без обязательного `@login_required()`, с клиентским fallback `req_user_id` и отсутствием проверки владения/группы.
- **Способ устранения:** Навесить `@login_required()` на все перечисленные маршруты; извлекать `user_id` строго из `g.current_user['id']` (исключение — явный `@admin_required` или проверка кураторства группы); запретить самоповышение до `pro` без серверной подписи/sandbox-флага; требовать текущий пароль при смене пароля.
- **Метод проверки:** Автоматический RBAC-матричный тест: анонимные запросы к указанным API возвращают `401`, попытки студента А изменить данные студента Б возвращают `403`.

#### `AUD-SEC-02` [CRITICAL] Обязательная Email-OTP блокирует локальную регистрацию и сброс пароля + слабая валидация кодов преподавателя
- **Источники:** `BE-02`, `FE-CRIT-02`, `SEC-09` (часть 1), `STUB-09`
- **Файлы и строки:** `server.py:230-238, 1789-1814, 1881-1895, 1946-2006, 2083-2093, 2191-2193`; `auth.html:48, 53-55`; `js/academy-auth.js:106-124`.
- **Корневая причина:** `deliver_auth_code()` возвращает `False`, когда не заданы `MAIL_API_KEY`/`SMTP_PASSWORD`, из-за чего `/api/auth/send_code` возвращает `HTTP 503` (подтверждено в живом тесте). Одновременно `/api/auth/register` требует сохранённый OTP, а в `auth.html:54` у `#verification_code` стоит атрибут `required`. При этом в `server.py:230-238` в не-`HOSTED` режиме принимаются тривиальные коды преподавателя (`'AMK2026'`, `'2026'`), а на клиенте (`js/app-logistics.js:30`) эти коды и демо-пароли (`student123`, `teacher123`) захардкожены открыто.
- **Способ устранения:** При отсутствии SMTP/Resend в локальной среде (`not HOSTED` или `AUTH_REQUIRE_EMAIL_OTP=false`) сделать email-подтверждение опциональным: убрать `required` с `#verification_code` в `auth.html`, разрешить регистрацию без OTP с явным флагом `email_verification_required: false` в `/api/auth/readiness`. Перенести коды преподавателей из клиентского JS только на серверную конфигурацию (`TEACHER_ACCESS_CODES` / админ-выдача инвайтов).
- **Метод проверки:** Локальная регистрация нового студента и преподавателя через `auth.html` без отправки email-кода завершается `HTTP 201` и успешным входом; клиентский JS не содержит секретных кодов преподавателя.

#### `AUD-SEC-03` [CRITICAL] Хранимый и DOM-XSS в `lesson_player.html`, `simulator.html`, `app-logistics.js`, `photoreal-showcase.js`
- **Источники:** `FE-CRIT-01`, `SEC-07`
- **Файлы и строки:**
  - `lesson_player.html:1826-1832, 1867-1876` — `submitAiTutor()` интерполирует `${question}` и `${replyMsg}` в `container.innerHTML += ...` без `escapeHtml()`. Воспроизведено в headless Chrome: `<img src=x onerror="window.__xss=1">` выполнил JS (`window.__xss === true`).
  - `lesson_player.html:877, 891, 893, 931, 962, 964, 969, 970, 1110, 1111, 1152, 1153, 1186, 1187, 1219, 1220, 1348, 1482` — рендеры 8 блоков вставляют строки API/каталога через `innerHTML` без экранирования.
  - `simulator.html:1387, 1400` и `js/app-logistics.js:1698-1704, 1778-1784, 1929, 2588` — `full_name`, `task_title`, `teacher_comment`, тосты и модальные окна через сырой `innerHTML`.
  - `js/photoreal-showcase.js:77-83` — неэкранированные метаданные модели в `innerHTML`.
  - `simulator.html:1089` — выполнение пользовательского HTML/JS в `<iframe sandbox="allow-scripts">` без строгого CSP.
- **Корневая причина:** Использование строковой конкатенации в `innerHTML` вместо `textContent` или `escapeHtml()`.
- **Способ устранения:** Заменить небезопасные `innerHTML +=` на `DOM`-узлы (`createElement` + `textContent`) или обязательный вызов `escapeHtml()` на каждый динамический фрагмент; ужесточить CSP-песочницу для HTML-превью.
- **Метод проверки:** Ввод `<img src=x onerror=window.__xss=1>` в AI-чат, комментарий к заданию и профиль в Selenium/Chrome: `window.__xss === undefined`, теги отображаются как текст.

#### `AUD-SEC-04` [CRITICAL] Мёртвый Rate Limiter на `/api/auth/*` и отсутствие CSRF-токенов
- **Источники:** `BE-08`, `SEC-05`
- **Файлы и строки:** `server.py:151-176`.
- **Корневая причина:** `_enforce_rate_limit()` проверяет устаревшие пути `('/api/login', '/api/register')`, тогда как реальные маршруты — `/api/auth/login`, `/api/auth/register`, `/api/auth/send_code`, `/api/auth/verify_code`, `/api/auth/reset_password`. Проверка `Origin` пропускает любые `POST`/`PUT`/`DELETE` без заголовка `Origin`, а `CSRF`-токены на state-changing маршрутах не проверяются.
- **Способ устранения:** Обновить rate limiter на все `/api/auth/*` и `/api/ai/*` (по IP + account key); внедрить CSRF-защиту (double-submit cookie / `X-CSRF-Token` заголовок, выдаваемый с сессией, + строгий `SameSite=Lax` и валидация `Origin`/`Referer`).
- **Метод проверки:** >20 запросов подряд на `/api/auth/login` возвращают `HTTP 429`; `POST` с чужим `Origin` или без CSRF-токена (в cookie-сессии) возвращает `HTTP 403`.

#### `AUD-SEC-05` [CRITICAL] Приём клиентских оценок и результатов автотестов на сервере без проверки
- **Источники:** `STUB-05`, `EXM-01` (часть безопасности)
- **Файлы и строки:** `server.py:2790-2818` (`POST /api/tasks/submit`), `js/app-logistics.js:1455` (`new Function(...)`).
- **Корневая причина:** Сервер принимает `score`, `autotest_passed`, `autotest_total`, `quiz_score` из клиентского JSON и при `autotest_total > 0` автоматически выставляет `100/100`. При этом автотесты в `app-logistics.js:1455` исполняют код студента небезопасно через `new Function()` в основном контексте браузера.
- **Способ устранения:** Вычислять баллы квизов, миссий и 3D/профильных экзаменов детерминированно на сервере на основе эталонной рубрики и телеметрии действий; клиентские автотесты изолировать в sandboxed WebWorker/iframe без доступа к DOM/cookie.
- **Метод проверки:** Подмена `score: 100` / `autotest_passed: 5` в `POST /api/tasks/submit` при неверных ответах/событиях не приводит к выставлению 100 баллов.

#### `AUD-SEC-06` [CRITICAL] Фрагментированная клиентская авторизация с хранением паролей в открытом виде и полным mock-API в `localStorage`
- **Источники:** `FE-CRIT-03`, `STUB-07`, `STUB-08`
- **Файлы и строки:** `js/academy-auth.js:5, 34-74`, `js/app-logistics.js:15-16, 436-1351`.
- **Корневая причина:** `academy-auth.js` включает `localAuthFallback` только для `*.github.io`, сохраняет пароли в открытом виде в `localStorage['amk.local_accounts.v1']`, возвращает хардкод OTP `'123456'` и выдаёт роль `teacher` без проверки `teacher_code`. Параллельно `app-logistics.js` при любом сетевом сбое переключается в `handleLocalApi` и имитирует целый LMS в `localStorage`.
- **Способ устранения:** Удалить хранение паролей в открытом виде и фейковую выдачу ролей; маршрутизировать `academy-auth.js` через единый API-клиент с явным отображением статуса недоступности сервера (`Сервер недоступен`), сохраняя read-only демо-каталог только для статического просмотра без подмены авторизации и сохранения оценок.
- **Метод проверки:** При остановленном Flask-сервере попытка регистрации/логина честно сообщает о недоступности backend вместо записи plaintext-паролей в `localStorage`.

#### `AUD-SEC-07` [HIGH] Устаревшая роль в Cookie-сессии, отсутствие изоляции групп кураторов и небезопасный `/api/demo/reset`
- **Источники:** `BE-10`, `SEC-06`, `COV-02` (часть RBAC)
- **Файлы и строки:** `server.py:109-119, 2997-3034, 3041..4386, 5130`, `admin.html`.
- **Корневая причина:** Маршруты проверяют `session.get('user_role')` вместо свежего чтения пользователя из БД и `session_version`. `/api/demo/reset` открыт для студентов (`@login_required()` без проверки роли). `get_teacher_assigned_groups()` в fallback проверяет устаревшие слаги (`accountant`, `marketing`, `hospitality`), а `/api/teacher/matrix` и `/api/teacher/stats` не фильтруют студентов по группам преподавателя. `admin_change_role` не защищён от саморазжалования единственного админа.
- **Способ устранения:** Ввести `users.session_version` (инвалидируется при смене роли/пароля) и централизованный декоратор `@require_roles(...)` поверх `get_current_user()`; ограничить `/api/demo/reset` ролями `teacher/admin` (и отключать в `HOSTED`); обновить маппинг групп на 5 актуальных специальностей и фильтровать `matrix`/`stats` по группам куратора.
- **Метод проверки:** Понижение роли пользователя в БД при активной cookie-сессии немедленно даёт `401/403` на `/api/admin/*`; студент на `/api/demo/reset` получает `403`; преподаватель HVAC видит только свои группы.

#### `AUD-SEC-08` [HIGH] Необработанные 401/403 ошибки и поддельные KPI-заглушки на `admin.html`, `teacher.html`, `learn.html`
- **Источники:** `FE-HIGH-05`, `STUB-13`
- **Файлы и строки:** `admin.html:128, 133, 138, 143, 223-236`, `teacher.html`, `js/academy.js:36-41`.
- **Корневая причина:** `admin.html` отрисовывает в HTML фиктивные числа (`12`, `10`, `2`, `48`), причём `stat-submissions` (`48`) вообще никогда не обновляется из API; при `403` нет экрана запрета доступа. `learn.html` при анонимном входе вызывает `/api/academy/progress` и генерирует `401` ошибку в консоли.
- **Способ устранения:** Сначала проверять `/api/auth/session`, показывать явный gate-экран при отсутствии нужной роли, заменить статичные числа на `—` до загрузки реальных метрик и вычислять `stat-submissions` из БД.
- **Метод проверки:** Открытие `admin.html`, `teacher.html`, `learn.html` гостем и студентом: 0 неожиданных ошибок 401/403 в консоли и отсутствие фиктивных KPI-цифр.

#### `AUD-SEC-09` [HIGH] Захардкоженные секреты, пароли БД и личные email в исходниках и конфигурации
- **Источники:** `BE-16`, `SEC-08`
- **Файлы и строки:** `docker-compose.yml:11, 30, 31`, `server.py:120-135, 1783, 1929, 4201`, `eduspace_ai.py:16`, `.secret_key`, `database.db`.
- **Корневая причина:** В `docker-compose.yml` зашиты пароли и `SESSION_SECRET`; в `server.py` указаны личные Gmail (`d03509181@gmail.com`, `danidanilov333@gmail.com`); в `eduspace_ai.py:16` ключ Gemini передаётся в URL `?key=...` вместо заголовка `x-goog-api-key`.
- **Способ устранения:** Вынести секреты в `.env` / переменные окружения с fail-closed проверкой при `HOSTED=1`; перенести контактные email в env; передавать Gemini API-ключ в HTTP-заголовке.
- **Метод проверки:** Запуск с `HOSTED=1` и пустым `SESSION_SECRET` завершается ошибкой конфигурации; `grep` по исходникам не находит личных email и зашитых паролей.

#### `AUD-SEC-10` [HIGH] Перебор и подделка сертификатов (`/api/certificate/verify`, `verify.html`)
- **Источники:** `BE-12`, `SEC-09` (часть 2), `STUB-06`, `STUB-14`
- **Файлы и строки:** `server.py:4117-4207`, `verify.html:278-315, 345`.
- **Корневая причина:** Бэкенд при 0 сданных работ подставляет `raw_avg = 92.4` и статус `"VALID / ДЕЙСТВИТЕЛЕН"`, позволяет искать по последовательному `id`, `email` или `LIKE %cert%`, и формирует код без HMAC. На фронтенде `verify.html` рисует статичный фейковый SVG-QR и падает с `TypeError` на отсутствующем `#cert-standard-label`.
- **Способ устранения:** Выдавать `VALID` только при реальном завершении программы (или возвращать `IN_PROGRESS / НЕ ВЫДАН` и `0.0`), убрать поиск по `email`/числовому `id`, подписывать код сертификата через HMAC-SHA256, починить DOM `verify.html` и генерировать настоящий QR по URL проверки.
- **Метод проверки:** Запрос `/api/certificate/verify?cert=1` для студента с 0 сдач не возвращает `92.4` и `VALID`; страница `verify.html` загружается без `TypeError`.

#### `AUD-SEC-11` [HIGH] Клиентские ответы викторин и 3D-урока зашиты в браузерном JS
- **Источники:** `STUB-17`, `3D-07`
- **Файлы и строки:** `js/academy.js:325`, `js/starter-lesson.js:253`.
- **Корневая причина:** Правильные ответы тестов и узлы проверки 3D (`!selected.includes('battery') || !selected.includes('starter')`) проверяются исключительно на клиенте.
- **Способ устранения:** Перенести эталонную проверку зачётных тестов, 3D-мастерской и экзаменов на серверную сторону с сохранением шагов и вердикта в БД.
- **Метод проверки:** Подмена ответа на клиенте не засчитывает прохождение экзамена/зачёта на сервере.

#### `AUD-SEC-12` [LOW] Параметризованные SQL-запросы проверены (нарушений SQLi не найдено)
- **Источники:** `SEC-10`
- **Файлы и строки:** `server.py:3015-3021, 3124`, `routes_interactive_lessons.py:399`, `migrate_to_postgres.py:361-396`.
- **Наблюдение:** Все динамические SQL-шаблоны строят плейсхолдеры `?` для параметров или интерполируют имена таблиц из локальной схемы SQLite. Рекомендовано добавить явный allowlist-валидатор идентификаторов в `migrate_to_postgres.py`.

---

### 3.2 Backend, PostgreSQL и целостность данных (`AUD-BE-*`)

#### `AUD-BE-01` [CRITICAL] Рассинхронизация учебного плана «12 vs 20 уроков» (блокировка уроков 13–20)
- **Источники:** `BE-11`, `COV-01`
- **Файлы и строки:** `server.py:1442, 1455, 2294-2295, 2436, 2983-2992, 3055, 3747-3749, 4190`; `routes_interactive_lessons.py:452`.
- **Корневая причина:** В БД `database.db` и `curriculum_seeder.py` по **20** уроков и заданий на курс (100 всего), но `get_current_day` / `advance_day`, расчёт процентов курсов, профиль, сертификат, `/api/health` (`tasks_total: 60`) и `/api/academy/progress` (`not 1 <= number <= 12`) жёстко зажаты на цифре `12`.
- **Способ устранения:** Перевести лимиты и знаменатели прогресса на динамический подсчёт из таблиц `courses`/`lessons`/`tasks` (20 на курс, 100 всего) и расширить валидацию `/api/academy/progress` до `1..20`.
- **Метод проверки:** Перевод учебного дня до 20 открывает урок 20; `/api/courses` возвращает `total_lessons: 20`; `/api/health` показывает фактические `100` уроков/заданий.

#### `AUD-BE-02` [CRITICAL] Крах PostgreSQL-транзакции (`InFailedSqlTransaction`) в `award_xp()` и `daily_quests()`
- **Источники:** `BE-04`
- **Файлы и строки:** `server.py:1579-1605, 5090-5096`.
- **Корневая причина:** Перехват `Exception` вокруг `INSERT INTO xp_transactions` и `INSERT INTO daily_quests_log` при конфликте уникальности не вызывает `conn.rollback()`. В PostgreSQL следующий `SELECT` на том же соединении падает с ошибкой прерванной транзакции.
- **Способ устранения:** Вызывать `conn.rollback()` в `except` (или использовать атомарный `ON CONFLICT DO NOTHING` для обоих диалектов).
- **Метод проверки:** Повторный вызов `award_xp()` с тем же `(user_id, source_type, source_id)` в PG возвращает `awarded=False` без исключения.

#### `AUD-BE-03` [CRITICAL] Неполная инициализация PostgreSQL в `init_db()`, утечка в SQLite при `HOSTED=True` и неперехваченный PG `IntegrityError`
- **Источники:** `BE-05`
- **Файлы и строки:** `server.py:739-975, 2132`.
- **Корневая причина:** PG-ветка `init_db()` не заполняет таблицу `tasks` (100 записей) и демо-`enrollments`; строка 975 безусловно открывает локальный `database.db` даже при активном `DATABASE_URL`; регистрация в строке 2132 ловит только `sqlite3.IntegrityError`, приводя к `HTTP 500` при дубле email в PostgreSQL.
- **Способ устранения:** Вынести единые диалектно-независимые сидеры `tasks` и `enrollments`; пропускать инициализацию SQLite при заданном `DATABASE_URL` / `HOSTED=True`; ловить базовый `IntegrityError` / проверять конфликт через `ON CONFLICT`.
- **Метод проверки:** Инициализация на чистой PG-БД создаёт 100 `tasks` и `enrollments`, не трогает `database.db`, а дубль email при регистрации возвращает `409`.

#### `AUD-BE-04` [CRITICAL] Дрейф схемы в `migrate_to_postgres.py` и ошибка SSL в `pg8000`
- **Источники:** `BE-06`
- **Файлы и строки:** `migrate_to_postgres.py:74-92, 168-195`, `server.py:495, 650`.
- **Корневая причина:** В `migrate_to_postgres.py` отсутствуют колонки `users` (`bonus_xp`, `streak_days`, `achievements_json`), `email_verifications` (`purpose`, `attempts`), `lesson_progress` (`current_stage`, `mission_state_json`, `mission_xp`) и таблица `notification_reads`. В `server.py` для `pg8000` отключается SSL для любых хостов без `"render.com"` в имени.
- **Способ устранения:** Синхронизировать DDL всех 23+ таблиц в `migrate_to_postgres.py` с `server.py`; включать SSL при `sslmode=require` / `PGSSLMODE`.
- **Метод проверки:** Сверка DDL всех таблиц SQLite vs `migrate_to_postgres.py` vs `server.py` (100% паритет колонок).

#### `AUD-BE-05` [HIGH] Разделённые модели прогресса и непоследовательная проверка `is_pro_required` / `get_current_day`
- **Источники:** `BE-14`
- **Файлы и строки:** `server.py:2298, 2535, 2672-2698` vs `routes_interactive_lessons.py:182-270`.
- **Корневая причина:** Параллельные таблицы (`tasks` + `task_submissions` + `lesson_progress` vs `lessons` + `lesson_block_progress`), разная передача `user_id` в `get_current_day()` и отсутствие проверки `is_pro_required` в `list_lessons()`.
- **Способ устранения:** Унифицировать проверку доступа (день открытия + Pro-подписка или единая политика бесплатного госзаказа) и синхронизировать завершение уроков в обе модели.
- **Метод проверки:** Тест доступа к урокам/заданиям №1–20 в обоих API возвращает согласованные флаги `is_locked` и завершения.

#### `AUD-BE-06` [HIGH] Нарушение учёта XP, формулы уровней и двойной подсчёт в рейтинге
- **Источники:** `BE-13`
- **Файлы и строки:** `server.py:1579-1605, 4545, 4720, 4755, 4880, 4963, 5012`.
- **Корневая причина:** Эндпоинты миссий напрямую правят `users.bonus_xp` без записи в журнал `xp_transactions` и считают уровень как `1 + total_xp // 500` вместо `get_level_info()`. Сортировка лидерборда (строка 5012) суммирует `ledger_xp + bonus_xp + task_xp`, дважды учитывая XP.
- **Способ устранения:** Проводить все начисления строго через `award_xp()`, считать уровни только через `get_level_info()` и выровнять SQL-формулу лидерборда.
- **Метод проверки:** После завершения миссии есть запись в `xp_transactions`, уровень в миссии совпадает с профилем, порядок лидерборда строго монотонный по `total_xp`.

#### `AUD-BE-07` [HIGH] Несогласованность слагов специальностей (`design` vs `graphic_design`, устаревшие слаги в группах)
- **Источники:** `COV-02`, `FE-MED-04`
- **Файлы и строки:** `server.py:109-119, 4249-4291`, `career.html:183, 369`.
- **Корневая причина:** В разных модулях остались `'design'`, `'accountant'`, `'marketing'`, `'hospitality'` вместо канонических `it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic`.
- **Способ устранения:** Унифицировать все маппинги на канонические 5 слагов (оставить алиас `'design' -> 'graphic_design'` только на входе чтения старых записей).
- **Метод проверки:** Все 5 специальностей корректно резолвятся в кураторстве, ИИ, миссиях и портфолио.

#### `AUD-BE-08` [HIGH] Сломанный CORS и preflight `OPTIONS` для split-архитектуры GitHub Pages → Render
- **Источники:** `BE-09`, `FE-HIGH-04`
- **Файлы и строки:** `server.py:151-160, 1891-1894`; `lesson_player.html:616, 1670, 1744, 1852`; `auth.html:68`; `career.html:254, 547, 556`.
- **Корневая причина:** Только `/api/auth/readiness` отдаёт `Access-Control-Allow-Origin`; отсутствуют `@app.after_request` CORS-заголовки и обработка `OPTIONS`. На `denrench.github.io` страницы жёстко стучатся на `amk-skillhub.onrender.com` и падают с CORS-ошибками.
- **Способ устранения:** Добавить централизованный allowlist CORS в `server.py` (включая `OPTIONS` и `Access-Control-Allow-Credentials: true`); на фронтенде использовать настраиваемый `API_BASE` и безопасный статический режим без битых ссылок на Render.
- **Метод проверки:** `OPTIONS` и `POST` с `Origin: https://denrench.github.io` возвращают корректные CORS-заголовки; в браузере 0 CORS-ошибок.

#### `AUD-BE-09` [HIGH] Дрейф продакшена на Render и отсутствие PG/Docker/ключей локально
- **Источники:** `BE-07`
- **Детали:** Сведено в раздел 2 (`BLK-01..06`). Требуется честная фиксация `BLOCKED` в отчётах без имитации.

#### `AUD-BE-10` [MEDIUM] `/api/teacher/grade_submission` возвращает `200` на несуществующий ID; `/api/tasks/<id>` игнорирует `user_id`
- **Источники:** `BE-15`
- **Файлы и строки:** `server.py:3465-3499, 2672-2698`.
- **Способ устранения:** Возвращать `404` при `sub_row is None` и передавать `user_id` из сессии в `get_current_day()`.

#### `AUD-BE-11` [MEDIUM] Постоянный 301-редирект `/gradebook.html` и эфемерное хранилище загрузок
- **Источники:** `BE-17`, `FE-MED-06`
- **Файлы и строки:** `server.py:3823-3826, 4057-4110`, `gradebook.html:1-1411`.
- **Корневая причина:** В `gradebook.html` лежит 1 411 строк мёртвого кода за мгновенным редиректом на `teacher.html?tab=matrix`, а загрузки файлов пишутся на эфемерный локальный диск `static/uploads/submissions/`.
- **Способ устранения:** Очистить `gradebook.html` до минимальной заглушки-редиректа или заменить ссылки напрямую на `teacher.html?tab=matrix`; документировать ограничение локальных загрузок на Render / предусмотреть настраиваемый `UPLOAD_DIR`.

#### `AUD-BE-12` [LOW] Рассинхронизация `requirements.txt` и `KNOWN_ISSUES.md`
- **Источники:** `BE-18`
- **Файлы:** `requirements.txt` (`flask-cors` установлен в среде, но не указан в списке, и не импортирован в `server.py`), `KNOWN_ISSUES.md` (описывает несуществующий Dev Preview режим OTP).

---

### 3.3 ИИ-наставник и инвентарь 18 заглушек / рисков целостности (`AUD-AI-*` & `AUD-STUB-*`)

Ниже сведены все **3 проблемы ИИ-подсистемы (`AI-01..03`)** и **все 18 заглушек/моков** из обзора целостности:

| Новый ID | Исходные ID | Серьёзность | Местоположение | Суть заглушки / дефекта | Устранение и метод проверки |
|---|---|---|---|---|---|
| `AUD-AI-01` | `BE-03`, `AI-01`, `STUB-01` | **CRITICAL** | `server.py:4249-4292` | В `/api/ai/chat` нет `@login_required()`, а строки 4266–4268 буквально содержат `if api_key and ('AI_LIVE' in os.environ): pass`, всегда возвращая статичный словарь `CURRICULUM_KNOWLEDGE` (с ошибкой ключа `'design'`). | Внедрить реальный вызов LLM (Gemini / OpenAI / Anthropic / OpenRouter) из env или пользовательского ключа с контекстом урока/задания/3D-сцены; при отсутствии ключа возвращать явный `HTTP 503` (`AI_PROVIDER_UNCONFIGURED`, `BLOCKED`) без заготовленных фраз. |
| `AUD-AI-02` | `BE-03`, `AI-02`, `STUB-02`, `STUB-03` | **CRITICAL** | `eduspace_ai.py:16, 126-260, 329-369` | `review_submission_ai` не вызывает LLM и ставит `90` при `len(code) > 20` иначе `60`. `student_socratic_tutor` и `generate_lesson_content` тихо отдают шаблоны `heuristic_offline` при отсутствии ключей. Ключ Gemini передаётся в URL. | Удалить `heuristic_offline` и проверку длины текста; передавать ключ Gemini в заголовке `x-goog-api-key`; передавать контекст 3D-сцены и возвращать явный статус `BLOCKED`/503 при отсутствии ключа. |
| `AUD-AI-03` | `AI-03`, `STUB-04` | **HIGH** | `simulator.html:1448-1507`, `lesson_player.html:1826-1880` | `simulator.html` в `handleAiUserSubmit` / `sendAiQuickPrompt` даже не отправляет запрос в `/api/ai/chat`, а возвращает фиктивный ответ через `setTimeout`. `lesson_player.html:1880` подставляет фейковый ответ при ошибке сети. | Подключить оба UI к `POST /api/ai/chat` с реальным контекстом урока/3D-сцены; при `503`/`BLOCKED` показывать честный баннер о необходимости API-ключа. |
| `AUD-STUB-01..18` | `STUB-01..18` | **CRITICAL–MEDIUM** | Разные файлы | **Полный учёт 18 заглушек:**<br>1. `server.py:4249-4291` (`pass` в `/api/ai/chat`) → `AUD-AI-01`<br>2. `eduspace_ai.py:343-369` (`len > 20`) → `AUD-AI-02`<br>3. `eduspace_ai.py:126-260,329-341` (`heuristic_offline`) → `AUD-AI-02`<br>4. `simulator.html:1448-1507`, `lesson_player.html:1880` (`setTimeout` ИИ) → `AUD-AI-03`<br>5. `server.py:2790-2818` (клиентский `score`/`autotest_passed`) → `AUD-SEC-05`<br>6. `server.py:4162` (фиктивный балл `92.4` в сертификате) → `AUD-SEC-10`<br>7. `js/app-logistics.js:436-1351` (`handleLocalApi` mock backend) → `AUD-SEC-06`<br>8. `js/academy-auth.js:40,52` (plaintext-пароли + OTP `'123456'`) → `AUD-SEC-06`<br>9. `app-logistics.js:30,295` & `server.py:230-238,1381-1390` (клиентские teacher codes и демо-пароли) → `AUD-SEC-02`<br>10. `simulator.html:1232-1250` (`Math.random()` в датчиках мультиметра и HVAC) → `AUD-FEAT-01`<br>11. `js/interactive-simulators.js:148` (статичный WCAG `'12.5 : 1'`) → `AUD-FEAT-01`<br>12. `career.html:348-430,555-558` (статичный `RESUME_DATA` и телефон `77079079764`) → `AUD-FEAT-05`<br>13. `admin.html:128..143,223-236` (статичные KPI `12, 10, 2, 48`) → `AUD-SEC-08`<br>14. `verify.html:278-315,345` (статичный SVG QR + краш `#cert-standard-label`) → `AUD-SEC-10`<br>15. `pricing.html:308,339-348` (`SVG Kaspi QR Mock` + мгновенный Pro без оплаты) → `AUD-SEC-01` + `AUD-STUB-15`<br>16. `js/app-logistics.js:2386-2400` (`openZoomModal` пустая заглушка) → `AUD-STUB-16`<br>17. `js/academy.js:325`, `js/starter-lesson.js:253` (клиентские ответы тестов/3D) → `AUD-SEC-11`<br>18. `js/app-logistics.js:1455` (`new Function(...)` eval в основном окне) → `AUD-SEC-05` | По каждому пункту из 18 либо заменена реальной серверной/физической логикой, либо (для внешних ключей ИИ/почты/оплаты) переведена в честный `BLOCKED`/sandbox-статус с тестом верификации. Отдельно по `STUB-15` (Kaspi QR Mock): явно пометить локальный checkout как учебную sandbox-подписку/упразднить фейковый QR оплаты до подключения реального шлюза; по `STUB-16` (`openZoomModal`): либо реализовать живое расписание/ссылки консультаций из БД, либо удалить мёртвую кнопку. |

---

### 3.4 Frontend UI/UX, дизайн-система, адаптивность и HTML (`AUD-FE-*`)

#### `AUD-FE-01` [HIGH] Конфликт трёх несовместимых CSS-систем (`academy.css` vs `workshop.css` vs `photoreal-tools.css`)
- **Источники:** `FE-HIGH-01`
- **Файлы и строки:** `css/workshop.css:381-476`, `css/photoreal-tools.css:54-234`, `lesson_player.html:18, 37, 40, 42`.
- **Корневая причина:** `workshop.css` содержит глобальные `!important`-переопределения светлой темы (`background-color: rgba(255,255,255,0.92) !important`, `color: #0f172a !important` на `.bg-dark-900`, `.text-white` и т.д.), которые конфликтуют с `photoreal-tools.css` при включении тем `graphite` и `neon`, превращая интерфейс в «лоскутное одеяло» с падением контрастности ниже WCAG AA.
- **Способ устранения:** Заменить `!important`-костыли на единую систему CSS-токенов (`--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--glow`, `--border`) для `light`, `graphite` и `neon` согласно `DESIGN_SYSTEM.md`.
- **Метод проверки:** Переключение тем `light`/`graphite`/`neon` на всех основных страницах с проверкой контрастности `>= 4.5:1`.

#### `AUD-FE-02` [HIGH] Поломка мобильной шапки (114–275 px) и горизонтальный overflow на `390×844`
- **Источники:** `FE-HIGH-02`, `FE-LOW-02`
- **Файлы и строки:** `js/theme.js:39-61`, `css/photoreal-tools.css:236-275`, `index.html`, `auth.html`, `learn.html` (`scrollWidth=409`), `student.html`, `profile.html` (`.theme-switch` уходит до `499px`), `mission.html` (шапка `275px`, stepper до `697px`), `tools.html`, `career.html`, `admin.html` (`scrollWidth=393`), `simulator.html` (орбы до `730px`), `teacher.html` (таблица до `888px`).
- **Корневая причина:** На `< 640px` в шапке нет мобильного drawer/бургер-меню; `theme.js` вставляет `.theme-switch` прямо в `<header>` мимо внутреннего flex-контейнера; фоновые glow-орбы и таблицы не обёрнуты в `overflow-x: hidden` / скролл-контейнер.
- **Способ устранения:** Единый адаптивный header/drawer (`height <= 72px` на `390×844`), выделенный `#theme-switch-slot` внутри навигации, `overflow-x: clip` для декоративных слоёв и горизонтальный wrapper для таблиц.
- **Метод проверки:** CDP `390×844` тест по всем страницам: `document.documentElement.scrollWidth <= 390`, `header.getBoundingClientRect().height <= 72`, все элементы управления внутри вьюпорта.

#### `AUD-FE-03` [HIGH] Ошибка чтения `specialty_slug` вместо `course_slug` в `lesson_player.html` (блок 4 `3d_model`)
- **Источники:** `FE-HIGH-06`
- **Файлы и строки:** `lesson_player.html:1092` vs `389, 744`.
- **Корневая причина:** `renderInteractiveWidgetBlock` читает `currentLesson.specialty_slug`, игнорируя `course_slug`, из-за чего все 3D-виджеты откатываются к модели `it`.
- **Способ устранения:** Читать `currentLesson.course_slug || currentLesson.specialty_slug || 'it'`.
- **Метод проверки:** Открытие 3D-блока курса `automechanic` вызывает `EduSpace3D.renderAutomechanic3d` / профильную сцену.

#### `AUD-FE-04` [MEDIUM] Осиротевший видеоплеер и 300+ файлов `assets/lesson-intros/*`
- **Источники:** `FE-MED-01`
- **Файлы и строки:** `assets/lesson-intros/*` (100 `.mp4` + 100 `.jpg` + 100 `.vtt`, 27.08 МБ), `js/lesson-media.js`, `js/starter-lesson.js:15-89`, `lesson_player.html:954`.
- **Корневая причина:** `TopicGameEngine` вытеснил `<video>` из блока 3, оставив видеоплеер и субтитры VTT недоступными в активном UI, хотя R1/R2 требуют проверку видеоплеера.
- **Способ устранения:** Восстановить в `lesson_player.html` и `simulator.html` переключаемую вкладку «Видео-обзор урока» поверх `video_url` + `video_poster` + `.vtt` субтитров (сохраняя интерактивную вкладку по умолчанию).
- **Метод проверки:** Проверка в браузере воспроизведения `.mp4` + `<track kind="subtitles" src="...vtt">` (`readyState >= 2`, 0 сетевых ошибок).

#### `AUD-FE-05` [MEDIUM] Невалидный HTML в `simulator.html`, дублирующий `<h1>` в `verify.html` и дублирующийся `GLTFLoader.js` в `index.html`
- **Источники:** `FE-MED-02`, `FE-MED-05`
- **Файлы и строки:** `simulator.html:113-119` (`<div>` между `</head>` и `<body>`), `verify.html:95, 148` (два `<h1>`), `index.html:13, 16` (повторная загрузка `GLTFLoader.js`, когда он уже встроен в `three.min.js`).
- **Способ устранения:** Перенести `<div>` внутрь `<body>`, заменить второй `<h1>` на `<h2>`, убрать дубликат `GLTFLoader.js`.

#### `AUD-FE-06` [MEDIUM] Устаревший маркетинговый копирайт («50 модулей / 10 уроков») и расхождение бесплатного/Pro доступа
- **Источники:** `FE-MED-03`
- **Файлы и строки:** `features.html:237`, `pricing.html:192, 214, 217, 246`, `about.html:178`, `simulator.html:159, 406-425`.
- **Способ устранения:** Обновить все упоминания на 100 уроков / 20 модулей на специальность и согласовать модель доступа между страницами.

#### `AUD-FE-07` [MEDIUM] Локализация `ru`/`kk` (`i18n.js`) подключена только на `tasks.html`
- **Источники:** `I18N-01`
- **Файлы:** `js/i18n.js`, `locales/ru.json`, `locales/kk.json` (198 ключей) vs остальные 19 HTML-страниц.
- **Способ устранения:** Подключить единый `i18n.js` и переключатель `RU / KK` в общий header на всех страницах с сохранением 100% паритета ключей.

#### `AUD-FE-08` [LOW] Расхождение длины пароля (`8` vs `6` символов) и мёртвая секция `#account-hosted`
- **Источники:** `FE-LOW-01`, `FE-LOW-03`
- **Файлы и строки:** `auth.html:51-52, 66-69`, `js/app-logistics.js:135`.
- **Способ устранения:** Унифицировать минимум 8 символов везде и убрать неиспользуемую секцию `#account-hosted`.

---

### 3.5 3D-мастерская, WebGL и ассеты (`AUD-3D-*`)

#### `AUD-3D-01` [HIGH] Бинарный дубликат `hvac-chiller.glb` и `mech-cylinder.glb`
- **Источники:** `3D-01`
- **Файлы:** `assets/models/hvac-chiller.glb` и `assets/models/mech-cylinder.glb` — идентичный размер `1 838 084` байта и одинаковый SHA-256 (`BB5FBCCC73A3F68C52F26687FBB25B4A1248AB5F8A115EC55E7AC6A4451C47EE`).
- **Способ устранения:** Заменить один из файлов (создать/экспортировать уникальную модель чиллера или блока цилиндров ДВС) и зафиксировать 25 уникальных SHA-256 хешей в `3D_ASSET_MANIFEST.md`.
- **Метод проверки:** `Get-FileHash assets\models\*.glb -Algorithm SHA256` выдаёт 25 разных хешей.

#### `AUD-3D-02` [HIGH] Тяжёлые несжатые GLB-модели (до 11.78 МБ на файл, 31.62 МБ суммарно)
- **Источники:** `3D-02`
- **Файлы:** `mech-turbo.glb` (11.78 МБ), `mech-suspension.glb` (7.89 МБ), `mech-transmission.glb` (4.96 МБ), `autoel-charging.glb` (3.56 МБ).
- **Способ устранения:** Оптимизация геометрии и текстур (цель `<= 2 МБ` на модель, сжатие Draco/Meshopt, ленивая загрузка по `IntersectionObserver`).

#### `AUD-3D-03` [HIGH] Отсутствие `OrbitControls`, семантического Raycasting, теней, инструментов и сборки/разборки в `workshop-models.js`
- **Источники:** `3D-03`
- **Файлы и строки:** `js/workshop-models.js:1-1114` (строка 1047 группирует меши слепым делением `Math.floor(mIdx / groupSize)`).
- **Корневая причина:** Нет `OrbitControls`, нет именованных узлов деталей, нет `PCFSoftShadowMap`, нет DAG-порядка разборки/сборки, инструментов (`torque_wrench`, `socket_set`, `feeler_gauge`, `multimeter`) и сохранения состояния на сервере.
- **Способ устранения:** Реализовать полноценный `Workshop3DEngine` (эталон — Автомеханика) с `OrbitControls`, `Raycaster` по именованным мешам, тенями, набором инструментов, проверкой последовательности операций и серверным чекпоинтингом.

#### `AUD-3D-04` [HIGH] Утечки GPU-памяти (geometries, textures, PMREM) и DOM-слушателей во всех трёх 3D-модулях
- **Источники:** `3D-04`
- **Файлы и строки:** `js/eduspace-3d-engine.js:16-25, 150, 204-286`, `js/workshop-models.js:1074-1086`, `js/photoreal-showcase.js`.
- **Способ устранения:** Внедрить централизованный `disposeThreeScene()` с полным обходом сцены, освобождением `geometry`, `material`, `texture`, `envMap`, `PMREMGenerator`, `EffectComposer`, `ResizeObserver` и `window`-листенеров; подтвердить нулевой рост `renderer.info.memory` на 10 циклах mount/unmount.

#### `AUD-3D-05` [MEDIUM] Отсутствие профилей графики `LOW` / `BALANCED` / `ULTRA` и проверка `HalfFloatType` для HDRI
- **Источники:** `3D-05`, `3D-06`
- **Файлы:** `js/eduspace-3d-engine.js`, `js/workshop-models.js`, `js/photoreal-showcase.js`.
- **Способ устранения:** Ввести единый `GraphicsProfile` (`LOW` / `BALANCED` / `ULTRA`) с управлением DPR, тенями, HDRI `HalfFloatType`/`UnsignedByteType` fallback и post-processing Bloom.

---

### 3.6 Симуляторы, физика, инструменты студента, карта навыков, миссии, портфолио и экзамены (`AUD-FEAT-*`)

#### `AUD-FEAT-01` [HIGH] Фейковая физика в симуляторах и `Math.random()` вместо инженерных моделей
- **Источники:** `SIM-01`, `SIM-02`, `STUB-10`, `STUB-11`
- **Файлы и строки:** `js/interactive-simulators.js:148, 671, 726`, `simulator.html:1232-1250`, `js/lesson-interactives.js:1-655`.
- **Корневая причина:** Графический дизайн показывает статичный `'12.5 : 1 (AAA)'`; Автоэлектрика знает только CAN 60/120 Ом и `'O.L'`; HVAC считает одну линейную формулу `-26 + p * 10.5` при захардкоженном высоком давлении `14.5 бар`; Автомеханика проверяет последовательное нажатие `1..10` без спиральной схемы и ступеней момента/доворота; `simulator.html` генерирует показания приборов через `Math.random()`.
- **Способ устранения:** Внедрить детерминированные физические решатели: формулу относительной яркости WCAG 2.1, узловой DC-решатель Ома/Кирхгофа с неисправностями (обрыв, КЗ, переходное сопротивление), таблицы насыщения P–T для `R134a`/`R410A`/`R32`/`R600a` с расчётом перегрева/переохлаждения/COP, спиральный моментно-угловой алгоритм ГБЦ и реальный DOM/Flexbox sandbox для Web.

#### `AUD-FEAT-02` [HIGH] Неполные 4 инструмента студента (`student-tools.js`) и хранение задач только в `localStorage`
- **Источники:** `TLS-01`
- **Файлы:** `js/student-tools.js:1-323`, `tools.html`.
- **Способ устранения:** Довести до 4 полноценных инструментов (Поиск, Калькулятор GPA/прогресса, Менеджер задач с API-синхронизацией, Таймер/Заметки/Экспорт портфолио) + профильные инженерные калькуляторы на `tools.html`.

#### `AUD-FEAT-03` [HIGH] Плоские прогресс-бары вместо интерактивной Карты навыков (DAG с зависимостями и разблокировками)
- **Источники:** `SKM-01` (часть 1)
- **Файлы и строки:** `profile.html`, `server.py:2407-2422`.
- **Способ устранения:** Построить граф компетенций (DAG) по всем 20 модулям каждой специальности с пререквизитами, уровнями, достижениями и открытием практических миссий.

#### `AUD-FEAT-04` [HIGH] Отсутствие практических миссий по 4 из 5 специальностей
- **Источники:** `SKM-01` (часть 2)
- **Файлы и строки:** `mission.html`, `server.py:4467-4900`.
- **Корневая причина:** Миссия есть только одна (`mission.html` для задания №1 графического дизайна); у `it`, `autoelectric`, `hvac`, `automechanic` нет ни одной интерактивной миссии.
- **Способ устранения:** Реализовать реальные многоэтапные практические миссии для всех 5 специальностей с серверной валидацией этапов.

#### `AUD-FEAT-05` [HIGH] Отсутствие автоматического портфолио с приватностью, согласием на публикацию и реальным PDF
- **Источники:** `PRT-01`, `STUB-12`
- **Файлы и строки:** `profile.html`, `js/app-logistics.js:2371`, `career.html:348-558`.
- **Способ устранения:** Добавить настройки приватности и явного согласия (`portfolio_settings`), автоматическую агрегацию подтверждённых работ/навыков/оценок из БД, публичный read-only маршрут `/portfolio/<slug>` и реальную генерацию PDF-выписки.

#### `AUD-FEAT-06` [HIGH] Отсутствие практических 3D-экзаменов с журналом ошибок, анти-тамперингом и проверкой преподавателем
- **Источники:** `EXM-01`
- **Файлы:** `simulator.html`, `curriculum_seeder.py`, `server.py:2790-2818`.
- **Способ устранения:** Реализовать движок практических 3D/профильных экзаменов (эталон — Автомеханика + 4 профильных экзамена) с подписанными попытками, логом ошибок, серверным пересчётом баллов и очередью проверки преподавателя.

---

### 3.7 Производительность и сборка фронтенда (`AUD-PERF-*`)

#### `AUD-PERF-01` [HIGH] Двойная загрузка Tailwind (2.93 МБ `tailwind.min.css` + runtime `cdn.tailwindcss.com` без `tailwind.config`)
- **Источники:** `FE-HIGH-03`, `PERF-01`
- **Файлы:** 15 из 20 HTML-страниц.
- **Способ устранения:** Собрать единый очищенный локальный CSS-бандл и удалить все `<script src="https://cdn.tailwindcss.com">` для автономности, устранения FOUC и соблюдения CSP.

#### `AUD-PERF-02` [HIGH] Синхронная загрузка 1.49 МБ JS-каталогов (`courses-catalog.js` + `topic-games-60.js`) на всех страницах
- **Источники:** `PERF-02`
- **Способ устранения:** Вынести лёгкий индекс курсов (~10 КБ) и загружать детальные JSON-чанки уроков/игр лениво по `fetch()`.

#### `AUD-PERF-03` [HIGH] Несоответствие телеметрии `/api/health` (60 vs 100 заданий)
- **Источники:** `PERF-04`, `BE-11`
- **Файлы:** `server.py:3739-3760`, `render.yaml:9`, `docker-compose.yml:39`.
- **Способ устранения:** Отдавать реальные счётчики из БД и честный статус зависимостей (`db`, `ai`, `email`).

#### `AUD-PERF-04` [MEDIUM] Отсутствие кеширующих заголовков, сжатия GLB и ленивой загрузки медиаресурсов
- **Источники:** `PERF-03`
- **Файлы:** `assets/models/*` (31.62 МБ), `assets/lesson-intros/*` (27.08 МБ), `assets/photoreal/*` (17.49 МБ).
- **Способ устранения:** Настроить `Cache-Control` / `ETag` в Flask, оптимизировать GLB и подгружать 3D/видео по требованию.

---

## 4. Таблица 100% трассировки исходных ID находок

| Исходный ID | Единый ID в `AUDIT_REPORT.md` | Исходный ID | Единый ID в `AUDIT_REPORT.md` |
|---|---|---|---|
| `BE-01` | `AUD-SEC-01` | `FE-LOW-01` | `AUD-FE-08` |
| `BE-02` | `AUD-SEC-02` | `FE-LOW-02` | `AUD-FE-02` |
| `BE-03` | `AUD-AI-01`, `AUD-AI-02` | `FE-LOW-03` | `AUD-FE-08` |
| `BE-04` | `AUD-BE-02` | `3D-01` | `AUD-3D-01` |
| `BE-05` | `AUD-BE-03` | `3D-02` | `AUD-3D-02` |
| `BE-06` | `AUD-BE-04` | `3D-03` | `AUD-3D-03` |
| `BE-07` | `AUD-BE-09` (`BLK-01..06`) | `3D-04` | `AUD-3D-04` |
| `BE-08` | `AUD-SEC-04` | `3D-05`, `3D-06` | `AUD-3D-05` |
| `BE-09` | `AUD-BE-08` | `3D-07` | `AUD-SEC-11` |
| `BE-10` | `AUD-SEC-07` | `COV-01` | `AUD-BE-01` |
| `BE-11` | `AUD-BE-01`, `AUD-PERF-03` | `COV-02` | `AUD-BE-07` |
| `BE-12` | `AUD-SEC-10` | `SIM-01`, `SIM-02` | `AUD-FEAT-01` |
| `BE-13` | `AUD-BE-06` | `AI-01`, `AI-02`, `AI-03` | `AUD-AI-01`, `AUD-AI-02`, `AUD-AI-03` |
| `BE-14` | `AUD-BE-05` | `TLS-01` | `AUD-FEAT-02` |
| `BE-15` | `AUD-BE-10` | `SKM-01` | `AUD-FEAT-03`, `AUD-FEAT-04` |
| `BE-16` | `AUD-SEC-09` | `PRT-01` | `AUD-FEAT-05` |
| `BE-17` | `AUD-BE-11` | `EXM-01` | `AUD-FEAT-06`, `AUD-SEC-05` |
| `BE-18` | `AUD-BE-12` | `I18N-01` | `AUD-FE-07` |
| `FE-CRIT-01` | `AUD-SEC-03` | `SEC-01`..`SEC-04` | `AUD-SEC-01` |
| `FE-CRIT-02` | `AUD-SEC-02` | `SEC-05` | `AUD-SEC-04` |
| `FE-CRIT-03` | `AUD-SEC-06` | `SEC-06` | `AUD-SEC-07` |
| `FE-HIGH-01` | `AUD-FE-01` | `SEC-07` | `AUD-SEC-03` |
| `FE-HIGH-02` | `AUD-FE-02` | `SEC-08` | `AUD-SEC-09` |
| `FE-HIGH-03` | `AUD-PERF-01` | `SEC-09` | `AUD-SEC-02`, `AUD-SEC-10` |
| `FE-HIGH-04` | `AUD-BE-08` | `SEC-10` | `AUD-SEC-12` |
| `FE-HIGH-05` | `AUD-SEC-08` | `PERF-01`..`PERF-04` | `AUD-PERF-01`..`AUD-PERF-04` |
| `FE-HIGH-06` | `AUD-FE-03` | `STUB-01`..`STUB-18` | Сведены в таблице §3.3 (`AUD-STUB-01..18`) |
| `FE-MED-01` | `AUD-FE-04` | `FE-MED-04` | `AUD-BE-07` |
| `FE-MED-02`, `FE-MED-05` | `AUD-FE-05` | `FE-MED-06` | `AUD-BE-11` |
| `FE-MED-03` | `AUD-FE-06` | | |
