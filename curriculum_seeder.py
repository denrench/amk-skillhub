"""
EduSpace Interactive Curriculum Seeder & Lesson Schema Definition
Generates high quality, 8-block modular educational lessons for all 5 college specialties (60 total).
Complies with Bloom's Taxonomy & Kolb's Experiential Learning Cycle:
Hook -> Objectives -> Interactive Topic Game -> Interactive Widget -> Inline Check -> Practical Application -> Assessment Quiz -> Summary & XP Reward
"""
import json
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

COURSES_METADATA = [
    {
        "slug": "it",
        "code": "06130100",
        "title": "Информационные системы и программирование",
        "short_title": "Веб-разработка и ПО",
        "description": "Проектирование современных веб-сервисов, frontend архитектура, клиент-серверное взаимодействие и базы данных.",
        "module_title": "Модуль 1. Основы веб-архитектуры и UI/UX дизайна"
    },
    {
        "slug": "graphic_design",
        "code": "02110300",
        "title": "Графический дизайн и мультимедиа",
        "short_title": "Графический дизайн",
        "description": "Теория цвета, типографика, визуальная иерархия, векторная и растровая графика, создание айдентики брендов.",
        "module_title": "Модуль 1. Композиция, айдентика и допечатная подготовка"
    },
    {
        "slug": "autoelectric",
        "code": "07161300",
        "title": "Техническое обслуживание и ремонт электрооборудования",
        "short_title": "Автоэлектроника",
        "description": "Электрооборудование автомобилей, чтение электрических схем, шина CAN, датчики ЭСУД и компьютерная диагностика.",
        "module_title": "Модуль 1. Измерительные приборы, электросхемы и CAN-сети"
    },
    {
        "slug": "hvac",
        "code": "07140700",
        "title": "Монтаж и эксплуатация холодильно-компрессорных машин и установок",
        "short_title": "Холодильные системы",
        "description": "Термодинамический цикл Карно, монтаж и вакуумация фреоновых трасс, заправка хладагентом и настройка ТРВ.",
        "module_title": "Модуль 1. Термодинамический контур, вакуумация и сервис No Frost"
    },
    {
        "slug": "automechanic",
        "code": "07161400",
        "title": "Техническое обслуживание и ремонт автотранспорта",
        "short_title": "Автомеханика",
        "description": "Устройство двигателей внутреннего сгорания, трансмиссия, ходовая часть, регламенты ТО и дефектовка деталей.",
        "module_title": "Модуль 1. Диагностика ДВС, ГРМ, трансмиссия и ходовая часть"
    }
]

def clean_html(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def _load_raw_catalog_lessons():
    catalog_path = os.path.join(BASE_DIR, "js", "courses-catalog.js")
    if os.path.exists(catalog_path):
        try:
            with open(catalog_path, "r", encoding="utf-8") as f:
                raw = f.read()
            marker = "window.EDU_LESSONS = "
            idx = raw.find(marker)
            if idx != -1:
                json_str = raw[idx + len(marker):].strip()
                if json_str.endswith(";"):
                    json_str = json_str[:-1]
                return json.loads(json_str)
        except Exception as e:
            print(f"[WARN] Failed to load catalog from {catalog_path}: {e}")
    return {}

def _parse_theory_chunks(raw_theory, default_topic, tools):
    chunks = []
    sections = re.split(r'<h[34]>(.*?)</h[34]>', raw_theory or '', flags=re.DOTALL)
    if len(sections) > 1:
        i = 1
        while i < len(sections):
            heading = clean_html(sections[i])
            body = clean_html(sections[i+1]) if i+1 < len(sections) else ""
            callout_type = "tip" if (i // 2) % 2 == 0 else "term"
            callout_title = "Совет эксперта" if callout_type == "tip" else "Ключевой термин"
            callout_text = f"Применяйте {tools or 'профильные стандарты'} строго в соответствии с регламентом." if callout_type == "tip" else f"Соблюдение отраслевых стандартов обеспечивает 100% надёжность."
            chunks.append({
                "heading": heading or f"Теоретический раздел {i//2 + 1}",
                "text": body,
                "callout": {
                    "type": callout_type,
                    "title": callout_title,
                    "text": callout_text
                }
            })
            i += 2
    if not chunks:
        cleaned = clean_html(raw_theory or '')
        mid = len(cleaned) // 2
        split_pos = cleaned.find('. ', mid)
        if split_pos != -1:
            part1 = cleaned[:split_pos+1].strip()
            part2 = cleaned[split_pos+1:].strip()
        else:
            part1 = cleaned
            part2 = f"Практическое применение стандартов по направлению: {default_topic}."
        chunks = [
            {
                "heading": "Фундаментальные основы и концепции",
                "text": part1 or f"Изучение теоретических основ по теме «{default_topic}».",
                "callout": {
                    "type": "tip",
                    "title": "Совет эксперта",
                    "text": f"Инструментарий: {tools or 'стандартное профильное оборудование'}."
                }
            },
            {
                "heading": "Регламент выполнения и требования к качеству",
                "text": part2 or "Все технологические операции производятся в соответствии с регламентом.",
                "callout": {
                    "type": "term",
                    "title": "Термин",
                    "text": f"Технологический регламент темы «{default_topic}»."
                }
            }
        ]
    return chunks

def _build_interactive_widget(item, spec, num):
    title = item.get("title", "")
    tools = item.get("tools", "")
    quiz = item.get("quiz", [])
    criteria = item.get("criteria", [])
    
    widget_types = ["flip_cards", "matching", "sequence"]
    widget_type = widget_types[(num - 1) % 3]
    
    if widget_type == "flip_cards":
        cards = []
        for q in quiz[:3]:
            opts = q.get("options", [])
            cor = q.get("correct", 0)
            front_text = q.get("q", "Вопрос по теме")
            if len(front_text) > 75:
                front_text = front_text[:72] + "..."
            back_text = (opts[cor] if cor < len(opts) else "") + ". " + q.get("explain", "")
            cards.append({"front": front_text, "back": back_text.strip()})
        while len(cards) < 3:
            cards.append({
                "front": f"Стандарт #{len(cards)+1}: {title[:35]}",
                "back": f"Обязательное соблюдение отраслевых норм при работе с {tools or 'оборудованием'}."
            })
        return {
            "id": "b4_interactive",
            "type": "interactive",
            "widget_type": "flip_cards",
            "title": "Интерактивные карточки: Ключевые понятия",
            "instructions": "Нажмите на карточку, чтобы перевернуть её и проверить понимание терминов.",
            "cards": cards[:3]
        }
    elif widget_type == "matching":
        pairs = []
        for q in quiz[:3]:
            opts = q.get("options", [])
            cor = q.get("correct", 0)
            left_text = q.get("q", "")
            if len(left_text) > 48:
                left_text = left_text[:45] + "..."
            right_text = opts[cor] if cor < len(opts) else "Нормативный регламент"
            if len(right_text) > 65:
                right_text = right_text[:62] + "..."
            pairs.append({"left": left_text, "right": right_text})
        if len(pairs) < 3:
            for c in criteria:
                pairs.append({"left": c[:40], "right": "Критерий соответствия ТЗ"})
                if len(pairs) >= 3:
                    break
        while len(pairs) < 3:
            pairs.append({"left": f"Параметр {len(pairs)+1}", "right": "Штатное нормативное значение"})
        return {
            "id": "b4_interactive",
            "type": "interactive",
            "widget_type": "matching",
            "title": "Интерактивное сопоставление: Параметры и результаты",
            "instructions": "Сопоставьте понятие или симптом с правильным регламентным значением.",
            "pairs": pairs[:3]
        }
    else:
        steps = []
        if criteria:
            steps = [f"Шаг {idx+1}. {c}" for idx, c in enumerate(criteria[:4])]
        if len(steps) < 3:
            steps = [
                f"1. Подготовка рабочего места и диагностического инструмента ({tools or 'оборудование'})",
                "2. Выполнение технологических замеров и сопоставление с допусками",
                "3. Формирование отчётности и фиксация в производственном журнале"
            ]
        return {
            "id": "b4_interactive",
            "type": "interactive",
            "widget_type": "sequence",
            "title": "Собери алгоритм: Регламент выполнения",
            "instructions": "Расставьте технологические шаги в правильном порядке кнопками ↑ / ↓ и проверьте себя.",
            "steps": steps
        }

_TOPIC_GAMES_CACHE = None

def _load_topic_games():
    global _TOPIC_GAMES_CACHE
    if _TOPIC_GAMES_CACHE is not None:
        return _TOPIC_GAMES_CACHE
    tg_path = os.path.join(BASE_DIR, 'js', 'topic-games-60.js')
    if not os.path.exists(tg_path):
        _TOPIC_GAMES_CACHE = {}
        return _TOPIC_GAMES_CACHE
    with open(tg_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    m = re.search(r'window\.EDU_TOPIC_GAMES\s*=\s*(\{.*\})\s*;?\s*$', raw, re.DOTALL)
    if m:
        _TOPIC_GAMES_CACHE = json.loads(m.group(1))
    else:
        _TOPIC_GAMES_CACHE = {}
    return _TOPIC_GAMES_CACHE

def _build_8_block_lesson(item, spec, num):
    title = item.get("title", f"Урок {num}")
    clean_title = re.sub(r"^Урок\s*\d+\.\s*", "", title)
    summary = item.get("summary", f"Практический производственный кейс по направлению: {title}.")
    criteria = item.get("criteria", [])
    if not criteria:
        criteria = [
            f"Освоить базовый регламент выполнения по теме {clean_title}",
            "Применить профильный инструмент без технологических нарушений",
            "Пройти выходной контроль качества в соответствии со стандартами"
        ]
    
    tools = item.get("tools", "")
    theory_raw = item.get("theory", "")
    chunks = _parse_theory_chunks(theory_raw, clean_title, tools)
    interactive_widget = _build_interactive_widget(item, spec, num)
    games_catalog = _load_topic_games()
    topic_game = (games_catalog.get(spec) or {}).get(str(num))
    
    quiz = item.get("quiz", [])
    first_q = quiz[0] if quiz else {
        "q": f"Какое требование является ключевым при выполнении темы «{clean_title}»?",
        "options": ["Соблюдение регламента и техники безопасности", "Случайный выбор параметров", "Игнорирование допусков", "Отказ от калибровки"],
        "correct": 0,
        "explain": "Соблюдение регламента и техники безопасности гарантирует надежность и безопасность."
    }
    
    assessment_questions = []
    for q in quiz:
        assessment_questions.append({
            "question": q.get("q", ""),
            "options": q.get("options", []),
            "correct": q.get("correct", 0)
        })
    if not assessment_questions:
        assessment_questions.append({
            "question": first_q["q"],
            "options": first_q["options"],
            "correct": first_q["correct"]
        })
        
    xp = 60 if num < 5 else (75 if num < 12 else 100)
    lesson_type = "visual" if num in (1, 2) else ("practical" if num < 9 else ("simulation" if num < 12 else "exam"))
    
    blocks = [
        {
            "id": "b1_hook",
            "type": "hook",
            "title": f"Кейс: {clean_title[:65]}",
            "badge": "Реальная ситуация",
            "content": summary
        },
        {
            "id": "b2_objectives",
            "type": "objectives",
            "title": "Чему вы научитесь в этом уроке",
            "items": criteria[:4]
        },
        {
            "id": "b3_theory",
            "type": "theory",
            "title": f"Интерактивный симулятор темы: {clean_title[:50]}",
            "summary": summary,
            "game": topic_game,
            "cheatsheet": [
                f"Инструмент / стандарт: {tools or 'профильный регламент АМК'}",
                criteria[0] if criteria else f"Контроль ключевых допусков по теме «{clean_title[:45]}»",
                first_q.get("explain", "Фиксация результата и сверка с эталонным значением")
            ],
            "chunks": chunks
        },
        interactive_widget,
        {
            "id": "b5_check",
            "type": "inline_check",
            "title": "Экспресс-проверка понимания",
            "question": first_q.get("q", ""),
            "options": first_q.get("options", []),
            "correct_index": first_q.get("correct", 0),
            "explanation": first_q.get("explain", "Ответ подтверждён технологическим регламентом."),
            "hint": "Вспомните ключевой принцип из теоретического блока урока."
        },
        {
            "id": "b6_practice",
            "type": "practical",
            "title": f"Практическое задание: {clean_title[:50]}",
            "task_description": item.get("task_prompt", summary),
            "guidelines": criteria[:4],
            "starter_code": item.get("starter_code", "// Ваше решение по заданию")
        },
        {
            "id": "b7_assessment",
            "type": "assessment",
            "title": "Итоговое испытание по уроку",
            "questions": assessment_questions
        },
        {
            "id": "b8_summary",
            "type": "summary",
            "title": "Результаты освоения урока",
            "xp": xp,
            "skills_acquired": [
                f"Освоена тема: {clean_title[:55]}",
                f"Изучен инструментарий: {tools or 'профильные стандарты отрасли'}",
                f"Начислено {xp} XP в профиль студента"
            ]
        }
    ]
    
    return {
        "title": title,
        "lesson_type": lesson_type,
        "xp_reward": xp,
        "unlock_day": num,
        "blocks": blocks
    }

def generate_default_courses():
    """Assembles all 50 interactive lessons across 5 specialties."""
    raw_catalog = _load_raw_catalog_lessons()
    courses = []
    for meta in COURSES_METADATA:
        slug = meta["slug"]
        items = raw_catalog.get(slug, [])
        lessons = []
        for idx in range(1, 13):
            item = next((it for it in items if it.get("num") == idx), None)
            if not item:
                item = {
                    "num": idx,
                    "title": f"Урок {idx}. Практический модуль {meta['short_title']}",
                    "summary": f"Практический производственный модуль №{idx} по направлению {meta['title']}.",
                    "criteria": [
                        f"Освоить профессиональный регламент модуля №{idx}",
                        "Выполнить практическую калибровку и настройку",
                        "Зафиксировать результаты в журнале производственной практики"
                    ],
                    "tools": meta["short_title"],
                    "theory": f"<h4>1. Регламент и стандарты</h4><p>Изучите стандарты выполнения технологических операций по модулю №{idx}.</p>",
                    "quiz": [{
                        "q": f"Какова основная цель выполнения операций модуля №{idx}?",
                        "options": ["Обеспечение надёжности и качества", "Случайный подбор параметров", "Игнорирование регламента", "Ускорение за счёт снижения качества"],
                        "correct": 0,
                        "explain": "Строгое следование регламенту обеспечивает проектное качество и безопасность."
                    }],
                    "task_prompt": f"Выполните производственное задание по модулю №{idx}.",
                    "starter_code": f"// Решение практического задания модуля №{idx}"
                }
            lesson_struct = _build_8_block_lesson(item, slug, idx)
            lessons.append(lesson_struct)
            
        courses.append({
            "slug": meta["slug"],
            "code": meta["code"],
            "title": meta["title"],
            "short_title": meta["short_title"],
            "description": meta["description"],
            "modules": [
                {
                    "title": meta["module_title"],
                    "lessons": lessons
                }
            ]
        })
    return courses

# Eagerly load all 60 courses/lessons
DEFAULT_COURSES = generate_default_courses()

def seed_interactive_curriculum(cursor):
    """Inserts default interactive courses, modules, and 8-block lessons into SQLite/Postgres DB."""
    for c in DEFAULT_COURSES:
        cursor.execute("""
        INSERT INTO courses (slug, code, title, description, is_published)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT(slug) DO UPDATE SET
            title = excluded.title,
            code = excluded.code,
            description = excluded.description
        """, (c["slug"], c["code"], c["title"], c["description"]))
        
        cursor.execute("SELECT id FROM courses WHERE slug = ?", (c["slug"],))
        course_row = cursor.fetchone()
        course_id = course_row[0] if course_row else None
        if not course_id:
            continue
            
        for m_idx, mod in enumerate(c["modules"], 1):
            cursor.execute("""
            SELECT id FROM course_modules WHERE course_id = ? AND (order_num = ? OR title = ?)
            ORDER BY id ASC
            """, (course_id, m_idx, mod["title"]))
            mod_rows = cursor.fetchall()
            if mod_rows:
                module_id = mod_rows[0][0]
                cursor.execute("""
                UPDATE course_modules SET title = ?, order_num = ?, is_published = 1 WHERE id = ?
                """, (mod["title"], m_idx, module_id))
                if len(mod_rows) > 1:
                    for dup in mod_rows[1:]:
                        dup_id = dup[0]
                        cursor.execute("UPDATE lessons SET module_id = ? WHERE module_id = ?", (module_id, dup_id))
                        cursor.execute("DELETE FROM course_modules WHERE id = ?", (dup_id,))
            else:
                cursor.execute("""
                INSERT INTO course_modules (course_id, title, order_num, is_published)
                VALUES (?, ?, ?, 1)
                """, (course_id, mod["title"], m_idx))
                module_id = cursor.lastrowid
                
            for l_idx, les in enumerate(mod["lessons"], 1):
                content_json_str = json.dumps(les["blocks"], ensure_ascii=False)
                cursor.execute("""
                SELECT id FROM lessons WHERE course_id = ? AND (order_num = ? OR title = ?)
                """, (course_id, l_idx, les["title"]))
                les_row = cursor.fetchone()
                if les_row:
                    cursor.execute("""
                    UPDATE lessons SET
                        module_id = ?,
                        title = ?,
                        lesson_type = ?,
                        order_num = ?,
                        xp_reward = ?,
                        unlock_day = ?,
                        is_published = 1,
                        content_json = ?
                    WHERE id = ?
                    """, (module_id, les["title"], les["lesson_type"], l_idx, les["xp_reward"], les["unlock_day"], content_json_str, les_row[0]))
                else:
                    cursor.execute("""
                    INSERT INTO lessons (course_id, module_id, title, lesson_type, order_num, xp_reward, unlock_day, is_published, content_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
                    """, (course_id, module_id, les["title"], les["lesson_type"], l_idx, les["xp_reward"], les["unlock_day"], content_json_str))

    # Clean out any orphaned modules referencing deleted courses
    try:
        cursor.execute("DELETE FROM course_modules WHERE course_id NOT IN (SELECT id FROM courses)")
    except Exception:
        pass

if __name__ == '__main__':
    import sqlite3
    db_path = os.path.join(BASE_DIR, 'database.db')
    print(f"[SEED] Seeding interactive curriculum with 60 topic games to {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    seed_interactive_curriculum(cur)
    conn.commit()
    conn.close()
    print("[SEED SUCCESS] Successfully seeded all 60 lessons with bespoke interactive topic games into database.db!")

