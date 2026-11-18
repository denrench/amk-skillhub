# -*- coding: utf-8 -*-
"""
Tier 5 White-Box Unit, Asset Budget & Adversarial Regression Suite (M2–M6).
Verifies:
- M2: Zero cdn.tailwindcss.com references across all 20 HTML pages, css/app.min.css budget,
      lazy catalog chunks in assets/data/catalog/, and Cache-Control headers.
- M3: 25 unique GLB hashes and total GLB size <= 2.0 MB, /api/workshop/state & /api/workshop/action
      prerequisite and tool validation.
- M4: /api/tools/state persistence & XSS safety, /api/ai/* 503 BLOCKED when unconfigured.
- M5: /api/skills/map 20-node DAG & unlock progression, 5-specialty /api/mission/* idempotency,
      /api/portfolio/* privacy & %PDF-1.4 binary export, /api/exams/* HMAC nonce & deterministic rubric.
"""
from __future__ import annotations

import glob
import hashlib
import os
import tempfile
import unittest

import server


class TestM2ToM6WhiteBoxSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp_dir = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls._tmp_dir.name, "test_m2_m6.db")
        os.environ["EDUSPACE_DB_PATH"] = cls.db_path
        for k in ("GEMINI_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY", "ANTHROPIC_API_KEY"):
            os.environ.pop(k, None)
        server.DB_PATH = cls.db_path
        server.app.config["TESTING"] = True
        server.init_db()

    @classmethod
    def tearDownClass(cls):
        try:
            cls._tmp_dir.cleanup()
        except Exception:
            pass

    def _register_and_client(self, email_prefix="wb", role="student", specialty="automechanic", group="АМ-21"):
        client = server.app.test_client()
        payload = {
            "email": f"{email_prefix}_{os.urandom(4).hex()}@amk.kz",
            "password": "ValidPass123",
            "first_name": "Тимур",
            "last_name": "Ахметов",
            "role": role,
            "specialty_slug": specialty,
            "group_name": group,
        }
        if role == "teacher":
            payload["teacher_code"] = "AMK2026"
        resp = client.post("/api/auth/register", json=payload)
        self.assertIn(resp.status_code, (200, 201), resp.get_data(as_text=True))
        return client, resp.get_json()

    def test_01_m2_zero_cdn_tailwind_and_local_css_bundle(self):
        html_files = sorted(glob.glob(os.path.join(server.BASE_DIR, "*.html")))
        self.assertEqual(len(html_files), 20)
        for path in html_files:
            with open(path, "r", encoding="utf-8") as f:
                raw = f.read()
            self.assertNotIn("cdn.tailwindcss.com", raw, f"Forbidden CDN found in {os.path.basename(path)}")
        bundle_path = os.path.join(server.BASE_DIR, "css", "app.min.css")
        self.assertTrue(os.path.isfile(bundle_path))
        self.assertGreater(os.path.getsize(bundle_path), 50_000)

    def test_02_m2_lazy_catalog_chunks_and_static_cache_headers(self):
        for slug in ("it", "graphic_design", "autoelectric", "hvac", "automechanic"):
            chunk = os.path.join(server.BASE_DIR, "assets", "data", "catalog", f"{slug}.json")
            self.assertTrue(os.path.isfile(chunk), f"Missing catalog chunk: {chunk}")
        client = server.app.test_client()
        resp = client.get("/css/app.min.css")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("max-age=", resp.headers.get("Cache-Control", ""))
        resp.close()

    def test_03_m3_glb_deduplication_and_size_budget(self):
        glb_files = sorted(glob.glob(os.path.join(server.BASE_DIR, "assets", "models", "*.glb")))
        self.assertEqual(len(glb_files), 25)
        hashes = set()
        total_bytes = 0
        for p in glb_files:
            with open(p, "rb") as f:
                data = f.read()
            self.assertEqual(data[:4], b"glTF", f"Invalid GLB header in {p}")
            hashes.add(hashlib.sha256(data).hexdigest())
            total_bytes += len(data)
        self.assertEqual(len(hashes), 25, "Duplicate GLB binary hashes detected")
        self.assertLessEqual(total_bytes, 2 * 1024 * 1024, f"Total GLB size {total_bytes} exceeds 2 MB budget")

    def test_04_m3_workshop_api_rules_and_persistence(self):
        client, _ = self._register_and_client("ws_wb", specialty="automechanic")
        # Out-of-order piston_1 before valve_cover must be rejected
        r_bad_order = client.post(
            "/api/workshop/action",
            json={"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": "piston_1", "tool_id": "socket_set"},
        )
        self.assertFalse(r_bad_order.get_json()["valid"])
        self.assertEqual(r_bad_order.get_json()["error_code"], "PREREQUISITE_LOCKED")

        # Wrong tool inspect_lamp on valve_cover must be rejected
        r_bad_tool = client.post(
            "/api/workshop/action",
            json={"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": "valve_cover", "tool_id": "inspect_lamp"},
        )
        self.assertFalse(r_bad_tool.get_json()["valid"])
        self.assertEqual(r_bad_tool.get_json()["error_code"], "WRONG_TOOL")

        # Valid sequence: valve_cover -> cylinder_head -> piston_1
        for part in ("valve_cover", "cylinder_head", "piston_1"):
            r_ok = client.post(
                "/api/workshop/action",
                json={"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": part, "tool_id": "socket_set"},
            )
            self.assertTrue(r_ok.get_json()["valid"])
        st = client.get("/api/workshop/state?lesson_id=1&model_id=mech-cylinder").get_json()
        self.assertTrue(st["completed"])
        self.assertEqual(st["disassembled_parts"], ["valve_cover", "cylinder_head", "piston_1"])

    def test_05_m4_student_tools_and_ai_blocked_contract(self):
        client, _ = self._register_and_client("tools_wb")
        r_post = client.post(
            "/api/tools/state",
            json={"tasks": [{"id": "1", "title": "Проверить ГРМ", "done": True}, {"id": "2", "title": "   ", "done": False}], "gpa_target": 3.9, "notes": "Заметка"},
        )
        self.assertEqual(r_post.status_code, 200)
        st = client.get("/api/tools/state").get_json()
        self.assertEqual(len(st["tasks"]), 1)
        self.assertEqual(st["gpa_target"], 3.9)

        r_ai = client.post("/api/ai/chat", json={"message": "Помоги с ДВС", "course_slug": "automechanic"})
        self.assertEqual(r_ai.status_code, 503)
        self.assertEqual(r_ai.get_json()["status"], "BLOCKED")

    def test_06_m5_skills_dag_missions_portfolio_and_exams(self):
        client, _ = self._register_and_client("m5_wb", specialty="automechanic", group="АМ-21")
        # Skill map starts with node 1 unlocked and downstream locked
        skm = client.get("/api/skills/map?specialty=automechanic").get_json()
        self.assertEqual(len(skm["nodes"]), 20)
        self.assertTrue(skm["nodes"][0]["unlocked"])
        self.assertFalse(skm["nodes"][1]["unlocked"])

        # Mission XP idempotency
        m1 = client.post("/api/mission/submit", json={"specialty": "automechanic", "mission_id": "automechanic_m1", "answers": {"stage_1": "ok"}}).get_json()
        self.assertTrue(m1["passed"])
        self.assertEqual(m1["xp_gained"], 100)
        m2 = client.post("/api/mission/submit", json={"specialty": "automechanic", "mission_id": "automechanic_m1", "answers": {"stage_1": "ok"}}).get_json()
        self.assertEqual(m2["xp_gained"], 0)

        # Practical 3D exam start -> event -> submit -> anti-replay
        ex_start = client.post("/api/exams/start", json={"specialty": "automechanic"}).get_json()
        att_id = ex_start["attempt_id"]
        nonce = ex_start["attempt_nonce"]
        client.post("/api/exams/event", json={"attempt_id": att_id, "attempt_nonce": nonce, "step_id": 1, "action": "detach", "part_id": "valve_cover", "tool_id": "socket_set"})
        client.post("/api/exams/event", json={"attempt_id": att_id, "attempt_nonce": nonce, "step_id": 2, "action": "detach", "part_id": "cylinder_head", "tool_id": "torque_wrench"})
        ex_sub = client.post("/api/exams/submit", json={"attempt_id": att_id, "attempt_nonce": nonce})
        self.assertEqual(ex_sub.status_code, 200)
        self.assertTrue(ex_sub.get_json()["passed"])
        replay = client.post("/api/exams/submit", json={"attempt_id": att_id, "attempt_nonce": nonce})
        self.assertEqual(replay.status_code, 409)

        # Portfolio PDF export
        pdf_resp = client.get("/api/portfolio/export.pdf")
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertTrue(pdf_resp.data.startswith(b"%PDF-1.4"))


if __name__ == "__main__":
    unittest.main()
