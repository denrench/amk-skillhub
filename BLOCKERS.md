# EXTERNAL BLOCKERS & CONSTRAINTS LOG — AMK SKILLHUB × NYVOR

| ID | Area | Description | Status | Mitigation / Action Taken |
|---|---|---|---|---|
| BLK-01 | Owner Email Privacy Directive | Part II Section 6 of the directive explicitly prohibits publishing the unconfirmed personal email address until confirmed by the owner. | `BLOCKED (By Policy)` | Email publication is intentionally disabled (`"email_published": false` in `config/branding.json`), and all email strings are stripped from public HTML/JS/CSS and enforced by `test_h02`. Public contacts use official Telegram `@denrench` and Instagram `@ny.vor`. |
| BLK-02 | External Cloud LLM API Key (`GEMINI_API_KEY`) | Live cloud Gemini API calls require an external paid/private `GEMINI_API_KEY` environment variable that must never be committed to Git. | `MITIGATED` | `/api/ai/tutor` supports live Gemini API when `GEMINI_API_KEY` is provided in the host environment and automatically falls back to the built-in deterministic domain-specific Socratic engineering mentor engine offline. |
