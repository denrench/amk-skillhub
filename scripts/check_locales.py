#!/usr/bin/env python3
"""
Автопроверка словарей локализации (locales/ru.json vs locales/kk.json).
Проверяет:
1. Недостающие ключи в kk.json (относительно ru.json)
2. Лишние ключи в kk.json
3. Расхождения плейсхолдеров ({date}, {count}, {done}, {total} и т.д.)
4. Пустые или пробельные строковые значения
"""
import json
import re
import sys
from pathlib import Path

PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z0-9_]+)\}")


def flatten_dict(d, prefix=""):
    items = {}
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            items.update(flatten_dict(v, full_key))
        else:
            items[full_key] = v
    return items


def check_locales(ru_path: Path, kk_path: Path) -> int:
    ru_data = json.loads(ru_path.read_text(encoding="utf-8"))
    kk_data = json.loads(kk_path.read_text(encoding="utf-8"))

    ru_flat = flatten_dict(ru_data)
    kk_flat = flatten_dict(kk_data)

    ru_keys = set(ru_flat.keys())
    kk_keys = set(kk_flat.keys())

    missing_in_kk = sorted(ru_keys - kk_keys)
    extra_in_kk = sorted(kk_keys - ru_keys)
    empty_values = []
    placeholder_mismatches = []

    for k, v in sorted(ru_flat.items()):
        if not isinstance(v, str) or not v.strip():
            empty_values.append(f"ru:{k}")

    for k, v in sorted(kk_flat.items()):
        if not isinstance(v, str) or not v.strip():
            empty_values.append(f"kk:{k}")

    for k in sorted(ru_keys & kk_keys):
        ru_val = str(ru_flat[k])
        kk_val = str(kk_flat[k])
        ru_ph = set(PLACEHOLDER_RE.findall(ru_val))
        kk_ph = set(PLACEHOLDER_RE.findall(kk_val))
        if ru_ph != kk_ph:
            placeholder_mismatches.append((k, sorted(ru_ph), sorted(kk_ph)))

    print(f"=== I18N DICTIONARY AUDIT ({ru_path.name} <-> {kk_path.name}) ===")
    print(f"Total keys in ru.json: {len(ru_keys)}")
    print(f"Total keys in kk.json: {len(kk_keys)}")
    print(f"Missing keys in kk.json: {len(missing_in_kk)}")
    for k in missing_in_kk:
        print(f"  [MISSING] {k}")
    print(f"Extra keys in kk.json:   {len(extra_in_kk)}")
    for k in extra_in_kk:
        print(f"  [EXTRA]   {k}")
    print(f"Empty values:            {len(empty_values)}")
    for k in empty_values:
        print(f"  [EMPTY]   {k}")
    print(f"Placeholder mismatches:  {len(placeholder_mismatches)}")
    for k, r_p, k_p in placeholder_mismatches:
        print(f"  [PLACEHOLDER MISMATCH] {k}: ru={r_p} vs kk={k_p}")

    if missing_in_kk or extra_in_kk or empty_values or placeholder_mismatches:
        print("RESULT: FAILED")
        return 1

    print("RESULT: PASSED (100% parity, all placeholders and values verified)")
    return 0


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    sys.exit(check_locales(root / "locales" / "ru.json", root / "locales" / "kk.json"))
