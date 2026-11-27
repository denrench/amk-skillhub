/**
 * AMK SkillHub — Интерактивный 30-секундный экспресс-челлендж на главной странице
 * Позволяет мгновенно проверить знания по 5 специальностям и перейти в 3D-симулятор.
 */
(function () {
  'use strict';

  const QUESTIONS = {
    it: [
      { q: 'Какое разрешение экрана оптимально для веб-баннера 1200×600 px?', opts: ['72 ppi (WebP)', '300 ppi (BMP)', '600 ppi (TIFF)'], ans: 0, tip: 'Для экранов используется 72 ppi и сжатие WebP/PNG — файл загружается в десятки раз быстрее.' },
      { q: 'Какой шаг модульной сетки используют в современном UI (Figma / CSS)?', opts: ['5 px', '8 px', '13 px'], ans: 1, tip: 'Базовый шаг 8 px кратен большинству экранов и обеспечивает ровные отступы.' },
      { q: 'Какое свойство CSS выравнивает flex-элементы по главной оси?', opts: ['align-items', 'justify-content', 'z-index'], ans: 1, tip: 'justify-content управляет распределением по главной оси flex-контейнера.' },
    ],
    graphic_design: [
      { q: 'Какая цветовая модель обязательна для офсетной печати?', opts: ['RGB', 'CMYK', 'HSB'], ans: 1, tip: 'Печатные машины работают по субтрактивной модели CMYK (Cyan, Magenta, Yellow, Key).' },
      { q: 'Какой стандартный вылет (Bleed) закладывают под обрез для полиграфии?', opts: ['0 мм', '3–5 мм', '25 мм'], ans: 1, tip: 'Вылет 3–5 мм за линию реза исключает белые полосы на краях готового изделия.' },
      { q: 'Какое минимальное разрешение растра требуется для качественной печати?', opts: ['72 dpi', '150 dpi', '300 dpi'], ans: 2, tip: 'Стандарт допечатной подготовки PDF/X-1a — 300 dpi.' },
    ],
    autoelectric: [
      { q: 'Какое суммарное сопротивление исправной шины CAN-Bus (2 терминатора по 120 Ом)?', opts: ['120 Ом', '60 Ом', '240 Ом'], ans: 1, tip: 'Два резистора 120 Ом соединены параллельно: R = 120 / 2 = 60 Ом.' },
      { q: 'Нормальное напряжение заряженного 12V AGM-аккумулятора в покое:', opts: ['10.8–11.2 В', '12.6–12.7 В', '15.8–16.2 В'], ans: 1, tip: '12.64 В в покое соответствует 100% заряду исправного 12V AGM АКБ.' },
      { q: 'Какое напряжение выдаёт исправный генератор под нагрузкой на работающем ДВС?', opts: ['12.0 В', '13.8–14.4 В', '18.5 В'], ans: 1, tip: 'Регулятор напряжения поддерживает 13.8–14.4 В для заряда АКБ и питания бортсети.' },
    ],
    hvac: [
      { q: 'Какой оптимальный перегрев (Superheat) хладагента на всасывании?', opts: ['0 K', '5–8 K', '25–30 K'], ans: 1, tip: 'Superheat 5–8 K защищает компрессор от гидроудара и сохраняет холодопроизводительность.' },
      { q: 'Зачем при пайке медных труб HVAC внутрь подают сухой азот?', opts: ['Для охлаждения', 'Чтобы не образовалась окалина внутри трубы', 'Для повышения давления'], ans: 1, tip: 'Азот вытесняет кислород и предотвращает образование оксидной окалины, забивающей ТРВ и компрессор.' },
      { q: 'Как заправляют двухкомпонентный хладагент R410A?', opts: ['Только газом', 'Только в жидкой фазе по весам', 'На глаз без весов'], ans: 1, tip: 'R410A заправляют строго в жидкой фазе (перевернув баллон) по электронным весам.' },
    ],
    automechanic: [
      { q: 'Типовой момент затяжки колёсных болтов легкового автомобиля:', opts: ['35–45 Н·м', '110–120 Н·м', '320–350 Н·м'], ans: 1, tip: 'Колёсные болты затягивают динамометрическим ключом крест-накрест моментом 110–120 Н·м.' },
      { q: 'Что обязательно делают после установки автомобиля на 2-стоечный подъёмник?', opts: ['Сразу откручивают колёса', 'Ставят каретки на механический стопор', 'Выключают свет'], ans: 1, tip: 'Постановка на механический стопор безопасности исключает падение при отказе гидравлики.' },
      { q: 'Какие три угла регулируют на стенде 3D сход-развала?', opts: ['Развал, Кастер, Схождение', 'Массу, Крен, Тангаж', 'Давление, Температуру, Уровень'], ans: 0, tip: 'Геометрия УУК включает развал (Camber), продольный наклон оси (Caster) и схождение (Toe).' },
    ],
  };

  const LABELS = {
    it: 'Веб-дизайн (IT)',
    graphic_design: 'Графдизайн',
    autoelectric: 'Автоэлектрика',
    hvac: 'Холодильное (HVAC)',
    automechanic: 'Автомеханика',
  };

  function boot() {
    const mount = document.getElementById('express-challenge-mount');
    if (!mount) return;

    let spec = 'it';
    let qIdx = 0;
    let score = 0;
    let picked = null;

    function render() {
      const list = QUESTIONS[spec] || QUESTIONS.it;
      const done = qIdx >= list.length;

      const tabs = Object.keys(LABELS).map((k) => {
        const act = k === spec;
        return `<button type="button" data-ec-spec="${k}" style="padding:7px 12px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid ${act ? '#38bdf8' : 'rgba(255,255,255,0.12)'};background:${act ? 'rgba(56,189,248,0.16)' : 'rgba(15,23,42,0.75)'};color:${act ? '#e0f2fe' : '#94a3b8'};">${LABELS[k]}</button>`;
      }).join('');

      let body = '';
      if (done) {
        body = `
          <div style="padding:18px;border-radius:14px;background:rgba(16,185,129,0.1);border:1px solid rgba(52,211,153,0.35);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;">
            <div>
              <div style="font-size:16px;font-weight:800;color:#6ee7b7;">Результат: ${score} из ${list.length} · +${score * 50} XP</div>
              <p style="margin:4px 0 0;font-size:13px;color:#cbd5e1;">Отлично! Закрепите практику на настоящих 3D-стендах по специальности «${LABELS[spec]}».</p>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <a href="simulator.html?specialty=${spec}&task=1" class="button primary" style="text-decoration:none;">Открыть 3D-симулятор →</a>
              <button type="button" id="ec-retry" class="button">Пройти ещё раз</button>
            </div>
          </div>`;
      } else {
        const cur = list[qIdx];
        const opts = cur.opts.map((o, i) => {
          let bg = 'rgba(15,23,42,0.85)', brd = 'rgba(255,255,255,0.12)', col = '#e2e8f0';
          if (picked !== null) {
            if (i === cur.ans) { bg = 'rgba(16,185,129,0.18)'; brd = '#34d399'; col = '#6ee7b7'; }
            else if (i === picked) { bg = 'rgba(244,63,94,0.18)'; brd = '#fb7185'; col = '#fda4af'; }
          }
          return `<button type="button" data-ec-opt="${i}" ${picked !== null ? 'disabled' : ''} style="text-align:left;padding:11px 14px;border-radius:12px;border:1px solid ${brd};background:${bg};color:${col};font-size:13.5px;font-weight:600;cursor:${picked === null ? 'pointer' : 'default'};">${o}</button>`;
        }).join('');

        body = `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#94a3b8;font-family:monospace;">
              <span>ВОПРОС ${qIdx + 1} ИЗ ${list.length}</span>
              <span style="color:#38bdf8;font-weight:700;">XP: ${score * 50}</span>
            </div>
            <div style="font-size:16px;font-weight:700;color:#f8fafc;">${cur.q}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">${opts}</div>
            ${picked !== null ? `
              <div style="padding:10px 14px;border-radius:12px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
                <span style="font-size:13px;color:#e0f2fe;">${cur.tip}</span>
                <button type="button" id="ec-next" class="button primary">${qIdx + 1 < list.length ? 'Следующий вопрос →' : 'Показать результат →'}</button>
              </div>
            ` : ''}
          </div>`;
      }

      mount.innerHTML = `
        <div style="padding:20px;border-radius:20px;background:rgba(11,17,32,0.88);border:1px solid rgba(56,189,248,0.22);display:flex;flex-direction:column;gap:16px;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;">${tabs}</div>
          ${body}
        </div>`;

      mount.querySelectorAll('[data-ec-spec]').forEach((b) => {
        b.onclick = () => { spec = b.getAttribute('data-ec-spec'); qIdx = 0; score = 0; picked = null; render(); };
      });
      mount.querySelectorAll('[data-ec-opt]').forEach((b) => {
        b.onclick = () => {
          picked = Number(b.getAttribute('data-ec-opt'));
          if (picked === list[qIdx].ans) score += 1;
          render();
        };
      });
      const nextBtn = mount.querySelector('#ec-next');
      if (nextBtn) nextBtn.onclick = () => { qIdx += 1; picked = null; render(); };
      const retryBtn = mount.querySelector('#ec-retry');
      if (retryBtn) retryBtn.onclick = () => { qIdx = 0; score = 0; picked = null; render(); };
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
