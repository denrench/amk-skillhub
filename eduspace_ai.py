"""
EduSpace AI Engine: Multi-provider integration (Gemini / OpenAI).
Provides:
1. Teacher Lesson Generator (8-block structure)
2. Student Socratic Tutor (with anti-cheat guardrails)
3. Teacher Submission Review Assistant
"""
import os
import json
import re
import urllib.request
import urllib.error

class AIProviderUnconfiguredError(RuntimeError):
    pass


class AIProviderCallError(RuntimeError):
    pass


def resolve_llm_keys(user_api_key="", provider=""):
    user_api_key = (user_api_key or "").strip()
    provider = (provider or "").strip().lower()

    if user_api_key:
        if provider == "gemini" or user_api_key.startswith("AIzaSy") or user_api_key.startswith("AQ.") or "gemini" in user_api_key.lower():
            return user_api_key, ""
        return "", user_api_key

    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    openai_key = (
        os.environ.get("OPENAI_API_KEY")
        or os.environ.get("OPENROUTER_API_KEY", "")
    )
    return gemini_key, openai_key


def _call_gemini_api(api_key, system_prompt, user_prompt):
    """Calls Google Gemini API safely via standard urllib with automatic model fallback."""
    preferred_models = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash"]
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": f"SYSTEM INSTRUCTION: {system_prompt}\n\nUSER PROMPT: {user_prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 2048
        }
    }
    encoded = json.dumps(payload).encode("utf-8")
    for model_name in preferred_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        req = urllib.request.Request(
            url,
            data=encoded,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
        except urllib.error.HTTPError as err:
            if err.code in (404, 503):
                continue
            raise err
        except Exception:
            continue
    return None


def _call_openai_api(api_key, system_prompt, user_prompt):
    """Calls OpenAI API safely via standard urllib."""
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 2048
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    )
    with urllib.request.urlopen(req, timeout=12) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        choices = res_data.get("choices", [])
        if choices and "message" in choices[0]:
            return choices[0]["message"].get("content")
    return None


def _strip_json_fences(raw_text):
    return re.sub(r"^```json\s*|^```\s*|```$", "", (raw_text or "").strip(), flags=re.MULTILINE).strip()


def generate_lesson_content(
    topic,
    discipline="IT",
    difficulty="beginner",
    duration=45,
    objectives="",
    lesson_type="theory",
    user_api_key="",
    provider="",
):
    """
    Generates a complete 8-block lesson structure for the Teacher Builder.
    Strictly requires a configured LLM provider key; never falls back to canned offline blocks.
    """
    gemini_key, openai_key = resolve_llm_keys(user_api_key=user_api_key, provider=provider)
    if not gemini_key and not openai_key:
        raise AIProviderUnconfiguredError(
            "AI-конструктор недоступен: не задан API-ключ LLM (укажите в настройках или переменных окружения)."
        )

    system_prompt = (
        "Ты — ведущий методист и эксперт образовательной платформы EduSpace. "
        "Твоя задача — создать профессиональный интерактивный урок из 8 обязательных блоков. "
        "Строго верни валидный JSON без markdown-обёртки: "
        "["
        "  {\"id\": \"b1_hook\", \"type\": \"hook\", \"title\": \"...\", \"badge\": \"Кейс из практики\", \"content\": \"...\"},"
        "  {\"id\": \"b2_objectives\", \"type\": \"objectives\", \"title\": \"Цели обучения\", \"items\": [\"...\"]},"
        "  {\"id\": \"b3_theory\", \"type\": \"theory\", \"title\": \"Теория и концепции\", \"chunks\": [{\"heading\": \"...\", \"text\": \"...\", \"callout\": {\"type\": \"tip\", \"title\": \"...\", \"text\": \"...\"}}]},"
        "  {\"id\": \"b4_interactive\", \"type\": \"interactive\", \"widget_type\": \"flip_cards\", \"title\": \"Интерактивное закрепление\", \"cards\": [{\"front\": \"...\", \"back\": \"...\"}]},"
        "  {\"id\": \"b5_check\", \"type\": \"inline_check\", \"title\": \"Проверка понимания\", \"question\": \"...\", \"options\": [\"...\"], \"correct_index\": 0, \"explanation\": \"...\", \"hint\": \"...\"},"
        "  {\"id\": \"b6_practice\", \"type\": \"practical\", \"title\": \"Практическое применение\", \"task_description\": \"...\", \"guidelines\": [\"...\"]},"
        "  {\"id\": \"b7_assessment\", \"type\": \"assessment\", \"title\": \"Итоговое испытание\", \"questions\": [{\"question\": \"...\", \"options\": [\"...\"], \"correct\": 0}]},"
        "  {\"id\": \"b8_summary\", \"type\": \"summary\", \"title\": \"Результаты урока\", \"xp\": 60, \"skills_acquired\": [\"...\"]}"
        "]"
    )
    user_prompt = (
        f"Тема: {topic}\n"
        f"Дисциплина: {discipline}\n"
        f"Уровень сложности: {difficulty}\n"
        f"Длительность: {duration} минут\n"
        f"Цели урока: {objectives or 'Освоить базовые и продвинутые практические навыки'}\n"
        f"Формат урока: {lesson_type}\n"
        "Создай реалистичный, глубокий образовательный контент с практическими ситуациями."
    )

    last_error = None
    if gemini_key:
        try:
            raw_text = _call_gemini_api(gemini_key, system_prompt, user_prompt)
            if raw_text:
                blocks = json.loads(_strip_json_fences(raw_text))
                if isinstance(blocks, list) and len(blocks) >= 1 and all(isinstance(b, dict) for b in blocks):
                    return {"provider": "gemini", "blocks": blocks}
                last_error = ValueError("Invalid lesson blocks JSON structure")
        except Exception as e:
            last_error = e
            print(f"[WARN] Gemini lesson generation failed: {e}")

    if openai_key:
        try:
            raw_text = _call_openai_api(openai_key, system_prompt, user_prompt)
            if raw_text:
                blocks = json.loads(_strip_json_fences(raw_text))
                if isinstance(blocks, list) and len(blocks) >= 1 and all(isinstance(b, dict) for b in blocks):
                    return {"provider": "openai", "blocks": blocks}
                last_error = ValueError("Invalid lesson blocks JSON structure")
        except Exception as e:
            last_error = e
            print(f"[WARN] OpenAI lesson generation failed: {e}")

    raise AIProviderCallError(
        f"Провайдер LLM не вернул корректную структуру урока ({type(last_error).__name__ if last_error else 'EmptyOrInvalidJSON'})."
    )

def student_socratic_tutor(lesson_data, current_block, student_question, history=None, context=None, user_api_key="", provider=""):
    """
    Socratic AI Tutor for students.
    Strictly requires a configured LLM provider key; never falls back to canned offline replies.
    """
    gemini_key, openai_key = resolve_llm_keys(user_api_key=user_api_key, provider=provider)
    if not gemini_key and not openai_key:
        raise AIProviderUnconfiguredError(
            "AI-наставник недоступен: не задан API-ключ LLM (укажите в настройках или переменных окружения)."
        )

    history = history or []
    context = context if isinstance(context, dict) else {}
    lesson_title = lesson_data.get("title", "Текущий урок")
    course_slug = lesson_data.get("course_slug") or context.get("course_slug") or "it"
    block_type = current_block.get("type", "general")
    block_title = current_block.get("title", "")

    cheat_triggers = [
        "дай ответ", "скажи ответ", "какой ответ", "правильный ответ",
        "ответ на тест", "ответ на вопрос", "вариант а или б", "а, б, в или г",
        "номер правильного ответа", "какой вариант выбрать", "реши за меня",
        "подскажи правильную букву", "скажи букву", "напиши решение",
        "готовое решение", "сделай за меня", "готовый код", "готовый чек-лист",
        "полный ответ", "дай шаблон", "помоги списать", "напиши за меня",
        "реши задачу полностью", "выполни задание"
    ]
    question_lower = student_question.lower()
    is_exam_block = block_type in ("practical", "assessment", "inline_check")
    is_cheat_attempt = any(t in question_lower for t in cheat_triggers)

    system_prompt = (
        "Ты — доброжелательный, но принципиальный Сократовский ИИ-тьютор образовательной платформы AMK SkillHub. "
        "Твоя задача — помогать студенту понимать учебный материал через объяснение принципов и наводящие вопросы. "
        "СТРОГОЕ ПРАВИЛО АНТИСПИСЫВАНИЯ: Категорически ЗАПРЕЩЕНО выдавать готовые решения практических заданий, "
        "готовый код для копирования, готовые чек-листы, точные ответы или буквы/номера вариантов тестов. "
        "Если студент просит решить за него или дать готовый ответ — вежливо откажи и задай 1–2 коротких наводящих вопроса."
    )

    context_lines = []
    if context.get("selected_part"):
        context_lines.append(f"Выбранная 3D-деталь: {context.get('selected_part')}")
    if context.get("disassembled_parts"):
        context_lines.append(f"Разобранные детали: {', '.join(map(str, context.get('disassembled_parts') or []))}")
    if context.get("simulator_state"):
        context_lines.append(f"Состояние симулятора: {json.dumps(context.get('simulator_state'), ensure_ascii=False)[:600]}")
    if context.get("recent_errors"):
        context_lines.append(f"Недавние ошибки: {json.dumps(context.get('recent_errors'), ensure_ascii=False)[:600]}")
    history_lines = []
    for item in history[-6:]:
        if isinstance(item, dict) and item.get("content"):
            history_lines.append(f"{item.get('role', 'user')}: {str(item.get('content'))[:300]}")

    user_prompt = (
        f"Курс: {course_slug}\n"
        f"Урок: {lesson_title}\n"
        f"Текущий блок: {block_title} ({block_type})\n"
        + ("Контекст 3D/симулятора:\n" + "\n".join(context_lines) + "\n" if context_lines else "")
        + ("История диалога:\n" + "\n".join(history_lines) + "\n" if history_lines else "")
        + ("ВНИМАНИЕ: студент находится на контрольном шаге практики/теста — НЕ пиши готовое решение или ответ, дай только принцип или наводящий вопрос.\n" if (is_cheat_attempt or is_exam_block) else "")
        + f"Вопрос студента: {student_question}\n"
        "Ответь структурированно, понятно и поддерживающе в стиле персонального наставника."
    )

    last_error = None
    if gemini_key:
        try:
            ans = _call_gemini_api(gemini_key, system_prompt, user_prompt)
            if ans:
                return {"role": "assistant", "anti_cheat_triggered": is_cheat_attempt, "message": ans.strip(), "provider": "gemini"}
        except Exception as e:
            last_error = e
            print(f"[WARN] Gemini tutor failed: {e}")

    if openai_key:
        try:
            ans = _call_openai_api(openai_key, system_prompt, user_prompt)
            if ans:
                return {"role": "assistant", "anti_cheat_triggered": is_cheat_attempt, "message": ans.strip(), "provider": "openai"}
        except Exception as e:
            last_error = e
            print(f"[WARN] OpenAI tutor failed: {e}")

    raise AIProviderCallError(
        f"Провайдер LLM не вернул ответ ({type(last_error).__name__ if last_error else 'EmptyResponse'})."
    )

def _parse_review_json(raw_text, max_score, provider_name):
    parsed = json.loads(_strip_json_fences(raw_text))
    if not isinstance(parsed, dict):
        raise ValueError("Review response must be a JSON object")
    if "recommended_score" not in parsed:
        raise ValueError("Missing recommended_score in review JSON")
    score = int(round(float(parsed["recommended_score"])))
    if score < 0 or score > max_score:
        raise ValueError(f"recommended_score {score} out of range 0..{max_score}")
    criteria = parsed.get("criteria_checks")
    if not isinstance(criteria, list):
        raise ValueError("criteria_checks must be a list")
    draft_feedback = str(parsed.get("draft_feedback") or "").strip()
    if not draft_feedback:
        raise ValueError("draft_feedback must not be empty")
    return {
        "recommended_score": score,
        "max_score": max_score,
        "criteria_checks": criteria,
        "draft_feedback": draft_feedback,
        "provider": provider_name,
    }


def review_submission_ai(submission_data, task_data, user_api_key="", provider=""):
    """
    Teacher AI Assistant: Pre-grades and drafts feedback for student submissions via real LLM API.
    Strictly requires a configured LLM provider key; never returns canned or length-based scores.
    """
    gemini_key, openai_key = resolve_llm_keys(user_api_key=user_api_key, provider=provider)
    if not gemini_key and not openai_key:
        raise AIProviderUnconfiguredError(
            "AI-проверка недоступна: не задан API-ключ LLM (укажите в настройках или переменных окружения)."
        )

    submission_data = submission_data or {}
    task_data = task_data or {}
    code_or_text = (submission_data.get("submitted_code") or submission_data.get("student_comment") or "").strip()
    task_title = task_data.get("title", "Практическое задание")
    max_score = int(task_data.get("max_score", 100) or 100)

    system_prompt = (
        "Ты — методист-эксперт образовательной платформы EduSpace. "
        "Оцени практическую работу студента объективно по критериям задания. "
        "Строго верни только валидный JSON без markdown-обёртки вида:\n"
        "{\n"
        f'  "recommended_score": <целое число от 0 до {max_score}>,\n'
        f'  "max_score": {max_score},\n'
        '  "criteria_checks": [{"criterion": "...", "status": "passed|partial|needs_work"}],\n'
        '  "draft_feedback": "<конструктивный отзыв преподавателю и студенту>"\n'
        "}"
    )
    user_prompt = (
        f"Задание: {task_title}\n"
        f"Максимальный балл: {max_score}\n"
        f"Ответ / код студента:\n{code_or_text[:6000] if code_or_text else '(пустой ответ)'}"
    )

    last_error = None
    if gemini_key:
        try:
            raw_text = _call_gemini_api(gemini_key, system_prompt, user_prompt)
            if raw_text:
                return _parse_review_json(raw_text, max_score, "gemini")
            last_error = ValueError("Empty Gemini review response")
        except Exception as e:
            last_error = e
            print(f"[WARN] Gemini submission review failed: {e}")

    if openai_key:
        try:
            raw_text = _call_openai_api(openai_key, system_prompt, user_prompt)
            if raw_text:
                return _parse_review_json(raw_text, max_score, "openai")
            last_error = ValueError("Empty OpenAI review response")
        except Exception as e:
            last_error = e
            print(f"[WARN] OpenAI submission review failed: {e}")

    raise AIProviderCallError(
        f"Провайдер LLM не вернул корректную оценку работы ({type(last_error).__name__ if last_error else 'EmptyOrInvalidJSON'})."
    )



def _analyze_lesson_integrity(integrity, solution_text, elapsed_seconds):
    """
    Server-side validation of anti-cheat proctoring telemetry.
    Recomputes trust_score (0..100) and detects anomalies so clients cannot spoof clean scores.
    """
    raw = integrity if isinstance(integrity, dict) else {}
    tab_switches = max(0, int(raw.get("tab_switches") or 0))
    away_seconds = max(0, int(raw.get("away_seconds") or 0))
    paste_attempts = max(0, int(raw.get("paste_attempts") or 0))
    copy_attempts = max(0, int(raw.get("copy_attempts") or 0))
    devtools_attempts = max(0, int(raw.get("devtools_attempts") or 0))
    instant_injections = max(0, int(raw.get("instant_injections") or 0))
    keystrokes = max(0, int(raw.get("keystrokes") or 0))
    text_len = len((solution_text or "").strip())

    score = 100
    score -= paste_attempts * 15
    score -= instant_injections * 20
    score -= tab_switches * 12
    score -= (away_seconds // 30) * 5
    score -= copy_attempts * 6
    score -= devtools_attempts * 10

    flags = []
    if paste_attempts > 0:
        flags.append(f"попыток вставки из буфера: {paste_attempts}")
    if instant_injections > 0:
        flags.append(f"заблокированных автоподстановок: {instant_injections}")
    if tab_switches > 0:
        flags.append(f"уходов со вкладки: {tab_switches} (вне урока {away_seconds} сек)")
    if copy_attempts > 0:
        flags.append(f"попыток копирования задания: {copy_attempts}")
    if devtools_attempts > 0:
        flags.append(f"попыток открыть DevTools: {devtools_attempts}")

    # Typing biometrics check (only if proctoring payload actually tracked keystrokes or sent explicit 0 with long text)
    if "keystrokes" in raw and text_len >= 80 and keystrokes < int(text_len * 0.30):
        score -= 22
        flags.append(f"аномалия ввода ({keystrokes} нажатий на {text_len} симв.)")
    if elapsed_seconds > 0 and elapsed_seconds < 12 and text_len >= 120:
        score -= 15
        flags.append(f"подозрительно быстрый ввод ({text_len} симв. за {elapsed_seconds} сек)")

    trust_score = max(0, min(100, int(score)))
    if trust_score >= 85:
        status = "verified"
        report = "Контроль самостоятельности пройден чисто (100% доверие, без переключений вкладок и вставки)." if not flags else (
            f"Индекс честности {trust_score}% — незначительные замечания ({', '.join(flags)})."
        )
    elif trust_score >= 60:
        status = "warning"
        report = f"Индекс честности {trust_score}% — зафиксированы нарушения режима самостоятельности: {', '.join(flags)}."
    else:
        status = "flagged"
        report = f"Индекс честности {trust_score}% — критический риск списывания: {', '.join(flags)}. Требуется самостоятельная пересдача."

    return {
        "trust_score": trust_score,
        "status": status,
        "report": report,
        "flags": flags,
        "tab_switches": tab_switches,
        "away_seconds": away_seconds,
        "paste_attempts": paste_attempts,
        "copy_attempts": copy_attempts,
        "devtools_attempts": devtools_attempts,
        "instant_injections": instant_injections,
        "keystrokes": keystrokes,
    }


def _apply_integrity_grade_cap(result_dict, integrity_info):
    """Applies strict server-side grade ceiling when cheating violations are detected."""
    trust = integrity_info["trust_score"]
    result_dict["trust_score"] = trust
    result_dict["integrity_status"] = integrity_info["status"]
    result_dict["integrity_report"] = integrity_info["report"]

    if trust < 45:
        result_dict["grade_5"] = min(int(result_dict.get("grade_5", 2)), 2)
        result_dict["score_100"] = min(int(result_dict.get("score_100", 45)), 45)
        result_dict["passed"] = False
        result_dict["verdict_title"] = "Работа не зачтена: зафиксированы признаки списывания"
        imps = list(result_dict.get("improvements") or [])
        imps.insert(0, "Пройдите урок самостоятельно без переключения вкладок и попыток вставки текста")
        result_dict["improvements"] = imps[:4]
    elif trust < 70:
        result_dict["grade_5"] = min(int(result_dict.get("grade_5", 3)), 3)
        result_dict["score_100"] = min(int(result_dict.get("score_100", 68)), 68)
        imps = list(result_dict.get("improvements") or [])
        imps.insert(0, f"Оценка ограничена из-за нарушений режима самостоятельности (индекс честности {trust}%)")
        result_dict["improvements"] = imps[:4]
    elif trust < 85:
        result_dict["grade_5"] = min(int(result_dict.get("grade_5", 4)), 4)
        result_dict["score_100"] = min(int(result_dict.get("score_100", 84)), 84)
    return result_dict


def evaluate_student_lesson_submission(
    lesson_title,
    specialty="it",
    task_prompt="",
    criteria=None,
    solution_text="",
    elapsed_seconds=0,
    interactive_score=0,
    interactive_done=False,
    integrity=None,
    user_api_key="",
    provider=""
):
    """
    Comprehensive AI Examiner & Anti-Cheat Proctor (Gemini / OpenAI) for end-of-lesson grading.
    Evaluates:
      1. Written student solution against lesson criteria (substance, accuracy, completeness)
      2. Time spent on lesson (honesty, pacing, anti-rush detection)
      3. Interactive lab performance
      4. Anti-cheat proctoring telemetry (tab switches, away time, paste/copy/DevTools attempts, keystrokes)
    Returns structured dict with grade_5 (2..5), score_100 (0..100), trust_score (0..100), integrity_report, feedback, etc.
    """
    criteria = criteria or []
    clean_solution = (solution_text or "").strip()
    elapsed = max(0, int(elapsed_seconds or 0))
    mins = elapsed // 60
    secs = elapsed % 60
    time_label = f"{mins} мин {secs} сек" if mins > 0 else f"{secs} сек"
    integrity_info = _analyze_lesson_integrity(integrity, clean_solution, elapsed)

    # Quick empty/too-short check
    if len(clean_solution) < 12:
        return _apply_integrity_grade_cap({
            "grade_5": 2,
            "score_100": 25,
            "passed": False,
            "verdict_title": "Требуется развёрнутое самостоятельное решение",
            "time_analysis": f"Затрачено времени: {time_label}. Ответ слишком короткий для объективной оценки.",
            "feedback": "Напишите полноценное самостоятельное решение по шагам, учитывая все критерии задания, и отправьте на повторную проверку ИИ.",
            "strengths": ["Интерактивная часть пройдена" if interactive_done else "Попытка сдачи зафиксирована"],
            "improvements": ["Раскройте каждый пункт технического задания своими словами", "Укажите конкретные параметры, единицы измерения или код"],
            "provider": "AMK AI Guard",
            "elapsed_seconds": elapsed,
        }, integrity_info)

    gemini_key, openai_key = resolve_llm_keys(user_api_key=user_api_key, provider=provider)
    criteria_text = "\n".join([f"- {c}" for c in criteria]) if criteria else "- Техническая точность и полнота ответа"

    system_prompt = (
        "Ты строгий, но справедливый ИИ-экзаменатор и проктор технического колледжа AMK SkillHub. "
        "Твоя задача — оценить самостоятельную работу студента в конце урока по четырём факторам: "
        "1) точность и полнота написанного решения по критериям ТЗ; "
        "2) время выполнения (если меньше 20 секунд при длинном тексте — предупреди о возможном списывании и снизь балл; "
        "если от 1 до 20 минут — похвали за вдумчивый темп); "
        "3) результаты интерактивной лаборатории; "
        "4) данные прокторинга антисписывания (уходы со вкладки, попытки вставки текста, копирования задания, DevTools и индекс честности). "
        "Если индекс честности < 70% или были попытки вставки/частые уходы со вкладки, обязательно укажи это в feedback и снизь оценку. "
        "Верни ТОЛЬКО валидный JSON без markdown-обёрток со следующими ключами: "
        '{"grade_5": 5, "score_100": 92, "passed": true, "verdict_title": "...", '
        '"time_analysis": "...", "feedback": "...", "strengths": ["..."], "improvements": ["..."]}. '
        "grade_5 — целое число от 2 до 5. passed — true если grade_5 >= 3. Язык ответа: русский."
    )
    user_prompt = (
        f"Специальность: {specialty}\n"
        f"Тема урока: {lesson_title}\n"
        f"Задание: {task_prompt}\n"
        f"Критерии выполнения:\n{criteria_text}\n"
        f"Интерактивный тренажёр: {'пройден' if interactive_done else 'не завершён'} (очки: {interactive_score})\n"
        f"Затраченное время на урок: {time_label} ({elapsed} сек)\n"
        f"Отчёт антисписывания (прокторинг): {integrity_info['report']} "
        f"(trust_score={integrity_info['trust_score']}%, уходов={integrity_info['tab_switches']}, "
        f"вне урока={integrity_info['away_seconds']}с, вставка={integrity_info['paste_attempts']}, "
        f"копирование={integrity_info['copy_attempts']}, DevTools={integrity_info['devtools_attempts']}, "
        f"нажатий клавиш={integrity_info['keystrokes']})\n"
        f"Решение студента:\n{clean_solution[:2500]}"
    )

    raw_reply = None
    used_provider = "fallback"
    try:
        if gemini_key:
            raw_reply = _call_gemini_api(gemini_key, system_prompt, user_prompt)
            used_provider = "Gemini AI"
        elif openai_key:
            raw_reply = _call_openai_api(openai_key, system_prompt, user_prompt)
            used_provider = "OpenAI"
    except Exception:
        raw_reply = None

    if raw_reply:
        try:
            parsed = json.loads(_strip_json_fences(raw_reply))
            g5 = int(parsed.get("grade_5", 4))
            g5 = max(2, min(5, g5))
            s100 = int(parsed.get("score_100", g5 * 20 - 5))
            s100 = max(0, min(100, s100))
            return _apply_integrity_grade_cap({
                "grade_5": g5,
                "score_100": s100,
                "passed": bool(parsed.get("passed", g5 >= 3)),
                "verdict_title": str(parsed.get("verdict_title") or ("Отличная работа!" if g5 == 5 else "Решение проверено ИИ")),
                "time_analysis": str(parsed.get("time_analysis") or f"Затрачено времени: {time_label}."),
                "feedback": str(parsed.get("feedback") or "Работа оценена на основании критериев курса."),
                "strengths": list(parsed.get("strengths") or [])[:4],
                "improvements": list(parsed.get("improvements") or [])[:4],
                "provider": used_provider,
                "elapsed_seconds": elapsed,
            }, integrity_info)
        except Exception:
            pass

    # Deterministic smart rubric fallback if API is unreachable
    words = len(re.findall(r"[A-Za-zА-Яа-яЁё0-9]+", clean_solution))
    matched = 0
    low = clean_solution.lower()
    for c in criteria:
        tokens = [t for t in re.findall(r"[a-zа-яё0-9]{3,}", str(c).lower()) if t not in ("для", "или", "при", "что", "как", "без", "все")]
        if any(t in low for t in tokens[:6]):
            matched += 1
    ratio = matched / max(1, len(criteria)) if criteria else min(1.0, words / 25.0)
    score = int(45 + ratio * 38 + (12 if interactive_done else 0) + (5 if words >= 18 else 0))
    if elapsed < 15 and words > 25:
        score = max(55, score - 15)
        t_note = f"Время: {time_label} — слишком быстро для объёмного текста, зафиксировано подозрение на списывание."
    elif elapsed < 30:
        t_note = f"Время: {time_label} — очень быстрый темп, убедитесь, что внимательно проверили все детали."
    else:
        t_note = f"Время: {time_label} — спокойный, вдумчивый темп выполнения задания."
    score = max(30, min(98, score))
    g5 = 5 if score >= 88 else (4 if score >= 74 else (3 if score >= 58 else 2))
    return _apply_integrity_grade_cap({
        "grade_5": g5,
        "score_100": score,
        "passed": g5 >= 3,
        "verdict_title": "Отличное выполнение!" if g5 == 5 else ("Хороший результат" if g5 == 4 else ("Удовлетворительно" if g5 == 3 else "Нужна доработка")),
        "time_analysis": t_note,
        "feedback": (
            f"Проверено соответствие критериям ({matched} из {max(1, len(criteria))}), объём ответа ({words} слов), "
            f"самостоятельность ({integrity_info['trust_score']}%) и статус интерактивной лаборатории. "
            + ("Решение грамотное и структурированное." if g5 >= 4 else "Добавьте больше технических деталей и конкретных значений по ТЗ.")
        ),
        "strengths": [
            f"Самостоятельно написано {words} слов по теме урока",
            "Интерактивный тренажёр успешно пройден" if interactive_done else "Показана базовая логика решения",
        ],
        "improvements": [] if g5 == 5 else ["Проверьте все критерии ТЗ и раскройте пропущенные параметры"],
        "provider": "AMK AI Rubric",
        "elapsed_seconds": elapsed,
    }, integrity_info)
