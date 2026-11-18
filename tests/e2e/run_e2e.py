# -*- coding: utf-8 -*-
"""
CLI Runner for AMK SkillHub / EduSpace 3.0 Dual-Track Opaque-Box E2E Suite.
Usage:
    python tests/e2e/run_e2e.py --tier 1
    python tests/e2e/run_e2e.py --tier all --json-out %TEMP%/e2e.json --md-out %TEMP%/e2e.md
    python tests/e2e/run_e2e.py --smoke
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import unittest
from typing import Dict, List

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

TIER_FILES: Dict[str, str] = {
    "1": "test_tier1_features.py",
    "2": "test_tier2_boundaries.py",
    "3": "test_tier3_pairwise.py",
    "4": "test_tier4_scenarios.py",
}

SMOKE_TESTS: List[str] = [
    "tests.e2e.test_tier1_features.TestT1Group01AuthAndRoles.test_auth_readiness_local_no_otp_required",
    "tests.e2e.test_tier1_features.TestT1Group02CatalogAnd20Lessons.test_courses_api_returns_5_specialties_with_20_lessons",
    "tests.e2e.test_tier1_features.TestT1Group04ThreeDWorkshopAndGraphics.test_3d_showcase_renders_webgl_canvas_on_index",
    "tests.e2e.test_tier1_features.TestT1Group07AIMentorContract.test_ai_chat_returns_503_blocked_without_api_key",
    "tests.e2e.test_tier1_features.TestT1Group12ResponsiveThemesAndI18n.test_all_20_html_pages_load_http_200_zero_severe_errors",
    "tests.e2e.test_tier2_boundaries.TestT2Group01AuthAndRoleBoundaries.test_unauthenticated_protected_endpoints_return_401",
    "tests.e2e.test_tier2_boundaries.TestT2Group12ResponsiveAndErrorRecoveryBoundaries.test_guest_learn_page_has_zero_401_console_errors",
]


class StructuredTestResult(unittest.TextTestResult):
    def __init__(self, stream, descriptions, verbosity):
        super().__init__(stream, descriptions, verbosity)
        self.records: List[Dict[str, str]] = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.records.append({"id": test.id(), "status": "PASS", "detail": ""})

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.records.append({"id": test.id(), "status": "FAIL", "detail": self._exc_info_to_string(err, test)})

    def addError(self, test, err):
        super().addError(test, err)
        self.records.append({"id": test.id(), "status": "ERROR", "detail": self._exc_info_to_string(err, test)})

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self.records.append({"id": test.id(), "status": "SKIP", "detail": str(reason)})


def build_suite(tier: str, smoke: bool) -> unittest.TestSuite:
    loader = unittest.TestLoader()
    if smoke:
        return loader.loadTestsFromNames(SMOKE_TESTS)

    suite = unittest.TestSuite()
    e2e_dir = os.path.dirname(os.path.abspath(__file__))
    if tier == "all":
        targets = [TIER_FILES[k] for k in ("1", "2", "3", "4")]
    else:
        targets = [TIER_FILES[tier]]

    for fname in targets:
        discovered = loader.discover(start_dir=e2e_dir, pattern=fname, top_level_dir=REPO_ROOT)
        suite.addTests(discovered)
    return suite


def render_markdown(summary: dict) -> str:
    lines = [
        "# AMK SkillHub E2E Run Summary",
        "",
        f"- **Mode:** `{summary['mode']}`",
        f"- **Duration:** `{summary['duration_sec']}s`",
        f"- **Total:** `{summary['total']}` | **Passed:** `{summary['passed']}` | **Failed:** `{summary['failed']}` | **Errors:** `{summary['errors']}` | **Skipped:** `{summary['skipped']}`",
        "",
    ]
    bad = [r for r in summary["records"] if r["status"] in ("FAIL", "ERROR")]
    if bad:
        lines.append("## Failures / Errors")
        lines.append("")
        for r in bad:
            first_line = (r["detail"].strip().splitlines() or [""])[-1]
            lines.append(f"- **{r['status']}** `{r['id']}` — `{first_line}`")
    else:
        lines.append("All executed tests passed.")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run AMK SkillHub Opaque-Box E2E Suite")
    parser.add_argument("--tier", choices=["1", "2", "3", "4", "all"], default="all", help="Which tier to run")
    parser.add_argument("--smoke", action="store_true", help="Run fast smoke subset across harness, server & Chrome")
    parser.add_argument("--verbosity", type=int, choices=[0, 1, 2], default=2, help="Test output verbosity")
    parser.add_argument("--json-out", default="", help="Optional path to write JSON summary")
    parser.add_argument("--md-out", default="", help="Optional path to write Markdown summary")
    args = parser.parse_args()

    suite = build_suite(args.tier, args.smoke)
    runner = unittest.TextTestRunner(
        verbosity=args.verbosity,
        resultclass=StructuredTestResult,
    )

    started = time.time()
    result: StructuredTestResult = runner.run(suite)  # type: ignore[assignment]
    duration = round(time.time() - started, 2)

    passed = sum(1 for r in result.records if r["status"] == "PASS")
    summary = {
        "mode": "smoke" if args.smoke else f"tier-{args.tier}",
        "duration_sec": duration,
        "total": result.testsRun,
        "passed": passed,
        "failed": len(result.failures),
        "errors": len(result.errors),
        "skipped": len(result.skipped),
        "records": result.records,
    }

    if args.json_out:
        os.makedirs(os.path.dirname(os.path.abspath(args.json_out)), exist_ok=True)
        with open(args.json_out, "w", encoding="utf-8") as fh:
            json.dump(summary, fh, ensure_ascii=False, indent=2)

    if args.md_out:
        os.makedirs(os.path.dirname(os.path.abspath(args.md_out)), exist_ok=True)
        with open(args.md_out, "w", encoding="utf-8") as fh:
            fh.write(render_markdown(summary))

    print(
        f"\n[E2E SUMMARY] mode={summary['mode']} total={summary['total']} "
        f"passed={summary['passed']} failed={summary['failed']} "
        f"errors={summary['errors']} skipped={summary['skipped']} duration={duration}s"
    )
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
