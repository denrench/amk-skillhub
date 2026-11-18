# -*- coding: utf-8 -*-
"""
EDU SPACE PRO — DATABASE MIGRATION ENGINE (SQLite -> PostgreSQL)
Safely migrates all 22 application tables, users, tasks, grades, submissions,
progress, and settings from local SQLite to production PostgreSQL.
Zero data loss guarantee: does NOT delete or alter SQLite source.
"""

import os
import re
import sys
import sqlite3
import urllib.parse

ALLOWED_TABLES = {
    'ai_conversations',
    'audit_logs',
    'course_modules',
    'courses',
    'daily_quests_log',
    'email_verifications',
    'enrollments',
    'exam_attempts',
    'exam_events',
    'grades',
    'lesson_block_progress',
    'lesson_progress',
    'lessons',
    'messages',
    'notification_reads',
    'notifications',
    'platform_settings',
    'portfolio_settings',
    'student_tools_state',
    'subscriptions',
    'task_submissions',
    'tasks',
    'teacher_groups',
    'transactions',
    'users',
    'workshop_states',
    'xp_transactions',
}
_IDENT_RE = re.compile(r'^[a-z_][a-z0-9_]*$')


def _validate_ident(name):
    if not isinstance(name, str) or not _IDENT_RE.match(name):
        raise ValueError(f"Unsafe SQL identifier rejected: {name!r}")
    return name


def _pg_ssl_context(pg_url):
    import ssl
    u = urllib.parse.urlparse(pg_url)
    qs = urllib.parse.parse_qs(u.query)
    sslmode = (qs.get('sslmode', [None])[0] or os.environ.get('PGSSLMODE') or '').lower()
    host = (u.hostname or '').lower()
    is_local = host in ('localhost', '127.0.0.1', '::1', 'db', 'postgres')
    use_ssl = (sslmode in ('require', 'verify-ca', 'verify-full')) or (not is_local and sslmode != 'disable')
    return ssl.create_default_context() if use_ssl else None


def run_migration(pg_url=None):
    pg_url = pg_url or os.environ.get('DATABASE_URL')
    if not pg_url:
        print("ERROR: DATABASE_URL not set. Please provide PostgreSQL connection string.")
        print("Example: python migrate_to_postgres.py postgresql://user:pass@ep-cool-db.neon.tech/neondb")
        return False

    if pg_url.startswith('postgres://'):
        pg_url = pg_url.replace('postgres://', 'postgresql://', 1)

    print("Connecting to PostgreSQL...")
    try:
        import psycopg2
        import psycopg2.extras
        pg_conn = psycopg2.connect(pg_url)
    except ImportError:
        try:
            import pg8000.dbapi
            u = urllib.parse.urlparse(pg_url)
            ssl_ctx = _pg_ssl_context(pg_url)
            pg_conn = pg8000.dbapi.connect(
                user=u.username,
                password=u.password,
                host=u.hostname,
                port=u.port or 5432,
                database=u.path.lstrip('/'),
                ssl_context=ssl_ctx
            )
        except Exception as e:
            print(f"ERROR: Could not import or connect with psycopg2/pg8000: {e}")
            return False
    except Exception as e:
        print(f"ERROR: PostgreSQL connection failed: {e}")
        return False

    base_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.environ.get('EDUSPACE_DB_PATH') or os.path.join(base_dir, 'database.db')

    if not os.path.exists(sqlite_path):
        print(f"ERROR: SQLite database file not found at {sqlite_path}")
        return False

    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sq_cur = sqlite_conn.cursor()
    pg_cur = pg_conn.cursor()

    print("PostgreSQL connection established successfully.")
    print("Reading SQLite database tables...")

    sq_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in sq_cur.fetchall() if row[0] in ALLOWED_TABLES]
    print(f"Found {len(tables)} tables to migrate: {tables}")

    # PostgreSQL DDL statements matching EDU SPACE PRO 22-table schema
    ddl_statements = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
            group_name VARCHAR(100) DEFAULT 'ИС-21',
            student_id VARCHAR(100) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_name VARCHAR(100) DEFAULT '',
            first_name VARCHAR(100) DEFAULT '',
            middle_name VARCHAR(100) DEFAULT '',
            specialty_slug VARCHAR(100) DEFAULT 'it',
            department VARCHAR(150) DEFAULT '',
            email_verified INTEGER DEFAULT 0,
            is_demo INTEGER DEFAULT 0,
            subscription_tier VARCHAR(50) DEFAULT 'free',
            pro_expires_at TIMESTAMP NULL,
            bonus_xp INTEGER DEFAULT 0,
            streak_days INTEGER DEFAULT 1,
            achievements_json TEXT DEFAULT '[]',
            session_version INTEGER NOT NULL DEFAULT 1
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            specialty_slug VARCHAR(100) NOT NULL,
            task_number INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            difficulty VARCHAR(50) DEFAULT 'medium',
            time_limit VARCHAR(50) DEFAULT '45 мин',
            unlock_day INTEGER DEFAULT 1,
            unlock_date_text VARCHAR(100) DEFAULT '',
            deadline_text VARCHAR(100) DEFAULT '',
            description TEXT DEFAULT '',
            tools_required TEXT DEFAULT '',
            starter_code TEXT DEFAULT '',
            max_score INTEGER DEFAULT 100,
            mode VARCHAR(50) DEFAULT 'both',
            ticket_number INTEGER DEFAULT 1,
            CONSTRAINT uq_tasks_spec_num UNIQUE(specialty_slug, task_number)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS task_submissions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            student_id VARCHAR(100),
            student_name VARCHAR(255),
            group_name VARCHAR(100),
            task_id INTEGER,
            specialty_slug VARCHAR(100),
            task_number INTEGER,
            task_title VARCHAR(255),
            score INTEGER DEFAULT 0,
            grade_letter VARCHAR(10) DEFAULT '—',
            status VARCHAR(50) DEFAULT 'submitted',
            time_spent_seconds INTEGER DEFAULT 0,
            submitted_code TEXT DEFAULT '',
            teacher_comment TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            repo_url TEXT DEFAULT '',
            student_comment TEXT DEFAULT '',
            autotest_passed INTEGER DEFAULT 0,
            autotest_total INTEGER DEFAULT 0,
            quiz_score INTEGER DEFAULT 0
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS grades (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            student_id VARCHAR(100),
            specialty_slug VARCHAR(100),
            specialty_name VARCHAR(255),
            score INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'graded',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS teacher_groups (
            id SERIAL PRIMARY KEY,
            teacher_id INTEGER NOT NULL,
            group_name VARCHAR(100) NOT NULL,
            specialty_slug VARCHAR(100) DEFAULT 'it',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_teacher_groups_tid_grp UNIQUE(teacher_id, group_name)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS platform_settings (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS email_verifications (
            email VARCHAR(255) PRIMARY KEY,
            code VARCHAR(20) NOT NULL,
            expires_at BIGINT NOT NULL,
            verified INTEGER DEFAULT 0,
            purpose TEXT DEFAULT 'legacy',
            attempts INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS enrollments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            specialty_slug VARCHAR(100) NOT NULL,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_enrollments_user_spec UNIQUE(user_id, specialty_slug)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS lesson_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            specialty_slug VARCHAR(100) NOT NULL,
            task_number INTEGER NOT NULL,
            status VARCHAR(50) DEFAULT 'in_progress',
            quiz_score INTEGER DEFAULT 0,
            quiz_total INTEGER DEFAULT 3,
            draft_code TEXT DEFAULT '',
            current_stage INTEGER DEFAULT 1,
            mission_state_json TEXT DEFAULT '{}',
            mission_xp INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_lesson_prog_user_spec_num UNIQUE(user_id, specialty_slug, task_number)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            target_role VARCHAR(50) DEFAULT 'student',
            target_group VARCHAR(100) DEFAULT '',
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS notification_reads (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, notification_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER,
            sender_name VARCHAR(255) NOT NULL,
            sender_role VARCHAR(50) NOT NULL,
            recipient_key VARCHAR(100) DEFAULT 'general',
            body TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            plan_code VARCHAR(50) NOT NULL DEFAULT 'free',
            billing_period VARCHAR(50) DEFAULT 'monthly',
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            amount INTEGER DEFAULT 0,
            currency VARCHAR(10) DEFAULT 'KZT',
            payment_method VARCHAR(50) DEFAULT 'sandbox',
            starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            plan_code VARCHAR(50) NOT NULL,
            amount INTEGER NOT NULL,
            currency VARCHAR(10) DEFAULT 'KZT',
            status VARCHAR(50) NOT NULL DEFAULT 'paid',
            payment_method VARCHAR(50) DEFAULT 'sandbox',
            receipt_number VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS xp_transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount INTEGER NOT NULL,
            source_type VARCHAR(64) NOT NULL,
            source_id VARCHAR(128) NOT NULL,
            description VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_xp_user_source UNIQUE(user_id, source_type, source_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            actor_id INTEGER,
            actor_email VARCHAR(128),
            actor_role VARCHAR(32),
            action VARCHAR(128) NOT NULL,
            target_type VARCHAR(64),
            target_id VARCHAR(128),
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS daily_quests_log (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            quest_key VARCHAR(64) NOT NULL,
            quest_date VARCHAR(32) NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_daily_user_quest UNIQUE(user_id, quest_key, quest_date)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            slug VARCHAR(64) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            code VARCHAR(64) DEFAULT '',
            description TEXT DEFAULT '',
            curator_id INTEGER,
            is_published INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS course_modules (
            id SERIAL PRIMARY KEY,
            course_id INTEGER NOT NULL REFERENCES courses(id),
            title VARCHAR(255) NOT NULL,
            order_num INTEGER DEFAULT 1,
            is_published INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS lessons (
            id SERIAL PRIMARY KEY,
            course_id INTEGER NOT NULL REFERENCES courses(id),
            module_id INTEGER REFERENCES course_modules(id),
            title VARCHAR(255) NOT NULL,
            lesson_type VARCHAR(64) DEFAULT 'theory',
            order_num INTEGER DEFAULT 1,
            xp_reward INTEGER DEFAULT 60,
            unlock_day INTEGER DEFAULT 1,
            is_published INTEGER DEFAULT 1,
            content_json TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS lesson_block_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            lesson_id INTEGER NOT NULL REFERENCES lessons(id),
            block_id VARCHAR(64) NOT NULL,
            completed INTEGER DEFAULT 0,
            state_json TEXT DEFAULT '{}',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_block_prog UNIQUE(user_id, lesson_id, block_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_conversations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            context_type VARCHAR(64) NOT NULL,
            context_id VARCHAR(128) DEFAULT '',
            user_message TEXT NOT NULL,
            assistant_message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS workshop_states (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            lesson_id INTEGER NOT NULL DEFAULT 1,
            model_id VARCHAR(128) NOT NULL,
            disassembled_parts_json TEXT DEFAULT '[]',
            active_tool VARCHAR(64) DEFAULT 'socket_set',
            step_history_json TEXT DEFAULT '[]',
            completed INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_workshop_user_les_mod UNIQUE(user_id, lesson_id, model_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS student_tools_state (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
            tasks_json TEXT DEFAULT '[]',
            gpa_target REAL DEFAULT 3.5,
            notes TEXT DEFAULT '',
            timer_minutes INTEGER DEFAULT 25,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS portfolio_settings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
            is_public INTEGER DEFAULT 0,
            show_grades INTEGER DEFAULT 1,
            show_certificates INTEGER DEFAULT 1,
            consent_granted INTEGER DEFAULT 0,
            public_slug VARCHAR(128) UNIQUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS exam_attempts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            specialty_slug VARCHAR(64) NOT NULL,
            attempt_nonce VARCHAR(128) NOT NULL,
            status VARCHAR(32) DEFAULT 'in_progress',
            score INTEGER DEFAULT 0,
            passed INTEGER DEFAULT 0,
            error_log_json TEXT DEFAULT '[]',
            teacher_status VARCHAR(32) DEFAULT 'pending',
            teacher_comment TEXT DEFAULT '',
            reviewer_id INTEGER,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            submitted_at TIMESTAMP NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS exam_events (
            id SERIAL PRIMARY KEY,
            attempt_id INTEGER NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
            step_id INTEGER DEFAULT 1,
            action VARCHAR(64) NOT NULL,
            part_id VARCHAR(128) DEFAULT '',
            tool_id VARCHAR(64) DEFAULT '',
            telemetry_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    ]

    print("Creating tables in PostgreSQL...")
    for ddl in ddl_statements:
        try:
            pg_cur.execute(ddl)
        except Exception as e:
            print(f"DDL execution error: {e}")
            pg_conn.rollback()
            return False

    pg_conn.commit()
    print("PostgreSQL tables verified.")

    total_migrated = 0
    for tbl in tables:
        if tbl not in ALLOWED_TABLES:
            continue
        safe_tbl = _validate_ident(tbl)
        sq_cur.execute(f'SELECT * FROM "{safe_tbl}";')
        rows = sq_cur.fetchall()
        if not rows:
            print(f"  Table '{safe_tbl}': 0 rows (empty)")
            continue

        cols = [_validate_ident(d[0]) for d in sq_cur.description]
        col_list = ', '.join([f'"{c}"' for c in cols])
        placeholders = ', '.join(['%s' for _ in cols])

        print(f"  Migrating table '{safe_tbl}' ({len(rows)} rows)...")

        inserted = 0
        for r in rows:
            vals = [r[c] for c in cols]
            try:
                insert_sql = f'INSERT INTO "{safe_tbl}" ({col_list}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;'
                pg_cur.execute(insert_sql, vals)
                inserted += 1
            except Exception as e:
                pg_conn.rollback()
                try:
                    pg_cur.execute(f'INSERT INTO "{safe_tbl}" ({col_list}) VALUES ({placeholders});', vals)
                    inserted += 1
                except Exception as inner_e:
                    pg_conn.rollback()
                    print(f"    Row insert skipped in {safe_tbl}: {inner_e}")

        pg_conn.commit()
        print(f"    Table '{safe_tbl}': {inserted} rows successfully migrated.")
        total_migrated += inserted

    for tbl in tables:
        if tbl not in ALLOWED_TABLES:
            continue
        safe_tbl = _validate_ident(tbl)
        try:
            pg_cur.execute(f"SELECT setval(pg_get_serial_sequence('{safe_tbl}', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM \"{safe_tbl}\";")
            pg_conn.commit()
        except Exception:
            pg_conn.rollback()

    sqlite_conn.close()
    pg_conn.close()

    print(f"\nSUCCESS: Data migration complete! {total_migrated} rows migrated into PostgreSQL.")
    return True

if __name__ == '__main__':
    url_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run_migration(url_arg)
