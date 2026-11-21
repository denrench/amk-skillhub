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

    # Fallback to load .env if not yet in os.environ
    if "GEMINI_API_KEY" not in os.environ and "OPENAI_API_KEY" not in os.environ and "OPENROUTER_API_KEY" not in os.environ:
        _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        if os.path.isfile(_env_path):
            try:
                with open(_env_path, "r", encoding="utf-8") as _ef:
                    for _line in _ef:
                        _line = _line.strip()
                        if not _line or _line.startswith("#") or "=" not in _line:
                            continue
                        _k, _v = _line.split("=", 1)
                        _k = _k.strip()
                        _v = _v.strip().strip("'\"")
                        if _k and _k not in os.environ:
                            os.environ[_k] = _v
            except Exception:
                pass

    gemini_key = os.environ.get("GEMINI_API_KEY") or (user_api_key if provider == "gemini" else "")
    openai_key = (
        os.environ.get("OPENAI_API_KEY")
        or os.environ.get("OPENROUTER_API_KEY")
        or (user_api_key if provider in ("openai", "openrouter", "") and user_api_key and not gemini_key else "")
    )
    return gemini_key, openai_key


def _call_gemini_api(api_key, system_prompt, user_prompt):
    """Calls Google Gemini API safely via standard urllib."""
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
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
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        }
    )
    with urllib.request.urlopen(req, timeout=12) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        candidates = res_data.get("candidates", [])
        if candidates and "content" in candidates[0]:
            parts = candidates[0]["content"].get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"]
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
        "подскажи правильную букву", "скажи букву"
    ]
    question_lower = student_question.lower()
    is_cheat_attempt = any(t in question_lower for t in cheat_triggers)

    system_prompt = (
        "Ты — доброжелательный, чуткий и профессиональный Сократовский ИИ-тьютор образовательной платформы EduSpace. "
        "Твоя задача — помогать студенту глубоко понимать учебный материал, объяснять сложные термины простыми аналогиями, "
        "задавать наводящие вопросы и вдохновлять на самостоятельное решение. "
        "ПРАВИЛО БЕЗОПАСНОСТИ: Если студент пытается узнать прямой ответ на проверочный вопрос, вежливо откажи и дай подсказку по принципу работы."
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
        + ("ВНИМАНИЕ: студент запросил готовый ответ на тест — не раскрывай ответ, дай только Сократовскую подсказку.\n" if is_cheat_attempt else "")
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

