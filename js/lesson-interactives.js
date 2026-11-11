/**
 * AMK SkillHub — Thematic Interactive Lesson Labs & Gamified Mechanics
 * Provides topic-specific hands-on mini-simulators, sortable algorithm steps,
 * bug-hunter challenges, and mentor feedback inside lesson_player.html (b4_interactive).
 */
window.LessonInteractives = (() => {
  'use strict';

  const MENTORS = {
    it: { name: 'Михаил Власов', role: 'Преподаватель Web Design', avatar: 'МВ', color: '#818cf8' },
    graphic_design: { name: 'Алия Сейдахметова', role: 'Мастер графического дизайна', avatar: 'АС', color: '#c084fc' },
    autoelectric: { name: 'Руслан Жумабаев', role: 'Диагност-автоэлектрик', avatar: 'РЖ', color: '#fbbf24' },
    hvac: { name: 'Тимур Ахметов', role: 'Инженер холодильных систем', avatar: 'ТА', color: '#38bdf8' },
    automechanic: { name: 'Ерлан Садыков', role: 'Мастер автомеханики', avatar: 'ЕС', color: '#fb923c' },
  };

  function mentorCard(spec, text, status = 'info') {
    const m = MENTORS[spec] || MENTORS.it;
    const border = status === 'ok' ? 'rgba(16,185,129,0.5)' : status === 'warn' ? 'rgba(245,158,11,0.5)' : 'rgba(99,102,241,0.35)';
    const bg = status === 'ok' ? 'rgba(6,78,59,0.28)' : status === 'warn' ? 'rgba(120,53,15,0.25)' : 'rgba(30,41,59,0.6)';
    return `
      <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:16px;border:1px solid ${border};background:${bg};">
        <div style="width:36px;height:36px;border-radius:12px;background:${m.color};color:#0f172a;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${m.avatar}</div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:11px;font-weight:800;color:${m.color};letter-spacing:0.03em;">${m.name} · ${m.role}</div>
          <div style="font-size:13px;color:#e2e8f0;margin-top:3px;line-height:1.45;">${text}</div>
        </div>
      </div>
    `;
  }

  function getTopicConfig(spec, num) {
    const key = `${spec}-${num}`;
    const map = {
      'it-1': { mode: 'web_export', title: 'Оптимизатор веб-баннера (72 ppi vs 300 ppi)', goal: 'Добейтесь веса баннера ≤ 150 КБ при чётком качестве для экрана (72 ppi, WebP).' },
      'it-2': { mode: 'web_export', variant: 'svg', title: 'Сравнение растра и SVG-вектора', goal: 'Переключите иконку в SVG-режим и проверьте зум 400% без потери чёткости.' },
      'it-3': { mode: 'figma_grid', variant: 'grid8', title: 'Конструктор 8px-сетки (Layout Grid)', goal: 'Исправьте все некратные 8px отступы на макете карточки.' },
      'it-4': { mode: 'figma_grid', variant: 'autolayout', title: 'Симулятор Auto Layout (Shift + A)', goal: 'Настройте Padding и Gap так, чтобы кнопка адаптировалась под длинный текст.' },
      'it-5': { mode: 'figma_grid', variant: 'variants', title: 'Мастер-компонент и варианты состояний', goal: 'Протестируйте переключение состояний Default → Hover → Disabled и обновите токен.' },
      'it-6': { mode: 'web_code', variant: 'html', title: 'Редактор семантического HTML5', goal: 'Замените несемантичные <div> на правильные теги <h1>, <p> и <button>.' },
      'it-8': { mode: 'web_code', variant: 'flexbox', title: 'Живая песочница Flexbox Header', goal: 'Разнесите логотип и меню по краям (display: flex; justify-content: space-between; align-items: center).' },
      'it-9': { mode: 'web_code', variant: 'js_click', title: 'Отладчик события click (addEventListener)', goal: 'Подключите обработчик клика к кнопке и проверьте реакцию DOM.' },
      'it-10': { mode: 'web_code', variant: 'flexbox', title: 'Сборка карточки товара (HTML + CSS)', goal: 'Выровняйте элементы карточки с помощью Flexbox и задайте аккуратный отступ.' },
      'it-11': { mode: 'figma_grid', variant: 'responsive', title: 'Адаптивный переключатель @media (Mobile-First)', goal: 'Переключите экран на 375px и уберите горизонтальное переполнение сетки.' },
      'it-12': { mode: 'web_export', variant: 'lighthouse', title: 'Предрелизный аудит Lighthouse', goal: 'Оптимизируйте вес медиа и включите отложенную загрузку для оценки 95+.' },

      'graphic_design-1': { mode: 'design_studio', variant: 'thirds', title: 'Сетка третей и оптический баланс', goal: 'Разместите главный фокус композиции на узле пересечения третей.' },
      'graphic_design-2': { mode: 'design_studio', variant: 'cmyk', title: 'Симулятор профилей RGB vs CMYK', goal: 'Переключите макет в CMYK и выберите безопасный тиражный оттенок без провала яркости.' },
      'graphic_design-3': { mode: 'design_studio', variant: 'typo', title: 'Лаборатория типографики и интерлиньяжа', goal: 'Настройте line-height (1.4) и трекинг так, чтобы текст читался легко.' },
      'graphic_design-4': { mode: 'design_prepress', variant: 'pathfinder', title: 'Булевы операции Pathfinder', goal: 'Объедините и вырежьте векторные контуры для чистого знака.' },
      'graphic_design-5': { mode: 'design_prepress', variant: 'clearspace', title: 'Контроль охранного поля логотипа (X)', goal: 'Увеличьте безопасный отступ до 1X, чтобы текст не задевал логотип.' },
      'graphic_design-6': { mode: 'design_prepress', variant: 'baseline', title: 'Базовая сетка многостраничного разворота', goal: 'Включите привязку строк к Baseline Grid и выровняйте колонки.' },
      'graphic_design-7': { mode: 'design_studio', variant: 'mask', title: 'Неразрушающая ретушь: Маска слоя vs Ластик', goal: 'Переключите режим на Layer Mask и проверьте слайдер «До / После».' },
      'graphic_design-9': { mode: 'design_prepress', variant: 'bleed', title: 'Prepress-инспектор (300 dpi + Bleed 3 мм)', goal: 'Устраните 3 типографские ошибки до отправки PDF/X-1a в печать.' },
      'graphic_design-10': { mode: 'design_prepress', variant: 'clearspace', title: 'Проверка носителей айдентики бренда', goal: 'Подтвердите единую сетку и охранное поле на визитке и бланке.' },
      'graphic_design-11': { mode: 'design_prepress', variant: 'smm', title: 'Ресайз-система SMM (1:1 → 9:16 Stories)', goal: 'Сдвиньте текст из «слепой зоны» интерфейса Reels/Stories.' },
      'graphic_design-12': { mode: 'design_prepress', variant: 'bleed', title: 'Финальный чек-лист дизайн-системы', goal: 'Проверьте все параметры спецификации для передачи заказчику.' },

      'autoelectric-1': { mode: 'elec_circuit', variant: 'vdrop', title: 'Замер падения напряжения (Voltage Drop)', goal: 'Подключите щупы к цепи с окислением, найдите потерю > 0.5 В и зачистите контакт.' },
      'autoelectric-2': { mode: 'elec_circuit', variant: 'parasitic', title: 'Поиск паразитной утечки тока АКБ', goal: 'По очереди отключайте предохранители, пока ток покоя не упадёт до ≤ 0.03 А.' },
      'autoelectric-4': { mode: 'elec_circuit', variant: 'charging', title: 'Стенд проверки 3-фазного генератора', goal: 'Замерьте напряжение на клеммах АКБ под нагрузкой и выявите пробитый диод.' },
      'autoelectric-5': { mode: 'elec_circuit', variant: 'relay', title: 'Интерактивная схема реле DIN 72552 (30/85/86/87)', goal: 'Подайте управление на 85–86 и проверьте замыкание силовой линии 30–87.' },
      'autoelectric-6': { mode: 'elec_scope', variant: 'obd', title: 'Диагностический сканер OBD-II (DTC + Live Data)', goal: 'Считайте код P0171, проверьте топливные коррекции STFT/LTFT и выберите причину.' },
      'autoelectric-7': { mode: 'elec_scope', variant: 'osc', title: 'Мотор-тестер и осциллограмма ДПКВ / Лямбда', goal: 'Переключите каналы осциллографа и найдите пропуск/сбой импульса датчика.' },
      'autoelectric-9': { mode: 'elec_circuit', variant: 'pwm', title: 'ШИМ-управление LED-оптикой от блока BCM', goal: 'Измените скважность PWM и проверьте стабильность сигнала без перегрева.' },
      'autoelectric-10': { mode: 'elec_circuit', variant: 'short', title: 'Поиск скрытого КЗ контрольной лампой', goal: 'Отключите проблемный жгут, чтобы контрольная лампа погасла.' },
      'autoelectric-11': { mode: 'elec_scope', variant: 'abs', title: 'Сравнение датчиков скорости колёс ABS/ESP', goal: 'Выявите колесо с потерянным импульсом на осциллограмме.' },
      'autoelectric-12': { mode: 'elec_scope', variant: 'obd', title: 'Комплексная дефектовка ЭБУ и цепей', goal: 'Соберите показания сканера и подтвердите диагноз в протоколе.' },

      'hvac-2': { mode: 'hvac_bench', variant: 'oil', title: 'Подбор пары: Хладагент + Масло', goal: 'Подберите совместимое масло (POE / Минеральное) для R600a и R134a.' },
      'hvac-3': { mode: 'hvac_bench', variant: 'superheat', title: 'Манометрический коллектор и расчёт Superheat', goal: 'Отрегулируйте давление и температуру трубки так, чтобы перегрев попал в норму 5–8 K.' },
      'hvac-4': { mode: 'hvac_diag', variant: 'csr', title: 'Прозвонка обмоток компрессора C, S, R', goal: 'Замерьте сопротивление пар контактов и определите клеммы Common, Start, Run.' },
      'hvac-5': { mode: 'hvac_diag', variant: 'brazing', title: 'Пайка меди с защитой сухим азотом', goal: 'Включите поддув азота и выставьте нейтральное пламя, чтобы избежать окалины.' },
      'hvac-6': { mode: 'hvac_diag', variant: 'leak', title: 'Опрессовка контура и поиск утечки', goal: 'Подайте сухой азот и проинспектируйте стыки на микроутечку.' },
      'hvac-7': { mode: 'hvac_bench', variant: 'vacuum', title: 'Глубокое вакуумирование до < 500 микрон', goal: 'Запустите 2-ступенчатый насос и доведите глубину вакуума до нормы.' },
      'hvac-8': { mode: 'hvac_bench', variant: 'scale', title: 'Точная заправка хладагента по весам', goal: 'Отмерьте точную заводскую дозу фреона (145 г) без перезаправки.' },
      'hvac-9': { mode: 'hvac_diag', variant: 'nofrost', title: 'Поиск обрыва в схеме оттайки No Frost', goal: 'Прозвоните таймер, дефрост-биметалл и ТЭН оттайки.' },
      'hvac-10': { mode: 'hvac_bench', variant: 'superheat', title: 'Пусконаладка торговой витрины', goal: 'Выведите контур витрины на стабильный перегрев 5–8 K.' },
      'hvac-11': { mode: 'hvac_diag', variant: 'bldc', title: 'Тест инверторного компрессора BLDC (U-V-W)', goal: 'Проверьте симметрию фазных обмоток и ШИМ-сигнал платы.' },
      'hvac-12': { mode: 'hvac_bench', variant: 'vacuum', title: 'Выходной контроль холодильной камеры', goal: 'Подтвердите вакуум, давление и перегрев для паспорта ГТО.' },

      'automechanic-2': { mode: 'mech_bench', variant: 'grm', title: 'Совмещение меток ГРМ и замер зазора щупом', goal: 'Выставьте распредвал по метке ВМТ и подберите щуп 0.25 мм.' },
      'automechanic-3': { mode: 'mech_bench', variant: 'micrometer', title: 'Измерение микрометром и допуск ЦПГ', goal: 'Снимите показание микрометра и определите износ шейки коленвала.' },
      'automechanic-4': { mode: 'mech_bench', variant: 'oil_cool', title: 'Тест давления масла и рефрактометр антифриза', goal: 'Проверьте давление на прогретом ДВС и температуру кристаллизации -40 °C.' },
      'automechanic-5': { mode: 'mech_bench', variant: 'torque', title: 'Затяжка корзины сцепления / ГБЦ по схеме', goal: 'Протяните крепёж по диагональной/спиральной схеме без перекоса.' },
      'automechanic-6': { mode: 'mech_bench', variant: 'suspension', title: 'Дефектовка ходовой части и люфта ИЧ-10', goal: 'Проинспектируйте узлы подвески и найдите деталь с критическим люфтом.' },
      'automechanic-7': { mode: 'mech_bench', variant: 'alignment', title: '3D Сход-развал: Camber / Caster / Toe', goal: 'Отрегулируйте углы колёс в зелёную зону для равномерного износа шин.' },
      'automechanic-8': { mode: 'mech_bench', variant: 'brakes', title: 'Замер биения диска и порядок прокачки ABS', goal: 'Укажите правильную последовательность прокачки от самого дальнего колеса.' },
      'automechanic-9': { mode: 'mech_bench', variant: 'balance', title: 'Балансировка колеса (Статика + Динамика)', goal: 'Установите балансировочные грузы для обнуления дисбаланса (0 г / 0 г).' },
      'automechanic-10': { mode: 'mech_bench', variant: 'torque', title: 'Контрольная протяжка узлов по ТО-2', goal: 'Выполните затяжку узлов в строгом порядке момента.' },
      'automechanic-11': { mode: 'mech_bench', variant: 'alignment', title: 'Проверка люфта рулевой рейки и схождения', goal: 'Устраните увод руля и зафиксируйте схождение в допуске.' },
      'automechanic-12': { mode: 'mech_bench', variant: 'oil_cool', title: 'Финальный пост диагностики ОТК', goal: 'Проведите финальные замеры и подтвердите выпуск автомобиля.' },
    };
    return map[key] || null;
  }

  function renderSortableSequence(container, block, spec, onComplete) {
    const rawSteps = block.steps || [];
    const correctOrder = rawSteps.map((text, idx) => ({ id: idx, text: String(text).replace(/^(Шаг\s*\d+\.|\d+\.)\s*/i, '').trim() }));
    // Deterministic shuffle so step 1 isn't already first
    let currentOrder = [...correctOrder];
    if (currentOrder.length >= 3) {
      currentOrder = [currentOrder[1], currentOrder[currentOrder.length - 1], currentOrder[0], ...currentOrder.slice(2, -1)];
    } else if (currentOrder.length === 2) {
      currentOrder = [currentOrder[1], currentOrder[0]];
    }

    let attempts = 0;

    function draw() {
      const rows = currentOrder.map((item, pos) => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
            <span style="width:28px;height:28px;border-radius:9px;background:rgba(99,102,241,0.22);color:#a5b4fc;font-weight:800;font-family:monospace;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${pos + 1}</span>
            <span style="font-size:13px;font-weight:600;color:#f8fafc;line-height:1.4;">${item.text}</span>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button type="button" data-move="up" data-idx="${pos}" ${pos === 0 ? 'disabled' : ''} style="min-width:34px;min-height:34px;border-radius:9px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.08);color:#fff;font-weight:700;cursor:pointer;opacity:${pos === 0 ? 0.35 : 1};">↑</button>
            <button type="button" data-move="down" data-idx="${pos}" ${pos === currentOrder.length - 1 ? 'disabled' : ''} style="min-width:34px;min-height:34px;border-radius:9px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.08);color:#fff;font-weight:700;cursor:pointer;opacity:${pos === currentOrder.length - 1 ? 0.35 : 1};">↓</button>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="space-y-5 animate-fade-in">
          <div>
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Интерактивный практикум · Собери алгоритм</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-3">${block.title || 'Восстановите правильный порядок'}</h2>
            <p class="text-xs text-slate-300 mt-1">Расставьте этапы технологического процесса от первого к последнему кнопками ↑ / ↓ и проверьте себя.</p>
          </div>
          <div class="bg-dark-850/80 p-5 sm:p-6 rounded-3xl border border-white/10 space-y-3">
            ${rows}
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding-top:10px;">
              <span id="seq-status" style="font-size:12px;color:#94a3b8;font-weight:600;">Нажмите «Проверить порядок», когда будете готовы.</span>
              <button type="button" id="seq-check-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-glow-indigo transition-all">Проверить порядок</button>
            </div>
          </div>
          <div id="seq-mentor-box"></div>
        </div>
      `;

      container.querySelectorAll('[data-move]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.idx);
          const dir = btn.dataset.move === 'up' ? -1 : 1;
          const j = i + dir;
          if (j < 0 || j >= currentOrder.length) return;
          const tmp = currentOrder[i];
          currentOrder[i] = currentOrder[j];
          currentOrder[j] = tmp;
          draw();
        });
      });

      container.querySelector('#seq-check-btn').addEventListener('click', () => {
        attempts++;
        const matches = currentOrder.filter((item, idx) => item.id === idx).length;
        const st = container.querySelector('#seq-status');
        const mBox = container.querySelector('#seq-mentor-box');
        if (matches === currentOrder.length) {
          const bonus = attempts === 1 ? 15 : 5;
          st.textContent = `✓ Идеально! Все ${matches} шагов в верном порядке (+${bonus} бонус XP).`;
          st.style.color = '#34d399';
          mBox.innerHTML = mentorCard(spec, `Отличная работа! Чёткая последовательность действий экономит время и исключает брак на объекте.`, 'ok');
          onComplete({ sequence_solved: true, bonus_xp: bonus, attempts });
        } else {
          st.textContent = `Совпадает ${matches} из ${currentOrder.length} позиций. Поменяйте шаги местами и проверьте ещё раз.`;
          st.style.color = '#fbbf24';
          mBox.innerHTML = mentorCard(spec, `Подсказка: всегда начинайте с подготовки и базового замера, а фиксацию отчёта оставляйте в конце.`, 'warn');
        }
      });
    }

    draw();
  }

  function renderTopicLab(container, lesson, block, onComplete) {
    const spec = lesson.course_slug || 'it';
    const num = Number(lesson.order_num || 1);
    const cfg = getTopicConfig(spec, num);
    if (!cfg) return false;

    const headerHtml = `
      <div class="space-y-5 animate-fade-in">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Живой тренажёр по теме урока
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white mt-3">${cfg.title}</h2>
            <p class="text-xs sm:text-sm text-slate-300 mt-1">🎯 Задача: ${cfg.goal}</p>
          </div>
          <div id="lab-combo-pill" class="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
            Бонус за выполнение: +15 XP
          </div>
        </div>
        <div id="lab-workspace" class="bg-dark-850/85 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4"></div>
        <div id="lab-mentor-feedback">${mentorCard(spec, 'Покрутите настройки тренажёра и доведите параметры до эталона. Результат засчитается автоматически!')}</div>
      </div>
    `;
    container.innerHTML = headerHtml;

    const ws = container.querySelector('#lab-workspace');
    const mentorBox = container.querySelector('#lab-mentor-feedback');
    let completed = false;

    function markSolved(msg, state) {
      if (!completed) {
        completed = true;
        const pill = container.querySelector('#lab-combo-pill');
        if (pill) {
          pill.textContent = '✓ Тренажёр пройден (+15 XP)';
          pill.className = 'px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono';
        }
        onComplete({ lab_mode: cfg.mode, bonus_xp: 15, ...state });
      }
      mentorBox.innerHTML = mentorCard(spec, msg, 'ok');
    }

    function warnMentor(msg) {
      mentorBox.innerHTML = mentorCard(spec, msg, 'warn');
    }

    // 1. WEB EXPORT & SVG / LIGHTHOUSE LAB
    if (cfg.mode === 'web_export') {
      let fmt = 'png';
      let ppi = 300;
      let qual = 95;
      function update() {
        const isSvg = cfg.variant === 'svg';
        const kb = isSvg
          ? (fmt === 'svg' ? 2 : Math.round(qual * 1.9 + 40))
          : Math.round((ppi === 300 ? 18 : 1.8) * (fmt === 'png' ? 210 : fmt === 'jpg' ? qual * 1.4 : qual * 0.72));
        const ok = isSvg ? fmt === 'svg' : (ppi === 72 && fmt === 'webp' && kb <= 150);
        ws.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;align-items:center;">
            <div style="space-y:12px;display:flex;flex-direction:column;gap:12px;">
              <div>
                <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;">Формат экспорта</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${(isSvg ? [['png', 'Растр PNG'], ['svg', 'Вектор SVG']] : [['png', 'PNG-24'], ['jpg', 'JPG'], ['webp', 'WebP']]).map(([id, lbl]) => `
                    <button type="button" data-fmt="${id}" style="padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid ${fmt === id ? '#818cf8' : 'rgba(255,255,255,0.14)'};background:${fmt === id ? '#4f46e5' : 'rgba(255,255,255,0.06)'};color:#fff;cursor:pointer;">${lbl}</button>
                  `).join('')}
                </div>
              </div>
              ${isSvg ? '' : `
              <div>
                <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;">Плотность пикселей (PPI)</div>
                <div style="display:flex;gap:8px;">
                  <button type="button" data-ppi="300" style="padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid ${ppi === 300 ? '#f87171' : 'rgba(255,255,255,0.14)'};background:${ppi === 300 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'};color:#fff;cursor:pointer;">300 ppi (Печать)</button>
                  <button type="button" data-ppi="72" style="padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;border:1px solid ${ppi === 72 ? '#34d399' : 'rgba(255,255,255,0.14)'};background:${ppi === 72 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'};color:#fff;cursor:pointer;">72 ppi (Экран)</button>
                </div>
              </div>
              <div>
                <label style="font-size:11px;font-weight:700;color:#94a3b8;display:block;margin-bottom:4px;">Качество сжатия: <strong style="color:#38bdf8">${qual}%</strong></label>
                <input id="lab-qual" type="range" min="40" max="100" value="${qual}" style="width:100%;accent-color:#6366f1;cursor:pointer;">
              </div>`}
            </div>
            <div style="padding:20px;border-radius:18px;background:#0f172a;border:1px solid ${ok ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.4)'};text-align:center;">
              <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Итоговый вес файла</div>
              <div style="font-size:36px;font-weight:900;font-family:monospace;color:${ok ? '#34d399' : '#f87171'};margin:8px 0;">${kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB'}</div>
              <div style="font-size:12px;color:#cbd5e1;">${ok ? '✓ Идеально для быстрой загрузки веба!' : isSvg ? 'При зуме 400% растр даёт лесенку пикселей' : 'Для веба нужен 72 ppi и формат WebP ≤ 150 КБ'}</div>
            </div>
          </div>
        `;
        ws.querySelectorAll('[data-fmt]').forEach(b => b.addEventListener('click', () => { fmt = b.dataset.fmt; update(); }));
        ws.querySelectorAll('[data-ppi]').forEach(b => b.addEventListener('click', () => { ppi = Number(b.dataset.ppi); update(); }));
        ws.querySelector('#lab-qual')?.addEventListener('input', e => { qual = Number(e.target.value); update(); });
        if (ok) {
          markSolved(isSvg ? 'Отлично! Векторный SVG весит 2 КБ и остаётся бритвенно-чётким на 4K-экранах.' : `Супер! Баннер в WebP (72 ppi) весит всего ${kb} КБ и загружается мгновенно.`, { fmt, ppi, kb });
        } else if (ppi === 300 && !isSvg) {
          warnMentor('300 ppi — это стандарт для типографии. Для сайта переключите на 72 ppi и выберите современный формат WebP.');
        }
      }
      update();
      return true;
    }

    // 2. FIGMA GRID / AUTO LAYOUT / VARIANTS / RESPONSIVE LAB
    if (cfg.mode === 'figma_grid') {
      let pad = cfg.variant === 'grid8' ? 13 : 10;
      let gap = 11;
      let mobile = false;
      let stateName = 'Default';
      function update() {
        const ok = cfg.variant === 'responsive' ? mobile : (cfg.variant === 'variants' ? stateName === 'Hover' : (pad % 8 === 0 && gap % 8 === 0));
        ws.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;align-items:center;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${cfg.variant === 'responsive' ? `
                <div style="font-size:12px;font-weight:700;color:#cbd5e1;">Ширина экрана (@media)</div>
                <div style="display:flex;gap:8px;">
                  <button type="button" data-mob="0" style="padding:8px 14px;border-radius:10px;border:1px solid ${!mobile ? '#818cf8' : 'rgba(255,255,255,0.14)'};background:${!mobile ? '#4f46e5' : 'rgba(255,255,255,0.06)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Desktop 1280px</button>
                  <button type="button" data-mob="1" style="padding:8px 14px;border-radius:10px;border:1px solid ${mobile ? '#34d399' : 'rgba(255,255,255,0.14)'};background:${mobile ? '#059669' : 'rgba(255,255,255,0.06)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Mobile 375px</button>
                </div>
              ` : cfg.variant === 'variants' ? `
                <div style="font-size:12px;font-weight:700;color:#cbd5e1;">Вариант состояния компонента</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${['Default', 'Hover', 'Disabled'].map(st => `
                    <button type="button" data-st="${st}" style="padding:8px 14px;border-radius:10px;border:1px solid ${stateName === st ? '#818cf8' : 'rgba(255,255,255,0.14)'};background:${stateName === st ? '#4f46e5' : 'rgba(255,255,255,0.06)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;">${st}</button>
                  `).join('')}
                </div>
              ` : `
                <div>
                  <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;">Padding (шаг 8px): <strong style="color:${pad % 8 === 0 ? '#34d399' : '#f87171'}">${pad}px</strong></div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${[13, 8, 16, 24].map(v => `<button type="button" data-pad="${v}" style="padding:7px 12px;border-radius:9px;border:1px solid ${pad === v ? '#38bdf8' : 'rgba(255,255,255,0.14)'};background:${pad === v ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.06)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;">${v}px</button>`).join('')}
                  </div>
                </div>
                <div>
                  <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;">Gap между элементами: <strong style="color:${gap % 8 === 0 ? '#34d399' : '#f87171'}">${gap}px</strong></div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${[11, 8, 16, 24].map(v => `<button type="button" data-gap="${v}" style="padding:7px 12px;border-radius:9px;border:1px solid ${gap === v ? '#38bdf8' : 'rgba(255,255,255,0.14)'};background:${gap === v ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.06)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;">${v}px</button>`).join('')}
                  </div>
                </div>
              `}
            </div>
            <div style="padding:18px;border-radius:16px;background:#0f172a;border:1px solid ${ok ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'};">
              <div style="font-size:10px;color:#94a3b8;font-family:monospace;margin-bottom:10px;">FIGMA LIVE FRAME</div>
              <div style="display:flex;flex-direction:${mobile ? 'column' : 'row'};gap:${gap}px;padding:${pad}px;border-radius:12px;background:#1e293b;border:1px dashed ${ok ? '#34d399' : '#f59e0b'};transition:all 0.2s;">
                <div style="padding:10px 14px;border-radius:8px;background:${stateName === 'Hover' ? '#6366f1' : stateName === 'Disabled' ? '#334155' : '#4f46e5'};color:#fff;font-size:12px;font-weight:700;opacity:${stateName === 'Disabled' ? 0.5 : 1};">Кнопка CTA</div>
                <div style="padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.08);color:#e2e8f0;font-size:12px;font-weight:600;">Блок B</div>
              </div>
            </div>
          </div>
        `;
        ws.querySelectorAll('[data-pad]').forEach(b => b.addEventListener('click', () => { pad = Number(b.dataset.pad); update(); }));
        ws.querySelectorAll('[data-gap]').forEach(b => b.addEventListener('click', () => { gap = Number(b.dataset.gap); update(); }));
        ws.querySelectorAll('[data-mob]').forEach(b => b.addEventListener('click', () => { mobile = b.dataset.mob === '1'; update(); }));
        ws.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { stateName = b.dataset.st; update(); }));
        if (ok) {
          markSolved('Отлично! Отступы кратны 8px, и макет держит идеальный ритм на экране.', { pad, gap, mobile, stateName });
        }
      }
      update();
      return true;
    }

    // 3. WEB CODE LIVE SANDBOX (HTML / FLEXBOX / JS CLICK)
    if (cfg.mode === 'web_code') {
      let justify = 'flex-start';
      let flexOn = false;
      let jsClicks = 0;
      let semantic = false;
      function update() {
        const isJs = cfg.variant === 'js_click';
        const isHtml = cfg.variant === 'html';
        const ok = isJs ? jsClicks >= 2 : isHtml ? semantic : (flexOn && justify === 'space-between');
        ws.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;align-items:center;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${isJs ? `
                <div style="font-family:monospace;font-size:12px;padding:12px;border-radius:12px;background:#0f172a;color:#a5b4fc;border:1px solid rgba(255,255,255,0.1);">
                  btn.addEventListener('click', () => {<br/>&nbsp;&nbsp;count++; // кликов: ${jsClicks}<br/>});
                </div>
                <button type="button" id="lab-js-btn" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-glow-indigo">Кликни меня 2 раза (${jsClicks}/2)</button>
              ` : isHtml ? `
                <div style="font-size:12px;color:#cbd5e1;font-weight:700;">Выберите правильную разметку карточки:</div>
                <button type="button" id="lab-html-bad" style="padding:10px;border-radius:10px;text-align:left;font-family:monospace;font-size:11px;border:1px solid ${!semantic ? '#f87171' : 'rgba(255,255,255,0.1)'};background:rgba(255,255,255,0.05);color:#fca5a5;cursor:pointer;">&lt;div&gt;Заголовок&lt;/div&gt; &lt;div&gt;Купить&lt;/div&gt;</button>
                <button type="button" id="lab-html-good" style="padding:10px;border-radius:10px;text-align:left;font-family:monospace;font-size:11px;border:1px solid ${semantic ? '#34d399' : 'rgba(255,255,255,0.1)'};background:rgba(16,185,129,0.12);color:#6ee7b7;cursor:pointer;">&lt;h1&gt;Заголовок&lt;/h1&gt; &lt;button&gt;Купить&lt;/button&gt;</button>
              ` : `
                <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#fff;cursor:pointer;">
                  <input type="checkbox" id="lab-flex-on" ${flexOn ? 'checked' : ''} style="width:16px;height:16px;accent-color:#6366f1;"> Включить display: flex
                </label>
                <div>
                  <div style="font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:6px;">justify-content:</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${['flex-start', 'center', 'space-between'].map(j => `
                      <button type="button" data-j="${j}" style="padding:7px 11px;border-radius:9px;font-family:monospace;font-size:11px;border:1px solid ${justify === j ? '#38bdf8' : 'rgba(255,255,255,0.14)'};background:${justify === j ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)'};color:#fff;cursor:pointer;">${j}</button>
                    `).join('')}
                  </div>
                </div>
              `}
            </div>
            <div style="padding:18px;border-radius:16px;background:#0f172a;border:1px solid ${ok ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'};">
              <div style="font-size:10px;color:#94a3b8;font-family:monospace;margin-bottom:10px;">HEADER PREVIEW</div>
              <div style="display:${flexOn ? 'flex' : 'block'};justify-content:${justify};align-items:center;gap:10px;padding:12px;border-radius:12px;background:#1e293b;">
                <span style="display:inline-block;padding:6px 10px;border-radius:8px;background:#4f46e5;color:#fff;font-size:11px;font-weight:800;">LOGO</span>
                <span style="display:inline-block;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.1);color:#e2e8f0;font-size:11px;">Курсы · Практика</span>
              </div>
              <div style="font-size:11px;color:${ok ? '#34d399' : '#94a3b8'};margin-top:10px;">${ok ? '✓ Структура и выравнивание настроены верно!' : 'Настройте параметры слева и посмотрите результат.'}</div>
            </div>
          </div>
        `;
        ws.querySelector('#lab-js-btn')?.addEventListener('click', () => { jsClicks++; update(); });
        ws.querySelector('#lab-html-bad')?.addEventListener('click', () => { semantic = false; warnMentor('<div> не сообщает браузеру и скринридеру, что это заголовок или кнопка.'); update(); });
        ws.querySelector('#lab-html-good')?.addEventListener('click', () => { semantic = true; update(); });
        ws.querySelector('#lab-flex-on')?.addEventListener('change', e => { flexOn = e.target.checked; update(); });
        ws.querySelectorAll('[data-j]').forEach(b => b.addEventListener('click', () => { justify = b.dataset.j; update(); }));
        if (ok) markSolved('Отлично! Код и живой превью-блок работают синхронно без ошибок.', { flexOn, justify, jsClicks, semantic });
      }
      update();
      return true;
    }

    // 4. GRAPHIC DESIGN STUDIO & PREPRESS
    if (cfg.mode === 'design_studio' || cfg.mode === 'design_prepress') {
      let cmykMode = false;
      let bleedOn = false;
      let dpi300 = false;
      let lineHeight = 1.0;
      let focusNode = 'center';
      function update() {
        const v = cfg.variant;
        const ok = v === 'cmyk' ? cmykMode : v === 'typo' ? lineHeight >= 1.35 : v === 'thirds' ? focusNode === 'third' : (bleedOn && dpi300);
        ws.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;align-items:center;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${v === 'cmyk' ? `
                <button type="button" id="lab-rgb" style="padding:10px;border-radius:10px;border:1px solid ${!cmykMode ? '#f87171' : 'rgba(255,255,255,0.12)'};background:rgba(255,255,255,0.06);color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Экранный RGB (#00FFAA)</button>
                <button type="button" id="lab-cmyk" style="padding:10px;border-radius:10px;border:1px solid ${cmykMode ? '#34d399' : 'rgba(255,255,255,0.12)'};background:rgba(16,185,129,0.14);color:#6ee7b7;font-size:12px;font-weight:700;cursor:pointer;">Печатный CMYK (C75 M0 Y50 K0)</button>
              ` : v === 'typo' ? `
                <label style="font-size:12px;font-weight:700;color:#cbd5e1;">Интерлиньяж (line-height): <strong style="color:#38bdf8">${lineHeight.toFixed(1)}</strong></label>
                <input id="lab-lh" type="range" min="0.9" max="1.8" step="0.1" value="${lineHeight}" style="width:100%;accent-color:#a855f7;">
              ` : v === 'thirds' ? `
                <div style="font-size:12px;font-weight:700;color:#cbd5e1;">Позиция главного акцента:</div>
                <div style="display:flex;gap:8px;">
                  <button type="button" id="lab-pos-c" style="padding:8px 12px;border-radius:10px;border:1px solid ${focusNode === 'center' ? '#f87171' : 'rgba(255,255,255,0.14)'};background:rgba(255,255,255,0.06);color:#fff;font-size:12px;cursor:pointer;">Строго в центре</button>
                  <button type="button" id="lab-pos-t" style="padding:8px 12px;border-radius:10px;border:1px solid ${focusNode === 'third' ? '#34d399' : 'rgba(255,255,255,0.14)'};background:rgba(16,185,129,0.14);color:#6ee7b7;font-size:12px;cursor:pointer;">Узел правила третей (1/3)</button>
                </div>
              ` : `
                <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#fff;cursor:pointer;">
                  <input type="checkbox" id="lab-bleed" ${bleedOn ? 'checked' : ''} style="width:16px;height:16px;accent-color:#10b981;"> Добавить вылеты / отступ (Bleed 3 мм / Clear Space X)
                </label>
                <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#fff;cursor:pointer;">
                  <input type="checkbox" id="lab-dpi" ${dpi300 ? 'checked' : ''} style="width:16px;height:16px;accent-color:#10b981;"> Подтвердить 300 dpi и безопасные зоны
                </label>
              `}
            </div>
            <div style="padding:20px;border-radius:16px;background:#0f172a;border:2px ${bleedOn ? 'solid' : 'dashed'} ${ok ? '#34d399' : '#f59e0b'};position:relative;min-height:140px;display:flex;flex-direction:column;justify-content:center;">
              <div style="font-size:15px;font-weight:800;color:${cmykMode ? '#2dd4bf' : (v === 'cmyk' ? '#00ffaa' : '#fff')};line-height:${lineHeight};text-align:${focusNode === 'third' ? 'left' : 'center'};">
                ${v === 'typo' ? 'Типографика управляет вниманием читателя — дайте строкам воздух!' : 'Макет дизайна • АМК SkillHub'}
              </div>
              <div style="font-size:11px;color:${ok ? '#34d399' : '#94a3b8'};margin-top:8px;text-align:${focusNode === 'third' ? 'left' : 'center'};">
                ${ok ? '✓ Параметры соответствуют стандарту дизайн-студии' : 'Отрегулируйте макет до зелёного статуса слева'}
              </div>
            </div>
          </div>
        `;
        ws.querySelector('#lab-rgb')?.addEventListener('click', () => { cmykMode = false; warnMentor('Неоновый RGB на бумаге превратится в грязно-бирюзовый — нужен профиль CMYK.'); update(); });
        ws.querySelector('#lab-cmyk')?.addEventListener('click', () => { cmykMode = true; update(); });
        ws.querySelector('#lab-lh')?.addEventListener('input', e => { lineHeight = Number(e.target.value); update(); });
        ws.querySelector('#lab-pos-c')?.addEventListener('click', () => { focusNode = 'center'; update(); });
        ws.querySelector('#lab-pos-t')?.addEventListener('click', () => { focusNode = 'third'; update(); });
        ws.querySelector('#lab-bleed')?.addEventListener('change', e => { bleedOn = e.target.checked; update(); });
        ws.querySelector('#lab-dpi')?.addEventListener('change', e => { dpi300 = e.target.checked; update(); });
        if (ok) markSolved('Прекрасно! Макет выверен по композиции, цвету и требованиям печати.', { cmykMode, bleedOn, dpi300, lineHeight, focusNode });
      }
      update();
      return true;
    }

    // 5. AUTOELECTRIC CIRCUIT / FLUKE / OSCILLOSCOPE / OBD LAB
    if (cfg.mode === 'elec_circuit' || cfg.mode === 'elec_scope') {
      let fuseFixed = false;
      let activePoint = 'BAT_POS';
      let selectedChannel = 'ckp';
      function update() {
        if (cfg.mode === 'elec_scope') {
          const ok = selectedChannel === 'fault';
          const info = selectedChannel === 'ckp' ? 'ДПКВ: ровный импульс 58+2 зуба (Норма)' : selectedChannel === 'can' ? 'CAN-H / CAN-L: 2.5В ± 1В, 60 Ω (Норма)' : 'ДМРВ / Колесо: провал сигнала! Найден сбой (P0171 / обрыв).';
          ws.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="font-size:11px;font-weight:700;color:#94a3b8;">Канал осциллографа / сканера</div>
                <button type="button" data-ch="ckp" style="padding:10px;border-radius:10px;text-align:left;border:1px solid ${selectedChannel === 'ckp' ? '#38bdf8' : 'rgba(255,255,255,0.12)'};background:rgba(255,255,255,0.05);color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Канал 1: ДПКВ (Коленвал)</button>
                <button type="button" data-ch="can" style="padding:10px;border-radius:10px;text-align:left;border:1px solid ${selectedChannel === 'can' ? '#38bdf8' : 'rgba(255,255,255,0.12)'};background:rgba(255,255,255,0.05);color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Канал 2: Шина CAN / Live Data</button>
                <button type="button" data-ch="fault" style="padding:10px;border-radius:10px;text-align:left;border:1px solid ${selectedChannel === 'fault' ? '#34d399' : 'rgba(245,158,11,0.35)'};background:rgba(245,158,11,0.12);color:#fde68a;font-size:12px;font-weight:700;cursor:pointer;">Канал 3: Проблемный датчик / Код DTC</button>
              </div>
              <div style="padding:18px;border-radius:16px;background:#09131c;border:1px solid ${ok ? '#34d399' : '#38bdf8'};font-family:monospace;">
                <div style="font-size:10px;color:#38bdf8;">MOTOR-TESTER • LIVE WAVEFORM</div>
                <div style="margin:14px 0;height:56px;display:flex;align-items:center;gap:4px;">
                  ${Array.from({ length: 18 }, (_, i) => {
                    const h = (selectedChannel === 'fault' && i > 10 && i < 15) ? 6 : (i % 2 === 0 ? 44 : 14);
                    const c = (selectedChannel === 'fault' && i > 10 && i < 15) ? '#f87171' : '#34d399';
                    return `<div style="flex:1;height:${h}px;background:${c};border-radius:3px;"></div>`;
                  }).join('')}
                </div>
                <div style="font-size:12px;color:${ok ? '#34d399' : '#cbd5e1'};">${info}</div>
              </div>
            </div>
          `;
          ws.querySelectorAll('[data-ch]').forEach(b => b.addEventListener('click', () => { selectedChannel = b.dataset.ch; update(); }));
          if (ok) markSolved('Точно в цель! На осциллограмме явно виден провал импульса и сбой коррекций.', { selectedChannel });
          return;
        }

        const reading = fuseFixed ? (activePoint === 'BAD_NODE' ? '0.12 V (Потери в норме)' : '12.60 V · Ток покоя 0.02 A') : (activePoint === 'BAD_NODE' ? '2.45 V ΔU (ОКИСЛЕНИЕ / УТЕЧКА 0.85 A!)' : '12.60 V (Клемма АКБ)');
        ws.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;align-items:center;">
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;">Точки подключения щупов мультиметра</div>
              <button type="button" data-pt="BAT_POS" style="padding:9px 12px;border-radius:10px;text-align:left;border:1px solid ${activePoint === 'BAT_POS' ? '#38bdf8' : 'rgba(255,255,255,0.12)'};background:rgba(255,255,255,0.05);color:#fff;font-size:12px;font-weight:700;cursor:pointer;">1. Проверить клемму (+) АКБ</button>
              <button type="button" data-pt="BAD_NODE" style="padding:9px 12px;border-radius:10px;text-align:left;border:1px solid ${activePoint === 'BAD_NODE' ? '#fbbf24' : 'rgba(255,255,255,0.12)'};background:rgba(255,255,255,0.05);color:#fff;font-size:12px;font-weight:700;cursor:pointer;">2. Замерить проблемный узел / предохранитель</button>
              <button type="button" id="lab-fix-elec" style="padding:10px 12px;border-radius:10px;border:none;background:${fuseFixed ? '#059669' : '#d97706'};color:#fff;font-size:12px;font-weight:800;cursor:pointer;">${fuseFixed ? '✓ Контакт / Цепь восстановлены' : '🔧 Устранить неисправность в найденном узле'}</button>
            </div>
            <div style="padding:20px;border-radius:16px;background:#0a1820;border:2px solid ${fuseFixed ? '#34d399' : '#f59e0b'};font-family:monospace;text-align:center;">
              <div style="font-size:10px;color:#38bdf8;">FLUKE 87V DIGITAL MULTIMETER</div>
              <div style="font-size:20px;font-weight:900;color:${fuseFixed ? '#34d399' : (activePoint === 'BAD_NODE' ? '#f87171' : '#38bdf8')};margin:12px 0;">${reading}</div>
              <div style="font-size:11px;color:#94a3b8;">${fuseFixed ? 'Все параметры цепи в заводском допуске.' : 'Сначала найдите точку падения/утечки, затем устраните дефект.'}</div>
            </div>
          </div>
        `;
        ws.querySelectorAll('[data-pt]').forEach(b => b.addEventListener('click', () => { activePoint = b.dataset.pt; update(); }));
        ws.querySelector('#lab-fix-elec')?.addEventListener('click', () => { fuseFixed = true; update(); });
        if (fuseFixed) markSolved('Отлично! Дефект локализован мультиметром и устранён, падение напряжения и ток покоя в норме.', { fuseFixed });
      }
      update();
      return true;
    }

    // 6. HVAC BENCH & DIAGNOSTICS
    if (cfg.mode === 'hvac_bench' || cfg.mode === 'hvac_diag') {
      let pressure = 1.4;
      let pipeTemp = 12.0;
      let fixedDiag = false;
      function update() {
        const tSat = -26.0 + pressure * 10.5;
        const sh = pipeTemp - tSat;
        const ok = cfg.mode === 'hvac_diag' ? fixedDiag : (sh >= 5.0 && sh <= 8.0);
        ws.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;align-items:center;">
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${cfg.mode === 'hvac_diag' ? `
                <div style="font-size:12px;color:#cbd5e1;font-weight:700;">Сервисный стенд: проверка и защита контура</div>
                <button type="button" id="lab-hvac-fix" style="padding:11px 14px;border-radius:12px;border:none;background:${fixedDiag ? '#059669' : '#0284c7'};color:#fff;font-size:12px;font-weight:800;cursor:pointer;">
                  ${fixedDiag ? '✓ Азот подан / Обмотки и цепь проверены' : '🔧 Запустить регламентную проверку / поддув азота'}
                </button>
              ` : `
                <div>
                  <label style="font-size:11px;font-weight:700;color:#94a3b8;display:block;margin-bottom:4px;">Давление всасывания: <strong style="color:#38bdf8">${pressure.toFixed(1)} bar</strong> (T кип: ${tSat.toFixed(1)} °C)</label>
                  <input id="lab-hp" type="range" min="1.0" max="3.2" step="0.1" value="${pressure}" style="width:100%;accent-color:#38bdf8;">
                </div>
                <div>
                  <label style="font-size:11px;font-weight:700;color:#94a3b8;display:block;margin-bottom:4px;">Температура трубки: <strong style="color:#38bdf8">${pipeTemp.toFixed(1)} °C</strong></label>
                  <input id="lab-ht" type="range" min="-6.0" max="15.0" step="0.5" value="${pipeTemp}" style="width:100%;accent-color:#10b981;">
                </div>
              `}
            </div>
            <div style="padding:20px;border-radius:16px;background:#0a1824;border:2px solid ${ok ? '#34d399' : '#f59e0b'};text-align:center;font-family:monospace;">
              <div style="font-size:10px;color:#38bdf8;">${cfg.mode === 'hvac_diag' ? 'СЕРВИСНЫЙ КОНТРОЛЬ' : 'ПЕРЕГРЕВ (SUPERHEAT)'}</div>
              <div style="font-size:32px;font-weight:900;color:${ok ? '#34d399' : (sh < 3 ? '#f87171' : '#fbbf24')};margin:8px 0;">
                ${cfg.mode === 'hvac_diag' ? (fixedDiag ? 'НОРМА 100%' : 'ПРОВЕРКА...') : sh.toFixed(1) + ' K'}
              </div>
              <div style="font-size:11px;color:#cbd5e1;">
                ${cfg.mode === 'hvac_diag' ? (fixedDiag ? 'Шов чистый без окалины, обмотки C-S-R в норме.' : 'Нажмите кнопку запуска регламентной операции слева.') : (ok ? '✓ Зелёная зона (5–8 K): контур сбалансирован!' : sh < 5 ? '⚠️ Слишком низкий (<5 K): риск гидроудара!' : '⚠️ Высокий (>8 K): нехватка фреона. Цель: 5–8 K')}
              </div>
            </div>
          </div>
        `;
        ws.querySelector('#lab-hp')?.addEventListener('input', e => { pressure = Number(e.target.value); update(); });
        ws.querySelector('#lab-ht')?.addEventListener('input', e => { pipeTemp = Number(e.target.value); update(); });
        ws.querySelector('#lab-hvac-fix')?.addEventListener('click', () => { fixedDiag = true; update(); });
        if (ok) markSolved('Отличный замер! Перегрев в зоне 5–8 K, компрессор надёжно защищён от гидроудара.', { pressure, pipeTemp, fixedDiag });
      }
      update();
      return true;
    }

    // 7. AUTOMECHANIC BENCH
    if (cfg.mode === 'mech_bench') {
      let stepDone = 0;
      let val = cfg.variant === 'alignment' ? -2.2 : 0.45;
      function update() {
        const isAlign = cfg.variant === 'alignment';
        const ok = isAlign ? Math.abs(val) <= 0.3 : stepDone >= 3;
        ws.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;align-items:center;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${isAlign ? `
                <label style="font-size:12px;font-weight:700;color:#cbd5e1;">Регулировка угла схождения / развала: <strong style="color:${ok ? '#34d399' : '#fbbf24'}">${val.toFixed(1)}°</strong> (Норма: ±0.3°)</label>
                <input id="lab-mech-ang" type="range" min="-2.5" max="2.5" step="0.1" value="${val}" style="width:100%;accent-color:#f97316;">
              ` : `
                <div style="font-size:12px;font-weight:700;color:#cbd5e1;">Выполните пошагово (${stepDone}/3):</div>
                <button type="button" id="lab-m1" style="padding:9px 12px;border-radius:10px;text-align:left;border:1px solid ${stepDone >= 1 ? '#34d399' : 'rgba(255,255,255,0.14)'};background:${stepDone >= 1 ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;">1. Выставить ВМТ / подготовить инструмент</button>
                <button type="button" id="lab-m2" ${stepDone < 1 ? 'disabled' : ''} style="padding:9px 12px;border-radius:10px;text-align:left;border:1px solid ${stepDone >= 2 ? '#34d399' : 'rgba(255,255,255,0.14)'};background:${stepDone >= 2 ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;opacity:${stepDone < 1 ? 0.4 : 1};">2. Снять контрольный замер по допуску</button>
                <button type="button" id="lab-m3" ${stepDone < 2 ? 'disabled' : ''} style="padding:9px 12px;border-radius:10px;text-align:left;border:1px solid ${stepDone >= 3 ? '#34d399' : 'rgba(255,255,255,0.14)'};background:${stepDone >= 3 ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)'};color:#fff;font-size:12px;font-weight:700;cursor:pointer;opacity:${stepDone < 2 ? 0.4 : 1};">3. Протянуть / зафиксировать в заказ-наряде</button>
              `}
            </div>
            <div style="padding:20px;border-radius:16px;background:#141a24;border:2px solid ${ok ? '#34d399' : '#f97316'};text-align:center;font-family:monospace;">
              <div style="font-size:10px;color:#fb923c;">ПОСТ ДИАГНОСТИКИ АМК</div>
              <div style="font-size:28px;font-weight:900;color:${ok ? '#34d399' : '#fbbf24'};margin:10px 0;">
                ${isAlign ? (ok ? `${val.toFixed(1)}° НОРМА` : `${val.toFixed(1)}° СБИТО`) : (ok ? 'ГОТОВО 3/3' : `ШАГ ${stepDone}/3`)}
              </div>
              <div style="font-size:11px;color:#cbd5e1;">${ok ? '✓ Все параметры соответствуют технологической карте.' : 'Выполните операции слева до зелёного статуса.'}</div>
            </div>
          </div>
        `;
        ws.querySelector('#lab-mech-ang')?.addEventListener('input', e => { val = Number(e.target.value); update(); });
        ws.querySelector('#lab-m1')?.addEventListener('click', () => { stepDone = Math.max(stepDone, 1); update(); });
        ws.querySelector('#lab-m2')?.addEventListener('click', () => { stepDone = Math.max(stepDone, 2); update(); });
        ws.querySelector('#lab-m3')?.addEventListener('click', () => { stepDone = Math.max(stepDone, 3); update(); });
        if (ok) markSolved('Чёткая работа механика! Допуск проверен прибором и зафиксирован без отклонений.', { stepDone, val });
      }
      update();
      return true;
    }

    return false;
  }

  return {
    getTopicConfig,
    renderTopicLab,
    renderSortableSequence,
    mentorCard,
  };
})();
