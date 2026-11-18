# -*- coding: utf-8 -*-
"""
Modular Opaque-Box E2E Test Harness for AMK SkillHub / EduSpace 3.0.
Provides:
- TempDatabaseClone: isolated %TEMP% clone of database.db (repo DB never mutated)
- IsolatedServer: ephemeral-port Flask subprocess launcher with clean teardown
- Chrome Driver Factory: headless Chrome (Desktop 1440x900 & Mobile CDP 390x844)
- ConsoleAndNetworkCollector: captures SEVERE browser/JS/HTTP errors
- ApiClient: opaque-box HTTP + cookie + CSRF test client
- capture_failure_screenshot: saves PNGs on assertion/driver failure
- E2ETestCase: base unittest.TestCase with automatic isolation & failure capture
"""
from __future__ import annotations

import http.cookiejar
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCE_DB_PATH = os.path.join(REPO_ROOT, "database.db")
SCREENSHOT_DIR = os.path.join(tempfile.gettempdir(), "amk_e2e_screenshots")

ALL_20_HTML_PAGES = [
    "index.html",
    "auth.html",
    "learn.html",
    "lesson_player.html",
    "tasks.html",
    "simulator.html",
    "mission.html",
    "student.html",
    "student-workspace.html",
    "teacher.html",
    "admin.html",
    "profile.html",
    "career.html",
    "tools.html",
    "verify.html",
    "features.html",
    "pricing.html",
    "about.html",
    "reviews.html",
    "gradebook.html",
]

CANONICAL_SPECIALTIES = [
    "it",
    "graphic_design",
    "autoelectric",
    "hvac",
    "automechanic",
]


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return int(s.getsockname()[1])


class TempDatabaseClone:
    """Creates an isolated copy of database.db inside %TEMP% and removes it on cleanup."""

    def __init__(self, source_db: str = SOURCE_DB_PATH):
        self.source_db = source_db
        self.temp_dir = tempfile.mkdtemp(prefix="amk_e2e_db_")
        self.db_path = os.path.join(self.temp_dir, "database.db")
        if os.path.exists(self.source_db):
            shutil.copy2(self.source_db, self.db_path)

    def cleanup(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def __enter__(self) -> "TempDatabaseClone":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.cleanup()


class IsolatedServer:
    """Runs server.py in an isolated subprocess against a temporary DB on an ephemeral port."""

    def __init__(self, strip_ai_keys: bool = True, startup_timeout: float = 25.0):
        self.strip_ai_keys = strip_ai_keys
        self.startup_timeout = startup_timeout
        self.db_clone: Optional[TempDatabaseClone] = None
        self.port: int = 0
        self.base_url: str = ""
        self.process: Optional[subprocess.Popen] = None

    def start(self) -> "IsolatedServer":
        self.db_clone = TempDatabaseClone()
        self.port = find_free_port()
        self.base_url = f"http://127.0.0.1:{self.port}"
        self._log_path = os.path.join(self.db_clone.temp_dir, "server.log")
        self._log_file = open(self._log_path, "w", encoding="utf-8", errors="replace")

        env = os.environ.copy()
        env["E2E_TEMP_DB"] = self.db_clone.db_path
        env["E2E_PORT"] = str(self.port)
        env["E2E_STRIP_AI_KEYS"] = "1" if self.strip_ai_keys else "0"
        env["PYTHONUNBUFFERED"] = "1"

        boot_script = os.path.join(os.path.dirname(__file__), "_server_boot.py")
        self.process = subprocess.Popen(
            [sys.executable, boot_script],
            cwd=REPO_ROOT,
            env=env,
            stdout=self._log_file,
            stderr=subprocess.STDOUT,
            text=True,
        )

        deadline = time.time() + self.startup_timeout
        last_err = None
        while time.time() < deadline:
            if self.process.poll() is not None:
                self._log_file.flush()
                with open(self._log_path, "r", encoding="utf-8", errors="replace") as rf:
                    out = rf.read()
                raise RuntimeError(f"Isolated server exited prematurely (code {self.process.returncode}):\n{out}")
            try:
                with urllib.request.urlopen(f"{self.base_url}/healthz", timeout=1.5) as resp:
                    if resp.status == 200:
                        return self
            except Exception as exc:
                last_err = exc
                time.sleep(0.2)

        self.stop()
        raise TimeoutError(f"Isolated server failed to become ready on {self.base_url}: {last_err}")

    def stop(self) -> None:
        if self.process is not None:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except Exception:
                try:
                    self.process.kill()
                    self.process.wait(timeout=3)
                except Exception:
                    pass
            finally:
                self.process = None

        if getattr(self, "_log_file", None) is not None:
            try:
                self._log_file.close()
            except Exception:
                pass
            self._log_file = None

        if self.db_clone is not None:
            self.db_clone.cleanup()
            self.db_clone = None

    def __enter__(self) -> "IsolatedServer":
        return self.start()

    def __exit__(self, exc_type, exc, tb) -> None:
        self.stop()


@dataclass
class ApiResponse:
    status: int
    headers: Dict[str, str]
    body: bytes
    text: str
    json_data: Optional[Any]


class ApiClient:
    """Opaque-box HTTP client with isolated cookie jar and automatic CSRF token handling."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.cookie_jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookie_jar))
        self.csrf_token: Optional[str] = None

    def _refresh_csrf(self) -> None:
        resp = self.request("GET", "/api/auth/session", auto_csrf=False)
        if isinstance(resp.json_data, dict):
            tok = resp.json_data.get("csrf_token")
            if tok:
                self.csrf_token = str(tok)

    def request(
        self,
        method: str,
        path: str,
        json_body: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        auto_csrf: bool = True,
        timeout: float = 15.0,
    ) -> ApiResponse:
        url = (path if path.startswith("http") else f"{self.base_url}{path}").replace(" ", "%20")
        req_headers = {"Accept": "application/json"}
        if headers:
            req_headers.update(headers)

        data_bytes = None
        if json_body is not None:
            data_bytes = json.dumps(json_body).encode("utf-8")
            req_headers.setdefault("Content-Type", "application/json")

        if auto_csrf and method.upper() in ("POST", "PUT", "PATCH", "DELETE"):
            if not self.csrf_token:
                self._refresh_csrf()
            if self.csrf_token and "X-CSRF-Token" not in req_headers:
                req_headers["X-CSRF-Token"] = self.csrf_token

        req = urllib.request.Request(url, data=data_bytes, headers=req_headers, method=method.upper())
        try:
            with self.opener.open(req, timeout=timeout) as resp:
                raw = resp.read()
                hdrs = {k.lower(): v for k, v in resp.headers.items()}
                status = resp.status
        except urllib.error.HTTPError as err:
            raw = err.read()
            hdrs = {k.lower(): v for k, v in err.headers.items()} if err.headers else {}
            status = err.code

        text = raw.decode("utf-8", errors="replace")
        parsed = None
        if "application/json" in hdrs.get("content-type", "") or text.lstrip().startswith(("{", "[")):
            try:
                parsed = json.loads(text)
            except Exception:
                parsed = None

        if isinstance(parsed, dict) and parsed.get("csrf_token"):
            self.csrf_token = str(parsed["csrf_token"])

        return ApiResponse(status=status, headers=hdrs, body=raw, text=text, json_data=parsed)

    def get(self, path: str, **kwargs) -> ApiResponse:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, json_body: Optional[Dict[str, Any]] = None, **kwargs) -> ApiResponse:
        return self.request("POST", path, json_body=json_body, **kwargs)

    def put(self, path: str, json_body: Optional[Dict[str, Any]] = None, **kwargs) -> ApiResponse:
        return self.request("PUT", path, json_body=json_body, **kwargs)

    def delete(self, path: str, **kwargs) -> ApiResponse:
        return self.request("DELETE", path, **kwargs)

    def register_user(
        self,
        email: str,
        password: str = "ValidPass123",
        role: str = "student",
        specialty_slug: str = "it",
        group_name: str = "ИС-21",
        first_name: str = "Тест",
        last_name: str = "Пользователь",
        teacher_code: Optional[str] = None,
    ) -> ApiResponse:
        payload: Dict[str, Any] = {
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
        resp = self.post("/api/auth/register", payload)
        self._refresh_csrf()
        return resp

    def login(self, email: str, password: str) -> ApiResponse:
        resp = self.post("/api/auth/login", {"email": email, "password": password})
        self._refresh_csrf()
        return resp

    def logout(self) -> ApiResponse:
        resp = self.post("/api/auth/logout", {})
        self.csrf_token = None
        return resp


def create_chrome_driver(
    viewport: str = "desktop",
    headless: bool = True,
    blocked_urls: Optional[List[str]] = None,
) -> webdriver.Chrome:
    """Factory for headless Chrome WebDriver supporting Desktop 1440x900 & Mobile CDP 390x844."""
    opts = ChromeOptions()
    if headless:
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

    driver = webdriver.Chrome(options=opts)
    driver.set_page_load_timeout(90)

    if viewport == "mobile":
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 3,
                "mobile": True,
                "touch": True,
            },
        )
        driver.execute_cdp_cmd("Emulation.setTouchEmulationEnabled", {"enabled": True})
    else:
        driver.set_window_size(1440, 900)

    if blocked_urls:
        driver.execute_cdp_cmd("Network.enable", {})
        driver.execute_cdp_cmd("Network.setBlockedURLs", {"urls": blocked_urls})

    return driver


class ConsoleAndNetworkCollector:
    """Collects SEVERE browser console messages and uncaught page exceptions."""

    @staticmethod
    def install_error_trap(driver: webdriver.Chrome) -> None:
        driver.execute_script(
            """
            if (!window.__e2eErrorTrapInstalled) {
                window.__e2eErrorTrapInstalled = true;
                window.__e2eUncaughtErrors = [];
                window.addEventListener('error', function (ev) {
                    window.__e2eUncaughtErrors.push(String(ev.message || ev.error || 'Script error'));
                });
                window.addEventListener('unhandledrejection', function (ev) {
                    window.__e2eUncaughtErrors.push('UnhandledRejection: ' + String(ev.reason || 'unknown'));
                });
            }
            """
        )

    @staticmethod
    def collect_severe(driver: webdriver.Chrome, ignore_substrings: Optional[List[str]] = None) -> List[str]:
        ignores = ignore_substrings or ["favicon.ico"]
        errors: List[str] = []
        try:
            for entry in driver.get_log("browser"):
                if entry.get("level") == "SEVERE":
                    msg = entry.get("message", "")
                    if not any(ig in msg for ig in ignores):
                        errors.append(msg)
        except Exception:
            pass
        try:
            uncaught = driver.execute_script("return window.__e2eUncaughtErrors || [];")
            for msg in uncaught:
                if not any(ig in str(msg) for ig in ignores):
                    errors.append(f"UncaughtJS: {msg}")
        except Exception:
            pass
        return errors


def capture_failure_screenshot(driver: webdriver.Chrome, test_name: str) -> Optional[str]:
    try:
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in test_name)[:80]
        stamp = int(time.time() * 1000)
        path = os.path.join(SCREENSHOT_DIR, f"{safe_name}_{stamp}.png")
        driver.save_screenshot(path)
        return path
    except Exception:
        return None


def unique_email(prefix: str = "e2e") -> str:
    return f"{prefix}.{int(time.time() * 1000)}.{os.getpid()}_{socket.htons(id(prefix) & 0xFFFF)}@amk.kz"


def wait_for_ready(driver: webdriver.Chrome, timeout: float = 25.0) -> None:
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )


def wait_for_selector(driver: webdriver.Chrome, css_selector: str, timeout: float = 10.0):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, css_selector))
    )


class E2ETestCase(unittest.TestCase):
    """
    Base class providing a clean isolated server (cloned %TEMP% DB) per test class
    and helper methods for creating Chrome drivers and API sessions with failure screenshots.
    """

    server: IsolatedServer
    base_url: str
    strip_ai_keys: bool = True

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls.server = IsolatedServer(strip_ai_keys=cls.strip_ai_keys).start()
        cls.base_url = cls.server.base_url

    @classmethod
    def tearDownClass(cls) -> None:
        if getattr(cls, "server", None) is not None:
            cls.server.stop()
        super().tearDownClass()

    def setUp(self) -> None:
        super().setUp()
        self._drivers: List[webdriver.Chrome] = []
        self._seq = getattr(self.__class__, "_test_counter", 0) + 1
        self.__class__._test_counter = self._seq

    def tearDown(self) -> None:
        outcome = getattr(self, "_outcome", None)
        failed = False
        if outcome is not None:
            result = getattr(outcome, "result", None)
            if result is not None:
                for test, _ in getattr(result, "failures", []) + getattr(result, "errors", []):
                    if test is self:
                        failed = True
                        break
        if failed:
            for idx, drv in enumerate(self._drivers):
                capture_failure_screenshot(drv, f"{self.id()}_drv{idx}")

        for drv in self._drivers:
            try:
                drv.quit()
            except Exception:
                pass
        self._drivers.clear()
        super().tearDown()

    def new_driver(self, viewport: str = "desktop", blocked_urls: Optional[List[str]] = None) -> webdriver.Chrome:
        drv = create_chrome_driver(viewport=viewport, headless=True, blocked_urls=blocked_urls)
        self._drivers.append(drv)
        return drv

    def new_api_client(self) -> ApiClient:
        return ApiClient(self.base_url)

    def unique_email(self, prefix: str = "user") -> str:
        return f"{prefix}.{self._seq}.{int(time.time() * 1000)}@amk.kz"

    def login_browser_via_api_or_form(
        self,
        driver: webdriver.Chrome,
        email: str,
        password: str,
    ) -> None:
        driver.get(f"{self.base_url}/auth.html")
        wait_for_ready(driver)
        form = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "account-login")))
        email_inp = form.find_element(By.CSS_SELECTOR, "input[name='email']")
        pass_inp = form.find_element(By.CSS_SELECTOR, "input[name='password']")
        email_inp.clear()
        email_inp.send_keys(email)
        pass_inp.clear()
        pass_inp.send_keys(password)
        form.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        WebDriverWait(driver, 10).until(
            lambda d: "/auth.html" not in d.current_url
            or d.execute_script(
                """
                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', '/api/auth/session', false);
                    xhr.send(null);
                    if (xhr.status === 200) {
                        var data = JSON.parse(xhr.responseText);
                        return Boolean(data && data.authenticated);
                    }
                } catch (e) {}
                return false;
                """
            )
        )

    def browser_api_login(self, driver: webdriver.Chrome, email: str, password: str) -> Dict[str, Any]:
        """Logs in directly inside the browser origin via synchronous XHR so HttpOnly cookies attach."""
        driver.get(f"{self.base_url}/auth.html")
        wait_for_ready(driver)
        res = driver.execute_script(
            """
            var email = arguments[0], password = arguments[1];
            var csrf = '';
            try {
                var sx = new XMLHttpRequest();
                sx.open('GET', '/api/auth/session', false);
                sx.send(null);
                if (sx.status === 200) {
                    csrf = (JSON.parse(sx.responseText) || {}).csrf_token || '';
                }
            } catch (e) {}
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/auth/login', false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf);
            xhr.send(JSON.stringify({ email: email, password: password }));
            var body = {};
            try { body = JSON.parse(xhr.responseText); } catch (e) {}
            return { status: xhr.status, body: body };
            """,
            email,
            password,
        )
        return res

    def browser_session_info(self, driver: webdriver.Chrome) -> Dict[str, Any]:
        return driver.execute_script(
            """
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/auth/session', false);
            xhr.send(null);
            try { return { status: xhr.status, body: JSON.parse(xhr.responseText) }; }
            catch (e) { return { status: xhr.status, body: null }; }
            """
        )

