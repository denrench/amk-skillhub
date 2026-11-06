# -*- coding: utf-8 -*-
"""
EduSpace Comprehensive Project Audit Script
"""
import os
import glob
import re
import json
import sqlite3

def run_deep_audit():
    print("=" * 70)
    print("EDUSPACE LMS COMPLETE MULTI-DIMENSIONAL AUDIT")
    print("=" * 70)
    
    with open('server.py', 'r', encoding='utf-8') as f:
        srv_lines = f.readlines()
    srv_text = "".join(srv_lines)
    
    # 1. Audit Server Endpoints & Auth / Role checks
    print("\n--- 1. SERVER ENDPOINTS & ACCESS CONTROL AUDIT ---")
    routes = []
    current_route = None
    endpoint_checks = []
    
    for i, line in enumerate(srv_lines):
        m = re.match(r'@app\.route\((["\'][^"\']+["\'])(?:,\s*methods=\[([^\]]+)\])?\)', line.strip())
        if m:
            path = m.group(1).strip("'\"")
            methods = m.group(2).replace("'", "").replace('"', '').replace(" ", "").split(",") if m.group(2) else ['GET']
            routes.append((i+1, path, methods))
            
            # Find function name
            j = i + 1
            while j < len(srv_lines) and srv_lines[j].strip().startswith('@'):
                j += 1
            if j < len(srv_lines) and srv_lines[j].strip().startswith('def '):
                fn_name = re.match(r'def ([a-zA-Z0-9_]+)', srv_lines[j].strip()).group(1)
                # Read function body (next 40 lines)
                body = "".join(srv_lines[j:min(len(srv_lines), j+45)])
                endpoint_checks.append({
                    'line': i+1,
                    'path': path,
                    'methods': methods,
                    'fn': fn_name,
                    'body': body
                })

    print(f"Total Routes scanned: {len(endpoint_checks)}")
    
    p0_auth_flaws = []
    for ep in endpoint_checks:
        path = ep['path']
        body = ep['body']
        
        # Check Admin endpoints
        if path.startswith('/api/admin'):
            # Check if role check is insecure
            if "role in ('student', 'teacher')" in body or 'role in ("student", "teacher")' in body:
                p0_auth_flaws.append((path, "Flawed admin check: 'role in (student, teacher)' allows None/unauthenticated access!"))
            elif "user_role" not in body and "role" not in body:
                p0_auth_flaws.append((path, "Admin route missing any role or authentication check!"))
                
        # Check Teacher endpoints
        if path.startswith('/api/teacher'):
            if "user_role == 'student'" in body or 'user_role == "student"' in body:
                p0_auth_flaws.append((path, "Flawed teacher check: 'user_role == student' allows unauthenticated access!"))
            elif "user_role" not in body and "get_current_user" not in body and "session" not in body:
                p0_auth_flaws.append((path, "Teacher route missing any authentication check!"))

    print(f"\n[CRITICAL P0 FINDINGS] Access Control Bypass Vulnerabilities found: {len(p0_auth_flaws)}")
    for route, flaw in p0_auth_flaws:
        print(f"  [P0] {route:30s} -> {flaw}")

    # 2. Audit Drip-Feed & Unlock Logic
    print("\n--- 2. TASK UNLOCK & DRIP-FEED RESTRICTIONS AUDIT ---")
    has_day_check = 'current_study_day' in srv_text
    has_unlock_day = 'unlock_day' in srv_text
    print(f"  current_study_day check present in server: {has_day_check}")
    print(f"  unlock_day field referenced in server: {has_unlock_day}")
    
    # Check if submit_task or save_lesson_progress enforces unlock check
    submit_task_code = ""
    progress_code = ""
    for ep in endpoint_checks:
        if ep['path'] == '/api/tasks/submit':
            submit_task_code = ep['body']
        elif ep['path'] == '/api/tasks/progress':
            progress_code = ep['body']
            
    print(f"  submit_task verifies task unlock before allowing submission: {'locked' in submit_task_code.lower() or 'unlock' in submit_task_code.lower()}")
    print(f"  progress verifies task unlock before allowing advance: {'unlock' in progress_code.lower() or 'locked' in progress_code.lower()}")

    # 3. Gamification & XP Audit
    print("\n--- 3. GAMIFICATION, XP TRANSACTIONS & LEADERBOARD AUDIT ---")
    has_xp_transactions_table = 'xp_transactions' in srv_text
    print(f"  xp_transactions table exists in schema: {has_xp_transactions_table}")
    print(f"  achievements system auto-unlock logic in server: {'achievements_json' in srv_text}")
    print(f"  streak tracking logic in server: {'streak_days' in srv_text}")
    
    # 4. Audit HTML Pages & Design System Consistency
    print("\n--- 4. DESIGN SYSTEM, NAVIGATION & SCROLL AUDIT ---")
    html_files = sorted(glob.glob('*.html'))
    for hf in html_files:
        with open(hf, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
        
        # Check navigation
        nav_matches = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\']', html)
        # Check design tokens
        uses_stitch = 'style.css' in html or '--bg-page' in html or 'bg-[#0b0f19]' in html or 'neo-bg' in html
        # Check active tab visual highlight
        has_active_nav = 'active' in html or 'border-b-2' in html or 'text-blue-500' in html or 'bg-blue' in html
        # Check mouse scroll / wheel prevention
        has_wheel_prevent = 'preventDefault' in html and 'wheel' in html
        
        print(f"  * {hf:15s} | Design System: {uses_stitch} | Wheel Prevent: {has_wheel_prevent} | Nav Links: {len(nav_matches)}")

    # 5. Database Schema & Tables
    print("\n--- 5. DATABASE SCHEMA INTEGRITY ---")
    conn = sqlite3.connect('database.db')
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cur.fetchall()]
    print(f"  Existing tables: {', '.join(tables)}")
    conn.close()

if __name__ == '__main__':
    run_deep_audit()
