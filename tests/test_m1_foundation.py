# -*- coding: utf-8 -*-
"""
M1 Foundation Verification Suite (T-M1-01 .. T-M1-11).
Runs strictly against an isolated %TEMP% SQLite backup of database.db with
server.app.testing = False so rate limiting, CSRF, Origin checks, and >=8 char
password rules execute under real runtime conditions.
"""
from __future__ import annotations

import io
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPO_DB_PATH = os.path.join(REPO_ROOT, "database.db")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

_TEMP_ROOT = None
_TEMP_DB_PATH = None
_TEMP_UPLOAD_DIR = None
server = None


def _bootstrap_isolated_server():
    global _TEMP_ROOT, _TEMP_DB_PATH, _TEMP_UPLOAD_DIR, server
    if server is not None:
        return server

    _TEMP_ROOT = tempfile.mkdtemp(prefix="amk_m1_test_")
    _TEMP_DB_PATH = os.path.join(_TEMP_ROOT, "test_database.db")
    _TEMP_UPLOAD_DIR = os.path.join(_TEMP_ROOT, "uploads")
    os.makedirs(_TEMP_UPLOAD_DIR, exist_ok=True)

    if os.path.exists(REPO_DB_PATH):
        src_conn = sqlite3.connect(f"file:{REPO_DB_PATH}?mode=ro", uri=True)
        dst_conn = sqlite3.connect(_TEMP_DB_PATH)
        try:
            src_conn.backup(dst_conn)
        finally:
            dst_conn.close()
            src_conn.close()

    os.environ["EDUSPACE_DB_PATH"] = _TEMP_DB_PATH
    os.environ["UPLOAD_DIR"] = _TEMP_UPLOAD_DIR
    for key in ("MAIL_API_KEY", "RESEND_API_KEY", "SMTP_PASSWORD", "GEMINI_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY", "ANTHROPIC_API_KEY", "HOSTED", "RENDER"):
        os.environ.pop(key, None)

    import server as srv
    srv.DB_PATH = _TEMP_DB_PATH
    srv.UPLOAD_DIR = _TEMP_UPLOAD_DIR
    srv.HOSTED = False
    srv.app.testing = False

    # Hard safety guard: never touch repo database.db
    assert os.path.abspath(srv.DB_PATH) != os.path.abspath(REPO_DB_PATH), "Refusing to run against repo database.db"
    assert os.path.abspath(_TEMP_ROOT) in os.path.abspath(srv.DB_PATH), "DB_PATH not inside %TEMP% sandbox"

    srv.init_db()
    server = srv
    return server


def setUpModule():
    _bootstrap_isolated_server()


def tearDownModule():
    global _TEMP_ROOT
    if _TEMP_ROOT and os.path.exists(_TEMP_ROOT):
        shutil.rmtree(_TEMP_ROOT, ignore_errors=True)
    _TEMP_ROOT = None
    os.environ.pop("EDUSPACE_DB_PATH", None)
    os.environ.pop("UPLOAD_DIR", None)
    import server as srv
    srv.DB_PATH = REPO_DB_PATH


class M1TestBase(unittest.TestCase):
    _seq = 0

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        _bootstrap_isolated_server()

    def setUp(self):
        super().setUp()
        server.app.testing = False
        with server._RATE_LOCK:
            server._RATE_BUCKETS.clear()

    def tearDown(self):
        with server._RATE_LOCK:
            server._RATE_BUCKETS.clear()
        super().tearDown()

    def unique_email(self, prefix="m1"):
        M1TestBase._seq += 1
        return f"{prefix}.{M1TestBase._seq}.{int(time.time() * 1000)}@amk.kz"

    def new_client(self):
        return server.app.test_client()

    def get_csrf(self, client):
        r = client.get("/api/auth/session")
        data = r.get_json() or {}
        return data.get("csrf_token", "")

    def register_and_login(
        self,
        email=None,
        password="ValidPass123",
        role="student",
        specialty_slug="it",
        group_name="ИС-21",
        first_name="Тест",
        last_name="Студент",
        teacher_code=None,
    ):
        c = self.new_client()
        email = email or self.unique_email(role)
        payload = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": password,
            "role": role,
            "specialty_slug": specialty_slug,
            "group_name": group_name,
        }
        if teacher_code is not None:
            payload["teacher_code"] = teacher_code
        r = c.post("/api/auth/register", json=payload)
        self.assertEqual(r.status_code, 201, f"Register failed for {email}: {r.status_code} {r.get_data(as_text=True)}")
        data = r.get_json()
        return c, data["user"], data.get("csrf_token") or self.get_csrf(c)

    def get_admin_client(self):
        c = self.new_client()
        r = c.post("/api/auth/login", json={"email": "admin@amk.kz", "password": "AdminPassword2026!"})
        if r.status_code != 200:
            admin_email = self.unique_email("m1_admin")
            c_reg, u, csrf = self.register_and_login(email=admin_email, role="student", first_name="Админ", last_name="Тестов")
            with server.app.app_context():
                conn = server.get_db()
                conn.execute("UPDATE users SET role = 'admin', session_version = COALESCE(session_version, 1) + 1 WHERE id = ?", (u["id"],))
                conn.commit()
            c_reg.post("/api/auth/logout", headers={"X-CSRF-Token": csrf})
            r2 = c.post("/api/auth/login", json={"email": admin_email, "password": "ValidPass123"})
            self.assertEqual(r2.status_code, 200)
            d2 = r2.get_json()
            return c, d2["user"], d2.get("csrf_token") or self.get_csrf(c)
        d = r.get_json()
        return c, d["user"], d.get("csrf_token") or self.get_csrf(c)


class TestGroupAM1IDORAndOwnership(M1TestBase):
    """T-M1-01: Unauthenticated 401s and Cross-User / Course Ownership 403s."""

    def test_a01_unauthenticated_idor_sweep_returns_401(self):
        c = self.new_client()
        with server.app.app_context():
            conn = server.get_db()
            u1_before = dict(conn.execute("SELECT password_hash, subscription_tier FROM users WHERE id = 1").fetchone())

        checks = [
            ("PUT", "/api/user/profile", {"user_id": 1, "first_name": "Hack", "last_name": "User", "new_password": "Password123"}),
            ("POST", "/api/courses/enroll", {"user_id": 1, "specialty_slug": "hvac"}),
            ("GET", "/api/billing/status?user_id=1", None),
            ("POST", "/api/billing/checkout", {"user_id": 1, "plan_code": "pro"}),
            ("GET", "/api/mission/state?user_id=1&specialty=graphic_design&task=1", None),
            ("POST", "/api/mission/save_stage", {"user_id": 1, "specialty_slug": "graphic_design", "task_number": 1, "current_stage": 2}),
            ("POST", "/api/mission/submit", {"user_id": 1, "specialty_slug": "graphic_design", "task_number": 1, "palette": ["#111", "#222", "#333"]}),
            ("GET", "/api/daily_quests?user_id=1", None),
            ("POST", "/api/daily_quests", {"user_id": 1, "quest_key": "pass_quiz"}),
            ("GET", "/api/demo/status?user_id=1", None),
            ("POST", "/api/courses", {"title": "Unauthorized Course", "slug": "unauth_c"}),
            ("PUT", "/api/courses/1", {"title": "Hijacked"}),
            ("POST", "/api/courses/1/modules", {"title": "Hijacked Mod"}),
            ("POST", "/api/lessons", {"course_id": 1, "module_id": 1, "title": "Hijacked Lesson"}),
            ("PUT", "/api/lessons/1", {"title": "Hijacked Lesson"}),
            ("DELETE", "/api/lessons/1", None),
        ]
        for method, path, body in checks:
            resp = c.open(path, method=method, json=body)
            self.assertEqual(resp.status_code, 401, f"{method} {path} returned {resp.status_code} instead of 401: {resp.get_data(as_text=True)}")

        with server.app.app_context():
            conn = server.get_db()
            u1_after = dict(conn.execute("SELECT password_hash, subscription_tier FROM users WHERE id = 1").fetchone())
        self.assertEqual(u1_before, u1_after)

    def test_a02_cross_user_student_idor_and_course_ownership_returns_403(self):
        c_a, u_a, csrf_a = self.register_and_login(specialty_slug="it", group_name="ИС-21")
        c_b, u_b, _ = self.register_and_login(specialty_slug="hvac", group_name="ХО-21")
        b_id = u_b["id"]

        h_a = {"X-CSRF-Token": csrf_a}
        idor_calls = [
            ("GET", f"/api/user/profile/{b_id}", None),
            ("PUT", "/api/user/profile", {"user_id": b_id, "first_name": "Evil", "last_name": "Swap"}),
            ("POST", "/api/courses/enroll", {"user_id": b_id, "specialty_slug": "automechanic"}),
            ("GET", f"/api/billing/status?user_id={b_id}", None),
            ("POST", "/api/billing/checkout", {"user_id": b_id, "plan_code": "pro"}),
            ("GET", f"/api/mission/state?user_id={b_id}&specialty=graphic_design&task=1", None),
            ("POST", "/api/mission/save_stage", {"user_id": b_id, "specialty_slug": "graphic_design", "task_number": 1, "current_stage": 2}),
            ("POST", "/api/mission/submit", {"user_id": b_id, "specialty_slug": "graphic_design", "task_number": 1, "palette": ["#000", "#111", "#222"], "explanation": "Valid test explanation text."}),
            ("GET", f"/api/daily_quests?user_id={b_id}", None),
            ("POST", "/api/daily_quests", {"user_id": b_id, "quest_key": "study_topic"}),
        ]
        for method, path, body in idor_calls:
            r = c_a.open(path, method=method, json=body, headers=h_a)
            self.assertEqual(r.status_code, 403, f"Cross-user {method} {path} returned {r.status_code} instead of 403")

        # Student cannot call teacher/admin lesson CRUD
        for method, path, body in [
            ("POST", "/api/courses", {"title": "Student Course"}),
            ("POST", "/api/lessons", {"course_id": 1, "module_id": 1, "title": "Hack"}),
            ("PUT", "/api/lessons/1", {"title": "Hack"}),
            ("DELETE", "/api/lessons/1", None),
        ]:
            r = c_a.open(path, method=method, json=body, headers=h_a)
            self.assertEqual(r.status_code, 403, f"Student {method} {path} returned {r.status_code} instead of 403")

        # Teacher assigned to 'it' cannot modify 'hvac' course/lesson
        c_t, _, csrf_t = self.register_and_login(role="teacher", specialty_slug="it", teacher_code="AMK2026", first_name="Иван", last_name="Куратор")
        with server.app.app_context():
            conn = server.get_db()
            hvac_course = conn.execute("SELECT id FROM courses WHERE slug = 'hvac' LIMIT 1").fetchone()
            hvac_lesson = conn.execute("SELECT id FROM lessons WHERE course_id = ? LIMIT 1", (hvac_course["id"],)).fetchone()
        r_course = c_t.put(f"/api/courses/{hvac_course['id']}", json={"title": "Cross-track"}, headers={"X-CSRF-Token": csrf_t})
        self.assertEqual(r_course.status_code, 403)
        r_lesson = c_t.put(f"/api/lessons/{hvac_lesson['id']}", json={"title": "Cross-track"}, headers={"X-CSRF-Token": csrf_t})
        self.assertEqual(r_lesson.status_code, 403)

    def test_a03_student_empty_code_submit_cannot_self_grade_100(self):
        c_s, u_s, csrf_s = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")
        r = c_s.post(
            "/api/tasks/submit",
            json={
                "specialty_slug": "it",
                "task_number": 1,
                "score": 100,
                "submitted_code": "",
                "repo_url": "",
            },
            headers={"X-CSRF-Token": csrf_s},
        )
        self.assertIn(r.status_code, (200, 400))
        if r.status_code == 200:
            res = (r.get_json() or {}).get("result") or {}
            self.assertEqual(res.get("status"), "Отправлено на проверку")
            self.assertEqual(res.get("grade_letter"), "—")
            self.assertEqual(res.get("score"), 0)
            self.assertNotEqual(res.get("grade_letter"), "A")
            self.assertNotEqual(res.get("status"), "Проверено (Отлично)")

        with server.app.app_context():
            conn = server.get_db()
            xp_cnt = conn.execute(
                "SELECT COUNT(*) FROM xp_transactions WHERE user_id = ? AND source_type IN ('task_completion', 'perfect_score_bonus')",
                (u_s["id"],),
            ).fetchone()[0]
        self.assertEqual(xp_cnt, 0)

    def test_a04_non_integer_user_id_returns_400_not_500(self):
        c_s, _, csrf_s = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")
        c_admin, _, csrf_admin = self.get_admin_client()
        h_s = {"X-CSRF-Token": csrf_s}
        h_a = {"X-CSRF-Token": csrf_admin}

        for bad_uid in ("not_an_int", "abc", []):
            calls = [
                (c_s, h_s, "PUT", "/api/user/profile", {"user_id": bad_uid, "first_name": "Тест", "last_name": "Юзер"}),
                (c_s, h_s, "POST", "/api/courses/enroll", {"user_id": bad_uid, "specialty_slug": "it"}),
                (c_s, h_s, "POST", "/api/tasks/progress", {"user_id": bad_uid, "specialty_slug": "it", "task_number": 1}),
                (c_s, h_s, "POST", "/api/tasks/submit", {"user_id": bad_uid, "specialty_slug": "it", "task_number": 1, "submitted_code": "x"}),
                (c_s, h_s, "POST", "/api/grades/save", {"user_id": bad_uid, "specialty_slug": "it", "task_number": 1, "submitted_code": "x"}),
                (c_s, h_s, "POST", "/api/billing/checkout", {"user_id": bad_uid, "plan_code": "pro"}),
                (c_s, h_s, "POST", "/api/mission/save_stage", {"user_id": bad_uid, "specialty_slug": "graphic_design", "task_number": 1}),
                (c_s, h_s, "POST", "/api/mission/submit", {"user_id": bad_uid, "specialty_slug": "graphic_design", "task_number": 1}),
                (c_s, h_s, "POST", "/api/daily_quests", {"user_id": bad_uid, "quest_key": "study_topic"}),
                (c_admin, h_a, "POST", "/api/admin/change_role", {"user_id": bad_uid, "role": "teacher"}),
            ]
            for client, hdrs, method, path, body in calls:
                resp = client.open(path, method=method, json=body, headers=hdrs)
                self.assertIn(
                    resp.status_code,
                    (400, 403),
                    f"{method} {path} with user_id={bad_uid!r} returned {resp.status_code}: {resp.get_data(as_text=True)}",
                )


class TestGroupBM1AuthAndOptionalOTP(M1TestBase):
    """T-M1-02, T-M1-03: Optional local OTP, >=8 char passwords, tightened teacher codes, no plaintext localStorage."""

    def test_b01_auth_readiness_local_mode(self):
        c = self.new_client()
        r = c.get("/api/auth/readiness")
        self.assertEqual(r.status_code, 200)
        d = r.get_json()
        self.assertTrue(d["login"])
        self.assertTrue(d["registration"])
        self.assertFalse(d["email_verification_required"])
        self.assertFalse(d["mail_configured"])

    def test_b02_password_min_8_optional_otp_and_tightened_teacher_codes(self):
        c = self.new_client()
        # 7-char password rejected under app.testing = False
        r_short = c.post("/api/auth/register", json={
            "first_name": "Данияр",
            "last_name": "Смагулов",
            "email": self.unique_email("short"),
            "password": "Pass123",
            "role": "student",
            "specialty_slug": "graphic_design",
            "group_name": "ГД-21",
        })
        self.assertEqual(r_short.status_code, 400)

        # Weak literal teacher codes must be rejected with 403
        for weak in ("2026", "AMK", "EDU", "TEACHER", "WRONG"):
            r_weak = c.post("/api/auth/register", json={
                "first_name": "Тест",
                "last_name": "Учитель",
                "email": self.unique_email("weak_t"),
                "password": "ValidPass123",
                "role": "teacher",
                "specialty_slug": "it",
                "teacher_code": weak,
            })
            self.assertEqual(r_weak.status_code, 403, f"Weak teacher code '{weak}' was NOT rejected (got {r_weak.status_code})")

        # Valid student registration with blank verification_code
        st_email = self.unique_email("opt_otp_st")
        r_st = c.post("/api/auth/register", json={
            "first_name": "Данияр",
            "last_name": "Смагулов",
            "email": st_email,
            "password": "Student2026!",
            "role": "student",
            "specialty_slug": "graphic_design",
            "group_name": "ГД-21",
            "verification_code": "",
        })
        self.assertEqual(r_st.status_code, 201)
        csrf = r_st.get_json()["csrf_token"]

        sess = c.get("/api/auth/session").get_json()
        self.assertTrue(sess["authenticated"])
        self.assertEqual(sess["user"]["role"], "student")

        r_out = c.post("/api/auth/logout", headers={"X-CSRF-Token": csrf})
        self.assertEqual(r_out.status_code, 200)

        r_in = c.post("/api/auth/login", json={"email": st_email, "password": "Student2026!"})
        self.assertEqual(r_in.status_code, 200)
        self.assertEqual(r_in.get_json()["user"]["role"], "student")

        # Valid teacher registration with AMK2026 and blank OTP
        c_t = self.new_client()
        r_t = c_t.post("/api/auth/register", json={
            "first_name": "Сергей",
            "last_name": "Иванов",
            "email": self.unique_email("opt_otp_t"),
            "password": "Teacher2026!",
            "role": "teacher",
            "specialty_slug": "graphic_design",
            "teacher_code": "AMK2026",
        })
        self.assertEqual(r_t.status_code, 201)
        self.assertEqual(r_t.get_json()["user"]["role"], "teacher")

        # Password reset without mail configured honestly returns 503 MAIL_NOT_CONFIGURED
        r_rst = c.post("/api/auth/reset_password", json={"email": st_email, "new_password": "NewPass2026!"})
        self.assertEqual(r_rst.status_code, 503)
        self.assertEqual(r_rst.get_json().get("code"), "MAIL_NOT_CONFIGURED")

    def test_b03_frontend_auth_no_plaintext_localstorage_or_hardcoded_otp(self):
        with open(os.path.join(REPO_ROOT, "js", "academy-auth.js"), "r", encoding="utf-8") as f:
            auth_js = f.read()
        with open(os.path.join(REPO_ROOT, "js", "app-logistics.js"), "r", encoding="utf-8") as f:
            app_js = f.read()
        with open(os.path.join(REPO_ROOT, "auth.html"), "r", encoding="utf-8") as f:
            auth_html = f.read()

        self.assertNotIn("amk.local_accounts.v1", auth_js)
        self.assertNotIn("localAuthFallback", auth_js)
        self.assertNotIn("123456", auth_js)
        self.assertNotIn("_RAW_TEACHER_CODES", app_js)
        self.assertNotIn("handleLocalApi", app_js)
        self.assertNotRegex(auth_html, r'name="verification_code"[^>]*\brequired\b')


class TestGroupCM1RateLimitCsrfCors(M1TestBase):
    """T-M1-04: Rate limit 429, Double-Submit CSRF 403, CORS preflight, Hosted fail-closed."""

    def test_c01_rate_limit_429_on_auth_and_ai(self):
        c = self.new_client()
        hit_429 = False
        for i in range(47):
            r = c.post(
                "/api/auth/login",
                json={"email": f"burst{i}@amk.kz", "password": "WrongPassword1"},
                environ_base={"REMOTE_ADDR": "10.0.0.99"},
            )
            if r.status_code == 429:
                hit_429 = True
                self.assertEqual(r.headers.get("Retry-After"), "60")
                break
            self.assertEqual(r.status_code, 401)
        self.assertTrue(hit_429, "Expected HTTP 429 within 47 rapid login attempts")

        # Distinct IP should not be rate-limited
        r_other = c.post(
            "/api/auth/login",
            json={"email": "other@amk.kz", "password": "WrongPassword1"},
            environ_base={"REMOTE_ADDR": "10.0.0.100"},
        )
        self.assertEqual(r_other.status_code, 401)

    def test_c02_csrf_403_origin_mismatch_cors_preflight_and_hosted_secret(self):
        c = self.new_client()
        # CORS OPTIONS preflight for denrench.github.io
        opt = c.open(
            "/api/auth/login",
            method="OPTIONS",
            headers={
                "Origin": "https://denrench.github.io",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type, X-CSRF-Token",
            },
        )
        self.assertIn(opt.status_code, (200, 204))
        self.assertEqual(opt.headers.get("Access-Control-Allow-Origin"), "https://denrench.github.io")
        self.assertEqual(opt.headers.get("Access-Control-Allow-Credentials"), "true")
        self.assertIn("origin", (opt.headers.get("Vary") or "").lower())

        # Foreign Origin rejected with 403
        r_evil = c.post(
            "/api/auth/login",
            json={"email": "x@amk.kz", "password": "ValidPass123"},
            headers={"Origin": "https://evil.example"},
        )
        self.assertEqual(r_evil.status_code, 403)
        self.assertEqual(r_evil.get_json().get("code"), "CSRF_ORIGIN_MISMATCH")

        # Authenticated state-changing POST without X-CSRF-Token -> 403; with X-CSRF-Token -> 200
        c_u, _, csrf = self.register_and_login()
        r_no_csrf = c_u.post("/api/tasks/progress", json={"specialty_slug": "it", "task_number": 1, "code": "// test"})
        self.assertEqual(r_no_csrf.status_code, 403)
        self.assertEqual(r_no_csrf.get_json().get("code"), "CSRF_TOKEN_INVALID")

        r_ok = c_u.post(
            "/api/tasks/progress",
            json={"specialty_slug": "it", "task_number": 1, "code": "// test"},
            headers={"X-CSRF-Token": csrf},
        )
        self.assertEqual(r_ok.status_code, 200)

        # Fail closed when HOSTED (RENDER=1 or APP_ENV=production) without SESSION_SECRET
        for hosted_env in ({"RENDER": "1"}, {"APP_ENV": "production"}):
            env = os.environ.copy()
            env.update(hosted_env)
            env.pop("SESSION_SECRET", None)
            env.pop("SECRET_KEY", None)
            env["EDUSPACE_DB_PATH"] = _TEMP_DB_PATH
            proc = subprocess.run(
                [sys.executable, "-c", "import server"],
                cwd=REPO_ROOT,
                env=env,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(proc.returncode, 0, f"{hosted_env} without SESSION_SECRET must fail closed")

    def test_c03_hosted_1_env_var_fails_closed_and_disables_dev_teacher_codes(self):
        # 1) HOSTED=1 and HOSTED=true without SESSION_SECRET must fail closed
        for val in ("1", "true"):
            env = os.environ.copy()
            env["HOSTED"] = val
            env.pop("SESSION_SECRET", None)
            env.pop("SECRET_KEY", None)
            env.pop("RENDER", None)
            env.pop("APP_ENV", None)
            env["EDUSPACE_DB_PATH"] = _TEMP_DB_PATH
            proc = subprocess.run(
                [sys.executable, "-c", "import server"],
                cwd=REPO_ROOT,
                env=env,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(proc.returncode, 0, f"HOSTED={val} without SESSION_SECRET must fail closed")

        # 2) HOSTED=1 + valid SESSION_SECRET + no TEACHER_ACCESS_CODES disables dev teacher codes
        env2 = os.environ.copy()
        env2["HOSTED"] = "1"
        env2["SESSION_SECRET"] = "x" * 48
        env2.pop("TEACHER_ACCESS_CODES", None)
        env2.pop("RENDER", None)
        env2.pop("APP_ENV", None)
        env2["EDUSPACE_DB_PATH"] = _TEMP_DB_PATH
        code = (
            "import json, server; "
            "assert server.HOSTED is True; "
            "assert server.TEACHER_ACCESS_CODES == set(); "
            "c = server.app.test_client(); "
            "r = c.post('/api/auth/register', json={'first_name':'Тест','last_name':'Учитель','email':'h_t@amk.kz','password':'ValidPass123','role':'teacher','specialty_slug':'it','teacher_code':'AMK2026'}); "
            "print(r.status_code)"
        )
        proc2 = subprocess.run(
            [sys.executable, "-c", code],
            cwd=REPO_ROOT,
            env=env2,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc2.returncode, 0, f"Subprocess failed: {proc2.stderr}")
        self.assertEqual(proc2.stdout.strip().splitlines()[-1], "403")

        # 3) Rotating X-Forwarded-For cannot bypass IP rate limit
        c = self.new_client()
        hit_429 = False
        for i in range(47):
            r = c.post(
                "/api/auth/login",
                json={"email": f"xff{i}@amk.kz", "password": "WrongPassword1"},
                headers={"X-Forwarded-For": f"203.0.113.{i + 1}"},
                environ_base={"REMOTE_ADDR": "10.0.0.177"},
            )
            if r.status_code == 429:
                hit_429 = True
                self.assertEqual(r.headers.get("Retry-After"), "60")
                break
        self.assertTrue(hit_429, "Rotating X-Forwarded-For headers bypassed IP rate limit")


class TestGroupDM1SessionVersionAndIsolation(M1TestBase):
    """T-M1-05: session_version invalidation, teacher group isolation, /api/demo/reset RBAC, 404 grade."""

    def test_d01_session_version_invalidation_and_self_demotion_guard(self):
        c_s, u_s, _ = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")
        self.assertTrue(c_s.get("/api/auth/session").get_json()["authenticated"])

        c_admin, u_admin, csrf_admin = self.get_admin_client()
        # Self-demotion guard
        r_self = c_admin.post(
            "/api/admin/change_role",
            json={"user_id": u_admin["id"], "role": "student"},
            headers={"X-CSRF-Token": csrf_admin},
        )
        self.assertEqual(r_self.status_code, 403)

        # Promote student -> bumps session_version -> student's old cookie immediately invalidated
        r_chg = c_admin.post(
            "/api/admin/change_role",
            json={"user_id": u_s["id"], "role": "teacher"},
            headers={"X-CSRF-Token": csrf_admin},
        )
        self.assertEqual(r_chg.status_code, 200)
        self.assertFalse(c_s.get("/api/auth/session").get_json()["authenticated"])
        self.assertEqual(c_s.get("/api/teacher/students").status_code, 401)

        # Password change in profile invalidates a second stale session cookie
        s2_email = self.unique_email("pwd_s2")
        c_s2_a, _, csrf_a = self.register_and_login(email=s2_email, password="OldPassword1")
        c_s2_b = self.new_client()
        r_b_in = c_s2_b.post("/api/auth/login", json={"email": s2_email, "password": "OldPassword1"})
        self.assertEqual(r_b_in.status_code, 200)

        r_pwd = c_s2_a.put(
            "/api/user/profile",
            json={
                "first_name": "Тест",
                "last_name": "Студент",
                "current_password": "OldPassword1",
                "new_password": "NewPassword2",
            },
            headers={"X-CSRF-Token": csrf_a},
        )
        self.assertEqual(r_pwd.status_code, 200)
        # c_s2_b holds stale session_version -> rejected
        self.assertFalse(c_s2_b.get("/api/auth/session").get_json()["authenticated"])

    def test_d02_teacher_group_isolation_grade_404_demo_reset_and_canonical_slugs(self):
        # Register Teacher GD (no explicit teacher_groups row -> canonical fallback ГД-21/ГД-22)
        c_tgd, u_tgd, csrf_tgd = self.register_and_login(
            role="teacher",
            specialty_slug="graphic_design",
            teacher_code="AMK2026",
            first_name="Алия",
            last_name="Дизайнова",
        )
        with server.app.app_context():
            assigned_groups = server.get_teacher_assigned_groups(u_tgd["id"])
            self.assertEqual(assigned_groups, ["ГД-21"])
            conn = server.get_db()
            conn.execute("DELETE FROM teacher_groups WHERE teacher_id = ?", (u_tgd["id"],))
            conn.commit()
            canonical_groups = server.get_teacher_assigned_groups(u_tgd["id"])
        self.assertEqual(canonical_groups, ["ГД-21", "ГД-22"])

        c_st_gd, u_st_gd, csrf_st_gd = self.register_and_login(role="student", specialty_slug="graphic_design", group_name="ГД-21")
        c_st_it, u_st_it, csrf_st_it = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")

        # Student IT submits task 1
        r_sub_it = c_st_it.post(
            "/api/tasks/submit",
            json={"specialty_slug": "it", "task_number": 1, "code": "<div>Test</div>", "quiz_score": 3},
            headers={"X-CSRF-Token": csrf_st_it},
        )
        self.assertEqual(r_sub_it.status_code, 200)
        it_sub_id = r_sub_it.get_json()["result"]["submission_id"]

        # Teacher GD queries students, foreign group, matrix, stats, grade_submission
        r_st = c_tgd.get("/api/teacher/students")
        self.assertEqual(r_st.status_code, 200)
        emails = {s["email"] for s in r_st.get_json()["students"]}
        self.assertIn(u_st_gd["email"], emails)
        self.assertNotIn(u_st_it["email"], emails)

        self.assertEqual(c_tgd.get("/api/teacher/students?group=ИС-21").status_code, 403)

        r_mat = c_tgd.get("/api/teacher/matrix?specialty=it")
        self.assertEqual(r_mat.status_code, 200)
        mat_emails = {row["student"]["email"] for row in r_mat.get_json()["rows"]}
        self.assertNotIn(u_st_it["email"], mat_emails)

        # Grading IT student's submission as GD teacher -> 403 GROUP_ACCESS_DENIED
        r_g403 = c_tgd.post(
            "/api/teacher/grade_submission",
            json={"submission_id": it_sub_id, "grade": 90, "feedback": "Cross-group"},
            headers={"X-CSRF-Token": csrf_tgd},
        )
        self.assertEqual(r_g403.status_code, 403)
        self.assertEqual(r_g403.get_json().get("code"), "GROUP_ACCESS_DENIED")

        # Grading non-existent submission -> 404
        r_g404 = c_tgd.post(
            "/api/teacher/grade_submission",
            json={"submission_id": 99999999, "grade": 90},
            headers={"X-CSRF-Token": csrf_tgd},
        )
        self.assertEqual(r_g404.status_code, 404)

        # Student cannot call /api/demo/reset -> 403
        r_demo = c_st_gd.post("/api/demo/reset", json={}, headers={"X-CSRF-Token": csrf_st_gd})
        self.assertEqual(r_demo.status_code, 403)

    def test_d03_teacher_cross_group_grade_task_and_broadcast_blocked(self):
        c_tit, _, csrf_tit = self.register_and_login(
            role="teacher",
            specialty_slug="it",
            teacher_code="AMK2026",
            first_name="Иван",
            last_name="Кодов",
        )
        _, u_hvac, _ = self.register_and_login(role="student", specialty_slug="hvac", group_name="ХО-21")
        c_admin, _, csrf_admin = self.get_admin_client()
        h_tit = {"X-CSRF-Token": csrf_tit}
        h_admin = {"X-CSRF-Token": csrf_admin}

        # (a) Cross-group /api/grades/save and /api/tasks/submit blocked with 403
        r_gs = c_tit.post(
            "/api/grades/save",
            json={"user_id": u_hvac["id"], "specialty_slug": "hvac", "task_number": 1, "score": 95},
            headers=h_tit,
        )
        self.assertEqual(r_gs.status_code, 403)
        r_ts = c_tit.post(
            "/api/tasks/submit",
            json={"user_id": u_hvac["id"], "specialty_slug": "hvac", "task_number": 1, "score": 95},
            headers=h_tit,
        )
        self.assertEqual(r_ts.status_code, 403)

        # (b) Cross-group /api/tasks/progress blocked with 403
        r_tp = c_tit.post(
            "/api/tasks/progress",
            json={"user_id": u_hvac["id"], "specialty_slug": "hvac", "task_number": 1, "quiz_score": 3},
            headers=h_tit,
        )
        self.assertEqual(r_tp.status_code, 403)

        # (c) Cross-specialty /api/teacher/create_task blocked with 403 and title unchanged
        with server.app.app_context():
            conn = server.get_db()
            auto_t1 = conn.execute(
                "SELECT id, title FROM tasks WHERE specialty_slug = 'automechanic' AND task_number = 1"
            ).fetchone()
        r_ct = c_tit.post(
            "/api/teacher/create_task",
            json={"specialty_slug": "automechanic", "task_number": 1, "title": "Hijacked", "description": "Hijacked"},
            headers=h_tit,
        )
        self.assertEqual(r_ct.status_code, 403)
        with server.app.app_context():
            conn = server.get_db()
            auto_t1_after = conn.execute(
                "SELECT title FROM tasks WHERE specialty_slug = 'automechanic' AND task_number = 1"
            ).fetchone()
        self.assertEqual(auto_t1["title"], auto_t1_after["title"])

        # (d) Cross-specialty POST/DELETE /api/teacher/delete_task blocked with 403
        self.assertEqual(
            c_tit.post(
                "/api/teacher/delete_task",
                json={"specialty_slug": "automechanic", "task_number": 1},
                headers=h_tit,
            ).status_code,
            403,
        )
        self.assertEqual(
            c_tit.delete(
                f"/api/teacher/delete_task?task_id={auto_t1['id']}",
                headers=h_tit,
            ).status_code,
            403,
        )

        # (e) Broadcast with empty or unassigned group blocked with 403; assigned group ИС-21 allowed
        self.assertEqual(
            c_tit.post("/api/teacher/broadcast", json={"target_group": "", "title": "All", "body": "Body"}, headers=h_tit).status_code,
            403,
        )
        self.assertEqual(
            c_tit.post("/api/teacher/broadcast", json={"target_group": "АМ-21", "title": "Other", "body": "Body"}, headers=h_tit).status_code,
            403,
        )
        self.assertEqual(
            c_tit.post("/api/teacher/broadcast", json={"target_group": "ИС-21", "title": "Own", "body": "Body"}, headers=h_tit).status_code,
            200,
        )

        # Admin remains globally allowed
        self.assertEqual(
            c_admin.post("/api/teacher/broadcast", json={"target_group": "", "title": "AdminAll", "body": "Body"}, headers=h_admin).status_code,
            200,
        )
        self.assertEqual(
            c_admin.post(
                "/api/grades/save",
                json={"user_id": u_hvac["id"], "specialty_slug": "hvac", "task_number": 1, "score": 88},
                headers=h_admin,
            ).status_code,
            200,
        )


class TestGroupEM1Curriculum20AndProLock(M1TestBase):
    """T-M1-06: 12->20 curriculum alignment, health counts, and Pro-tier consistency."""

    def test_e01_20_lessons_unlock_health_and_pro_tier_lock(self):
        c_t, _, csrf_t = self.register_and_login(role="teacher", specialty_slug="it", teacher_code="AMK2026")
        h = self.new_client().get("/api/health").get_json()
        self.assertEqual(h["tasks_total"], 100)
        self.assertEqual(h["lessons_total"], 100)

        courses = self.new_client().get("/api/courses").get_json()["courses"]
        self.assertEqual(len(courses), 5)
        for crs in courses:
            self.assertEqual(crs["total_lessons"], 20)

        r_adv = c_t.post("/api/teacher/advance_day", json={"day": 20}, headers={"X-CSRF-Token": csrf_t})
        self.assertEqual(r_adv.status_code, 200)
        self.assertEqual(r_adv.get_json()["current_study_day"], 20)

        # Free student: tasks 1..20 returned, task 20 unlock_day passed, but Pro lock enforced on task/lesson > 3
        c_st, u_st, csrf_st = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")
        tasks_resp = c_st.get(f"/api/tasks?specialty=it&user_id={u_st['id']}").get_json()
        self.assertEqual(len(tasks_resp["tasks"]), 20)
        task_20 = tasks_resp["tasks"][19]
        self.assertEqual(task_20["task_number"], 20)
        self.assertFalse(task_20["is_locked"])
        self.assertTrue(task_20["is_pro_required"])

        # Free student gets 403 on Pro-locked task 20 & lesson 20
        r_t20_free = c_st.get(f"/api/tasks/{task_20['id']}")
        self.assertEqual(r_t20_free.status_code, 403)
        self.assertTrue(r_t20_free.get_json().get("is_pro_locked"))

        with server.app.app_context():
            conn = server.get_db()
            l20 = conn.execute(
                "SELECT l.id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.slug = 'it' AND l.order_num = 20 LIMIT 1"
            ).fetchone()
        r_l20_free = c_st.get(f"/api/lessons/{l20['id']}")
        self.assertEqual(r_l20_free.status_code, 403)
        self.assertTrue(r_l20_free.get_json().get("is_pro_locked"))

        # Upgrade student to Pro in sandbox -> both task 20 and lesson 20 return 200
        r_pro = c_st.post(
            "/api/billing/checkout",
            json={"plan_code": "pro", "billing_period": "monthly", "payment_method": "sandbox"},
            headers={"X-CSRF-Token": csrf_st},
        )
        self.assertEqual(r_pro.status_code, 200)
        self.assertEqual(c_st.get(f"/api/tasks/{task_20['id']}").status_code, 200)
        self.assertEqual(c_st.get(f"/api/lessons/{l20['id']}").status_code, 200)

        # /api/academy/progress accepts lesson 20
        r_prog = c_st.post(
            "/api/academy/progress",
            json={"specialty": "it", "lesson": 20},
            headers={"X-CSRF-Token": csrf_st},
        )
        self.assertEqual(r_prog.status_code, 200)

    def test_e02_anon_pro_and_unlock_day_bypass_blocked(self):
        c_t, _, csrf_t = self.register_and_login(role="teacher", specialty_slug="it", teacher_code="AMK2026")
        self.assertEqual(c_t.post("/api/teacher/advance_day", json={"day": 1}, headers={"X-CSRF-Token": csrf_t}).status_code, 200)

        with server.app.app_context():
            conn = server.get_db()
            l1 = conn.execute("SELECT l.id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.slug = 'it' AND l.order_num = 1 LIMIT 1").fetchone()
            l2 = conn.execute("SELECT l.id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.slug = 'it' AND l.order_num = 2 LIMIT 1").fetchone()
            l20 = conn.execute("SELECT l.id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.slug = 'it' AND l.order_num = 20 LIMIT 1").fetchone()
            t20 = conn.execute("SELECT id FROM tasks WHERE specialty_slug = 'it' AND task_number = 20 LIMIT 1").fetchone()

        anon = self.new_client()
        # Unlocked Day-1 Module 1 remains accessible for guest preview
        self.assertEqual(anon.get(f"/api/lessons/{l1['id']}").status_code, 200)

        # Unauthenticated caller must NEVER receive 200 or leak blocks on Pro-locked or Day-locked modules
        r_anon_l20 = anon.get(f"/api/lessons/{l20['id']}")
        self.assertIn(r_anon_l20.status_code, (401, 403))
        self.assertNotIn("blocks", (r_anon_l20.get_json() or {}).get("lesson", {}))

        r_anon_l2 = anon.get(f"/api/lessons/{l2['id']}")
        self.assertIn(r_anon_l2.status_code, (401, 403))

        # Day-1 Free student cannot fetch Day-2 lesson
        c_st, _, _ = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")
        self.assertEqual(c_st.get(f"/api/lessons/{l2['id']}").status_code, 403)

        # Even after advancing study day to 20, unauthenticated caller still blocked on Pro task 20 & lesson 20
        self.assertEqual(c_t.post("/api/teacher/advance_day", json={"day": 20}, headers={"X-CSRF-Token": csrf_t}).status_code, 200)
        try:
            self.assertIn(anon.get(f"/api/tasks/{t20['id']}").status_code, (401, 403))
            self.assertIn(anon.get(f"/api/lessons/{l20['id']}").status_code, (401, 403))
        finally:
            c_t.post("/api/teacher/advance_day", json={"day": 1}, headers={"X-CSRF-Token": csrf_t})

    def test_e03_free_student_cannot_complete_pro_or_future_lessons(self):
        c_t, _, csrf_t = self.register_and_login(role="teacher", specialty_slug="it", teacher_code="AMK2026")
        self.assertEqual(c_t.post("/api/teacher/advance_day", json={"day": 1}, headers={"X-CSRF-Token": csrf_t}).status_code, 200)

        with server.app.app_context():
            conn = server.get_db()
            l2 = conn.execute("SELECT l.id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.slug = 'it' AND l.order_num = 2 LIMIT 1").fetchone()
            l20 = conn.execute("SELECT l.id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.slug = 'it' AND l.order_num = 20 LIMIT 1").fetchone()

        c_st, u_st, csrf_st = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")
        h_st = {"X-CSRF-Token": csrf_st}

        # (a) Free student cannot complete Pro lesson 20
        r_comp20 = c_st.post(f"/api/lessons/{l20['id']}/complete", json={}, headers=h_st)
        self.assertEqual(r_comp20.status_code, 403)
        with server.app.app_context():
            conn = server.get_db()
            bp_cnt = conn.execute("SELECT COUNT(*) FROM lesson_block_progress WHERE user_id = ? AND lesson_id = ?", (u_st["id"], l20["id"])).fetchone()[0]
            xp_cnt = conn.execute("SELECT COUNT(*) FROM xp_transactions WHERE user_id = ?", (u_st["id"],)).fetchone()[0]
        self.assertEqual(bp_cnt, 0)
        self.assertEqual(xp_cnt, 0)

        # (b) Free student cannot save block_progress on lesson 20
        self.assertEqual(
            c_st.post(f"/api/lessons/{l20['id']}/block_progress", json={"block_id": "b1_hook", "completed": True}, headers=h_st).status_code,
            403,
        )

        # (c) Free student cannot mark lesson 20 in /api/academy/progress
        self.assertEqual(
            c_st.post("/api/academy/progress", json={"specialty": "it", "lesson": 20}, headers=h_st).status_code,
            403,
        )

        # (d) Upgrade to Pro -> still blocked on Day-locked lesson 2 on Day 1
        self.assertEqual(
            c_st.post("/api/billing/checkout", json={"plan_code": "pro", "billing_period": "monthly", "payment_method": "sandbox"}, headers=h_st).status_code,
            200,
        )
        self.assertEqual(c_st.post(f"/api/lessons/{l2['id']}/complete", json={}, headers=h_st).status_code, 403)


class _FakePgIntegrityError(Exception):
    pass


class _FakePgCursor:
    def __init__(self, conn):
        self.conn = conn
        self.rowcount = 1
        self._rows = []

    def execute(self, sql, params=None):
        if self.conn.in_failed_tx:
            raise RuntimeError("InFailedSqlTransaction: current transaction is aborted")
        norm = " ".join(sql.split())
        if "INSERT INTO xp_transactions" in norm or "INSERT INTO daily_quests_log" in norm:
            self.conn.in_failed_tx = True
            raise _FakePgIntegrityError("duplicate key value violates unique constraint")
        if norm.startswith("SELECT COALESCE(SUM(amount), 0) FROM xp_transactions"):
            self._rows = [(100,)]
        elif norm.startswith("SELECT bonus_xp FROM users"):
            self._rows = [{"bonus_xp": 50}]
        elif norm.startswith("SELECT streak_days FROM users"):
            self._rows = [{"streak_days": 1}]
        elif norm.startswith("SELECT quest_key FROM daily_quests_log"):
            self._rows = []
        else:
            self._rows = []

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return list(self._rows)


class _FakePgConn:
    def __init__(self):
        self.in_failed_tx = False
        self.rollback_count = 0
        self.commit_count = 0

    def cursor(self):
        return _FakePgCursor(self)

    def rollback(self):
        self.in_failed_tx = False
        self.rollback_count += 1

    def commit(self):
        self.commit_count += 1


class TestGroupFM1PostgresParityAndRollback(M1TestBase):
    """T-M1-07: Mock PG IntegrityError rollback() and migrate_to_postgres.py schema parity."""

    def test_f01_pg_award_xp_and_daily_quests_rollback_on_integrity_error(self):
        fake_conn = _FakePgConn()
        awarded, final_bonus, lvl = server.award_xp(fake_conn, 1, 50, "task_completion", "it_1", "Test")
        self.assertFalse(awarded)
        self.assertGreaterEqual(fake_conn.rollback_count, 1)
        self.assertEqual(final_bonus, 100)
        self.assertIsInstance(lvl["level"], int)

        # Verify daily_quests POST path rolls back if daily_quests_log insert raises IntegrityError
        c_st, u_st, csrf_st = self.register_and_login()
        fake_conn2 = _FakePgConn()

        def fake_award_xp(conn, uid, amount, src, sid, desc):
            return True, 125, server.get_level_info(125)

        with patch.object(server, "get_current_user", return_value=u_st), \
             patch.object(server, "get_db", return_value=fake_conn2), \
             patch.object(server, "award_xp", side_effect=fake_award_xp):
            r_dq = c_st.post(
                "/api/daily_quests",
                json={"quest_key": "pass_quiz"},
                headers={"X-CSRF-Token": csrf_st},
            )
            self.assertEqual(r_dq.status_code, 200)
            self.assertGreaterEqual(fake_conn2.rollback_count, 1)
            self.assertFalse(fake_conn2.in_failed_tx)

    def test_f02_migrate_to_postgres_schema_parity(self):
        import migrate_to_postgres as mtp

        sqlite_conn = sqlite3.connect(_TEMP_DB_PATH)
        sqlite_tables = {
            r[0] for r in sqlite_conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'"
            ).fetchall()
        }
        self.assertEqual(mtp.ALLOWED_TABLES, sqlite_tables)

        with open(os.path.join(REPO_ROOT, "migrate_to_postgres.py"), "r", encoding="utf-8") as f:
            src = f.read()

        self.assertIn("def _validate_ident(", src)
        self.assertIn("ALLOWED_TABLES", src)
        self.assertIn("notification_reads", src)

        ddl_cols = {}
        for m in re.finditer(r"CREATE TABLE IF NOT EXISTS\s+([a-z_]+)\s*\((.*?)\)\s*;?\s*\"\"\"", src, re.DOTALL):
            tbl = m.group(1)
            body = m.group(2)
            cols = set()
            for line in body.splitlines():
                line = line.strip()
                if not line or line.startswith(("--", "UNIQUE", "CONSTRAINT", "PRIMARY", "FOREIGN")):
                    continue
                col_m = re.match(r"^([a-z_][a-z0-9_]*)\s+", line)
                if col_m:
                    cols.add(col_m.group(1))
            ddl_cols[tbl] = cols

        self.assertEqual(set(ddl_cols.keys()), sqlite_tables)
        for tbl in sqlite_tables:
            sq_cols = {r[1] for r in sqlite_conn.execute(f"PRAGMA table_info({tbl})").fetchall()}
            missing = sq_cols - ddl_cols[tbl]
            self.assertEqual(missing, set(), f"migrate_to_postgres.py table '{tbl}' missing columns: {missing}")

        for col in ("bonus_xp", "streak_days", "achievements_json", "session_version"):
            self.assertIn(col, ddl_cols["users"])
        for col in ("purpose", "attempts"):
            self.assertIn(col, ddl_cols["email_verifications"])
        for col in ("current_stage", "mission_state_json", "mission_xp"):
            self.assertIn(col, ddl_cols["lesson_progress"])
        sqlite_conn.close()

    def test_f03_pg_init_db_preserves_current_study_day(self):
        with open(os.path.join(REPO_ROOT, "server.py"), "r", encoding="utf-8") as f:
            srv_src = f.read()
        self.assertIn(
            "INSERT INTO platform_settings (key, value) VALUES ('current_study_day', '1') ON CONFLICT (key) DO NOTHING",
            srv_src,
        )
        self.assertNotIn(
            "INSERT INTO platform_settings (key, value) VALUES ('current_study_day', '1') ON CONFLICT (key) DO UPDATE",
            srv_src,
        )


class TestGroupGM1CertHMACAndLeaderboard(M1TestBase):
    """T-M1-08: HMAC cert verification, no fake 92.4, and leaderboard XP sorting."""

    def test_g01_certificate_hmac_no_fake_92_4_and_leaderboard_sort(self):
        c_st, u_st, _ = self.register_and_login(role="student", specialty_slug="it", group_name="ИС-21")
        # Sequential integer and email lookups must be rejected
        self.assertEqual(self.new_client().get("/api/certificate/verify?cert=1").status_code, 400)
        self.assertEqual(self.new_client().get(f"/api/certificate/verify?cert={u_st['email']}").status_code, 400)

        cert_code = server.make_certificate_code(u_st["id"], u_st["student_id"])
        r_cert = self.new_client().get(f"/api/certificate/verify?cert={cert_code}")
        self.assertEqual(r_cert.status_code, 200)
        cert = r_cert.get_json()["certificate"]
        self.assertEqual(cert["passed_modules"], 0)
        self.assertEqual(cert["average_score"], 0.0)
        self.assertNotEqual(cert["average_score"], 92.4)
        self.assertIn("IN_PROGRESS", cert["status"])

        # Tampered HMAC signature -> 404
        tampered = cert_code[:-1] + ("0" if cert_code[-1] != "0" else "1")
        self.assertEqual(self.new_client().get(f"/api/certificate/verify?cert={tampered}").status_code, 404)

        # Teacher cannot receive a student certificate
        _, u_t, _ = self.register_and_login(role="teacher", specialty_slug="it", teacher_code="AMK2026")
        t_cert = server.make_certificate_code(u_t["id"], u_t["student_id"])
        self.assertEqual(self.new_client().get(f"/api/certificate/verify?cert={t_cert}").status_code, 404)

        # Leaderboard sorted strictly descending by total_xp
        lb = self.new_client().get("/api/leaderboard").get_json()["leaderboard"]
        xps = [row["total_xp"] for row in lb]
        self.assertEqual(xps, sorted(xps, reverse=True))


class TestGroupHM1AIAndSecretHygiene(M1TestBase):
    """T-M1-09: AI 503 BLOCKED without key and secret/XSS hygiene checks."""

    def test_h01_ai_chat_503_blocked_without_key(self):
        self.assertEqual(self.new_client().post("/api/ai/chat", json={"message": "Привет"}).status_code, 401)
        c_st, _, csrf_st = self.register_and_login()
        r = c_st.post("/api/ai/chat", json={"message": "Помоги с задачей"}, headers={"X-CSRF-Token": csrf_st})
        self.assertEqual(r.status_code, 503)
        d = r.get_json()
        self.assertEqual(d.get("status"), "BLOCKED")
        self.assertEqual(d.get("code"), "AI_PROVIDER_UNCONFIGURED")

    def test_h02_secret_hygiene_and_xss_escapers_static_scan(self):
        with open(os.path.join(REPO_ROOT, "server.py"), "r", encoding="utf-8") as f:
            srv_src = f.read()
        with open(os.path.join(REPO_ROOT, "docker-compose.yml"), "r", encoding="utf-8") as f:
            dc_src = f.read()

        self.assertNotIn("d03509181@gmail.com", srv_src)
        self.assertNotIn("danidanilov333@gmail.com", srv_src)
        self.assertIn("POSTGRES_PASSWORD:?", dc_src)
        self.assertIn("SESSION_SECRET:?", dc_src)

        for rel in ("lesson_player.html", "simulator.html", "teacher.html", "profile.html", os.path.join("js", "app-logistics.js"), os.path.join("js", "photoreal-showcase.js")):
            with open(os.path.join(REPO_ROOT, rel), "r", encoding="utf-8") as f:
                self.assertIn("escapeHtml", f.read(), f"Missing escapeHtml in {rel}")

        with open(os.path.join(REPO_ROOT, "mission.html"), "r", encoding="utf-8") as f:
            mission_src = f.read()
        self.assertIn("escapeMissionHtml", mission_src)
        self.assertIn("sanitizeHexColor", mission_src)

        with open(os.path.join(REPO_ROOT, "verify.html"), "r", encoding="utf-8") as f:
            self.assertNotIn("danidanilov333@gmail.com", f.read())

    def test_h03_ai_tutor_503_blocked_and_ai_rate_limit(self):
        # (a) Unauth -> 401
        self.assertEqual(self.new_client().post("/api/ai/tutor", json={"message": "Помоги"}).status_code, 401)

        # (b) Auth student with message OR question -> 503 BLOCKED AI_PROVIDER_UNCONFIGURED
        c_st, _, csrf_st = self.register_and_login()
        h = {"X-CSRF-Token": csrf_st}
        for payload in (
            {"message": "Помоги с заданием", "course_slug": "it", "lesson_id": 1},
            {"question": "Помоги с заданием", "lesson_id": 1},
        ):
            r = c_st.post("/api/ai/tutor", json=payload, headers=h)
            self.assertEqual(r.status_code, 503, f"Expected 503 for {payload}, got {r.status_code}: {r.get_data(as_text=True)}")
            d = r.get_json() or {}
            self.assertEqual(d.get("status"), "BLOCKED")
            self.assertEqual(d.get("code"), "AI_PROVIDER_UNCONFIGURED")

        # (c) Burst 47 POSTs to /api/ai/chat and /api/ai/tutor -> hits 429 Retry-After: 60
        for path, remote_ip in (("/api/ai/chat", "10.0.0.155"), ("/api/ai/tutor", "10.0.0.156")):
            hit_429 = False
            for _ in range(47):
                r_burst = c_st.post(
                    path,
                    json={"message": "Тест лимита"},
                    headers=h,
                    environ_base={"REMOTE_ADDR": remote_ip},
                )
                if r_burst.status_code == 429:
                    hit_429 = True
                    self.assertEqual(r_burst.headers.get("Retry-After"), "60")
                    break
                self.assertEqual(r_burst.status_code, 503)
            self.assertTrue(hit_429, f"Expected 429 on {path} within 47 requests")


class TestGroupIM1UploadDirAndTraversal(M1TestBase):
    """T-M1-11: UPLOAD_DIR persistence, extension/empty validation, and path traversal guard."""

    def test_i01_upload_dir_persistence_and_traversal_guard(self):
        c_st, _, csrf_st = self.register_and_login()
        h = {"X-CSRF-Token": csrf_st}

        # Valid upload lands in configured UPLOAD_DIR inside %TEMP%
        r_ok = c_st.post(
            "/api/tasks/upload",
            data={"specialty_slug": "it", "task_number": "1", "file": (io.BytesIO(b"hello submission"), "notes.txt")},
            content_type="multipart/form-data",
            headers=h,
        )
        self.assertEqual(r_ok.status_code, 200)
        d_ok = r_ok.get_json()
        saved_name = d_ok["saved_name"]
        expected_path = os.path.join(_TEMP_UPLOAD_DIR, saved_name)
        self.assertTrue(os.path.exists(expected_path), f"Upload missing from UPLOAD_DIR: {expected_path}")

        r_get = c_st.get(d_ok["file_url"])
        self.assertEqual(r_get.status_code, 200)
        self.assertEqual(r_get.data, b"hello submission")
        r_get.close()

        # Disallowed .svg extension -> 400
        r_svg = c_st.post(
            "/api/tasks/upload",
            data={"specialty_slug": "it", "task_number": "1", "file": (io.BytesIO(b"<svg/>"), "xss.svg")},
            content_type="multipart/form-data",
            headers=h,
        )
        self.assertEqual(r_svg.status_code, 400)

        # Empty file -> 400
        r_empty = c_st.post(
            "/api/tasks/upload",
            data={"specialty_slug": "it", "task_number": "1", "file": (io.BytesIO(b""), "empty.txt")},
            content_type="multipart/form-data",
            headers=h,
        )
        self.assertEqual(r_empty.status_code, 400)

        # Traversal guard on /uploads/ and /database.db
        self.assertEqual(c_st.get("/uploads/../database.db").status_code, 403)
        self.assertIn(c_st.get("/database.db").status_code, (403, 404))


class TestGroupJM1SeleniumBrowser(M1TestBase):
    """T-M1-02, T-M1-03, T-M1-08, T-M1-09, T-M1-10: Headless browser verification against isolated WSGI server."""

    wsgi_server = None
    wsgi_thread = None
    base_url = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if os.environ.get("M1_SKIP_SELENIUM") == "1":
            return
        from werkzeug.serving import make_server
        cls.wsgi_server = make_server("127.0.0.1", 0, server.app, threaded=True)
        port = cls.wsgi_server.server_port
        cls.base_url = f"http://127.0.0.1:{port}"
        cls.wsgi_thread = threading.Thread(target=cls.wsgi_server.serve_forever, daemon=True)
        cls.wsgi_thread.start()

    @classmethod
    def tearDownClass(cls):
        if cls.wsgi_server is not None:
            cls.wsgi_server.shutdown()
            cls.wsgi_server.server_close()
            cls.wsgi_server = None
        super().tearDownClass()

    def _new_driver(self):
        if os.environ.get("M1_SKIP_SELENIUM") == "1":
            self.skipTest("M1_SKIP_SELENIUM=1")
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options as ChromeOptions
        opts = ChromeOptions()
        opts.page_load_strategy = "eager"
        opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu-sandbox")
        opts.add_argument("--enable-webgl")
        opts.add_argument("--ignore-gpu-blocklist")
        opts.add_argument("--use-gl=angle")
        opts.add_argument("--use-angle=swiftshader")
        opts.add_argument("--window-size=1440,900")
        opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
        drv = webdriver.Chrome(options=opts)
        drv.set_page_load_timeout(120)
        self.addCleanup(drv.quit)
        return drv

    def _browser_login(self, drv, email, password="ValidPass123"):
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        drv.get(f"{self.base_url}/auth.html")
        WebDriverWait(drv, 20).until(lambda d: d.execute_script("return document.readyState !== 'loading'"))
        WebDriverWait(drv, 20).until(EC.presence_of_element_located((By.ID, "account-login")))
        WebDriverWait(drv, 15).until(
            lambda d: d.execute_script("return !!(window.EduSpace && window.EduSpace.setActiveUser);")
        )
        login_res = drv.execute_script(
            """
            var sx = new XMLHttpRequest();
            sx.open('GET', '/api/auth/session', false);
            sx.send(null);
            var csrf = (JSON.parse(sx.responseText) || {}).csrf_token || '';
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/auth/login', false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf);
            xhr.send(JSON.stringify({email: arguments[0], password: arguments[1]}));
            if (xhr.status === 200) {
                try {
                    var resp = JSON.parse(xhr.responseText) || {};
                    if (resp.user && window.EduSpace && window.EduSpace.setActiveUser) {
                        window.EduSpace.setActiveUser(resp.user);
                    }
                } catch (e) {}
            }
            return xhr.status;
            """,
            email,
            password,
        )
        self.assertEqual(login_res, 200)

    def _severe_logs(self, drv):
        out = []
        try:
            for entry in drv.get_log("browser"):
                if entry.get("level") == "SEVERE" and "favicon.ico" not in entry.get("message", ""):
                    out.append(entry.get("message", ""))
        except Exception:
            pass
        return out

    def test_j01_lesson_player_ai_tutor_dom_xss(self):
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        st_email = self.unique_email("sel_xss")
        self.register_and_login(email=st_email, password="ValidPass123")
        drv = self._new_driver()
        self._browser_login(drv, st_email, "ValidPass123")

        drv.get(f"{self.base_url}/lesson_player.html?lesson_id=1")
        WebDriverWait(drv, 30).until(EC.presence_of_element_located((By.ID, "ai-tutor-input")))
        WebDriverWait(drv, 30).until(
            lambda d: d.execute_script("return typeof toggleAiTutor === 'function' && typeof submitAiTutor === 'function';")
        )
        WebDriverWait(drv, 30).until(
            lambda d: (d.find_element(By.ID, "lp-lesson-title").text or "").strip() not in ("", "Загрузка урока...")
        )
        drv.execute_script("toggleAiTutor(true);")
        WebDriverWait(drv, 15).until(
            lambda d: "BLOCKED" in (d.find_element(By.ID, "lp-ai-status-badge").text or "").upper()
        )
        inp = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.ID, "ai-tutor-input")))

        payload = '<img src=x onerror="window.__xss=1"><svg onload="window.__xss=2">'
        inp.clear()
        inp.send_keys(payload)
        drv.execute_script("submitAiTutor(new Event('submit', {cancelable: true}));")

        WebDriverWait(drv, 15).until(
            lambda d: payload in d.find_element(By.ID, "ai-tutor-messages").text
            and (
                "AI-наставник недоступен" in d.find_element(By.ID, "ai-tutor-messages").text
                or "API-ключ" in d.find_element(By.ID, "ai-tutor-messages").text
                or "BLOCKED" in d.find_element(By.ID, "ai-tutor-messages").text
            )
        )
        self.assertEqual(len(drv.find_elements(By.CSS_SELECTOR, "[id^='ai-load-']")), 0)
        self.assertIsNone(drv.execute_script("return window.__xss;"))
        injected_cnt = drv.execute_script(
            "return document.querySelectorAll('#ai-tutor-messages img, #ai-tutor-messages svg[onload]').length;"
        )
        self.assertEqual(injected_cnt, 0)

    def test_j02_verify_html_zero_js_errors_and_dynamic_qr(self):
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait

        _, u_a, _ = self.register_and_login(first_name="Алихан", last_name="Тестов")
        _, u_b, _ = self.register_and_login(first_name="Мадина", last_name="Тестова")
        cert_a = server.make_certificate_code(u_a["id"], u_a["student_id"])
        cert_b = server.make_certificate_code(u_b["id"], u_b["student_id"])

        drv = self._new_driver()
        drv.get(f"{self.base_url}/verify.html?cert={cert_a}")
        WebDriverWait(drv, 15).until(
            lambda d: not d.find_element(By.ID, "verify-card").get_attribute("class").__contains__("hidden")
        )
        self.assertEqual(self._severe_logs(drv), [])
        svg_a = drv.find_element(By.CSS_SELECTOR, "#cert-qr-svg svg").get_attribute("outerHTML")
        rect_cnt = len(drv.find_elements(By.CSS_SELECTOR, "#cert-qr-svg svg rect"))
        self.assertGreater(rect_cnt, 100, f"Expected real QR matrix (>100 rects), got {rect_cnt}")

        drv.get(f"{self.base_url}/verify.html?cert={cert_b}")
        WebDriverWait(drv, 15).until(
            lambda d: not d.find_element(By.ID, "verify-card").get_attribute("class").__contains__("hidden")
        )
        svg_b = drv.find_element(By.CSS_SELECTOR, "#cert-qr-svg svg").get_attribute("outerHTML")
        self.assertNotEqual(svg_a, svg_b, "QR SVG must vary dynamically per certificate URL")

    def test_j03_auth_gates_zero_guest_401_and_optional_otp_ui(self):
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        drv = self._new_driver()
        # Guest on learn.html, admin.html, teacher.html, mission.html -> 0 SEVERE/401 console errors
        for page in ("learn.html", "admin.html", "teacher.html", "mission.html"):
            drv.get(f"{self.base_url}/{page}")
            WebDriverWait(drv, 15).until(lambda d: d.execute_script("return document.readyState !== 'loading'"))
            time.sleep(0.5)
            errs = self._severe_logs(drv)
            self.assertEqual(errs, [], f"Guest {page} had SEVERE/401 console errors: {errs}")

        # Verify explicit gates and zero fake KPIs on admin.html/teacher.html/mission.html
        drv.get(f"{self.base_url}/admin.html")
        WebDriverWait(drv, 15).until(lambda d: "hidden" not in d.find_element(By.ID, "admin-auth-gate").get_attribute("class"))
        self.assertNotEqual(drv.find_element(By.ID, "stat-submissions").text.strip(), "48")

        drv.get(f"{self.base_url}/teacher.html")
        WebDriverWait(drv, 15).until(lambda d: "hidden" not in d.find_element(By.ID, "teacher-auth-gate").get_attribute("class"))

        drv.get(f"{self.base_url}/mission.html")
        WebDriverWait(drv, 15).until(lambda d: "hidden" not in d.find_element(By.ID, "mission-auth-gate").get_attribute("class"))

        # Optional OTP registration via auth.html -> student.html + zero plaintext password in localStorage
        drv.get(f"{self.base_url}/auth.html?mode=register")
        WebDriverWait(drv, 15).until(EC.presence_of_element_located((By.ID, "account-register")))
        time.sleep(0.4)
        otp_req = drv.execute_script(
            "var el = document.querySelector('#account-register input[name=\"verification_code\"]'); return el ? el.required : false;"
        )
        self.assertFalse(otp_req)

        reg_email = self.unique_email("sel_reg")
        drv.execute_script(
            """
            var f = document.getElementById('account-register');
            f.elements.last_name.value = 'Тестов';
            f.elements.first_name.value = 'Студент';
            f.elements.email.value = arguments[0];
            f.elements.password.value = 'ValidPass123';
            f.elements.group_name.value = 'ИС-21';
            """,
            reg_email,
        )
        drv.find_element(By.CSS_SELECTOR, "#account-register button[type='submit']").click()
        WebDriverWait(drv, 15).until(lambda d: "student.html" in d.current_url)

        ls_dump = drv.execute_script("return JSON.stringify(localStorage);")
        self.assertNotIn("ValidPass123", ls_dump)
        self.assertNotIn("amk.local_accounts.v1", ls_dump)

    def test_j04_teacher_builder_stored_xss(self):
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        t_email = self.unique_email("sel_txss")
        c_t, _, csrf_t = self.register_and_login(
            email=t_email,
            role="teacher",
            specialty_slug="it",
            teacher_code="AMK2026",
            first_name="Олег",
            last_name="Преподов",
        )
        with server.app.app_context():
            conn = server.get_db()
            it_course = conn.execute("SELECT id FROM courses WHERE slug = 'it' LIMIT 1").fetchone()
            it_mod = conn.execute("SELECT id FROM course_modules WHERE course_id = ? LIMIT 1", (it_course["id"],)).fetchone()

        xss_payload = '</textarea><img src=x onerror="window.__xss=1"><svg onload="window.__xss=2">'
        r_create = c_t.post(
            "/api/lessons",
            json={
                "course_id": it_course["id"],
                "module_id": it_mod["id"] if it_mod else None,
                "title": "XSS Probe Lesson",
                "order_num": 19,
                "unlock_day": 1,
                "blocks": [
                    {
                        "id": "b1_hook",
                        "type": f'hook{xss_payload}',
                        "title": f'title{xss_payload}',
                        "content": f'content{xss_payload}',
                        "question": f'question{xss_payload}',
                    }
                ],
            },
            headers={"X-CSRF-Token": csrf_t},
        )
        self.assertEqual(r_create.status_code, 201)
        new_lesson_id = r_create.get_json()["lesson_id"]

        try:
            drv = self._new_driver()
            self._browser_login(drv, t_email, "ValidPass123")
            drv.get(f"{self.base_url}/teacher.html?tab=builder")
            WebDriverWait(drv, 25).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, f"#b-lesson-select option[value='{new_lesson_id}']"))
            )
            drv.execute_script(
                "var sel = document.getElementById('b-lesson-select'); sel.value = String(arguments[0]); sel.dispatchEvent(new Event('change'));",
                new_lesson_id,
            )
            WebDriverWait(drv, 15).until(
                lambda d: d.execute_script(
                    "var el = document.querySelector('#builder-blocks-list [data-block-field=\"title\"]'); return el ? el.value.indexOf('window.__xss') !== -1 : false;"
                )
            )
            self.assertIsNone(drv.execute_script("return window.__xss;"))
            injected = drv.execute_script(
                "return document.querySelectorAll('#builder-blocks-list img, #builder-blocks-list svg[onload]').length;"
            )
            self.assertEqual(injected, 0)
            vals = drv.execute_script(
                """
                var card = document.querySelector('#builder-blocks-list [data-block-card="0"]');
                return {
                    title: card.querySelector('[data-block-field="title"]').value,
                    content: card.querySelector('[data-block-field="content"]').value,
                    question: card.querySelector('[data-block-field="question"]').value
                };
                """
            )
            self.assertIn(xss_payload, vals["title"])
            self.assertIn(xss_payload, vals["content"])
            self.assertIn(xss_payload, vals["question"])
        finally:
            c_t.delete(f"/api/lessons/{new_lesson_id}", headers={"X-CSRF-Token": csrf_t})

    def test_j05_profile_hmac_cert_link_and_20_modules(self):
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        st_email = self.unique_email("sel_prof")
        _, u_st, _ = self.register_and_login(
            email=st_email,
            password="ValidPass123",
            first_name="Алихан",
            last_name="Тестов",
            specialty_slug="it",
            group_name="ИС-21",
        )
        expected_cert = server.make_certificate_code(u_st["id"], u_st["student_id"])

        drv = self._new_driver()
        self._browser_login(drv, st_email, "ValidPass123")
        drv.get(f"{self.base_url}/profile.html")
        WebDriverWait(drv, 25).until(
            lambda d: "0 из 20" in (d.find_element(By.ID, "prof-completed-cnt").text or "")
        )
        self.assertNotIn("из 10", drv.find_element(By.ID, "prof-completed-cnt").text)

        btn = WebDriverWait(drv, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[onclick*='openCertificateModal']"))
        )
        btn.click()

        modal = WebDriverWait(drv, 15).until(EC.visibility_of_element_located((By.ID, "edu-modal-dialog")))
        WebDriverWait(drv, 10).until(lambda d: (d.find_element(By.ID, "edu-modal-dialog").text or "").strip() != "")
        modal_text = modal.text
        self.assertIn("из 20", modal_text)
        self.assertNotIn("из 10", modal_text)
        self.assertIn("IN_PROGRESS", modal_text)
        self.assertNotIn("ВЕРИФИЦИРОВАНО", modal_text)

        verify_link = WebDriverWait(drv, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#edu-modal-dialog a[href*='verify.html?cert=']"))
        )
        href = verify_link.get_attribute("href")
        self.assertIn(expected_cert, href)

        drv.get(href)
        WebDriverWait(drv, 15).until(
            lambda d: "hidden" not in d.find_element(By.ID, "verify-card").get_attribute("class")
        )
        self.assertIn("hidden", drv.find_element(By.ID, "verify-error").get_attribute("class"))
        rect_cnt = len(drv.find_elements(By.CSS_SELECTOR, "#cert-qr-svg svg rect"))
        self.assertGreater(rect_cnt, 100)


if __name__ == "__main__":
    unittest.main(verbosity=2)
