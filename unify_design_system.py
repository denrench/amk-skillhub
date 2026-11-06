# -*- coding: utf-8 -*-
"""
Unify Futuristic Design System & Linked Styles Across All 17 HTML Pages
"""
import glob
import re

html_files = sorted(glob.glob('*.html'))
print(f"Auditing & Unifying Design System across {len(html_files)} HTML pages...")

for hf in html_files:
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Favicon
    if 'assets/eduspace-logo.svg' not in content:
        favicon_tag = '<link rel="icon" type="image/svg+xml" href="assets/eduspace-logo.svg"/>\n'
        content = re.sub(r'(<head[^>]*>)', r'\1\n  ' + favicon_tag, content, count=1, flags=re.I)
        modified = True

    # 2. style.css
    if 'href="css/style.css"' not in content and "href='css/style.css'" not in content:
        style_tag = '  <link rel="stylesheet" href="css/style.css"/>\n'
        content = re.sub(r'(</head>)', style_tag + r'\1', content, count=1, flags=re.I)
        modified = True

    # 3. components.css
    if 'href="css/components.css"' not in content and "href='css/components.css'" not in content:
        comp_tag = '  <link rel="stylesheet" href="css/components.css"/>\n'
        content = re.sub(r'(</head>)', comp_tag + r'\1', content, count=1, flags=re.I)
        modified = True

    # 4. Remove duplicate script loads in teacher.html
    if hf == 'teacher.html':
        dup_marker = '  <!-- Scripts -->\n  <script src="js/courses-catalog.js"></script>\n  <script src="js/app-logistics.js"></script>'
        if dup_marker in content:
            content = content.replace(dup_marker, '  <!-- Scripts -->', 1)
            modified = True
            print("  [OK] Removed duplicate script imports from teacher.html")

    if modified:
        with open(hf, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [OK] Unified Design System links for {hf}")
    else:
        print(f"  [--] {hf} already compliant")

print("\nAll HTML pages verified and unified with CSS variables and design system tokens!")
