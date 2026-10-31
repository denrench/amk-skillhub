/* EDU SPACE - Complete Interactive Logistics Engine */

// Toast notification helper
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('edu-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'edu-toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white');
  const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');

  toast.className = `${bg} pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 transform translate-y-5 opacity-0`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">${icon}</span>
    <span>${message}</span>
    <button type="button" class="ml-2 hover:opacity-75" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[16px]">close</span>
    </button>
  `;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-5', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// User session management
function getActiveUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function setActiveUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  document.cookie = `user_id=${user.id}; path=/; max-age=86400`;
  document.cookie = `user_role=${user.role}; path=/; max-age=86400`;
}

function logoutUser() {
  localStorage.removeItem('currentUser');
  document.cookie = 'user_id=; path=/; max-age=0';
  document.cookie = 'user_role=; path=/; max-age=0';
  showToast('Вы вышли из системы', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

// Modal helper
function openModal(title, contentHtml) {
  let modalOverlay = document.getElementById('edu-global-modal');
  if (modalOverlay) modalOverlay.remove();

  modalOverlay = document.createElement('div');
  modalOverlay.id = 'edu-global-modal';
  modalOverlay.className = 'fixed inset-0 z-[9990] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200';
  modalOverlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up border border-slate-200">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 class="font-headline-sm text-base font-bold text-slate-900">${title}</h3>
        <button type="button" class="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200" onclick="closeModal()">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div class="p-6 overflow-y-auto text-slate-800 text-sm">
        ${contentHtml}
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

function closeModal() {
  const modalOverlay = document.getElementById('edu-global-modal');
  if (modalOverlay) modalOverlay.remove();
}

// Global Logistics Initializer
document.addEventListener('DOMContentLoaded', function() {
  const user = getActiveUser();

  // 1. Fix all logo links
  document.querySelectorAll('a').forEach(a => {
    if (a.textContent.includes('EDU SPACE')) {
      a.href = 'index.html';
    }
  });

  // 2. Global Header User Widget
  const header = document.querySelector('header');
  if (header) {
    const userContainer = header.querySelector('.flex.items-center.gap-3:last-child');
    if (userContainer) {
      if (user) {
        const isTeacher = user.role === 'teacher';
        const cabinetLink = isTeacher ? 'teacher.html' : 'student.html';
        userContainer.innerHTML = `
          <a href="${cabinetLink}" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              ${(user.full_name || user.username || 'U')[0].toUpperCase()}
            </div>
            <div class="text-left hidden md:block">
              <div class="text-xs font-bold text-slate-900 leading-tight">${user.full_name || user.username}</div>
              <div class="text-[10px] text-indigo-600 font-semibold">${isTeacher ? 'Преподаватель' : 'Студент'}</div>
            </div>
          </a>
          <a href="${cabinetLink}" class="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all shadow-sm">
            Кабинет
          </a>
          <button type="button" id="globalLogoutBtn" title="Выйти из аккаунта" class="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
            <span class="material-symbols-outlined text-[20px]">logout</span>
          </button>
        `;
        document.getElementById('globalLogoutBtn')?.addEventListener('click', logoutUser);
      } else {
        // If not logged in, ensure "Войти" and "Регистрация" buttons lead to auth.html
        userContainer.querySelectorAll('a').forEach(a => {
          const t = a.textContent.toLowerCase();
          if (t.includes('войти')) a.href = 'auth.html?mode=login';
          if (t.includes('регистрация')) a.href = 'auth.html?mode=register';
        });
      }
    }
  }

  // 3. Initialize Logistics for Current Page
  initAllInteractions();
});

function initAllInteractions() {
  function findAllByText(pattern) {
    return Array.from(document.querySelectorAll('button, a')).filter(el => {
      const t = el.textContent.toLowerCase();
      return pattern.test(t);
    });
  }

  // --- NOTIFICATIONS & CHAT BUTTONS ---
  document.querySelectorAll('button, a').forEach(btn => {
    const text = btn.textContent.trim();
    if (text === 'notifications' || btn.querySelector('.material-symbols-outlined')?.textContent === 'notifications') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('🔔 Академические уведомления', `
          <div class="flex flex-col gap-3">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <span class="material-symbols-outlined text-indigo-600 text-[20px] mt-0.5">verified</span>
              <div>
                <div class="text-sm font-bold text-slate-900">Практическая работа №3 проверена</div>
                <div class="text-xs text-slate-600">Оценка: A (100/100). Преподаватель оставил комментарий к коду.</div>
                <div class="text-[10px] text-indigo-600 mt-1 font-semibold">Сегодня, 08:30</div>
              </div>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <span class="material-symbols-outlined text-amber-600 text-[20px] mt-0.5">timer</span>
              <div>
                <div class="text-sm font-bold text-slate-900">Ближайший дедлайн: Графовые алгоритмы</div>
                <div class="text-xs text-slate-600">Срок сдачи лабораторной работы истекает через 3 дня.</div>
                <div class="text-[10px] text-amber-600 mt-1 font-semibold">До 3 ноября</div>
              </div>
            </div>
          </div>
        `);
      });
    }

    if (text === 'chat' || btn.querySelector('.material-symbols-outlined')?.textContent === 'chat') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('💬 Сообщения и консультации', `
          <div class="flex flex-col gap-3">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">МВ</div>
                <div>
                  <div class="text-sm font-bold text-slate-900">Михаил Власов (Куратор)</div>
                  <div class="text-xs text-emerald-600 font-medium">● В сети</div>
                </div>
              </div>
              <button class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700" onclick="showToast('Чат открыт'); closeModal();">Написать</button>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">ПК</div>
                <div>
                  <div class="text-sm font-bold text-slate-900">Профессор Кузнецов</div>
                  <div class="text-xs text-slate-500">Был 20 минут назад</div>
                </div>
              </div>
              <button class="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-300" onclick="showToast('Чат открыт'); closeModal();">Написать</button>
            </div>
          </div>
        `);
      });
    }
  });

  // --- SIMULATOR & TASKS LOGISTICS ---
  // Format toolbar in simulator
  const simTextarea = document.querySelector('textarea');
  if (simTextarea) {
    document.querySelectorAll('button').forEach(btn => {
      const icon = btn.querySelector('.material-symbols-outlined')?.textContent.trim();
      if (['format_bold', 'format_italic', 'code', 'link', 'format_list_bulleted'].includes(icon)) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const start = simTextarea.selectionStart;
          const end = simTextarea.selectionEnd;
          const selected = simTextarea.value.substring(start, end) || 'текст';
          let wrap = ['', ''];
          if (icon === 'format_bold') wrap = ['**', '**'];
          if (icon === 'format_italic') wrap = ['*', '*'];
          if (icon === 'code') wrap = ['`', '`'];
          if (icon === 'link') wrap = ['[', '](https://)'];
          if (icon === 'format_list_bulleted') wrap = ['\\n- ', ''];
          simTextarea.setRangeText(wrap[0] + selected + wrap[1], start, end, 'select');
          simTextarea.focus();
        });
      }
    });

    // Save Draft button
    findAllByText(/сохранить черновик/).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('sim_draft_task_3', simTextarea.value);
        showToast('Черновик успешно сохранён в браузере!', 'success');
      });
    });
  }

  // --- TEACHER PORTAL LOGISTICS ---
  // "Создать задание" button
  findAllByText(/создать задание/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('➕ Создание нового практического задания', `
        <form onsubmit="event.preventDefault(); showToast('Задание успешно создано и добавлено в систему!'); closeModal();">
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 mb-1">Название задания</label>
            <input type="text" placeholder="например: Практическая работа №11: Docker Compose" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" required />
          </div>
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 mb-1">Специальность</label>
            <select class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
              <option>Информационные технологии</option>
              <option>Автомеханика</option>
              <option>Криогенная техника</option>
              <option>Графический дизайн</option>
              <option>Мебельное производство</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 mb-1">Максимальный балл</label>
            <input type="number" value="100" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" />
          </div>
          <div class="mb-4">
            <label class="block text-xs font-bold text-slate-700 mb-1">Критерии оценивания (Рубрика)</label>
            <textarea rows="3" placeholder="Требования к коду, архитектуре, оформлению..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">Код оформлен по стандартам, автотесты пройдены, интеграция API без ошибок.</textarea>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all">Опубликовать задание</button>
        </form>
      `);
    });
  });

  // "Электронный журнал" button -> scroll to journal section
  findAllByText(/электронный журнал/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const el = document.getElementById('journal-section') || document.querySelector('table');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Переход к электронному журналу', 'info');
      }
    });
  });

  // "Сводная ведомость всех групп" button
  findAllByText(/сводная ведомость/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('📊 Сводная ведомость успеваемости групп', `
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div class="font-bold text-slate-900">Группа ИТ-21 (Веб-разработка)</div>
              <div class="text-xs text-slate-500">24 студента • 94% сдачи в срок</div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Средний: 4.88</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div class="font-bold text-slate-900">Группа ИТ-22 (Архитектура ПО)</div>
              <div class="text-xs text-slate-500">22 студента • 88% сдачи в срок</div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Средний: 4.75</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div class="font-bold text-slate-900">Группа АВ-19 (Автодиагностика)</div>
              <div class="text-xs text-slate-500">20 студентов • 91% сдачи в срок</div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Средний: 4.82</span>
          </div>
          <button class="mt-2 w-full py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700" onclick="exportCsvJournal(); closeModal();">
            📥 Экспортировать ведомость (CSV/Excel)
          </button>
        </div>
      `);
    });
  });

  // "Экспорт" / "Экспорт ведомости"
  findAllByText(/экспорт ведомости|экспорт в xlsx|экспорт/).forEach(btn => {
    if (!btn.getAttribute('data-bound-export')) {
      btn.setAttribute('data-bound-export', 'true');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        exportCsvJournal();
      });
    }
  });

  // Table row "Проверить" buttons in teacher portal
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.trim() === 'Проверить') {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const row = btn.closest('tr') || btn.closest('.flex');
        const studentName = row ? (row.querySelector('span, td, .font-semibold')?.textContent.trim() || 'Константин Воронов') : 'Константин Воронов';
        const taskName = 'Практическая работа №3: Интерактивный UI-компонент';

        openModal(`📝 Проверка работы: ${studentName}`, `
          <div class="flex flex-col gap-3">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <div class="font-bold text-slate-900 mb-1">${taskName}</div>
              <div>Решение студента: <span class="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">github.com/voronov/ui-component</span></div>
              <div class="mt-1 text-emerald-700 font-semibold">✓ Автотесты V8: 10/10 пройдено успешно</div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Оценка (баллы 0-100):</label>
              <input type="number" id="gradeScoreInput" value="98" min="0" max="100" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Буквенная оценка:</label>
              <select id="gradeLetterInput" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option value="A">A (Отлично, 90-100)</option>
                <option value="B">B (Хорошо, 75-89)</option>
                <option value="C">C (Удовлетворительно, 60-74)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Рецензия преподавателя:</label>
              <textarea id="gradeCommentInput" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">Отличная декомпозиция компонентов, корректная типизация TypeScript и быстрая обработка асинхронных ответов API.</textarea>
            </div>
            <button type="button" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all" id="saveGradeBtn">
              ✓ Выставить оценку в журнал
            </button>
          </div>
        `);

        document.getElementById('saveGradeBtn')?.addEventListener('click', async () => {
          const score = document.getElementById('gradeScoreInput')?.value || 98;
          const letter = document.getElementById('gradeLetterInput')?.value || 'A';
          const comment = document.getElementById('gradeCommentInput')?.value || '';

          btn.textContent = `Проверено (${score}/100, ${letter})`;
          btn.className = 'px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-default';
          btn.disabled = true;

          closeModal();
          showToast(`Оценка для ${studentName} сохранена в журнале: ${score} баллов (${letter})!`, 'success');

          try {
            await fetch('/api/teacher/grade_submission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                submission_id: 1,
                grade: letter,
                score: parseInt(score),
                teacher_comment: comment
              })
            });
          } catch(e) {}
        });
      });
    }
  });

  // "Начать онлайн-сессию"
  findAllByText(/начать онлайн-сессию/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('🎥 Онлайн-аудитория EDU SPACE', `
        <div class="flex flex-col gap-4 text-center">
          <div class="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
            <span class="material-symbols-outlined text-[32px]">videocam</span>
          </div>
          <div>
            <h4 class="font-bold text-base text-slate-900">Сессия готова к запуску</h4>
            <p class="text-xs text-slate-500 mt-1">Ссылка для подключения студентов группы ИТ-21 сгенерирована.</p>
          </div>
          <div class="p-3 bg-slate-100 rounded-xl font-mono text-xs text-slate-700 break-all select-all">
            https://eduspace.amk.kz/room/it21-practice-stream
          </div>
          <button class="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700" onclick="showToast('Трансляция запущена!'); closeModal();">
            Подключиться к трансляции
          </button>
        </div>
      `);
    });
  });

  // "Создать опрос / квиз"
  findAllByText(/создать опрос/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('📋 Экспресс-опрос для группы', `
        <form onsubmit="event.preventDefault(); showToast('Опрос успешно запущен для студентов!'); closeModal();">
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 mb-1">Вопрос квиза</label>
            <input type="text" value="Какова алгоритмическая сложность поиска в B-Tree?" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" />
          </div>
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 mb-1">Варианты ответов (через запятую)</label>
            <input type="text" value="O(log n), O(n), O(1), O(n log n)" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" />
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700">Запустить опрос</button>
        </form>
      `);
    });
  });

  // "Загрузить лекцию"
  findAllByText(/загрузить лекцию/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.docx,.pptx,.zip';
      input.onchange = () => {
        if (input.files.length > 0) {
          showToast(`Файл "${input.files[0].name}" успешно загружен для группы!`, 'success');
        }
      };
      input.click();
    });
  });

  // "Рассылка группе"
  findAllByText(/рассылка группе/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('📢 Объявление для всей группы', `
        <form onsubmit="event.preventDefault(); showToast('Объявление разослано всем студентам группы!'); closeModal();">
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 mb-1">Тема рассылки</label>
            <input type="text" value="Напоминание о защите практических работ" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" />
          </div>
          <div class="mb-4">
            <label class="block text-xs font-bold text-slate-700 mb-1">Текст сообщения</label>
            <textarea rows="3" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600">Коллеги, защита практических работ №3-5 состоится в среду в 10:00 в аудитории 402.</textarea>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700">Отправить рассылку</button>
        </form>
      `);
    });
  });

  // --- PROFILE LOGISTICS ---
  // "Поделиться портфолио"
  findAllByText(/поделиться портфолио/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard?.writeText(window.location.href);
      showToast('Ссылка на портфолио скопирована в буфер обмена!', 'success');
    });
  });

  // "Редактировать профиль"
  findAllByText(/редактировать профиль|редактировать/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = getActiveUser() || { full_name: 'Константин Воронов', email: 'voronov@student.amk.kz' };
      openModal('✏️ Редактирование профиля', `
        <form onsubmit="
          event.preventDefault();
          const newName = document.getElementById('editFullName').value;
          const newEmail = document.getElementById('editEmail').value;
          const u = getActiveUser() || {};
          u.full_name = newName;
          u.email = newEmail;
          setActiveUser(u);
          showToast('Профиль успешно обновлён!');
          closeModal();
          setTimeout(() => window.location.reload(), 400);
        ">
          <div class="mb-3">
            <label class="block text-xs font-bold text-slate-700 mb-1">ФИО</label>
            <input type="text" id="editFullName" value="${user.full_name || 'Константин Воронов'}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" required />
          </div>
          <div class="mb-4">
            <label class="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input type="email" id="editEmail" value="${user.email || 'voronov@student.amk.kz'}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" required />
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700">Сохранить изменения</button>
        </form>
      `);
    });
  });

  // "Экспорт справки (PDF)"
  findAllByText(/справка \(pdf\)|экспорт справки/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Формирование академической справки (PDF)...', 'info');
      setTimeout(() => window.print(), 500);
    });
  });

  // --- SOCIAL LOGIN BUTTONS IN AUTH ---
  findAllByText(/google|vk id|яндекс/).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.textContent.includes('Google') ? 'Google' : (btn.textContent.includes('VK') ? 'VK ID' : 'Яндекс');
      const mockUser = {
        id: Date.now(),
        username: `user_${service.toLowerCase()}`,
        full_name: `Студент (${service})`,
        role: 'student',
        email: `student@${service.toLowerCase()}.com`
      };
      setActiveUser(mockUser);
      showToast(`Успешный вход через ${service}!`, 'success');
      setTimeout(() => window.location.href = 'student.html', 500);
    });
  });
}

function exportCsvJournal() {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "№,Студент,Группа,Специальность,Задание,Балл,Оценка,Статус\\n"
    + "1,Константин Воронов,ИТ-21,Информационные технологии,UI-компонент,100,A,Зачтено\\n"
    + "2,Алина Семенова,ИТ-21,Информационные технологии,UI-компонент,95,A,Зачтено\\n"
    + "3,Артур Бауыржанұлы,ИТ-22,Информационные технологии,Docker Compose,92,A,Зачтено\\n"
    + "4,Диана Ким,ГД-18,Графический дизайн,Брендинг и гайдлайн,96,A,Зачтено\\n"
    + "5,Ильяс Сапаров,АВ-19,Автомеханика,Диагностика OBD-II,90,A,Зачтено\\n";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "vedomost_uspevaemosti_amk.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Ведомость успеваемости скачана в формате CSV/Excel!', 'success');
}
