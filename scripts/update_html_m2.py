#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LITE_PAGES = {
    "about.html", "admin.html", "auth.html", "career.html",
    "features.html", "pricing.html", "profile.html", "reviews.html", "student.html",
}

def main():
    for path in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        name = os.path.basename(path)
        if name == "gradebook.html":
            continue
        txt = open(path, encoding="utf-8").read()
        orig = txt

        # 1. Remove cdn.tailwindcss.com script and inline tailwind.config block
        txt = re.sub(r'\s*<script[^>]+src=["\']https://cdn\.tailwindcss\.com["\'][^>]*></script>', "", txt)
        txt = re.sub(r'\s*<script>\s*if\s*\(window\.tailwind\)\s*tailwind\.config\s*=\s*\{.*?\};\s*</script>', "", txt, flags=re.S)
        txt = re.sub(r'\s*<script>\s*if\s*\(window\.tailwind\)\s*tailwind\.config\s*=\s*\{.*?\}\s*</script>', "", txt, flags=re.S)

        # 2. Switch non-player pages to courses-catalog-lite.js
        if name in LITE_PAGES:
            txt = txt.replace("js/courses-catalog.js", "js/courses-catalog-lite.js")

        # 3. Ensure js/i18n.js is included in <head>
        if "js/i18n.js" not in txt:
            if '<script src="js/theme.js"></script>' in txt:
                txt = txt.replace(
                    '<script src="js/theme.js"></script>',
                    '<script src="js/theme.js"></script>\n  <script src="js/i18n.js"></script>',
                )
            else:
                txt = txt.replace("</head>", '  <script src="js/i18n.js"></script>\n</head>')

        # 4. Update stale 50-module / 10-lesson copy
        txt = txt.replace("Каталог 50 модулей", "Каталог 100 модулей")
        txt = txt.replace("ко всем 50 модулям", "ко всем 100 модулям")
        txt = txt.replace("Все 50 модулей", "Все 100 модулей")
        txt = txt.replace("всех 50 модулей", "всех 100 модулей")
        txt = txt.replace("Уроки №4–10 заблокированы", "Уроки №4–20 (Pro / госзаказ)")

        if txt != orig:
            with open(path, "w", encoding="utf-8") as f:
                f.write(txt)
            print("Updated", name)

if __name__ == "__main__":
    main()
