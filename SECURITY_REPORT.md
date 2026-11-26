# SECURITY & PRIVACY REPORT — AMK SKILLHUB × NYVOR

## 1. Security Controls Verified (`server.py` / `app.py`)
- **Password Hashing**: `werkzeug.security.generate_password_hash` (scrypt/pbkdf2) with zero plaintext password storage.
- **Session & Cookie Hardening**: `HttpOnly`, `SameSite=Lax`, server-managed session tokens in SQLite.
- **CSRF Protection**: Enforced via `X-CSRF-Token` validation on state-mutating endpoints.
- **Rate Limiting**: Brute-force protection on `/api/auth/login` and `/api/auth/register` (HTTP `429 Too Many Requests` after threshold).
- **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, Content-Security-Policy (CSP).
- **Sandboxed Code Execution**: `/api/code/execute` validates Python AST and executes in an isolated subprocess with strict timeout and restricted builtins.
- **Student UI Hardening**: Hid `#lp-ai-key-trigger` (`API-ключ`) in `lesson_player.html` from regular students.

## 2. Privacy & Secret Hygiene
- **Owner Email Protection**: Unconfirmed personal email addresses are completely absent from all HTML, JS, CSS, JSON, and Python source files (`verified by test_h02`).
- **Git Ignore Rules**: `.env`, `.secret_key`, `.agents/`, `database.db-wal`, `database.db-shm`, and `%SystemDrive%/` are excluded via `.gitignore`.
