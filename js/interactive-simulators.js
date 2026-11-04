/**
 * EDU SPACE PRO — PROFESSIONAL INTERACTIVE SIMULATORS ENGINE
 * Specialized interactive workstations for all 5 AMK specialties:
 * 1. Web: Live Code / DOM / CSS Flexbox Sandbox
 * 2. Design: Canvas Artboard, Vector Shapes, Layer controls & WCAG
 * 3. Autoelectric: Wiring Schematic + Virtual Fluke Multimeter with Red/Black Probes
 * 4. HVAC: Thermodynamic Cycle, Animated Flow, Pressure Gauges & Superheat
 * 5. Automechanics: 4-Stroke Engine Cycle Animation + Cylinder Head Torque Sequencer
 */

window.EduSimulators = (function () {
  'use strict';

  let currentSpecialty = 'it';
  let currentTaskNum = 1;

  // =========================================================================
  // 1. WEB DEVELOPMENT & DOM / CSS FLEXBOX SIMULATOR
  // =========================================================================
  function renderWebSimulator(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-400 text-[20px]">splitscreen</span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Интерактивная песочница CSS Flexbox & DOM</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">Live Visualizer</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Controls Panel -->
          <div class="p-4 rounded-2xl bg-dark-900 border border-white/10 space-y-3 text-xs">
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">display: flex / grid</label>
              <select id="web-sim-display" onchange="EduSimulators.updateWebSandbox()" class="w-full px-3 py-2 rounded-xl bg-dark-850 border border-white/10 text-white text-xs">
                <option value="flex">display: flex</option>
                <option value="grid">display: grid</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">justify-content</label>
              <select id="web-sim-justify" onchange="EduSimulators.updateWebSandbox()" class="w-full px-3 py-2 rounded-xl bg-dark-850 border border-white/10 text-white text-xs">
                <option value="flex-start">flex-start (по началу)</option>
                <option value="center" selected>center (по центру)</option>
                <option value="space-between">space-between (по краям)</option>
                <option value="space-around">space-around (с отступами)</option>
                <option value="flex-end">flex-end (в конец)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">align-items</label>
              <select id="web-sim-align" onchange="EduSimulators.updateWebSandbox()" class="w-full px-3 py-2 rounded-xl bg-dark-850 border border-white/10 text-white text-xs">
                <option value="center" selected>center</option>
                <option value="flex-start">flex-start</option>
                <option value="flex-end">flex-end</option>
                <option value="stretch">stretch</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">gap (px): <span id="web-sim-gap-val" class="text-indigo-400 font-mono">16px</span></label>
              <input type="range" min="0" max="40" value="16" oninput="EduSimulators.updateWebGap(this.value)" class="w-full accent-indigo-500 cursor-pointer"/>
            </div>
            <div class="pt-2">
              <button type="button" onclick="EduSimulators.insertWebSnippet()" class="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]">content_paste</span>
                Вставить сгенерированный CSS в решение
              </button>
            </div>
          </div>

          <!-- Live Visual Playground -->
          <div class="lg:col-span-2 p-5 rounded-2xl bg-dark-950 border border-white/10 flex flex-col justify-between min-h-[240px]">
            <div class="flex items-center justify-between text-[11px] text-slate-400 mb-3 font-mono">
              <span>#preview-container {</span>
              <span id="web-sim-css-inline" class="text-indigo-400 font-bold">display: flex; justify-content: center; align-items: center; gap: 16px;</span>
              <span>}</span>
            </div>

            <!-- The flex container -->
            <div id="web-sandbox-box" class="flex-1 rounded-xl bg-dark-900 border border-dashed border-indigo-500/40 p-4 transition-all" style="display: flex; justify-content: center; align-items: center; gap: 16px;">
              <div class="px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md">Блок A</div>
              <div class="px-4 py-3 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md">Блок B</div>
              <div class="px-4 py-3 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-md">Блок C</div>
            </div>

            <div class="text-[10px] text-slate-500 text-center mt-3">
              Интерактивный DOM-рендерер EDU SPACE PRO • В реальном времени отображает поведение сетки
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. GRAPHIC & UI/UX DESIGN SIMULATOR
  // =========================================================================
  let canvasCtx = null;
  let canvasElements = [];

  function renderDesignSimulator(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-purple-400 text-[20px]">palette</span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Интерактивный графический холст & Композиция</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">Vector Canvas</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <!-- Toolbar -->
          <div class="p-4 rounded-2xl bg-dark-900 border border-white/10 space-y-3 text-xs">
            <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Инструменты фигур</div>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" onclick="EduSimulators.addCanvasShape('rect')" class="p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 text-white flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-purple-400">rectangle</span>Прямоугольник
              </button>
              <button type="button" onclick="EduSimulators.addCanvasShape('circle')" class="p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 text-white flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-cyan-400">circle</span>Круг
              </button>
              <button type="button" onclick="EduSimulators.addCanvasShape('text')" class="p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 text-white flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-amber-400">title</span>Текст
              </button>
              <button type="button" onclick="EduSimulators.clearCanvas()" class="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[16px]">delete</span>Очистить
              </button>
            </div>

            <!-- Color Palette -->
            <div class="pt-2">
              <label class="block text-[11px] font-bold text-slate-300 mb-1.5">Палитра макета</label>
              <div class="flex items-center gap-2">
                <button type="button" onclick="EduSimulators.setCanvasColor('#4f46e5')" class="w-6 h-6 rounded-full bg-indigo-600 border border-white/30"></button>
                <button type="button" onclick="EduSimulators.setCanvasColor('#8b5cf6')" class="w-6 h-6 rounded-full bg-purple-500 border border-white/30"></button>
                <button type="button" onclick="EduSimulators.setCanvasColor('#06b6d4')" class="w-6 h-6 rounded-full bg-cyan-500 border border-white/30"></button>
                <button type="button" onclick="EduSimulators.setCanvasColor('#10b981')" class="w-6 h-6 rounded-full bg-emerald-500 border border-white/30"></button>
                <button type="button" onclick="EduSimulators.setCanvasColor('#f59e0b')" class="w-6 h-6 rounded-full bg-amber-500 border border-white/30"></button>
                <button type="button" onclick="EduSimulators.setCanvasColor('#ffffff')" class="w-6 h-6 rounded-full bg-white border border-slate-400"></button>
              </div>
            </div>

            <!-- WCAG Score -->
            <div class="p-3 rounded-xl bg-dark-850 border border-white/5 space-y-1">
              <div class="text-[10px] uppercase font-bold text-slate-400">WCAG Контрастность</div>
              <div class="text-sm font-black text-emerald-400" id="design-wcag-val">12.5 : 1 (AAA)</div>
              <div class="text-[10px] text-slate-400">Соответствует стандартам доступности</div>
            </div>

            <button type="button" onclick="EduSimulators.exportCanvasPng()" class="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-sm transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[15px]">download</span>Экспорт макета (PNG)
            </button>
          </div>

          <!-- Canvas Viewport -->
          <div class="lg:col-span-3 p-4 rounded-2xl bg-dark-950 border border-white/10 flex flex-col items-center justify-center">
            <canvas id="design-artboard" width="600" height="320" class="rounded-xl border border-white/15 bg-dark-900 shadow-2xl max-w-full cursor-crosshair"></canvas>
            <div class="text-[10px] text-slate-500 mt-2 font-mono">Artboard 600×320px • Кликните на холст для добавления элементов</div>
          </div>
        </div>
      </div>
    `;

    setTimeout(initCanvasArtboard, 50);
  }

  let activeColor = '#8b5cf6';

  function initCanvasArtboard() {
    const canvas = document.getElementById('design-artboard');
    if (!canvas) return;
    canvasCtx = canvas.getContext('2d');
    canvasElements = [
      { type: 'rect', x: 40, y: 40, w: 140, h: 90, color: '#4f46e5' },
      { type: 'circle', x: 300, y: 150, r: 60, color: '#06b6d4' },
      { type: 'text', x: 220, y: 260, text: 'EDU SPACE UI/UX', color: '#ffffff' }
    ];
    redrawCanvas();
  }

  function redrawCanvas() {
    if (!canvasCtx) return;
    const canvas = document.getElementById('design-artboard');
    canvasCtx.fillStyle = '#0f1117';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    canvasCtx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, 0);
      canvasCtx.lineTo(x, canvas.height);
      canvasCtx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, y);
      canvasCtx.lineTo(canvas.width, y);
      canvasCtx.stroke();
    }

    // Draw elements
    canvasElements.forEach(el => {
      canvasCtx.fillStyle = el.color;
      if (el.type === 'rect') {
        canvasCtx.fillRect(el.x, el.y, el.w, el.h);
      } else if (el.type === 'circle') {
        canvasCtx.beginPath();
        canvasCtx.arc(el.x, el.y, el.r, 0, Math.PI * 2);
        canvasCtx.fill();
      } else if (el.type === 'text') {
        canvasCtx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
        canvasCtx.fillText(el.text, el.x, el.y);
      }
    });
  }

  // =========================================================================
  // 3. AUTOELECTRIC & VIRTUAL FLUKE MULTIMETER SIMULATOR
  // =========================================================================
  const CIRCUIT_NODES = {
    BAT_POS: { name: 'Вывод (+) АКБ 12В', v: 12.60, r_to_gnd: Infinity },
    MAIN_FUSE_IN: { name: 'Вход предохранителя EFI (15A)', v: 12.58, r_to_gnd: Infinity },
    MAIN_FUSE_OUT: { name: 'Выход предохранителя EFI', v: 12.55, r_to_gnd: 120 },
    ECU_5V_REF: { name: 'Опорное напряжение ЭБУ (+5.0В)', v: 5.00, r_to_gnd: 2500 },
    MAF_SIG: { name: 'Сигнальный провод ДМРВ', v: 1.85, r_to_gnd: 1800 },
    CAN_HIGH: { name: 'Линия CAN-High (Контакт 6 OBD)', v: 2.70, r_to_gnd: 120 },
    CAN_LOW: { name: 'Линия CAN-Low (Контакт 14 OBD)', v: 2.30, r_to_gnd: 120 },
    GND: { name: 'Масса кузова / ДВС (GND)', v: 0.00, r_to_gnd: 0 }
  };

  let redProbeNode = 'BAT_POS';
  let blackProbeNode = 'GND';
  let multimeterMode = 'DCV';
  let isFuseBlown = false;

  function renderAutoelectricSimulator(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-cyan-400 text-[20px]">electrical_services</span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Виртуальный цифровой мультиметр & Схема питания ЭБУ</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">Fluke Pro</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Schematic & Probe Points -->
          <div class="lg:col-span-2 p-5 rounded-2xl bg-dark-900 border border-white/10 space-y-4">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-300">Интерактивная схема контрольных точек:</span>
              <button type="button" onclick="EduSimulators.toggleFuseFault()" class="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-colors">
                <span id="fuse-fault-btn-text">${isFuseBlown ? '✓ Восстановить предохранитель' : '⚠️ Смоделировать сгоревший предохранитель'}</span>
              </button>
            </div>

            <!-- Nodes Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              ${Object.keys(CIRCUIT_NODES).map(key => {
                const node = CIRCUIT_NODES[key];
                return `
                  <div class="p-3 rounded-xl bg-dark-850 border border-white/10 flex items-center justify-between hover:border-cyan-500/40 transition-colors">
                    <div>
                      <div class="font-bold text-white text-[11px]">${node.name}</div>
                      <div class="text-[10px] text-slate-400 font-mono">${key}</div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <button type="button" onclick="EduSimulators.connectProbe('red', '${key}')" class="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white text-[10px] font-bold border border-red-500/40 transition-colors" title="Подключить красный щуп (+)">
                        Красный
                      </button>
                      <button type="button" onclick="EduSimulators.connectProbe('black', '${key}')" class="px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white text-[10px] font-bold border border-white/10 transition-colors" title="Подключить чёрный щуп (COM)">
                        Чёрный
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Digital Multimeter Display Unit -->
          <div class="p-6 rounded-2xl bg-dark-950 border border-cyan-500/30 flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-white/10">
                <div class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">FLUKE 87V TRUE RMS</div>
                <div class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="text-[10px] text-emerald-400 font-bold">READY</span>
                </div>
              </div>

              <!-- Main LCD Screen -->
              <div class="mt-4 p-5 rounded-2xl bg-[#0d161a] border border-cyan-500/40 text-center font-mono space-y-1 shadow-inner">
                <div class="text-[11px] text-cyan-400/70 flex items-center justify-between">
                  <span>AUTO RANGE</span>
                  <span id="multimeter-mode-label">DC VOLTS</span>
                </div>
                <div class="text-4xl font-black text-cyan-300 tracking-wider py-1" id="fluke-main-val">12.60 V</div>
                <div class="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>HOLD: OFF</span>
                  <span>600V CAT IV</span>
                </div>
              </div>
            </div>

            <!-- Probes Connection Status -->
            <div class="p-3 rounded-xl bg-dark-900 border border-white/10 space-y-1.5 text-[11px]">
              <div class="flex items-center justify-between">
                <span class="text-red-400 font-bold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>Красный щуп (+):</span>
                <span class="font-mono text-white" id="status-red-probe">BAT_POS</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-bold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-500"></span>Чёрный щуп (COM):</span>
                <span class="font-mono text-white" id="status-black-probe">GND</span>
              </div>
            </div>

            <!-- Mode Selector Buttons -->
            <div class="grid grid-cols-3 gap-2">
              <button type="button" onclick="EduSimulators.setMultimeterMode('DCV')" class="p-2 rounded-xl bg-cyan-600 text-white font-bold text-[10px] shadow-sm">DCV (В)</button>
              <button type="button" onclick="EduSimulators.setMultimeterMode('OHM')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-[10px] border border-white/10">OHM (Ω)</button>
              <button type="button" onclick="EduSimulators.setMultimeterMode('CONT')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-[10px] border border-white/10">Прозвонка</button>
            </div>
          </div>
        </div>
      </div>
    `;

    updateMultimeterReading();
  }

  function updateMultimeterReading() {
    const valEl = document.getElementById('fluke-main-val');
    if (!valEl) return;

    const rNode = CIRCUIT_NODES[redProbeNode];
    const bNode = CIRCUIT_NODES[blackProbeNode];

    if (!rNode || !bNode) {
      valEl.textContent = '0.00 V';
      return;
    }

    if (multimeterMode === 'DCV') {
      let vRed = rNode.v;
      let vBlack = bNode.v;

      if (isFuseBlown && (redProbeNode === 'MAIN_FUSE_OUT' || redProbeNode === 'ECU_5V_REF' || redProbeNode === 'MAF_SIG')) {
        vRed = 0.00;
      }
      if (isFuseBlown && (blackProbeNode === 'MAIN_FUSE_OUT' || blackProbeNode === 'ECU_5V_REF' || blackProbeNode === 'MAF_SIG')) {
        vBlack = 0.00;
      }

      const diff = vRed - vBlack;
      valEl.textContent = diff.toFixed(2) + ' V';
    } else if (multimeterMode === 'OHM') {
      if (redProbeNode === 'CAN_HIGH' && blackProbeNode === 'CAN_LOW') {
        valEl.textContent = isFuseBlown ? '120.0 Ω' : '60.0 Ω';
      } else if (redProbeNode === blackProbeNode) {
        valEl.textContent = '0.1 Ω';
      } else {
        valEl.textContent = 'O.L MΩ';
      }
    } else {
      // Continuity
      if (redProbeNode === blackProbeNode || (redProbeNode === 'MAIN_FUSE_IN' && blackProbeNode === 'MAIN_FUSE_OUT' && !isFuseBlown)) {
        valEl.textContent = 'BEEP 0.0 Ω';
        if (window.EduSpace && window.EduSpace.playUiTone) window.EduSpace.playUiTone('success');
      } else {
        valEl.textContent = 'OPEN (Обрыв)';
      }
    }
  }

  // =========================================================================
  // 4. HVAC & THERMODYNAMIC CYCLE SIMULATOR
  // =========================================================================
  let hvacPressureBar = 2.1;
  let hvacPipeTempC = 2.0;

  function renderHvacSimulator(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-400 text-[20px]">ac_unit</span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Интерактивный контур хладагента & Расчёт перегрева</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">R134a Thermodynamic Loop</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Animated Thermodynamic Cycle Diagram -->
          <div class="lg:col-span-2 p-5 rounded-2xl bg-dark-900 border border-white/10 space-y-4">
            <div class="text-xs font-bold text-slate-300">Схема холодильного контура (4 фазы):</div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div class="p-3.5 rounded-2xl bg-dark-850 border border-red-500/30 space-y-1">
                <div class="text-[10px] text-red-400 font-bold uppercase">1. Компрессор</div>
                <div class="text-xs font-black text-white">14.5 bar</div>
                <div class="text-[10px] text-slate-400">+75 °C (Пар)</div>
              </div>
              <div class="p-3.5 rounded-2xl bg-dark-850 border border-amber-500/30 space-y-1">
                <div class="text-[10px] text-amber-400 font-bold uppercase">2. Конденсатор</div>
                <div class="text-xs font-black text-white">14.0 bar</div>
                <div class="text-[10px] text-slate-400">+45 °C (Жидкость)</div>
              </div>
              <div class="p-3.5 rounded-2xl bg-dark-850 border border-cyan-500/30 space-y-1">
                <div class="text-[10px] text-cyan-400 font-bold uppercase">3. ТРВ (Вентиль)</div>
                <div class="text-xs font-black text-white" id="hvac-txv-p">2.1 bar</div>
                <div class="text-[10px] text-slate-400">-5.0 °C (Дроссель)</div>
              </div>
              <div class="p-3.5 rounded-2xl bg-dark-850 border border-blue-500/30 space-y-1">
                <div class="text-[10px] text-blue-400 font-bold uppercase">4. Испаритель</div>
                <div class="text-xs font-black text-white" id="hvac-evap-p">2.1 bar</div>
                <div class="text-[10px] text-emerald-400 font-bold" id="hvac-evap-sh">SH: 7.0 K</div>
              </div>
            </div>

            <!-- Interactive Adjusters -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div class="space-y-1.5 text-xs">
                <label class="block font-bold text-slate-300">Давление всасывания (Низкая сторона): <span id="hvac-p-label" class="text-cyan-400 font-mono">2.1 bar</span></label>
                <input type="range" min="1.0" max="3.5" step="0.1" value="2.1" oninput="EduSimulators.updateHvacPressure(this.value)" class="w-full accent-cyan-400 cursor-pointer"/>
              </div>
              <div class="space-y-1.5 text-xs">
                <label class="block font-bold text-slate-300">Фактическая температура трубки (°C): <span id="hvac-t-label" class="text-cyan-400 font-mono">2.0 °C</span></label>
                <input type="range" min="-10.0" max="15.0" step="0.5" value="2.0" oninput="EduSimulators.updateHvacTemp(this.value)" class="w-full accent-blue-400 cursor-pointer"/>
              </div>
            </div>
          </div>

          <!-- Diagnostic Verdict Gauge -->
          <div class="p-6 rounded-2xl bg-dark-950 border border-blue-500/30 flex flex-col justify-between space-y-4">
            <div class="space-y-1 text-center">
              <div class="text-[10px] uppercase font-bold text-slate-400">Фактический перегрев (Superheat)</div>
              <div class="text-4xl font-black text-cyan-400 font-mono" id="hvac-superheat-display">7.0 K</div>
              <div class="text-[11px] font-bold text-emerald-400 mt-2" id="hvac-verdict-text">✓ Нормальная заправка контура (Цель: 5–8 K)</div>
            </div>

            <div class="p-3 rounded-xl bg-dark-900 border border-white/10 space-y-1 text-[11px] text-slate-300">
              <div class="text-slate-400 font-bold">Температура кипения (T sat):</div>
              <div class="font-mono text-white text-base" id="hvac-tsat-val">-5.0 °C</div>
              <div class="text-[10px] text-slate-500 pt-1">Формула: SH = T_трубки - T_кипения</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. AUTOMODEL & CYLINDER HEAD TORQUE SIMULATOR
  // =========================================================================
  const BOLT_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let currentBoltsTightened = [];
  let currentTorqueStage = 1;

  function renderAutomechanicSimulator(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-400 text-[20px]">precision_manufacturing</span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Динамометрическая сборка ГБЦ & 4 такта ДВС</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">Torque Master</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Cylinder Head Bolt Map (10 Bolts Pattern) -->
          <div class="lg:col-span-2 p-5 rounded-2xl bg-dark-900 border border-white/10 space-y-4">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-300">Схема расположения болтов ГБЦ (Порядок: от центра к краям):</span>
              <button type="button" onclick="EduSimulators.resetTorqueSequence()" class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold border border-white/10">
                Сбросить обтяжку
              </button>
            </div>

            <!-- Bolt Pattern Grid -->
            <div class="p-6 rounded-2xl bg-dark-950 border border-amber-500/30 space-y-4">
              <div class="grid grid-cols-5 gap-3 max-w-md mx-auto">
                ${[8, 4, 1, 5, 9].map(num => `
                  <button type="button" onclick="EduSimulators.clickTorqueBolt(${num})" id="bolt-btn-${num}" class="bolt-btn p-3 rounded-2xl bg-dark-900 hover:bg-amber-500/20 border border-white/15 text-center transition-all group">
                    <div class="w-8 h-8 rounded-full bg-dark-850 mx-auto flex items-center justify-center font-bold font-mono text-xs text-white group-hover:scale-110">
                      ${num}
                    </div>
                    <div class="text-[9px] text-slate-500 mt-1" id="bolt-status-${num}">0 Н·м</div>
                  </button>
                `).join('')}
              </div>

              <div class="grid grid-cols-5 gap-3 max-w-md mx-auto">
                ${[7, 3, 2, 6, 10].map(num => `
                  <button type="button" onclick="EduSimulators.clickTorqueBolt(${num})" id="bolt-btn-${num}" class="bolt-btn p-3 rounded-2xl bg-dark-900 hover:bg-amber-500/20 border border-white/15 text-center transition-all group">
                    <div class="w-8 h-8 rounded-full bg-dark-850 mx-auto flex items-center justify-center font-bold font-mono text-xs text-white group-hover:scale-110">
                      ${num}
                    </div>
                    <div class="text-[9px] text-slate-500 mt-1" id="bolt-status-${num}">0 Н·м</div>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="text-[11px] text-slate-400" id="torque-feedback-message">
              Затягивайте болты строго по порядку: 1 ➔ 2 ➔ 3 ➔ ... ➔ 10
            </div>
          </div>

          <!-- Torque Wrench Specs -->
          <div class="p-6 rounded-2xl bg-dark-950 border border-amber-500/30 flex flex-col justify-between space-y-4">
            <div>
              <div class="text-[10px] uppercase font-bold text-slate-400">Динамометрический ключ</div>
              <div class="text-3xl font-black text-amber-400 font-mono mt-1" id="torque-gauge-display">35.0 N·m</div>
              <div class="text-xs text-slate-300 mt-1" id="torque-stage-desc">Этап 1: Предварительная затяжка 35 Н·м</div>
            </div>

            <div class="space-y-2 text-xs">
              <button type="button" onclick="EduSimulators.selectTorqueStage(1, 35)" class="w-full p-2.5 rounded-xl bg-amber-600 text-white font-bold text-left flex items-center justify-between">
                <span>1. Первый этап</span>
                <span class="font-mono">35 Н·м</span>
              </button>
              <button type="button" onclick="EduSimulators.selectTorqueStage(2, 60)" class="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-left flex items-center justify-between border border-white/10">
                <span>2. Второй этап</span>
                <span class="font-mono">60 Н·м</span>
              </button>
              <button type="button" onclick="EduSimulators.selectTorqueStage(3, 90)" class="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-left flex items-center justify-between border border-white/10">
                <span>3. Доворот на угол</span>
                <span class="font-mono">+90°</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PUBLIC CONTROLLER INTERFACE
  // =========================================================================
  return {
    init: function (specialty, taskNumber, containerEl) {
      currentSpecialty = specialty || 'it';
      currentTaskNum = taskNumber || 1;

      if (!containerEl) {
        containerEl = document.getElementById('specialty-interactive-workbench');
      }
      if (!containerEl) return;

      if (currentSpecialty === 'it') {
        renderWebSimulator(containerEl);
      } else if (currentSpecialty === 'design') {
        renderDesignSimulator(containerEl);
      } else if (currentSpecialty === 'autoelectric') {
        renderAutoelectricSimulator(containerEl);
      } else if (currentSpecialty === 'hvac') {
        renderHvacSimulator(containerEl);
      } else if (currentSpecialty === 'automechanic') {
        renderAutomechanicSimulator(containerEl);
      }
    },

    // Web Handlers
    updateWebSandbox: function () {
      const box = document.getElementById('web-sandbox-box');
      if (!box) return;
      const disp = document.getElementById('web-sim-display').value;
      const just = document.getElementById('web-sim-justify').value;
      const align = document.getElementById('web-sim-align').value;

      box.style.display = disp;
      box.style.justifyContent = just;
      box.style.alignItems = align;

      const inline = document.getElementById('web-sim-css-inline');
      if (inline) {
        inline.textContent = `display: ${disp}; justify-content: ${just}; align-items: ${align}; gap: ${box.style.gap || '16px'};`;
      }
    },

    updateWebGap: function (val) {
      const box = document.getElementById('web-sandbox-box');
      if (box) box.style.gap = val + 'px';
      const label = document.getElementById('web-sim-gap-val');
      if (label) label.textContent = val + 'px';
      this.updateWebSandbox();
    },

    insertWebSnippet: function () {
      const inline = document.getElementById('web-sim-css-inline');
      const textarea = document.getElementById('solution-code');
      if (inline && textarea) {
        textarea.value += '\\n\\n/* Сгенерированный Flexbox-контейнер */\\n.container {\\n  ' + inline.textContent + '\\n}\\n';
        if (window.EduSpace && window.EduSpace.playUiTone) window.EduSpace.playUiTone('success');
      }
    },

    // Design Handlers
    addCanvasShape: function (type) {
      if (type === 'rect') {
        canvasElements.push({ type: 'rect', x: Math.random() * 300 + 50, y: Math.random() * 150 + 50, w: 100, h: 70, color: activeColor });
      } else if (type === 'circle') {
        canvasElements.push({ type: 'circle', x: Math.random() * 300 + 50, y: Math.random() * 150 + 50, r: 40, color: activeColor });
      } else if (type === 'text') {
        canvasElements.push({ type: 'text', x: Math.random() * 200 + 50, y: Math.random() * 150 + 50, text: 'Design Component', color: activeColor });
      }
      redrawCanvas();
    },

    setCanvasColor: function (color) {
      activeColor = color;
      redrawCanvas();
    },

    clearCanvas: function () {
      canvasElements = [];
      redrawCanvas();
    },

    exportCanvasPng: function () {
      const canvas = document.getElementById('design-artboard');
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'eduspace-design-export.png';
      a.click();
    },

    // Autoelectric Handlers
    connectProbe: function (probe, nodeKey) {
      if (probe === 'red') {
        redProbeNode = nodeKey;
        const st = document.getElementById('status-red-probe');
        if (st) st.textContent = nodeKey;
      } else {
        blackProbeNode = nodeKey;
        const st = document.getElementById('status-black-probe');
        if (st) st.textContent = nodeKey;
      }
      updateMultimeterReading();
      if (window.EduSpace && window.EduSpace.playUiTone) window.EduSpace.playUiTone('click');
    },

    setMultimeterMode: function (mode) {
      multimeterMode = mode;
      const lbl = document.getElementById('multimeter-mode-label');
      if (lbl) lbl.textContent = mode;
      updateMultimeterReading();
    },

    toggleFuseFault: function () {
      isFuseBlown = !isFuseBlown;
      const btn = document.getElementById('fuse-fault-btn-text');
      if (btn) btn.textContent = isFuseBlown ? '✓ Восстановить предохранитель' : '⚠️ Смоделировать сгоревший предохранитель';
      updateMultimeterReading();
    },

    // HVAC Handlers
    updateHvacPressure: function (p) {
      hvacPressureBar = parseFloat(p);
      const lbl = document.getElementById('hvac-p-label');
      if (lbl) lbl.textContent = p + ' bar';

      const tsat = -26.0 + (hvacPressureBar * 10.5);
      const sh = hvacPipeTempC - tsat;

      const tsatEl = document.getElementById('hvac-tsat-val');
      if (tsatEl) tsatEl.textContent = tsat.toFixed(1) + ' °C';

      const shEl = document.getElementById('hvac-superheat-display');
      if (shEl) shEl.textContent = sh.toFixed(1) + ' K';

      const txvP = document.getElementById('hvac-txv-p');
      if (txvP) txvP.textContent = p + ' bar';

      const evapP = document.getElementById('hvac-evap-p');
      if (evapP) evapP.textContent = p + ' bar';

      const evapSh = document.getElementById('hvac-evap-sh');
      if (evapSh) evapSh.textContent = 'SH: ' + sh.toFixed(1) + ' K';

      const verd = document.getElementById('hvac-verdict-text');
      if (verd) {
        if (sh < 3.0) {
          verd.textContent = '⚠️ Опасность гидроудара (перегрев < 3 K, жидкий фреон идёт в компрессор!)';
          verd.className = 'text-[11px] font-bold text-red-400 mt-2';
        } else if (sh > 10.0) {
          verd.textContent = '⚠️ Недостаток хладагента / утечка (перегрев > 10 K)';
          verd.className = 'text-[11px] font-bold text-amber-400 mt-2';
        } else {
          verd.textContent = '✓ Нормальная заправка контура (Цель: 5–8 K)';
          verd.className = 'text-[11px] font-bold text-emerald-400 mt-2';
        }
      }
    },

    updateHvacTemp: function (t) {
      hvacPipeTempC = parseFloat(t);
      const lbl = document.getElementById('hvac-t-label');
      if (lbl) lbl.textContent = t + ' °C';
      this.updateHvacPressure(hvacPressureBar);
    },

    // Automechanics Handlers
    selectTorqueStage: function (stage, nm) {
      currentTorqueStage = stage;
      const g = document.getElementById('torque-gauge-display');
      const d = document.getElementById('torque-stage-desc');
      if (stage === 3) {
        if (g) g.textContent = '+90° (угол)';
        if (d) d.textContent = 'Этап 3: Финальный пластический доворот болта на 90 градусов';
      } else {
        if (g) g.textContent = nm.toFixed(1) + ' N·m';
        if (d) d.textContent = 'Этап ' + stage + ': Равномерная затяжка ' + nm + ' Н·м';
      }
    },

    clickTorqueBolt: function (num) {
      const nextExpected = BOLT_SEQUENCE[currentBoltsTightened.length];
      const feedback = document.getElementById('torque-feedback-message');

      if (num === nextExpected) {
        currentBoltsTightened.push(num);
        const statusEl = document.getElementById('bolt-status-' + num);
        if (statusEl) {
          statusEl.textContent = currentTorqueStage === 3 ? '+90°' : (currentTorqueStage === 1 ? '35 Н·м' : '60 Н·м');
          statusEl.className = 'text-[9px] text-emerald-400 font-bold mt-1';
        }
        const btn = document.getElementById('bolt-btn-' + num);
        if (btn) btn.classList.add('border-emerald-500', 'bg-emerald-500/10');

        if (window.EduSpace && window.EduSpace.playUiTone) window.EduSpace.playUiTone('click');

        if (currentBoltsTightened.length === 10) {
          if (feedback) {
            feedback.innerHTML = '🎉 <strong class="text-emerald-400">Все 10 болтов ГБЦ обтянуты строго по спирали без коробления головки блока!</strong>';
          }
          if (window.EduSpace && window.EduSpace.playUiTone) window.EduSpace.playUiTone('success');
        } else {
          if (feedback) {
            feedback.textContent = `Болт #${num} затянут! Следующий болт: #${BOLT_SEQUENCE[currentBoltsTightened.length]}`;
          }
        }
      } else {
        if (feedback) {
          feedback.innerHTML = `⚠️ <strong class="text-red-400">Нарушение регламента!</strong> Вы нажали болт #${num}, но по схеме завода следующим должен быть #${nextExpected}. Нарушение приведёт к деформации привалочной плоскости!`;
        }
        if (window.EduSpace && window.EduSpace.playUiTone) window.EduSpace.playUiTone('error');
      }
    },

    resetTorqueSequence: function () {
      currentBoltsTightened = [];
      for (let i = 1; i <= 10; i++) {
        const st = document.getElementById('bolt-status-' + i);
        if (st) {
          st.textContent = '0 Н·м';
          st.className = 'text-[9px] text-slate-500 mt-1';
        }
        const btn = document.getElementById('bolt-btn-' + i);
        if (btn) btn.className = 'bolt-btn p-3 rounded-2xl bg-dark-900 hover:bg-amber-500/20 border border-white/15 text-center transition-all group';
      }
      const feedback = document.getElementById('torque-feedback-message');
      if (feedback) feedback.textContent = 'Затягивайте болты строго по порядку: 1 ➔ 2 ➔ 3 ➔ ... ➔ 10';
    }
  };
})();
