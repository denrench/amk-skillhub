window.WorkshopModels = (() => {
  const lessons = {
    'it-7': {
      title: 'Слои CSS-блока',
      parts: [
        ['Контент', 'Область, в которой находится содержимое.', 'box', [1.65, .19, .9], [0,.95,0], 0xffd275],
        ['Внутренний отступ', 'Пространство между контентом и границей.', 'box', [2.4, .17, 1.5], [0,.62,0], 0x86c6a5],
        ['Граница', 'Обрамление области блока.', 'box', [2.8,.16,1.8], [0,.30,0], 0x75adc3],
        ['Внешний отступ', 'Пространство снаружи границы, между блоком и соседями.', 'box', [3.5,.1,2.3], [0,.04,0], 0x8b8db9],
      ],
    },
    'graphic_design-8': {
      title: 'Грани упаковки',
      parts: [
        ['Лицевая грань', 'На лицевой панели размещают основное изображение и название.', 'box', [1.55,1.42,.07], [0,.72,.58], 0xfbd275],
        ['Боковые грани', 'Проверьте, как графика проходит через сгиб.', 'box', [.07,1.42,1.15], [.78,.72,0], 0x86c6a5],
        ['Клапан', 'Клапан закрывает коробку. Его контур и сгиб обозначаются на развёртке.', 'box', [1.55,.07,1.18], [0,1.45,0], 0x75adc3],
        ['Корпус', 'На сборке видно, какие панели окажутся рядом.', 'box', [1.49,1.4,1.07], [0,.71,0], 0x607a6b],
      ],
    },
    'autoelectric-8': {
      title: 'Участок сети CAN',
      parts: [
        ['Первый узел', 'Обменивается сообщениями через общую пару линий.', 'box', [.7,.63,.75], [-1.65,.38,0], 0x86c6a5],
        ['CAN High', 'Один провод дифференциальной пары.', 'wave', [1], [0,.43,0], 0xfbd275],
        ['CAN Low', 'Второй провод дифференциальной пары.', 'wave', [-1], [0,.43,0], 0x75adc3],
        ['Второй узел', 'Принимает и передаёт данные по тем же линиям.', 'box', [.7,.63,.75], [1.65,.38,0], 0x86c6a5],
      ],
    },
    'hvac-1': {
      title: 'Узлы холодильного контура',
      parts: [
        ['Компрессор', 'Повышает давление пара.', 'cylinder', [.34,.65], [-1.3,.38,.75], 0xfbd275],
        ['Конденсатор', 'Передаёт тепло наружу. Хладагент конденсируется.', 'box', [.62,.70,.8], [-1.3,.38,-.75], 0xe48a72],
        ['Дросселирующий узел', 'Давление хладагента снижается на участке дросселирования.', 'cylinder', [.18,.30], [1.3,.25,-.75], 0x86c6a5],
        ['Испаритель', 'Хладагент испаряется, поглощая тепло.', 'box', [.65,.58,.8], [1.3,.38,.75], 0x75adc3],
      ],
      loop: true,
    },
    'automechanic-1': {
      title: 'Разрез цилиндра двигателя',
      parts: [
        ['Стенка цилиндра', 'Ограничивает рабочую полость; разрез открывает обзор.', 'cut', [.75,1.65], [0,.93,0], 0x75adc3],
        ['Поршень', 'Движется внутри цилиндра.', 'cylinder', [.58,.28], [0,.65,0], 0xfbd275],
        ['Впускной клапан', 'Открывает путь поступающему воздуху.', 'cylinder', [.12,.45], [-.30,1.72,0], 0x86c6a5],
        ['Выпускной клапан', 'Открывает путь отработавшим газам.', 'cylinder', [.12,.45], [.30,1.72,0], 0xe48a72],
      ],
    },
  };

  function geometry(T, shape, params) {
    if (shape === 'box') return new T.BoxGeometry(...params);
    if (shape === 'cylinder') return new T.CylinderGeometry(params[0], params[0], params[1], 28);
    if (shape === 'cut') return new T.CylinderGeometry(params[0], params[0], params[1], 28, 1, true, Math.PI / 2, Math.PI);
    const curve = new T.CatmullRomCurve3(Array.from({length: 37}, (_, i) =>
      new T.Vector3(-1.35 + i * .075, Math.sin(i * .48) * .15 * params[0], Math.cos(i * .48) * .15 * params[0])));
    return new T.TubeGeometry(curve, 45, .045, 8, false);
  }

  function show(canvas, definition) {
    const { title, parts } = definition;
    canvas.innerHTML = `
      <section class="starter-panel workshop-model-panel">
        <div class="starter-heading"><span>УЧЕБНАЯ МОДЕЛЬ</span><h2>${title}</h2>
          <p>Выберите элемент, чтобы увидеть его назначение.</p></div>
        <div class="starter-grid">
          <div>
            <div class="workshop-visual" aria-label="${title}" hidden></div>
            <div class="starter-view" role="group" aria-label="Управление видом" hidden>
              <button type="button" class="starter-button" data-angle="-1">Повернуть влево</button>
              <button type="button" class="starter-button" data-angle="1">Повернуть вправо</button>
              <button type="button" class="starter-button" data-angle="0">Сбросить вид</button>
            </div>
          </div>
          <aside class="starter-sidebar" aria-label="Элементы модели">
            ${parts.map(([label], i) => `<button type="button" class="starter-button" data-part="${i}" aria-pressed="false">${label}</button>`).join('')}
            <p role="status">Выберите элемент из списка.</p>
          </aside>
        </div>
      </section>`;
    const stage = canvas.querySelector('.workshop-visual');
    const toolbar = canvas.querySelector('.starter-view');
    const status = canvas.querySelector('[role="status"]');
    const buttons = canvas.querySelectorAll('[data-part]');
    const T = window.THREE;
    let renderer;
    try {
      if (T) renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // The component list remains available without a WebGL context.
    }
    if (!renderer) status.textContent = '3D недоступно. Выберите элемент в списке, чтобы прочитать описание.';
    let draw;
    let meshes = [];
    let dispose;
    if (renderer) {
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(38, 1, .1, 25);
      const key = new T.DirectionalLight(0xffffff, 1.3);
      key.position.set(3, 5, 4);
      scene.add(key, new T.HemisphereLight(0xffffff, 0x375347, 1));
      meshes = parts.map(([, , shape, params, position, color]) => {
        const item = new T.Mesh(geometry(T, shape, params), new T.MeshStandardMaterial({ color, side: T.DoubleSide }));
        item.position.set(...position);
        scene.add(item);
        return item;
      });
      if (definition.loop) {
        const path = new T.CatmullRomCurve3(parts.map(([, , , [x, , z]]) => new T.Vector3(x, .21, z)), true);
        scene.add(new T.Mesh(new T.TubeGeometry(path, 44, .045, 8, true), new T.MeshStandardMaterial({ color: 0xe4ddd0 })));
      }
      let angle = .4;
      draw = () => {
        const width = stage.clientWidth || 1;
        const height = stage.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        camera.position.set(Math.sin(angle) * 5, 2.8, Math.cos(angle) * 5);
        camera.lookAt(0, .57, 0);
        renderer.render(scene, camera);
      };
      stage.hidden = false;
      toolbar.hidden = false;
      stage.append(renderer.domElement);
      const resize = new ResizeObserver(draw);
      resize.observe(stage);
      toolbar.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        const step = Number(button.dataset.angle);
        angle = step ? angle + step * .35 : .4;
        draw();
      }));
      draw();
      dispose = () => {
        resize.disconnect();
        scene.traverse(item => {
          item.geometry?.dispose();
          item.material?.dispose();
        });
        renderer.dispose();
      };
    }
    buttons.forEach((button, i) => button.addEventListener('click', () => {
      buttons.forEach(peer => peer.setAttribute('aria-pressed', String(peer === button)));
      status.textContent = parts[i][1];
      meshes.forEach((mesh, index) => mesh.material.emissive.setHex(i === index ? 0x655327 : 0x000000));
      draw?.();
    }));
    return dispose;
  }

  function forLesson(lesson) {
    const key = `${lesson.course_slug}-${lesson.order_num}`;
    const catalogTitle = window.EDU_LESSONS?.[lesson.course_slug]?.find(item => item.num === Number(lesson.order_num))?.title;
    return catalogTitle && lesson.title === catalogTitle ? lessons[key] : undefined;
  }

  return { forLesson, show };
})();
