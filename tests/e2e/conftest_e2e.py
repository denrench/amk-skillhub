# -*- coding: utf-8 -*-
"""
Pytest-compatible fixture definitions and shared harness exports for tests/e2e/.
Can be used both by pytest (if installed) and unittest/run_e2e.py.
"""
from __future__ import annotations

try:
    import pytest
except ImportError:  # pragma: no cover - pytest optional in local Python 3.12 env
    pytest = None

from tests.e2e.harness import (
    ALL_20_HTML_PAGES,
    CANONICAL_SPECIALTIES,
    ApiClient,
    ConsoleAndNetworkCollector,
    E2ETestCase,
    IsolatedServer,
    TempDatabaseClone,
    capture_failure_screenshot,
    create_chrome_driver,
)

if pytest is not None:

    @pytest.fixture(scope="session")
    def e2e_server():
        with IsolatedServer(strip_ai_keys=True) as srv:
            yield srv

    @pytest.fixture
    def api_client(e2e_server):
        return ApiClient(e2e_server.base_url)

    @pytest.fixture
    def desktop_driver():
        drv = create_chrome_driver(viewport="desktop", headless=True)
        try:
            yield drv
        finally:
            drv.quit()

    @pytest.fixture
    def mobile_driver():
        drv = create_chrome_driver(viewport="mobile", headless=True)
        try:
            yield drv
        finally:
            drv.quit()


__all__ = [
    "ALL_20_HTML_PAGES",
    "CANONICAL_SPECIALTIES",
    "ApiClient",
    "ConsoleAndNetworkCollector",
    "E2ETestCase",
    "IsolatedServer",
    "TempDatabaseClone",
    "capture_failure_screenshot",
    "create_chrome_driver",
]
