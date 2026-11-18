# -*- coding: utf-8 -*-
"""
Isolated subprocess entry point for launching AMK SkillHub Flask app
against a cloned temporary SQLite database on an ephemeral localhost port.
"""
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)


def main():
    temp_db = os.environ["E2E_TEMP_DB"]
    port = int(os.environ["E2E_PORT"])
    strip_ai = os.environ.get("E2E_STRIP_AI_KEYS", "1") == "1"

    # Force local isolated SQLite mode; never mutate repo database.db or remote PG
    for var in ("RENDER", "HOSTED", "APP_ENV", "DATABASE_URL", "MAIL_API_KEY", "SMTP_PASSWORD"):
        os.environ.pop(var, None)

    if strip_ai:
        for var in ("GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "OPENROUTER_API_KEY", "AI_API_KEY"):
            os.environ.pop(var, None)

    os.environ["EDUSPACE_DB_PATH"] = temp_db
    os.environ["DB_PATH"] = temp_db
    os.environ["PORT"] = str(port)
    os.environ["UPLOAD_DIR"] = os.path.join(os.path.dirname(temp_db), "uploads")
    os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)

    import server

    server.DB_PATH = temp_db
    if "core.db" in sys.modules:
        core_db = sys.modules["core.db"]
        if hasattr(core_db, "DB_PATH"):
            core_db.DB_PATH = temp_db

    if hasattr(server, "init_db"):
        server.init_db()

    from werkzeug.serving import make_server

    srv = make_server("127.0.0.1", port, server.app, threaded=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
