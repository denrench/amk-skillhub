#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Splits monolithic js/courses-catalog.js (822 KB) and js/topic-games-60.js (702 KB)
into:
  - assets/data/catalog/index.json
  - assets/data/catalog/<slug>.json (5 specialty lesson chunks)
  - assets/data/catalog/games-<slug>.json (5 specialty topic-game chunks)
  - js/courses-catalog-lite.js (~24 KB index + async EduCatalog.loadCourse loader)
And appends window.EduCatalog to js/courses-catalog.js so player & non-player pages
share the unified lazy catalog contract.
"""
from __future__ import annotations

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "data", "catalog")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    cat_path = os.path.join(ROOT, "js", "courses-catalog.js")
    games_path = os.path.join(ROOT, "js", "topic-games-60.js")

    cat_text = open(cat_path, encoding="utf-8").read()
    games_text = open(games_path, encoding="utf-8").read()

    # Extract window.EDU_COURSES and window.EDU_LESSONS
    m_courses = re.search(r"window\.EDU_COURSES\s*=\s*(\[.*?\])\s*;\s*window\.EDU_LESSONS", cat_text, re.S)
    m_lessons = re.search(r"window\.EDU_LESSONS\s*=\s*(\{.*\})\s*;", cat_text, re.S)
    if not m_courses or not m_lessons:
        raise RuntimeError("Could not parse EDU_COURSES / EDU_LESSONS from js/courses-catalog.js")

    courses = json.loads(m_courses.group(1))
    lessons_str = m_lessons.group(1)
    # Strip trailing EduCatalog block if already appended
    if "// --- EduCatalog Lazy Loader ---" in cat_text:
        cat_base = cat_text.split("// --- EduCatalog Lazy Loader ---")[0]
        m_lessons = re.search(r"window\.EDU_LESSONS\s*=\s*(\{.*\})\s*;", cat_base, re.S)
        lessons_str = m_lessons.group(1)
    else:
        cat_base = cat_text

    lessons = json.loads(lessons_str)

    # Extract window.EDU_TOPIC_GAMES
    m_games = re.search(r"window\.EDU_TOPIC_GAMES\s*=\s*(\{.*\})\s*;", games_text, re.S)
    if not m_games:
        raise RuntimeError("Could not parse EDU_TOPIC_GAMES from js/topic-games-60.js")
    games = json.loads(m_games.group(1))

    lite_lessons = {}
    for slug, items in lessons.items():
        chunk_path = os.path.join(OUT_DIR, f"{slug}.json")
        with open(chunk_path, "w", encoding="utf-8") as f:
            json.dump({"specialty": slug, "lessons": items}, f, ensure_ascii=False, separators=(",", ":"))

        lite_lessons[slug] = [
            {
                "num": it.get("num"),
                "title": it.get("title"),
                "difficulty": it.get("difficulty", "Базовый"),
                "time_limit": it.get("time_limit", "60 мин"),
                "tools": it.get("tools", ""),
                "summary": it.get("summary", ""),
                "video_url": it.get("video_url", f"assets/lesson-intros/{slug}-{it.get('num')}.mp4"),
                "video_poster": it.get("video_poster", f"assets/lesson-intros/{slug}-{it.get('num')}.jpg"),
            }
            for it in items
        ]

    for slug, g_items in games.items():
        g_path = os.path.join(OUT_DIR, f"games-{slug}.json")
        with open(g_path, "w", encoding="utf-8") as f:
            json.dump({"specialty": slug, "games": g_items}, f, ensure_ascii=False, separators=(",", ":"))

    index_payload = {"courses": courses, "lessons": lite_lessons}
    index_path = os.path.join(OUT_DIR, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_payload, f, ensure_ascii=False, separators=(",", ":"))

    loader_snippet = """
// --- EduCatalog Lazy Loader ---
(function () {
  var _cache = {};
  var _gameCache = {};
  window.EduCatalog = {
    loadIndex: async function () {
      if (window.EDU_COURSES && window.EDU_LESSONS) {
        return { courses: window.EDU_COURSES, lessons: window.EDU_LESSONS };
      }
      var res = await fetch('assets/data/catalog/index.json', { credentials: 'same-origin' });
      var data = await res.json();
      window.EDU_COURSES = data.courses || [];
      window.EDU_LESSONS = data.lessons || {};
      return data;
    },
    loadCourse: async function (slug) {
      var s = slug || 'it';
      if (_cache[s]) return _cache[s];
      if (window.EDU_LESSONS && window.EDU_LESSONS[s] && window.EDU_LESSONS[s][0] && window.EDU_LESSONS[s][0].theory) {
        _cache[s] = window.EDU_LESSONS[s];
        return _cache[s];
      }
      var res = await fetch('assets/data/catalog/' + encodeURIComponent(s) + '.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load catalog chunk for ' + s);
      var data = await res.json();
      window.EDU_LESSONS = window.EDU_LESSONS || {};
      window.EDU_LESSONS[s] = data.lessons || [];
      _cache[s] = window.EDU_LESSONS[s];
      return _cache[s];
    },
    loadGames: async function (slug) {
      var s = slug || 'it';
      if (_gameCache[s]) return _gameCache[s];
      if (window.EDU_TOPIC_GAMES && window.EDU_TOPIC_GAMES[s]) {
        _gameCache[s] = window.EDU_TOPIC_GAMES[s];
        return _gameCache[s];
      }
      var res = await fetch('assets/data/catalog/games-' + encodeURIComponent(s) + '.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load topic games chunk for ' + s);
      var data = await res.json();
      window.EDU_TOPIC_GAMES = window.EDU_TOPIC_GAMES || {};
      window.EDU_TOPIC_GAMES[s] = data.games || {};
      _gameCache[s] = window.EDU_TOPIC_GAMES[s];
      return _gameCache[s];
    }
  };
})();
"""

    lite_js = (
        "// AMK SkillHub — Lightweight Catalog Index + Lazy Chunk Loader\n"
        f"window.EDU_COURSES = {json.dumps(courses, ensure_ascii=False, separators=(',', ':'))};\n"
        f"window.EDU_LESSONS = {json.dumps(lite_lessons, ensure_ascii=False, separators=(',', ':'))};\n"
        + loader_snippet
    )
    lite_js_path = os.path.join(ROOT, "js", "courses-catalog-lite.js")
    with open(lite_js_path, "w", encoding="utf-8") as f:
        f.write(lite_js)

    with open(cat_path, "w", encoding="utf-8") as f:
        f.write(cat_base.rstrip() + "\n" + loader_snippet)

    print(
        f"Generated {OUT_DIR}/index.json ({os.path.getsize(index_path)} B), "
        f"5 lesson chunks, 5 game chunks, and js/courses-catalog-lite.js ({len(lite_js)} B)."
    )


if __name__ == "__main__":
    main()
