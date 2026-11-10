window.StarterLesson = (() => {
  const base = 'assets/starter-lesson/';
  const points = [
    { id: 'battery', label: 'A · Плюс АКБ', color: 0xe6ac47, x: -2, info: 'Начало силового плюсового кабеля.' },
    { id: 'starter', label: 'B · Силовой вход стартера', color: 0xd6894d, x: 2, info: 'Второй конец силового плюсового кабеля.' },
    { id: 'relay', label: 'C · Управляющее реле', color: 0x81c5a3, x: 0, info: 'Передаёт команду на пуск по управляющей ветви.' },
    { id: 'ground', label: 'D · Масса', color: 0x85b8d7, x: 0, info: 'Обратный путь через массу относится к минусовой стороне цепи.' },
  ];

  function matches(lesson) {
    return lesson.course_slug === 'autoelectric' && Number(lesson.order_num) === 3 &&
      /^Урок\s+3\.\s+Диагностика и ремонт системы пуска:/i.test(lesson.title);
  }

  function showTheory(canvas, onWatched) {
    canvas.innerHTML = `
      <section class="starter-panel">
        <div class="starter-heading"><span>АВТОЭЛЕКТРИКА / УРОК 03</span><h2>Диагностика системы пуска</h2>
        <p>Проследите путь тока и определите, какой участок нужно проверить на учебном стенде.</p></div>
        <div class="starter-grid">
          <div>
            <video class="starter-video" controls playsinline preload="metadata" aria-label="Как устроена цепь запуска" poster="${base}poster.jpg">
              <track kind="captions" srclang="ru" label="Русский" src="${base}captions-ru.vtt">
            </video>
            <p role="status" class="starter-video-status"></p>
            <button type="button" class="starter-button starter-primary" data-play>Воспроизвести</button>
            <button type="button" class="starter-button" data-retry hidden>Повторить загрузку</button>
            <details class="starter-notes">
              <summary>Конспект и источник</summary>
              <p>АКБ питает силовую ветвь, реле передаёт команду на пуск, а масса обеспечивает обратный путь тока.</p>
              <p>Падение напряжения на участке проверяют под нагрузкой. Для плюсового кабеля сравнивают потенциалы на плюсовой клемме АКБ и силовом входе стартера. Допустимые значения берут из документации на конкретный автомобиль.</p>
              <a href="https://www.denso-am.eu/news/starter-troubleshooting" target="_blank" rel="noopener noreferrer">Разбор диагностики стартера · DENSO</a>
            </details>
          </div>
          <aside class="starter-sidebar"><h3>Главы видео</h3>
            <button type="button" class="starter-button" data-time="0">00:00 · Цепь запуска</button>
            <button type="button" class="starter-button" data-time="18">00:18 · Плюсовой кабель</button>
            <button type="button" class="starter-button" data-time="36">00:36 · Задание на стенде</button>
          </aside>
        </div>
      </section>`;
    const video = canvas.querySelector('video');
    const status = canvas.querySelector('.starter-video-status');
    const retry = canvas.querySelector('[data-retry]');
    const play = canvas.querySelector('[data-play]');
    const chapters = canvas.querySelectorAll('[data-time]');
    function enableChapters(enabled) {
      chapters.forEach(button => { button.disabled = !enabled; });
    }
    function showError() {
      status.textContent = 'Видео недоступно. Повторите загрузку или откройте конспект.';
      retry.hidden = false;
      play.disabled = true;
      enableChapters(false);
    }
    function load() {
      status.textContent = 'Загружаем видео…';
      retry.hidden = true;
      play.disabled = false;
      enableChapters(false);
      video.src = base + 'overview.mp4';
      video.load();
    }
    video.addEventListener('error', showError);
    video.addEventListener('loadedmetadata', () => {
      status.textContent = '';
      enableChapters(true);
    });
    video.addEventListener('playing', () => {
      play.textContent = 'Пауза';
      status.textContent = '';
    });
    video.addEventListener('pause', () => { play.textContent = 'Воспроизвести'; });
    video.addEventListener('ended', () => { if (video.isConnected) onWatched(); });
    play.addEventListener('click', () => {
      if (!video.paused) {
        video.pause();
        return;
      }
      video.play().catch(error => {
        if (error.name !== 'AbortError' && video.isConnected) showError();
      });
    });
    retry.addEventListener('click', load);
    chapters.forEach(button => button.addEventListener('click', () => {
      video.currentTime = Number(button.dataset.time);
    }));
    load();
  }

  function mountModel(container, onSelect) {
    const T = window.THREE;
    if (!T) return null;
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return null;
    }
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 50);
    const frame = new T.Group();
    const solids = [];
    scene.add(frame, new T.HemisphereLight(0xffffff, 0x234539, 1.2));
    const key = new T.DirectionalLight(0xfff0cf, 1.2);
    key.position.set(2, 5, 4);
    scene.add(key);

    function mesh(geometry, color, x, y, z, group = frame) {
      const item = new T.Mesh(geometry, new T.MeshStandardMaterial({ color }));
      item.position.set(x, y, z);
      group.add(item);
      return item;
    }
    mesh(new T.BoxGeometry(6.5, .2, 3.2), 0x365848, 0, -.13, 0);
    for (const point of points) {
      const group = new T.Group();
      group.userData.point = point.id;
      group.position.set(point.x, 0, point.id === 'relay' ? -.9 : point.id === 'ground' ? 1 : 0);
      frame.add(group);
      if (point.id === 'starter') {
        mesh(new T.CylinderGeometry(.48, .48, 1.24, 24), point.color, 0, .58, 0, group).rotation.z = Math.PI / 2;
        mesh(new T.CylinderGeometry(.23, .23, .7, 20), 0xafbec8, .1, 1.05, 0, group).rotation.z = Math.PI / 2;
      } else {
        const [w, h, d] = point.id === 'battery' ? [1.22, .7, .85] : point.id === 'relay' ? [.65, .52, .65] : [.65, .15, .52];
        mesh(new T.BoxGeometry(w, h, d), point.color, 0, h / 2, 0, group);
        mesh(new T.CylinderGeometry(.09, .09, .15, 14), 0xd1d9d2, -.18, h, 0, group);
        mesh(new T.CylinderGeometry(.09, .09, .15, 14), 0xd1d9d2, .18, h, 0, group);
      }
      const marker = mesh(new T.SphereGeometry(.16, 16, 10), 0xffcf66, 0, 1.38, 0, group);
      marker.visible = false;
      solids.push({ id: point.id, group, marker });
    }
    function wire(color, coordinates) {
      const path = new T.CatmullRomCurve3(coordinates.map(p => new T.Vector3(...p)));
      mesh(new T.TubeGeometry(path, 30, .05, 8, false), color, 0, 0, 0);
    }
    wire(0xf4a74b, [[-1.83,.73,0],[-1.1,.22,.25],[1.05,.25,.26],[1.6,.64,0]]);
    wire(0x81c5a3, [[-1.85,.74,-.12],[-1.2,.14,-.9],[0,.48,-.9],[1.15,.22,-.8],[2.15,1,-.08]]);
    wire(0x85b8d7, [[-2.18,.74,0],[-2.15,.18,1],[0,.2,1],[1.75,.16,1],[2.4,.35,.1]]);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.append(renderer.domElement);
    let angle = -.42;
    let distance = 8;
    function draw() {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.position.set(Math.sin(angle) * distance, distance * .5, Math.cos(angle) * distance);
      camera.lookAt(0, .32, 0);
      renderer.render(scene, camera);
    }
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    draw();
    const ray = new T.Raycaster();
    const pointer = new T.Vector2();
    const targets = solids.map(({ group }) => group);
    renderer.domElement.addEventListener('click', event => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
        1 - (event.clientY - rect.top) / rect.height * 2);
      ray.setFromCamera(pointer, camera);
      let hit = ray.intersectObjects(targets, true)[0]?.object;
      while (hit && !hit.userData.point) hit = hit.parent;
      if (hit) onSelect(hit.userData.point);
    });
    return {
      select(ids) {
        solids.forEach(({ id, marker }) => { marker.visible = ids.includes(id); });
        draw();
      },
      view(action) {
        if (action === 'left') angle -= .35;
        if (action === 'right') angle += .35;
        if (action === 'closer') distance = Math.max(5, distance - .7);
        if (action === 'farther') distance = Math.min(13, distance + .7);
        if (action === 'reset') { angle = -.42; distance = 8; }
        draw();
      },
      dispose() {
        observer.disconnect();
        frame.traverse(item => {
          item.geometry?.dispose();
          item.material?.dispose();
        });
        renderer.dispose();
      },
    };
  }

  function showPractice(canvas, previous, onPassed) {
    canvas.innerHTML = `
      <section class="starter-panel">
        <div class="starter-heading"><span>ПРАКТИКА / УЧЕБНЫЙ СТЕНД</span><h2>Точки измерения</h2>
        <p>Стартер вращается медленно. Выберите две точки для проверки падения напряжения на плюсовом кабеле.</p></div>
        <div class="starter-grid">
          <div>
            <div class="starter-model" hidden aria-label="Трёхмерная модель системы пуска"></div>
            <div class="starter-view" hidden aria-label="Управление моделью" role="group">
              <button type="button" class="starter-button" data-view="left" aria-label="Повернуть влево">↶</button>
              <button type="button" class="starter-button" data-view="right" aria-label="Повернуть вправо">↷</button>
              <button type="button" class="starter-button" data-view="closer" aria-label="Приблизить">+</button>
              <button type="button" class="starter-button" data-view="farther" aria-label="Отдалить">−</button>
              <button type="button" class="starter-button" data-view="reset">Сбросить вид</button>
            </div>
            <details class="starter-notes" open>
              <summary>Учебная схема</summary>
              <ul><li>A → B · силовой плюсовой кабель</li><li>C · управляющая ветвь</li><li>D · обратный путь через массу</li></ul>
            </details>
          </div>
          <form class="starter-sidebar"><fieldset><legend>Контрольные точки</legend>
            ${points.map(({ id, label }) => `<label class="starter-point"><input type="checkbox" name="point" value="${id}"> ${label}</label>`).join('')}
            </fieldset>
            <p class="starter-point-info" aria-live="polite">Выберите детали на модели или в списке.</p>
            <button type="submit" class="starter-button starter-primary">Проверить ответ</button>
            <p class="starter-feedback" role="status"></p>
          </form>
        </div>
      </section>`;
    const container = canvas.querySelector('.starter-model');
    const view = canvas.querySelector('.starter-view');
    const form = canvas.querySelector('form');
    const feedback = canvas.querySelector('.starter-feedback');
    const inputs = Array.from(form.elements.point);
    container.hidden = false;
    const model = mountModel(container, id => {
      const input = inputs.find(item => item.value === id);
      if (input && !input.matches(':disabled')) input.click();
    });
    container.hidden = !model;
    view.hidden = !model;
    canvas.querySelector('details').open = !model;
    canvas.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => model?.view(button.dataset.view)));
    if (previous.starterPassed) {
      inputs.forEach(input => { input.checked = previous.points?.includes(input.value) ?? false; });
      model?.select(previous.points || []);
      form.querySelector('fieldset').disabled = true;
      form.querySelector('[type="submit"]').disabled = true;
      feedback.textContent = 'Задание выполнено. Ответ восстановлен.';
    }
    form.addEventListener('change', event => {
      const point = points.find(item => item.id === event.target.value);
      model?.select(inputs.filter(input => input.checked).map(input => input.value));
      canvas.querySelector('.starter-point-info').textContent = point.info;
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const selected = inputs.filter(input => input.checked).map(input => input.value);
      if (selected.length !== 2 || !selected.includes('battery') || !selected.includes('starter')) {
        feedback.textContent = selected.length !== 2 ? 'Выберите ровно две точки.' : 'Нужны два конца одного силового плюсового кабеля. Проверьте схему и попробуйте ещё раз.';
        return;
      }
      form.querySelector('fieldset').disabled = true;
      form.querySelector('[type="submit"]').disabled = true;
      feedback.textContent = 'Верно. Между A и B находится плюсовой кабель. Сохраняем результат…';
      const saved = await onPassed({ starterPassed: true, points: selected });
      feedback.textContent = saved === 'server' ? 'Верно. Результат сохранён в аккаунте.' :
        saved === 'local' ? 'Верно. Результат сохранён в этом браузере.' :
        'Верно. Сохранение недоступно, результат доступен до закрытия страницы.';
    });
    return () => model?.dispose();
  }

  return { matches, showTheory, showPractice };
})();
