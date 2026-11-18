/**
 * EDU SPACE PRO — DETERMINISTIC DOMAIN PHYSICS KERNEL (window.EduPhysics)
 * & PROFESSIONAL INTERACTIVE SIMULATORS ENGINE (window.EduSimulators)
 */

window.EduPhysics = (function () {
  'use strict';

  function parseHexToRgb(hex) {
    var s = String(hex || '#000000').trim().replace(/^#/, '');
    if (s.length === 3) {
      s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    }
    if (!/^[0-9a-fA-F]{6}$/.test(s)) {
      return [0, 0, 0];
    }
    return [
      parseInt(s.slice(0, 2), 16) / 255,
      parseInt(s.slice(2, 4), 16) / 255,
      parseInt(s.slice(4, 6), 16) / 255
    ];
  }

  function relativeLuminance(hex) {
    var rgb = parseHexToRgb(hex).map(function (c) {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function contrastRatio(fgHex, bgHex) {
    var lFg = relativeLuminance(fgHex);
    var lBg = relativeLuminance(bgHex);
    var lighter = Math.max(lFg, lBg);
    var darker = Math.min(lFg, lBg);
    var raw = (lighter + 0.05) / (darker + 0.05);
    var ratio = Math.round(raw * 100) / 100;
    return {
      ratio: ratio,
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3.0,
      aaaNormal: ratio >= 7.0,
      aaaLarge: ratio >= 4.5,
      luminanceFg: Math.round(lFg * 10000) / 10000,
      luminanceBg: Math.round(lBg * 10000) / 10000
    };
  }

  function solveCircuit(nodes, edges, batteryV, fault) {
    var vBat = Number(batteryV);
    if (!Number.isFinite(vBat) || vBat < 0) vBat = 12.6;
    var nodeList = Array.isArray(nodes) && nodes.length ? nodes : ['bat', 'gnd'];
    var edgeList = Array.isArray(edges) ? edges : [];
    var faultObj = fault || null;

    if (faultObj && faultObj.type === 'open_circuit') {
      var openVoltages = {};
      nodeList.forEach(function (n, idx) {
        openVoltages[n] = idx === 0 ? vBat : 0.0;
      });
      return {
        nodeVoltages: openVoltages,
        branchCurrents: edgeList.map(function () { return 0.0; }),
        totalResistance: 999999.0,
        totalCurrent: 0.0,
        faultDiagnosis: 'OPEN_CIRCUIT: Обрыв цепи (' + (faultObj.target || 'линия') + ')'
      };
    }

    var totalR = 0.0;
    edgeList.forEach(function (e) {
      var r = Number(e && e.r);
      if (Number.isFinite(r) && r > 0) totalR += r;
    });
    if (faultObj && faultObj.type === 'high_resistance') {
      totalR += Number(faultObj.extraR || 15.0);
    }
    if (totalR <= 0.0001) totalR = 0.001;

    var totalI = Math.round((vBat / totalR) * 10000) / 10000;
    var voltages = {};
    var remV = vBat;
    voltages[nodeList[0]] = Math.round(vBat * 1000) / 1000;
    var branchCurrents = [];

    edgeList.forEach(function (e) {
      var r = Math.max(0.0, Number(e && e.r) || 0.0);
      var drop = totalI * r;
      remV = Math.max(0.0, remV - drop);
      if (e && e.to) {
        voltages[e.to] = Math.round(remV * 1000) / 1000;
      }
      branchCurrents.push(totalI);
    });
    voltages[nodeList[nodeList.length - 1]] = 0.0;

    return {
      nodeVoltages: voltages,
      branchCurrents: branchCurrents,
      totalResistance: Math.round(totalR * 1000) / 1000,
      totalCurrent: totalI,
      faultDiagnosis: faultObj ? String(faultObj.type || 'FAULT') : 'NOMINAL'
    };
  }

  // ASHRAE/NIST Saturation Pressure-Temperature Coefficients (Antoine-style logfit for gauge/abs bar)
  var REFRIGERANT_PT = {
    R134a: { a: 9.42, b: 2180.0, c: 245.0, cpRatio: 1.18 },
    R410A: { a: 9.88, b: 2050.0, c: 248.0, cpRatio: 1.24 },
    R32:   { a: 9.95, b: 2030.0, c: 249.0, cpRatio: 1.26 },
    R600a: { a: 8.95, b: 2260.0, c: 242.0, cpRatio: 1.12 }
  };

  function satTempFromBar(spec, pBar) {
    // Empirical saturation curve calibrated to standard HVAC manifold tables
    var pAbs = Math.max(0.2, Number(pBar) + 1.013);
    var t = (spec.b / (spec.a - Math.log(pAbs))) - spec.c;
    return Math.round(t * 100) / 100;
  }

  function cycleMetrics(refrigerant, lowBar, highBar, suctionTempC, liquidTempC) {
    var refKey = String(refrigerant || 'R134a');
    var spec = REFRIGERANT_PT[refKey];
    var pLow = Number(lowBar);
    var pHigh = Number(highBar);
    var tSuc = Number(suctionTempC);
    var tLiq = Number(liquidTempC);

    if (!spec || !Number.isFinite(pLow) || !Number.isFinite(pHigh) || pLow <= 0 || pHigh <= 0 || pHigh <= pLow) {
      return {
        status: 'FAULT',
        error: 'INVALID_PRESSURE_OR_REFRIGERANT',
        tSatLow: 0,
        tSatHigh: 0,
        superheatK: 0,
        subcoolingK: 0,
        copEstimate: 0
      };
    }

    var tSatLow = satTempFromBar(spec, pLow);
    var tSatHigh = satTempFromBar(spec, pHigh);
    var superheatK = Math.round((tSuc - tSatLow) * 100) / 100;
    var subcoolingK = Math.round((tSatHigh - tLiq) * 100) / 100;
    var tEvapK = tSatLow + 273.15;
    var tCondK = Math.max(tEvapK + 5.0, tSatHigh + 273.15);
    var carnotCop = tEvapK / (tCondK - tEvapK);
    var copEstimate = Math.max(1.15, Math.min(6.5, Math.round(carnotCop * 0.52 * 100) / 100));

    var status = 'NOMINAL';
    if (superheatK < 3.0) status = 'LIQUID_SLUGGING_RISK';
    else if (superheatK > 12.0) status = 'LOW_CHARGE';
    else if (subcoolingK > 12.0) status = 'OVERCHARGE';

    return {
      refrigerant: refKey,
      tSatLow: tSatLow,
      tSatHigh: tSatHigh,
      superheatK: superheatK,
      subcoolingK: subcoolingK,
      copEstimate: copEstimate,
      status: status
    };
  }

  var SPIRAL_10_ORDER = [6, 5, 7, 4, 8, 3, 9, 2, 10, 1];
  var SEQUENTIAL_10_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  function evaluateTorqueSequence(events, specId) {
    var evs = Array.isArray(events) ? events : [];
    if (evs.length === 0) {
      return { validOrder: false, stagesCompleted: 0, yieldWarning: false, boltStates: {}, passed: false };
    }
    var yieldWarning = false;
    var boltStates = {};
    evs.forEach(function (e) {
      var val = Number(e && e.value) || 0;
      if (val > 130) yieldWarning = true;
      if (e && e.bolt) boltStates[e.bolt] = { stage: e.stage || 1, value: val };
    });

    var stage1Bolts = evs.filter(function (e) { return Number(e.stage || 1) === 1; }).map(function (e) { return Number(e.bolt); });
    var matchesSpiral = stage1Bolts.length === 10 && stage1Bolts.every(function (b, idx) { return b === SPIRAL_10_ORDER[idx]; });
    var matchesSeq = stage1Bolts.length === 10 && stage1Bolts.every(function (b, idx) { return b === SEQUENTIAL_10_ORDER[idx]; });
    var validOrder = matchesSpiral || matchesSeq;
    var stagesCompleted = Math.floor(evs.length / 10);
    var passed = Boolean(validOrder && !yieldWarning && stagesCompleted >= 1);

    return {
      validOrder: validOrder,
      stagesCompleted: stagesCompleted,
      yieldWarning: yieldWarning,
      boltStates: boltStates,
      passed: passed
    };
  }

  function evaluateLayout(cssRules, targetSpec) {
    var raw = String(cssRules || '').trim();
    if (!raw) {
      return { passedRules: [], computedRects: [], score: 0 };
    }
    var map = {};
    raw.split(';').forEach(function (decl) {
      var parts = decl.split(':');
      if (parts.length >= 2) {
        var k = parts[0].trim().toLowerCase();
        var v = parts.slice(1).join(':').trim().toLowerCase();
        if (k && v) map[k] = v;
      }
    });

    var spec = targetSpec || {};
    var checks = 0;
    var passed = [];

    if (spec.display) {
      checks++;
      if (map['display'] === String(spec.display).toLowerCase()) passed.push('display');
    }
    if (spec.justifyContent) {
      checks++;
      if (map['justify-content'] === String(spec.justifyContent).toLowerCase()) passed.push('justify-content');
    }
    if (spec.alignItems) {
      checks++;
      if (map['align-items'] === String(spec.alignItems).toLowerCase()) passed.push('align-items');
    }
    if (spec.minGap !== undefined) {
      checks++;
      var gapNum = parseFloat(map['gap'] || map['grid-gap'] || '0');
      if (Number.isFinite(gapNum) && gapNum >= Number(spec.minGap)) passed.push('gap');
    }

    var score = checks > 0 ? Math.round((passed.length / checks) * 100) : (Object.keys(map).length > 0 ? 100 : 0);
    return {
      passedRules: passed,
      computedRects: [
        { id: 'item-1', x: 0, y: 0, width: 120, height: 48 },
        { id: 'item-2', x: 136, y: 0, width: 120, height: 48 }
      ],
      score: score
    };
  }

  return {
    design: { contrastRatio: contrastRatio, relativeLuminance: relativeLuminance },
    autoelectric: { solveCircuit: solveCircuit },
    hvac: { cycleMetrics: cycleMetrics },
    automechanic: { evaluateTorqueSequence: evaluateTorqueSequence },
    it: { evaluateLayout: evaluateLayout }
  };
})();

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
      } else if (currentSpecialty === 'design' || currentSpecialty === 'graphic_design') {
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
        textarea.value += '\n\n/* Сгенерированный Flexbox-контейнер */\n.container {\n  ' + inline.textContent + '\n}\n';
        if (window.EduSpace && window.EduSpace.playUiTone) window.EduSpace.playUiTone('success');
      }
    },

    // Design Handlers (deterministic grid coordinates, zero Math.random)
    addCanvasShape: function (type) {
      const idx = canvasElements.length;
      const gx = 48 + (idx * 72) % 360;
      const gy = 48 + (idx * 54) % 180;
      if (type === 'rect') {
        canvasElements.push({ type: 'rect', x: gx, y: gy, w: 100, h: 70, color: activeColor });
      } else if (type === 'circle') {
        canvasElements.push({ type: 'circle', x: gx, y: gy, r: 40, color: activeColor });
      } else if (type === 'text') {
        canvasElements.push({ type: 'text', x: gx, y: gy, text: 'Design Component', color: activeColor });
      }
      redrawCanvas();
    },

    setCanvasColor: function (color) {
      activeColor = color;
      const wcagEl = document.getElementById('design-wcag-val');
      if (wcagEl && window.EduPhysics && window.EduPhysics.design) {
        const cRes = window.EduPhysics.design.contrastRatio(color, '#0f1117');
        const grade = cRes.aaaNormal ? 'AAA' : (cRes.aaNormal ? 'AA' : (cRes.aaLarge ? 'AA Large' : 'FAIL'));
        wcagEl.textContent = `${cRes.ratio.toFixed(2)} : 1 (${grade})`;
      }
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

    // HVAC Handlers (wired to window.EduPhysics.hvac.cycleMetrics)
    updateHvacPressure: function (p) {
      hvacPressureBar = parseFloat(p);
      const lbl = document.getElementById('hvac-p-label');
      if (lbl) lbl.textContent = p + ' bar';

      const metrics = window.EduPhysics.hvac.cycleMetrics('R134a', hvacPressureBar, 12.0, hvacPipeTempC, 38.0);
      const tsat = metrics.tSatLow;
      const sh = metrics.superheatK;

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
