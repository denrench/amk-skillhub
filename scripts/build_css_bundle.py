#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pre-compiles all Tailwind & custom utility classes used across *.html and js/*.js
into css/app.min.css (and updates css/tailwind.min.css to the purged bundle),
eliminating the 2.93 MB unpurged stylesheet and runtime cdn.tailwindcss.com JIT.
"""
from __future__ import annotations

import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SLATE_PALETTE = {
    "50": "#f8fafc",
    "100": "#f1f5f9",
    "200": "#e2e8f0",
    "300": "#cbd5e1",
    "400": "#94a3b8",
    "500": "#64748b",
    "600": "#475569",
    "700": "#334155",
    "800": "#1e293b",
    "900": "#0f172a",
    "950": "#020617",
}

DARK_PALETTE = {
    "950": "#07090e",
    "900": "#0b0f19",
    "850": "#101524",
    "800": "#161c2e",
    "700": "#1e263d",
    "600": "#2a3452",
}

NEO_PALETTE = {
    "bg": "#080B16",
    "surface": "#11182A",
    "cyan": "#00D9FF",
    "purple": "#8957FF",
    "white": "#F4F7FF",
    "gray": "#8B96AD",
    "success": "#36E6A0",
}

COLOR_RGB = {
    "white": (255, 255, 255),
    "black": (0, 0, 0),
    "slate-950": (2, 6, 23),
    "slate-900": (15, 23, 42),
    "slate-800": (30, 41, 59),
    "slate-700": (51, 65, 85),
    "dark-950": (7, 9, 14),
    "dark-900": (11, 15, 25),
    "dark-850": (16, 21, 36),
    "dark-800": (22, 28, 46),
    "indigo-500": (99, 102, 241),
    "indigo-600": (79, 70, 229),
    "indigo-950": (30, 27, 75),
    "purple-500": (168, 85, 247),
    "purple-600": (147, 51, 234),
    "purple-950": (59, 7, 100),
    "cyan-400": (34, 211, 238),
    "cyan-500": (6, 182, 212),
    "sky-500": (14, 165, 233),
    "blue-500": (59, 130, 246),
    "blue-600": (37, 99, 235),
    "emerald-400": (52, 211, 153),
    "emerald-500": (16, 185, 129),
    "emerald-600": (5, 150, 105),
    "emerald-950": (2, 44, 34),
    "amber-400": (251, 191, 36),
    "amber-500": (245, 158, 11),
    "amber-950": (69, 26, 3),
    "red-500": (239, 68, 68),
    "red-600": (220, 38, 38),
    "rose-500": (244, 63, 94),
    "neo-cyan": (0, 217, 255),
    "neo-purple": (137, 87, 255),
    "neo-success": (54, 230, 160),
    "neo-bg": (8, 11, 22),
    "neo-surface": (17, 24, 42),
}

TW3_COLORS = {
    "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0", "slate-300": "#cbd5e1",
    "slate-400": "#94a3b8", "slate-500": "#64748b", "slate-600": "#475569", "slate-700": "#334155",
    "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
    "emerald-200": "#a7f3d0", "emerald-300": "#6ee7b7", "emerald-400": "#34d399",
    "emerald-500": "#10b981", "emerald-600": "#059669", "emerald-700": "#047857",
    "emerald-900": "#064e3b", "emerald-950": "#022c22",
    "cyan-200": "#a5f3fc", "cyan-300": "#67e8f9", "cyan-400": "#22d3ee",
    "cyan-500": "#06b6d4", "cyan-600": "#0891b2", "cyan-700": "#0e7490",
    "cyan-900": "#164e63", "cyan-950": "#083344",
    "sky-300": "#7dd3fc", "sky-400": "#38bdf8", "sky-500": "#0ea5e9", "sky-600": "#0284c7",
    "amber-200": "#fde68a", "amber-300": "#fcd34d", "amber-400": "#fbbf24",
    "amber-500": "#f59e0b", "amber-600": "#d97706", "amber-900": "#78350f", "amber-950": "#451a03",
    "orange-300": "#fdba74", "orange-400": "#fb923c", "orange-500": "#f97316", "orange-600": "#ea580c",
    "rose-200": "#fecdd3", "rose-300": "#fda4af", "rose-400": "#fb7185",
    "rose-500": "#f43f5e", "rose-600": "#e11d48",
    "teal-400": "#2dd4bf", "teal-500": "#14b8a6", "teal-600": "#0d9488",
    "violet-500": "#8b5cf6", "violet-600": "#7c3aed",
    "indigo-300": "#a5b4fc", "indigo-400": "#818cf8", "indigo-500": "#6366f1",
    "indigo-600": "#4f46e5", "indigo-700": "#4338ca", "indigo-900": "#312e81", "indigo-950": "#1e1b4b",
    "blue-400": "#60a5fa", "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8",
    "purple-300": "#d8b4fe", "purple-400": "#c084fc", "purple-500": "#a855f7",
    "purple-600": "#9333ea", "purple-700": "#7e22ce", "purple-900": "#581c87", "purple-950": "#3b0764",
    "red-400": "#f87171", "red-500": "#ef4444", "red-600": "#dc2626", "red-700": "#b91c1c",
    "green-400": "#4ade80", "green-500": "#22c55e", "green-600": "#16a34a",
}


def css_escape(cls: str) -> str:
    return re.sub(r"([^a-zA-Z0-9_-])", r"\\\1", cls)


def collect_used_tokens() -> set[str]:
    tokens: set[str] = set()
    files = glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "js", "*.js"))
    token_re = re.compile(r"[A-Za-z0-9_:/\-\[\]\.%#]+")
    for path in files:
        try:
            text = open(path, encoding="utf-8").read()
        except Exception:
            continue
        for tok in token_re.findall(text):
            if len(tok) <= 64:
                tokens.add(tok)
    return tokens


def generate_v3_extras(tokens: set[str]) -> str:
    rules: list[str] = []

    # 1. Core Flexbox/Grid/Backdrop/Sizing v3 shorthands
    rules.append(".shrink-0{flex-shrink:0}.shrink{flex-shrink:1}.grow{flex-grow:1}.grow-0{flex-grow:0}")
    rules.append(".backdrop-blur-sm{backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}")
    rules.append(".backdrop-blur-md{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}")
    rules.append(".backdrop-blur-lg{backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}")
    rules.append(".backdrop-blur-xl{backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}")
    rules.append(".backdrop-blur-2xl{backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px)}")
    rules.append(".blur-xl{filter:blur(24px)}.blur-2xl{filter:blur(40px)}.blur-3xl{filter:blur(64px)}")
    rules.append(".aspect-video{aspect-ratio:16/9}.aspect-square{aspect-ratio:1/1}")
    rules.append(".scroll-smooth{scroll-behavior:smooth}")

    # 2. Slate, Dark, Neo palettes
    for shade, hex_val in SLATE_PALETTE.items():
        rules.append(f".text-slate-{shade}{{color:{hex_val}}}")
        rules.append(f".bg-slate-{shade}{{background-color:{hex_val}}}")
        rules.append(f".border-slate-{shade}{{border-color:{hex_val}}}")
        rules.append(f".placeholder-slate-{shade}::placeholder{{color:{hex_val}}}")
        rules.append(f".hover\\:text-slate-{shade}:hover{{color:{hex_val}}}")
        rules.append(f".hover\\:bg-slate-{shade}:hover{{background-color:{hex_val}}}")
    for shade, hex_val in DARK_PALETTE.items():
        rules.append(f".bg-dark-{shade}{{background-color:{hex_val}}}")
        rules.append(f".border-dark-{shade}{{border-color:{hex_val}}}")
        rules.append(f".text-dark-{shade}{{color:{hex_val}}}")
    for name, hex_val in NEO_PALETTE.items():
        rules.append(f".bg-neo-{name}{{background-color:{hex_val}}}")
        rules.append(f".text-neo-{name}{{color:{hex_val}}}")
        rules.append(f".border-neo-{name}{{border-color:{hex_val}}}")
        rules.append(f".hover\\:text-neo-{name}:hover{{color:{hex_val}}}")

    # 3. Opacity slash utilities & arbitrary bracket utilities found in tokens
    media_wrappers = {
        "sm": "@media (min-width:640px)",
        "md": "@media (min-width:768px)",
        "lg": "@media (min-width:1024px)",
        "xl": "@media (min-width:1280px)",
    }

    for tok in sorted(tokens):
        base = tok
        prefix_media = None
        is_hover = False
        parts = tok.split(":")
        if len(parts) > 1:
            for p in parts[:-1]:
                if p in media_wrappers:
                    prefix_media = media_wrappers[p]
                elif p == "hover":
                    is_hover = True
            base = parts[-1]

        sel = "." + css_escape(tok) + (":hover" if is_hover else "")
        decl = None

        # Arbitrary font-size: text-[11px]
        m = re.match(r"^text-\[([0-9.]+(?:px|rem|em|%))\]$", base)
        if m:
            decl = f"font-size:{m.group(1)}"

        # Arbitrary width/height/min/max: w-[420px], max-w-[85vw], min-w-[680px], max-h-[60vh]
        if not decl:
            m = re.match(r"^(w|h|min-w|max-w|min-h|max-h)-\[([^\]]+)\]$", base)
            if m:
                prop_map = {
                    "w": "width",
                    "h": "height",
                    "min-w": "min-width",
                    "max-w": "max-width",
                    "min-h": "min-height",
                    "max-h": "max-height",
                }
                decl = f"{prop_map[m.group(1)]}:{m.group(2)}"

        # Arbitrary blur: blur-[120px]
        if not decl:
            m = re.match(r"^blur-\[([0-9.]+px)\]$", base)
            if m:
                decl = f"filter:blur({m.group(1)})"

        # Arbitrary border-radius: rounded-[14px]
        if not decl:
            m = re.match(r"^rounded-\[([0-9.]+(?:px|rem))\]$", base)
            if m:
                decl = f"border-radius:{m.group(1)}"

        # Arbitrary z-index: z-[60]
        if not decl:
            m = re.match(r"^z-\[(-?[0-9]+)\]$", base)
            if m:
                decl = f"z-index:{m.group(1)}"

        # Opacity slash: bg-white/10, border-indigo-500/30, text-white/80, from-cyan-950/60
        if not decl and "/" in base:
            m = re.match(r"^(bg|border|text|from|via|to)-([a-z0-9-]+)\/([0-9]+)$", base)
            if m:
                kind, cname, pct_s = m.group(1), m.group(2), m.group(3)
                rgb = COLOR_RGB.get(cname)
                if rgb:
                    alpha = round(int(pct_s) / 100.0, 3)
                    rgba = f"rgba({rgb[0]},{rgb[1]},{rgb[2]},{alpha})"
                    if kind in ("bg", "border", "text"):
                        prop = {"bg": "background-color", "border": "border-color", "text": "color"}[kind]
                        decl = f"{prop}:{rgba}"
                    elif kind == "from":
                        decl = f"--tw-gradient-from:{rgba};--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba({rgb[0]},{rgb[1]},{rgb[2]},0))"
                    elif kind == "via":
                        decl = f"--tw-gradient-stops:var(--tw-gradient-from),{rgba},var(--tw-gradient-to,rgba({rgb[0]},{rgb[1]},{rgb[2]},0))"
                    elif kind == "to":
                        decl = f"--tw-gradient-to:{rgba}"

        # Solid Tailwind v3 colors: bg-emerald-600, text-cyan-400, border-amber-500, ring-indigo-500, from/via/to
        if not decl and "/" not in base:
            m = re.match(r"^(bg|border|text|ring|from|via|to)-([a-z]+-[a-z0-9]+)$", base)
            if m:
                kind, cname = m.group(1), m.group(2)
                hex_val = TW3_COLORS.get(cname)
                if not hex_val and cname.startswith("neo-"):
                    hex_val = NEO_PALETTE.get(cname[4:])
                if hex_val:
                    if kind == "bg":
                        decl = f"background-color:{hex_val}"
                    elif kind == "text":
                        decl = f"color:{hex_val}"
                    elif kind == "border":
                        decl = f"border-color:{hex_val}"
                    elif kind == "ring":
                        decl = f"--tw-ring-color:{hex_val}"
                    elif kind == "from":
                        decl = f"--tw-gradient-from:{hex_val};--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(0,0,0,0))"
                    elif kind == "via":
                        decl = f"--tw-gradient-stops:var(--tw-gradient-from),{hex_val},var(--tw-gradient-to,rgba(0,0,0,0))"
                    elif kind == "to":
                        decl = f"--tw-gradient-to:{hex_val}"

        if decl:
            rule = f"{sel}{{{decl}}}"
            if prefix_media:
                rule = f"{prefix_media}{{{rule}}}"
            rules.append(rule)

    return "\n".join(rules)


def purge_tailwind_v2(raw_tw: str, used_tokens: set[str]) -> str:
    """Purges unused class rules from Tailwind v2 while keeping all base resets and used classes."""
    class_sel_re = re.compile(r"\.([a-zA-Z0-9_\\/\.\-]+)")

    def should_keep_selector(sel: str) -> bool:
        matches = class_sel_re.findall(sel)
        if not matches:
            return True  # element/reset selector (html, body, *, button, etc.)
        for m in matches:
            clean = m.replace("\\:", ":").replace("\\.", ".").replace("\\/", "/")
            if clean in used_tokens:
                return True
            base = clean.split(":")[-1]
            if base in used_tokens:
                return True
        return False

    def filter_rule_list(css_chunk: str) -> str:
        out = []
        i = 0
        n = len(css_chunk)
        while i < n:
            if css_chunk[i].isspace():
                i += 1
                continue
            if css_chunk.startswith("/*", i):
                end_c = css_chunk.find("*/", i + 2)
                if end_c == -1:
                    break
                i = end_c + 2
                continue
            if css_chunk.startswith("@media", i) or css_chunk.startswith("@keyframes", i) or css_chunk.startswith("@-webkit-keyframes", i):
                brace_open = css_chunk.find("{", i)
                if brace_open == -1:
                    break
                header = css_chunk[i:brace_open].strip()
                depth = 1
                j = brace_open + 1
                while j < n and depth > 0:
                    if css_chunk[j] == "{":
                        depth += 1
                    elif css_chunk[j] == "}":
                        depth -= 1
                    j += 1
                inner = css_chunk[brace_open + 1 : j - 1]
                if header.startswith("@media"):
                    kept_inner = filter_rule_list(inner)
                    if kept_inner:
                        out.append(f"{header}{{{kept_inner}}}")
                else:
                    out.append(f"{header}{{{inner}}}")
                i = j
            else:
                brace_open = css_chunk.find("{", i)
                if brace_open == -1:
                    break
                sel = css_chunk[i:brace_open].strip()
                brace_close = css_chunk.find("}", brace_open + 1)
                if brace_close == -1:
                    break
                body = css_chunk[brace_open + 1 : brace_close]
                if should_keep_selector(sel):
                    out.append(f"{sel}{{{body}}}")
                i = brace_close + 1
        return "".join(out)

    return filter_rule_list(raw_tw)


def main():
    tw_path = os.path.join(ROOT, "css", "tailwind.min.css")
    raw_tw = open(tw_path, encoding="utf-8").read()
    tokens = collect_used_tokens()
    purged_tw = purge_tailwind_v2(raw_tw, tokens)
    v3_css = generate_v3_extras(tokens)

    style_css = open(os.path.join(ROOT, "css", "style.css"), encoding="utf-8").read()
    comp_css = open(os.path.join(ROOT, "css", "components.css"), encoding="utf-8").read()
    starter_css = open(os.path.join(ROOT, "css", "starter-lesson.css"), encoding="utf-8").read()
    workshop_css = open(os.path.join(ROOT, "css", "workshop.css"), encoding="utf-8").read()
    photoreal_css = open(os.path.join(ROOT, "css", "photoreal-tools.css"), encoding="utf-8").read()

    combined_tw = "/* Purged Tailwind + V3 Utilities */\n" + purged_tw + "\n" + v3_css + "\n"
    with open(tw_path, "w", encoding="utf-8") as f:
        f.write(combined_tw)

    app_bundle = "\n".join([
        "/* AMK SkillHub / EduSpace 3.0 — Unified Compiled CSS Bundle (app.min.css) */",
        combined_tw,
        style_css,
        comp_css,
        starter_css,
        workshop_css,
        photoreal_css,
    ])
    app_min_path = os.path.join(ROOT, "css", "app.min.css")
    with open(app_min_path, "w", encoding="utf-8") as f:
        f.write(app_bundle)

    print(f"Purged tailwind.min.css to {len(combined_tw)} bytes; built css/app.min.css ({len(app_bundle)} bytes).")


if __name__ == "__main__":
    main()

