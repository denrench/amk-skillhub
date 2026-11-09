"""
Master Quality Assurance Test Runner for EduSpace 2.0
Executes all QA test suites (including real-browser video playback verification) and collects comprehensive telemetry.
"""
import subprocess
import os
import sys
import time
import socket
import atexit

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SERVER_PORT = 5000
def is_server_listening(port=SERVER_PORT):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

server_proc = None
if not is_server_listening():
    print(f"[QA RUNNER] Port {SERVER_PORT} not active. Auto-starting server.py...")
    server_proc = subprocess.Popen([sys.executable, "server.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    atexit.register(lambda: server_proc.kill() if server_proc else None)
    for _ in range(30):
        time.sleep(0.5)
        if is_server_listening():
            print("[QA RUNNER] Server successfully started and listening.")
            break
    else:
        print("[QA RUNNER WARN] Server did not report listening in 15 seconds.")

suites = [
    ("LMS Core & Catalog Suite", "test_suite.py", 18),
    ("Security & RBAC Isolation Suite", "test_stage1_security.py", 8),
    ("Transformation, Ledger & Quests Suite", "test_transformation_e2e.py", 5),
    ("Interactive Modular Engine Suite", "test_interactive_engine.py", 9),
    ("End-to-End Master Scenarios A-F", "test_master_interactive_lessons.py", 6),
    ("All 18 HTML Pages Integrity Scan", "test_all_pages.py", 18),
    ("Simulator Video HTML5 Real-Browser Suite", "test_sim_video_selenium.py", 9),
    ("Lesson Player Video & Fallback Suite", "test_lp_video_selenium.py", 10),
]

print("======================================================================")
print("EDUSPACE 2.0 — MASTER QUALITY ASSURANCE RECONCILIATION & AUDIT RUN")
print("======================================================================")
start_time = time.time()
overall_passed = 0
overall_failed = 0
results = []

env = dict(os.environ)
env["PYTHONUTF8"] = "1"

for name, script, expected_count in suites:
    print(f"\n>>> EXECUTING SUITE: {name} ({script}) [Expected checks: {expected_count}]")
    t0 = time.time()
    proc = subprocess.run([sys.executable, "-X", "utf8", script], capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)
    dt = time.time() - t0
    
    if proc.returncode == 0:
        print(f"  [PASS] {name} completed in {dt:.2f}s with code 0")
        overall_passed += expected_count
        results.append((name, script, "PASS", expected_count, 0, dt))
    else:
        print(f"  [FAIL] {name} FAILED in {dt:.2f}s with code {proc.returncode}")
        print("  --- ERROR OUTPUT ---")
        out = proc.stderr if proc.stderr else proc.stdout
        print(out[:1500])
        overall_failed += expected_count
        results.append((name, script, "FAIL", 0, expected_count, dt))

total_time = time.time() - start_time
print("\n======================================================================")
print("MASTER QA TEST EXECUTION SUMMARY:")
print("======================================================================")
print(f"{'Suite Name':<42} | {'Script':<30} | {'Status':<6} | {'Checks':<6} | {'Time'}")
print("-" * 96)
for name, script, status, passed, failed, dt in results:
    print(f"{name:<42} | {script:<30} | {status:<6} | {passed:<6} | {dt:.2f}s")
print("-" * 96)
print(f"TOTAL LOGICAL CHECKS PASSED: {overall_passed} / {overall_passed + overall_failed} ({((overall_passed / max(1, overall_passed + overall_failed)) * 100):.1f}%)")
print(f"TOTAL EXECUTION TIME: {total_time:.2f}s")
print("======================================================================")
