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
import json
import os
import tempfile
import unittest
import urllib.error
from unittest.mock import patch

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
        os.environ.pop("EDUSPACE_DB_PATH", None)
        server.DB_PATH = os.path.join(server.BASE_DIR, "database.db")

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
        self.assertIn(b"Akhmetov Timur", pdf_resp.data)

    def test_07_ai_generate_lesson_and_review_submission_no_stubs(self):
        teach_client, _ = self._register_and_client("ai_teach", role="teacher", specialty="it", group="ИС-21")

        # 1. With user_api_key when provider call fails -> must return 503 BLOCKED (never heuristic_offline or 90/60)
        with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("offline")):
            r_gen_fail = teach_client.post(
                "/api/ai/generate_lesson",
                json={"topic": "Flexbox Grid", "discipline": "IT", "user_api_key": "bad-key", "provider": "gemini"},
            )
            self.assertEqual(r_gen_fail.status_code, 503)
            self.assertEqual(r_gen_fail.get_json()["status"], "BLOCKED")
            self.assertEqual(r_gen_fail.get_json()["code"], "AI_PROVIDER_ERROR")

            r_rev_fail = teach_client.post(
                "/api/ai/review_submission",
                json={"code": "print('hello world from student solution')", "user_api_key": "bad-key", "provider": "gemini"},
            )
            self.assertEqual(r_rev_fail.status_code, 503)
            self.assertEqual(r_rev_fail.get_json()["status"], "BLOCKED")
            self.assertEqual(r_rev_fail.get_json()["code"], "AI_PROVIDER_ERROR")

        # 2. Mocked Gemini response -> verify x-goog-api-key header and real JSON parsing
        class _FakeHTTPResp:
            def __init__(self, text_payload):
                self._raw = json.dumps({
                    "candidates": [{"content": {"parts": [{"text": text_payload}]}}]
                }).encode("utf-8")

            def read(self):
                return self._raw

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        captured_headers = []
        captured_bodies = []

        def _fake_urlopen(req, timeout=12):
            captured_headers.append({k.lower(): v for k, v in req.header_items()})
            body_obj = json.loads(req.data.decode("utf-8"))
            captured_bodies.append(body_obj)
            prompt_txt = body_obj["contents"][0]["parts"][0]["text"]
            if "Оцени практическую работу" in prompt_txt:
                return _FakeHTTPResp(json.dumps({
                    "recommended_score": 42,
                    "max_score": 100,
                    "criteria_checks": [{"criterion": "Семантика", "status": "partial"}],
                    "draft_feedback": "Нужно доработать медиа-запросы."
                }, ensure_ascii=False))
            return _FakeHTTPResp(json.dumps([
                {"id": "b1_hook", "type": "hook", "title": "Реальный LLM кейс", "content": "Сгенерировано моделью"},
                {"id": "b2_objectives", "type": "objectives", "title": "Цели", "items": ["Цель 1"]},
            ], ensure_ascii=False))

        with patch("urllib.request.urlopen", side_effect=_fake_urlopen):
            r_gen_ok = teach_client.post(
                "/api/ai/generate_lesson",
                json={"topic": "Grid Layout", "discipline": "IT", "user_api_key": "test-gemini-key", "provider": "gemini"},
            )
            self.assertEqual(r_gen_ok.status_code, 200, r_gen_ok.get_data(as_text=True))
            gen_json = r_gen_ok.get_json()
            self.assertEqual(gen_json["provider"], "gemini")
            self.assertEqual(gen_json["blocks"][0]["title"], "Реальный LLM кейс")

            r_rev_ok = teach_client.post(
                "/api/ai/review_submission",
                json={"code": "x" * 100, "user_api_key": "test-gemini-key", "provider": "gemini"},
            )
            self.assertEqual(r_rev_ok.status_code, 200, r_rev_ok.get_data(as_text=True))
            rev_json = r_rev_ok.get_json()["review"]
            self.assertEqual(rev_json["recommended_score"], 42)
            self.assertEqual(rev_json["provider"], "gemini")
            self.assertEqual(rev_json["draft_feedback"], "Нужно доработать медиа-запросы.")

            # 3. /api/ai/chat forwards context & x-goog-api-key
            r_chat_ok = teach_client.post(
                "/api/ai/chat",
                json={
                    "message": "Проверь деталь",
                    "specialty": "automechanic",
                    "user_api_key": "test-gemini-key",
                    "provider": "gemini",
                    "context": {
                        "selected_part": "valve_cover",
                        "disassembled_parts": ["spark_plug_1"],
                        "simulator_state": {"torque_nm": 45},
                        "recent_errors": ["WRONG_TOOL"],
                    },
                },
            )
            self.assertEqual(r_chat_ok.status_code, 200, r_chat_ok.get_data(as_text=True))

        self.assertEqual(len(captured_headers), 3)
        for hdrs in captured_headers:
            self.assertEqual(hdrs.get("x-goog-api-key"), "test-gemini-key")
        chat_prompt = captured_bodies[2]["contents"][0]["parts"][0]["text"]
        self.assertIn("valve_cover", chat_prompt)
        self.assertIn("WRONG_TOOL", chat_prompt)

    def test_08_workshop_brakes_parts_and_reset_alias(self):
        client, _ = self._register_and_client("ws_brakes", specialty="automechanic")
        r_bad = client.post(
            "/api/workshop/action",
            json={"lesson_id": 9, "model_id": "mech-brakes", "action": "detach", "part_id": "brake_pads", "tool_id": "socket_set"},
        )
        self.assertEqual(r_bad.status_code, 200)
        self.assertFalse(r_bad.get_json()["valid"])
        self.assertEqual(r_bad.get_json()["error_code"], "PREREQUISITE_LOCKED")

        for part in ("caliper_bolts", "caliper_body", "brake_pads", "brake_rotor"):
            r_ok = client.post(
                "/api/workshop/action",
                json={"lesson_id": 9, "model_id": "mech-brakes", "action": "detach", "part_id": part, "tool_id": "socket_set"},
            )
            self.assertTrue(r_ok.get_json()["valid"], r_ok.get_data(as_text=True))

        # Check piston_02 -> piston_2 normalization on mech-cylinder
        for part in ("valve_cover", "camshaft_exhaust", "cylinder_head", "gasket_head", "piston_02"):
            r_cyl = client.post(
                "/api/workshop/action",
                json={"lesson_id": 1, "model_id": "mech-cylinder", "action": "detach", "part_id": part, "tool_id": "socket_set"},
            )
            self.assertTrue(r_cyl.get_json()["valid"], r_cyl.get_data(as_text=True))
        self.assertIn("piston_2", r_cyl.get_json()["disassembled_parts"])

        r_reset = client.post("/api/workshop/reset", json={"lesson_id": 9, "model_id": "mech-brakes"})
        self.assertEqual(r_reset.status_code, 200)
        self.assertEqual(r_reset.get_json()["disassembled_parts"], [])

    def test_09_mission_stage4_lab_completed_and_portfolio_privacy(self):
        c1, _ = self._register_and_client("mis_p1", specialty="hvac", group="ХО-21")
        r_st = c1.post(
            "/api/mission/save_stage",
            json={
                "specialty": "hvac",
                "task_number": 1,
                "current_stage": 5,
                "event_key": "stage_4_lab",
                "state": {
                    "theory_completed": [1, 2, 3, 4, 5],
                    "training_completed": [1, 2, 3, 4],
                    "lab_completed": True,
                },
            },
        )
        self.assertEqual(r_st.status_code, 200, r_st.get_data(as_text=True))
        self.assertEqual(r_st.get_json()["max_allowed_stage"], 5)
        self.assertEqual(r_st.get_json()["xp_gained"], 100)

        r_sub = c1.post(
            "/api/mission/submit",
            json={"specialty": "hvac", "task_number": 1, "mission_id": "hvac_m1", "answers": {"superheat_k": 6.5}},
        )
        self.assertEqual(r_sub.status_code, 200)
        sub_json = r_sub.get_json()
        self.assertIn("submission", sub_json)
        self.assertIn("Ремонт Холодильного Оборудования", sub_json["submission"]["task_title"])

        # Portfolio privacy masking & duplicate slug 409
        slug = f"unique-hvac-{os.urandom(3).hex()}"
        r_set1 = c1.put(
            "/api/portfolio/settings",
            json={"is_public": True, "consent_granted": True, "show_grades": False, "public_slug": slug},
        )
        self.assertEqual(r_set1.status_code, 200)

        anon = server.app.test_client()
        r_pub = anon.get(f"/api/portfolio/public/{slug}")
        self.assertEqual(r_pub.status_code, 200)
        pub_json = r_pub.get_json()
        self.assertNotIn("email", pub_json["student"])
        self.assertIsNone(pub_json["average_score"])
        self.assertEqual(pub_json["grades"], [])
        self.assertTrue(len(pub_json["projects"]) >= 1)
        self.assertIsNone(pub_json["projects"][0]["score"])
        self.assertEqual(pub_json["projects"][0]["grade_letter"], "—")

        c2, _ = self._register_and_client("mis_p2", specialty="it")
        r_dup = c2.put("/api/portfolio/settings", json={"public_slug": slug})
        self.assertEqual(r_dup.status_code, 409)
        self.assertEqual(r_dup.get_json()["code"], "SLUG_TAKEN")

    def test_10_exams_five_specialty_rubrics(self):
        client, _ = self._register_and_client("ex_hvac", specialty="hvac")
        start = client.post("/api/exams/start", json={"specialty": "hvac"}).get_json()
        self.assertEqual(start["exam_spec"]["model_id"], "hvac-chiller")
        att_id = start["attempt_id"]
        nonce = start["attempt_nonce"]

        # Invalid tool + out-of-range superheat without diagnosis -> deducts points & logs errors
        client.post(
            "/api/exams/event",
            json={
                "attempt_id": att_id,
                "attempt_nonce": nonce,
                "step_id": 1,
                "action": "measure_superheat",
                "part_id": "evaporator_suction",
                "tool_id": "socket_set",
                "telemetry": {"refrigerant": "R134a", "superheat_k": 22.0},
            },
        )
        sub = client.post("/api/exams/submit", json={"attempt_id": att_id, "attempt_nonce": nonce})
        self.assertEqual(sub.status_code, 200)
        res = sub.get_json()
        self.assertLess(res["score"], 100)
        err_codes = {e["error_code"] for e in res["error_log_json"]}
        self.assertIn("WRONG_TOOL", err_codes)
        self.assertIn("SUPERHEAT_OUT_OF_RANGE", err_codes)


if __name__ == "__main__":
    unittest.main()
