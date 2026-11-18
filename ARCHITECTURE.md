# Системная архитектура AMK SkillHub / EduSpace 3.0 (`ARCHITECTURE.md`)

**Целевой стек (существующий репозиторий):** Python 3.12 · Flask 3.1.3 · SQLite 3 (локально) / PostgreSQL (`psycopg2-binary` + `pg8000`) · Three.js r128 (`js/vendor/three.min.js`) · Vanilla JS ES6 + единый скомпилированный CSS.  
**Принцип эволюции:** Модернизация и декомпозиция существующего репозитория `C:\Users\Пользователь\.gemini\antigravity\scratch\amk-skillhub` с сохранением обратной совместимости всех публичных URL (`/`, `/auth.html`, `/learn.html`, `/lesson_player.html`, `/simulator.html`, `/student.html`, `/teacher.html`, `/admin.html`, `/profile.html`, `/career.html`, `/tools.html`, `/verify.html`, `/mission.html`, `/tasks.html` и `/api/*`).

---

## 1. Высокоуровневая архитектура и декомпозиция Backend

Текущий монолит `server.py` (5 161 строка) + `routes_interactive_lessons.py` (707 строк) поэтапно декомпозируется в модульные пакеты с сохранением точки входа `server.py:app` (для `run_server.bat`, `Procfile` и `gunicorn`):

```
amk-skillhub/
├── server.py                      # Инициализация Flask app, CORS, CSRF, rate-limit, регистрация Blueprints
├── core/
│   ├── db.py                      # Единый пул и адаптер SQLite / PostgreSQL (psycopg2 + pg8000), rollback-safe helpers
│   ├── schema.py                  # Идемпотентный DDL и сидер для SQLite & PG (100 уроков, 100 заданий, демо-аккаунты)
│   ├── security.py                # Сессии, session_version, @login_required, @require_roles, CSRF, rate-limit, HMAC-подписи
│   └── progress.py                # Единая модель 20 уроков/курс, award_xp(), get_level_info(), достижения
├── routes/
│   ├── auth_bp.py                 # /api/auth/* (логин, регистрация с опциональным OTP, сброс пароля, readiness, сессия)
│   ├── courses_bp.py              # /api/courses*, /api/tasks*, /api/lessons*, /api/academy/progress (паритет 20 уроков)
│   ├── workshops_bp.py            # /api/workshop/* (чекпоинты 3D-разборки/сборки и телеметрия)
│   ├── missions_bp.py             # /api/mission/* (практические миссии по всем 5 специальностям)
│   ├── exams_bp.py                # /api/exams/* (подписанные попытки, журнал ошибок, автопроверка, очередь преподавателя)
│   ├── skills_portfolio_bp.py     # /api/skill_map, /api/portfolio*, /portfolio/<slug>, /api/certificate/verify
│   ├── ai_bp.py                   # /api/ai/chat, /api/ai/tutor, /api/ai/generate_lesson, /api/ai/review_submission, /api/ai/settings
│   └── staff_bp.py                # /api/teacher/*, /api/admin/*, /api/demo/reset, /api/billing/*
├── routes_interactive_lessons.py  # Сохраняется как Blueprint (или тонкий реэкспорт из routes/courses_bp.py)
├── eduspace_ai.py                 # Чистый LLM-клиент (Gemini / OpenAI / Anthropic / OpenRouter) с 3D/lesson контекстом
├── curriculum_seeder.py           # Сидер 5 курсов × 20 уроков (100 уроков + 100 заданий + 100 узлов карты навыков)
└── migrate_to_postgres.py         # Полная синхронизация всех таблиц и колонок SQLite → PostgreSQL
```

---

## 2. База данных и паритет SQLite / PostgreSQL

### 2.1 Инвентарь таблиц (23 существующие + 5 новых/расширенных)

**Существующие 23 таблицы (`database.db`):**
`users`, `courses`, `course_modules`, `lessons`, `tasks`, `enrollments`, `task_submissions`, `grades`, `lesson_progress`, `lesson_block_progress`, `xp_transactions`, `daily_quests_log`, `notifications`, `notification_reads`, `ai_conversations`, `audit_logs`, `email_verifications`, `messages`, `platform_settings`, `subscriptions`, `teacher_groups`, `transactions`, `sqlite_sequence` (в SQLite).

**Целевые расширения схемы:**
1. `users`: добавить `session_version INTEGER NOT NULL DEFAULT 1`, `ai_provider TEXT`, `ai_api_key_enc TEXT` (шифрование ключей пользователя через `cryptography.Fernet` на базе `SECRET_KEY`, в открытом виде не отдаётся клиенту).
2. `skill_nodes` и `user_skill_unlocks`:
   - `skill_nodes(id, specialty_slug, order_num, code, title, branch, tier, prereq_codes_json, required_lesson_num, mission_slug, xp_bonus)` — 20 узлов на специальность (100 всего).
   - `user_skill_unlocks(id, user_id, node_id, status ['locked'|'available'|'mastered'], unlocked_at, mastered_at, UNIQUE(user_id, node_id))`.
3. `workshop_states`:
   - `workshop_states(id, user_id, course_slug, model_key, mode ['practice'|'exam'], step_history_json, disassembled_parts_json, active_tool, telemetry_json, updated_at, UNIQUE(user_id, model_key, mode))`.
4. `exam_attempts` и `exam_error_logs`:
   - `exam_attempts(id, user_id, specialty_slug, scenario_code, attempt_token_hash, status ['in_progress'|'submitted'|'graded'|'flagged'], started_at, submitted_at, duration_sec, server_score, max_score, teacher_review_status, teacher_comment, reviewed_by)`.
   - `exam_error_logs(id, attempt_id, step_seq, action_type, target_part, expected_action, actual_action, severity, penalty_points, created_at)`.
5. `portfolio_settings`:
   - `portfolio_settings(user_id PRIMARY KEY, is_public INTEGER DEFAULT 0, public_slug TEXT UNIQUE, show_grades INTEGER DEFAULT 1, show_projects INTEGER DEFAULT 1, show_certificates INTEGER DEFAULT 1, consent_given INTEGER DEFAULT 0, consent_at TIMESTAMP, bio TEXT)`.

### 2.2 Правила диалектного паритета SQLite ↔ PostgreSQL
1. **Единый обёрнутый драйвер (`core/db.py`):**
   - Плейсхолдеры `?` транслируются в `%s` централизованно; строковые литералы внутри SQL не затрагиваются (парсер учитывает одинарные кавычки).
   - Идентификаторы таблиц/колонок в `migrate_to_postgres.py` проходят allowlist-проверку (`^[a-z_][a-z0-9_]*$`).
2. **Безопасность транзакций при конфликтах (`InFailedSqlTransaction`):**
   - Каждый `try ... except IntegrityError` (в `award_xp()`, `daily_quests()`, `register()`, upsert прогресса) обязан вызывать `conn.rollback()` в `except`, либо использовать явный `INSERT ... ON CONFLICT (...) DO NOTHING`.
   - Перехватываются оба исключения: `sqlite3.IntegrityError`, `psycopg2.IntegrityError`, `pg8000.dbapi.IntegrityError`.
3. **SSL для `pg8000`:**
   - Вместо проверки `"render.com" in hostname`, SSL включается при `?sslmode=require` / `PGSSLMODE=require` или для любых не-localhost хостов по умолчанию с явным `sslmode=disable` только для локальных сокетов.
4. **Изоляция от SQLite в `HOSTED=True` / при `DATABASE_URL`:**
   - `init_db()` выполняет DDL и сидинг **всех** 28 таблиц (включая `tasks` = 100 строк и `enrollments`) в активную БД и **не открывает** `database.db`, если активен PostgreSQL.

---

## 3. Безопасность: Auth, RBAC, CSRF, Rate Limiting и Email-верификация

1. **Единая проверка сессии и `session_version`:**
   - Cookie-сессия Flask (`HttpOnly`, `SameSite=Lax`, `Secure` в `HOSTED=True`) хранит `user_id` и `session_version`.
   - `get_current_user()` всегда читает актуальную строку из `users` и сравнивает `session['session_version'] == user['session_version']`.
   - Смена роли администратором, смена пароля или принудительный сброс инкрементируют `session_version += 1`, мгновенно аннулируя старые сессии.
2. **RBAC-матрица:**
   - `@login_required()`: обязателен на всех пользовательских маршрутах (`/api/user/profile`, `/api/courses/enroll`, `/api/mission/*`, `/api/daily_quests`, `/api/billing/*`, `/api/workshop/*`, `/api/exams/*`, `/api/ai/*`, `/api/portfolio*`). Ни один студенческий эндпоинт не принимает `user_id` из тела/query — используется строго `g.current_user['id']`.
   - `@require_roles('teacher', 'admin')`: `teacher` видит и оценивает **только** студентов своих назначенных групп (`get_teacher_assigned_groups()` для всех 5 канонических специальностей). `/api/demo/reset` доступен только `teacher`/`admin` (отключён при `HOSTED=True`).
   - `@require_roles('admin')`: управление ролями с запретом саморазжалования последнего администратора.
3. **CSRF и CORS:**
   - При создании сессии генерируется криптографический `csrf_token` (отдаётся через `/api/auth/session` и cookie/заголовок `X-CSRF-Token`). Все `POST`/`PUT`/`PATCH`/`DELETE` (кроме login/register, защищённых `Origin` + rate-limit) проверяют `X-CSRF-Token`.
   - `@app.after_request` добавляет CORS-заголовки только для allowlist (`https://denrench.github.io`, `http://localhost:*`, `http://127.0.0.1:*`) с `Vary: Origin` и корректной обработкой `OPTIONS`.
4. **Rate Limiting:**
   - Покрывает `/api/auth/login`, `/api/auth/register`, `/api/auth/send_code`, `/api/auth/verify_code`, `/api/auth/reset_password`, `/api/ai/*` (окна по IP и email/user_id).
5. **Опциональная Email-верификация в локальной среде:**
   - Флаг `EMAIL_VERIFICATION_REQUIRED = bool(HOSTED and (MAIL_API_KEY or SMTP_PASSWORD))` (по умолчанию `False` локально).
   - `GET /api/auth/readiness` возвращает `{"login": true, "registration": true, "email_verification_required": false, "mail_provider_configured": false}`.
   - В локальной среде регистрация (`POST /api/auth/register`) и вход (`POST /api/auth/login`) работают напрямую без SMTP/Resend, без фейковых OTP-заглушек `'123456'`.
6. **Парольная политика и санитайзинг:**
   - Минимум 8 символов (буква + цифра) на всех формах и API (`register`, `reset_password`, `PUT /api/user/profile`).
   - Все HTML-рендеры используют `textContent` / `escapeHtml()`; удаление plaintext-паролей и `handleLocalApi` из браузера.

---

## 4. Единая модель учебного плана (20 уроков на курс = 100 всего)

```
Course (5) ──▶ Modules ──▶ Lessons (1..20) ──▶ 8 Blocks (b1..b8)
   │                              │
   └────────── Tasks (1..20) ─────┴──▶ Единый сервис прогресса (core/progress.py)
                                            ├── lesson_block_progress (b1..b8)
                                            ├── lesson_progress (status)
                                            ├── task_submissions (практика/тест/экзамен)
                                            ├── xp_transactions (идемпотентный журнал)
                                            └── skill_nodes / user_skill_unlocks
```

- Канонические слаги специальностей (строго 5): `it`, `graphic_design`, `autoelectric`, `hvac`, `automechanic`.
- Все ограничения `12` и делители `12.0` / `60` заменяются динамическим значением `course.total_lessons` (`20` на курс, `100` по платформе).
- Начисления XP из уроков, заданий, миссий, квестов и экзаменов идут **только** через `award_xp(conn, user_id, amount, source_type, source_id, desc)` с проверкой `conn.rollback()` при дубле. Уровень вычисляется единой функцией `get_level_info(total_xp)`.

---

## 5. Архитектура 3D-мастерской и физических симуляторов

### 5.1 Движок 3D-мастерской (`js/workshop-3d-engine.js`)
Построен на локальном `Three.js r128` (`THREE.GLTFLoader`, `THREE.OrbitControls`, `THREE.RGBELoader`, `THREE.PMREMGenerator`, `THREE.EffectComposer`, `THREE.UnrealBloomPass`):
- **Эталон — Автомеханика (`automechanic`):**
  1. **Сцена и освещение:** студийный HDRI (`studio_small_09_1k.hdr`) + 3-точечный свет + `PCFSoftShadowMap` (на `BALANCED`/`ULTRA`).
  2. **Интерактивный Raycasting:** наведение и клик по именованным 3D-деталям (`node.name` по схеме из `3D_ASSET_MANIFEST.md`) с подсветкой контура/эмиссии и инспектором узла (допуски, износ, момент затяжки).
  3. **Инструменты мастера:** выбор активного инструмента (`inspect`, `socket_wrench`, `torque_wrench`, `feeler_gauge`, `multimeter`, `caliper`), влияющего на допустимые операции и телеметрию.
  4. **DAG разборки и сборки:** пошаговая проверка зависимостей деталей (нельзя снять поршень/распредвал до снятия клапанной крышки/ГБЦ; при сборке требуется правильная последовательность и момент затяжки) с плавной анимацией смещения (`lerp`) и записью ошибок.
  5. **Персистентность:** автосохранение шага, снятых узлов и активного инструмента в `POST /api/workshop/state` + восстановление при перезагрузке.
  6. **Профили графики (`LOW` / `BALANCED` / `ULTRA`) и `disposeThreeScene()`:** полное освобождение геометрий, материалов, текстур, рендер-таргетов, `PMREM`, `OrbitControls` и DOM/ResizeObserver-листенеров.

### 5.2 Детерминированные физические симуляторы по всем 5 направлениям (`js/physics/*.js`)
Заменяют все `Math.random()` и статические строки:
1. **`automechanic` (`js/physics/mech-physics.js`):** спиральный порядок затяжки ГБЦ (10 болтов из центра крест-накрест), 3 ступени затяжки (например, 30 Н·м → 60 Н·м → доворот +90°), расчёт компрессии/зазоров клапанов и биения тормозного диска.
2. **`autoelectric` (`js/physics/elec-physics.js`):** узловой решатель цепей постоянного тока по законам Ома и Кирхгофа ($I = U / (R_{load} + R_{fault})$, падение напряжения на клеммах, сопротивление шины CAN при обрыве/КЗ одного или двух терминаторов 120 Ω, моделирование утечки и просадки АКБ).
3. **`hvac` (`js/physics/hvac-physics.js`):** таблицы насыщения давление–температура ($P\text{–}T$) для хладагентов `R134a`, `R410A`, `R32`, `R600a`; расчёт температуры испарения/конденсации, перегрева ($\Delta T_{SH} = T_{suction} - T_{sat,LP}$), переохлаждения ($\Delta T_{SC} = T_{sat,HP} - T_{liquid}$) и холодильного коэффициента $COP$.
4. **`graphic_design` (`js/physics/design-physics.js`):** точный расчёт относительной яркости и контрастности по формуле **WCAG 2.1** ($L = 0.2126 R + 0.7152 G + 0.0722 B$, $CR = (L_1 + 0.05)/(L_2 + 0.05)$ с вердиктами AA/AAA), проверка вылетов Bleed 3 мм и лимита краски $TIL = C+M+Y+K \le 300\%$.
5. **`it` (`js/physics/web-physics.js`):** изолированный AST/iframe-проверяющий движок для Flexbox/CSS Grid, Box Model и DOM-событий с детерминированной проверкой вычисленных `getComputedStyle()` и `getBoundingClientRect()` без `new Function()` в главном окне.

---

## 6. Архитектура реального LLM AI-наставника (`eduspace_ai.py` + `routes/ai_bp.py`)

**Нулевая терпимость к фейковым ответам:** удаляются `CURRICULUM_KNOWLEDGE`, `pass`-заглушка в `server.py:4267`, `heuristic_offline` в `eduspace_ai.py`, проверка `len > 20` и `setTimeout`-имитации в `simulator.html`.

```
[Браузер: Урок / 3D-мастерская / Симулятор]
       │  POST /api/ai/chat  { course_slug, lesson_id, block_id,
       │                       scene_state: { selected_part, tool, disassembled, telemetry },
       │                       recent_errors: [...], message }
       ▼
[routes/ai_bp.py (@login_required, rate-limited, CSRF)]
       │  1. Выбор ключа: env (GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY / OPENROUTER_API_KEY)
       │     или расшифрованный пользовательский ключ из users.ai_api_key_enc
       │  2. Если ключ НЕ задан → немедленный возврат HTTP 503:
       │     { "success": false, "status": "BLOCKED", "code": "AI_KEY_REQUIRED",
       │       "message": "AI-наставник недоступен: API-ключ LLM не настроен." }
       ▼
[eduspace_ai.py] → HTTP POST (ключ строго в заголовке: x-goog-api-key / Authorization: Bearer)
       │  Системный промпт: роль мастера АМК, текущий урок, 3D-деталь, активный инструмент,
       │  журнал ошибок, запрет на прямой слив ответов теста (Сократовский метод) + JSON-инструкции
       │  для 3D-сцены (highlight_part, focus_camera)
       ▼
[Сохранение в ai_conversations] → Ответ студенту
```

---

## 7. Карта навыков, 5 миссий, Портфолио и Практические 3D-экзамены

1. **Интерактивная Карта навыков (`skill-map.html` / вкладка в `profile.html`):**
   - Граф компетенций (DAG) из 20 узлов на специальность (ветви: *Фундамент*, *Диагностика*, *Практика*, *Мастерство*), визуальные статусы (`locked` / `available` / `mastered`), тултипы с пререквизитами, автоматическое открытие миссий и достижений при прохождении зависимых уроков/экзаменов.
2. **Практические миссии по всем 5 специальностям (`mission.html?specialty=<slug>&mission=<code >`):**
   - `graphic_design`: «Колорист-архитектор и допечатная подготовка» (WCAG 2.1 + CMYK TIL + сетка).
   - `automechanic`: «Капитальный ремонт ГБЦ и тормозного контура» (3D-разборка, момент затяжки, замеры).
   - `autoelectric`: «Поиск неисправности CAN-шины и цепи запуска» (DC-мультиметр + осциллограф ДПКВ/ДПРВ).
   - `hvac`: «Диагностика и дозаправка холодильного контура» (вакуумирование, P–T манометры, перегрев/переохлаждение).
   - `it`: «Адаптивный лендинг, REST API и OWASP-аудит» (вёрстка + API-валидация + исправление XSS/SQLi).
   - Каждый этап сохраняется и валидируется на сервере через `/api/mission/save_stage` и `/api/mission/submit`.
3. **Автоматическое Портфолио студента (`profile.html`, `career.html`, `/portfolio/<slug>`):**
   - Автоматически агрегирует из БД: завершённые миссии, сданные 3D-экзамены, подтверждённые узлы карты навыков, средний балл и сертификаты (без статичных `RESUME_DATA`).
   - Настройки приватности и явного согласия (`is_public`, `consent_given`, `show_grades`, `public_slug`). Без согласия студента публичная ссылка возвращает `403/404`.
   - Экспорт структурированного PDF-досье (генерация чистого печатного/PDF-документа с верификационным QR и HMAC-кодом).
4. **Практические 3D-экзамены (`exam.html` / режим экзамена в `simulator.html` и `workshop`):**
   - Старт экзамена через `POST /api/exams/start` выдаёт серверный `attempt_id` и одноразовый `attempt_token` (HMAC).
   - Действия в 3D-сцене (выбор детали, инструмента, порядок снятия/установки, замеры) отправляются потоком событий в `/api/exams/<id>/event`; ошибки фиксируются в `exam_error_logs`.
   - Завершение `POST /api/exams/<id>/submit` **пересчитывает балл исключительно на сервере** по эталонной рубрике (игнорируя любые попытки подменить `score` с клиента) и отправляет работу в очередь проверки преподавателя (`/api/teacher/exams`).

---

## 8. Архитектура фронтенд-ассетов и бандлинга

1. **Устранение двойного Tailwind:** удалить `<script src="https://cdn.tailwindcss.com">` со всех 15 страниц и заменить 2.93 МБ `tailwind.min.css` на единый предсобранный `css/design-system.css` + `css/app-bundle.css` (без зависимости от внешнего CDN и без FOUC).
2. **Разделение JS-каталогов:** разбить `courses-catalog.js` (803 КБ) и `topic-games-60.js` (686 КБ) на компактный индекс `data/courses-index.json` (~10 КБ) и лениво подгружаемые по курсу JSON-файлы `data/lessons/<slug>.json` и `data/games/<slug>.json` (экономия >= 70% трафика на страницах без плеера).
3. **Единый каркас навигации и локализации:** общий модуль `js/ui-shell.js` монтирует адаптивный header/drawer, переключатель тем (`light`/`graphite`/`neon`) в `#theme-switch-slot` и переключатель языков `RU`/`KK` (`js/i18n.js`) на всех страницах платформы.
4. **Кеширование статики в Flask:** `Cache-Control: public, max-age=86400` для версионированных CSS/JS/GLB/шрифтов и ленивая загрузка 3D-моделей/видео через `IntersectionObserver`.
