# -*- coding: utf-8 -*-
"""
Captures desktop (1440x900) and mobile (390x844) release screenshots and prints
the 25 optimized GLB asset hashes/sizes for 3D_ASSET_MANIFEST.md & FINAL_RELEASE_REPORT.md.
"""
from __future__ import annotations

import glob
import hashlib
import os
import time

from tests.e2e.harness import IsolatedServer, create_chrome_driver, wait_for_ready

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT_DIR, "assets", "screenshots", "release")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    glb_files = sorted(glob.glob(os.path.join(ROOT_DIR, "assets", "models", "*.glb")))
    total_b = 0
    print("=== GLB INVENTORY ===")
    for p in glb_files:
        data = open(p, "rb").read()
        h = hashlib.sha256(data).hexdigest()[:16].upper()
        total_b += len(data)
        print(f"{os.path.basename(p):26s} | {len(data):8d} B | {h}")
    print(f"TOTAL GLB FILES: {len(glb_files)} | TOTAL BYTES: {total_b} ({total_b / (1024*1024):.2f} MB)")

    with IsolatedServer(strip_ai_keys=True) as srv:
        for mode, pages in [
            ("desktop", ["index.html", "lesson_player.html?course=automechanic&lesson=1", "simulator.html?specialty=automechanic&task=1", "tools.html", "profile.html", "career.html"]),
            ("mobile", ["index.html", "profile.html", "tools.html", "mission.html?specialty=automechanic"]),
        ]:
            drv = create_chrome_driver(mode)
            try:
                # Register & authenticate an isolated student so profile/simulator/mission render full authenticated UI
                drv.get(f"{srv.base_url}/auth.html")
                wait_for_ready(drv)
                drv.execute_async_script("""
                    const done = arguments[arguments.length - 1];
                    const email = 'release_' + Date.now() + '_' + Math.random().toString(36).slice(2,6) + '@amk.kz';
                    fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            full_name: 'Алихан Нурланов',
                            email: email,
                            password: 'ReleaseUser123!',
                            role: 'student',
                            specialty_slug: 'automechanic'
                        })
                    }).then(r => r.json()).then(d => {
                        if (d && d.user && window.EduSpace && window.EduSpace.setActiveUser) {
                            window.EduSpace.setActiveUser(d.user);
                        }
                        done(Boolean(d && d.user));
                    }).catch(() => done(false));
                """)
                for page in pages:
                    slug = page.split("?")[0].replace(".html", "")
                    drv.get(f"{srv.base_url}/{page}")
                    wait_for_ready(drv)
                    time.sleep(0.8)
                    out_path = os.path.join(OUT_DIR, f"{slug}_{mode}.png")
                    drv.save_screenshot(out_path)
                    print(f"Saved screenshot: {out_path} ({os.path.getsize(out_path)} B)")
            finally:
                try:
                    drv.quit()
                except Exception:
                    pass


if __name__ == "__main__":
    main()
