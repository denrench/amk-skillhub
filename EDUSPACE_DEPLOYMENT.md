# EDUSPACE DEPLOYMENT

## 1. Обзор конфигурации развертывания
EduSpace 2.0 поддерживает несколько сценариев развертывания:
1. **Локальный стенд разработчика:** Запуск на встроенном сервере Flask с базой данных SQLite (`database.db`).
2. **Docker / Docker Compose:** Изолированные контейнеры приложения и СУБД PostgreSQL.
3. **Облачные платформы (PaaS):** Render, Fly.io, Railway, Heroku с подключением управляемой базы данных PostgreSQL через `DATABASE_URL`.

---

## 2. Необходимые переменные окружения

| Переменная | Обязательность | Назначение | Пример значения |
|---|---|---|---|
| `PORT` | Опционально | Порт веб-сервера (по умолчанию 5000) | `5000` |
| `DATABASE_URL` | Опционально | Строка подключения к PostgreSQL | `postgres://user:pass@host:5432/eduspace` |
| `SESSION_SECRET` | Рекомендуется | Ключ подписи сессионных cookie | `super-secret-cryptographic-key-2026` |
| `GEMINI_API_KEY` | Опционально | Ключ Google AI Studio для ИИ-модуля | `AIzaSy...` |
| `OPENAI_API_KEY` | Опционально | Ключ OpenAI API для резервной модели | `sk-proj-...` |
| `SMTP_HOST` | Опционально | Сервер отправки реальных email OTP | `smtp.gmail.com` |
| `SMTP_PORT` | Опционально | Порт SMTP | `587` |
| `SMTP_USER` | Опционально | Email отправителя | `noreply@eduspace.kz` |
| `SMTP_PASSWORD` | Опционально | Пароль приложения Google / Яндекс | `xxxx xxxx xxxx xxxx` |

> [!NOTE]
> Если `SMTP_PASSWORD` не задан, сервер автоматически выводит сгенерированные 6-значные коды подтверждения в консоль (`[OTP DEV PREVIEW]`), что обеспечивает автономную локальную разработку и тестирование без необходимости подключения к интернету.

---

## 3. Инструкции по развертыванию

### 3.1. Локальный запуск (Windows / Linux / macOS)
```bash
# 1. Клонирование репозитория
git clone <repo-url> amk-skillhub
cd amk-skillhub

# 2. Установка зависимостей
pip install -r requirements.txt

# 3. Инициализация и запуск сервера
python server.py
```
Сервер будет доступен по адресу: `http://localhost:5000`.

### 3.2. Развертывание в Docker Compose
```bash
docker-compose up --build -d
```
Стек включает в себя:
- Сервис `web`: контейнер с Python 3.12 и Gunicorn;
- Сервис `db`: официальный образ `postgres:15-alpine`.

### 3.3. Развертывание на Render / Railway
1. Подключите Git-репозиторий в панели управления Render / Railway;
2. Создайте PostgreSQL базу данных;
3. В настройках Web Service добавьте переменную `DATABASE_URL`, связав её с базой;
4. Команда сборки (Build Command): `pip install -r requirements.txt`;
5. Команда запуска (Start Command): `gunicorn -w 4 -b 0.0.0.0:$PORT server:app`.
6. При первом старте сервер автоматически выполнит DDL миграцию схемы и сидирование каталога.
