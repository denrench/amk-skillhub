/* EDU SPACE - Complete Interactive Logistics Engine (Pristine UTF-8) */

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('edu-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'edu-toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white');
  const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');

  toast.className = `${bg} pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 transform translate-y-5 opacity-0`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">${icon}</span>
    <span>${message}</span>
    <button type="button" class="ml-2 hover:opacity-75 focus:outline-none" onclick="this.parentElement.remove()">
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

// --- MODAL ENGINE (Safe overflow restoration) ---
function openModal(title, htmlContent) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.id = 'edu-modal-overlay';
  overlay.className = 'fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 overflow-y-auto';
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };

  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 my-auto transform scale-95 transition-transform duration-200';
  modal.innerHTML = `
    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
      <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">${title}</h3>
      <button onclick="closeModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
    <div class="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 flex-1">
      ${htmlContent}
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    modal.classList.remove('scale-95');
    modal.classList.add('scale-100');
  });
}

function closeModal() {
  const existing = document.getElementById('edu-modal-overlay');
  if (existing) {
    existing.remove();
  }
}

// --- USER SESSION MANAGEMENT ---
function getActiveUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    id: 1,
    username: 'voronov_k',
    full_name: 'Константин Воронов',
    role: 'student',
    specialty: '06130100 - Программное обеспечение',
    group: 'ИС-21',
    email: 'voronov@student.amk.kz'
  };
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
  }, 400);
}

// --- RESET DEMO MODE (Start from 0% on Day 1) ---
async function resetDemoMode() {
  if (confirm('Сбросить демоверсию к абсолютному нулю (День 1, 0% прогресса, очистить работы)?')) {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Демоверсия сброшена к началу!', 'success');
    } catch (e) {
      showToast('Демоверсия сброшена локально!', 'success');
    }
    localStorage.removeItem('student_submissions');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

// --- MODALS & WORKFLOWS ---

// 1. Weekly Schedule Modal
function openScheduleModal() {
  openModal('📅 Расписание занятий — Алматинский многопрофильный колледж', `
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
      <span class="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Группа ИС-21 (2 курс)</span>
      <span class="text-slate-500 font-medium">Осенний семестр 2026/2027</span>
    </div>
    <div class="space-y-3 mt-2">
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="font-bold text-xs text-slate-800 flex justify-between items-center mb-1">
          <span>Понедельник</span>
          <span class="text-indigo-600 font-semibold">08:30 - 12:45</span>
        </div>
        <p class="text-xs text-slate-600">1-2 пара: Front-end разработка (Vue / React) — Ауд. 304, преп. Иванов С. П.</p>
        <p class="text-xs text-slate-600">3 пара: Английский язык для IT — Ауд. 210, преп. Оспанова Д. С.</p>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="font-bold text-xs text-slate-800 flex justify-between items-center mb-1">
          <span>Вторник</span>
          <span class="text-indigo-600 font-semibold">10:15 - 14:30</span>
        </div>
        <p class="text-xs text-slate-600">2 пара: Проектирование реляционных баз данных (PostgreSQL) — Лаб. 102</p>
        <p class="text-xs text-slate-600">3-4 пара: Лабораторный тренажер EDU SPACE — Лаб. 108</p>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="font-bold text-xs text-slate-800 flex justify-between items-center mb-1">
          <span>Среда</span>
          <span class="text-indigo-600 font-semibold">08:30 - 12:00</span>
        </div>
        <p class="text-xs text-slate-600">1 пара: Компьютерные сети и безопасность (Cisco CCNA) — Ауд. 401</p>
        <p class="text-xs text-slate-600">2 пара: UI/UX Дизайн и дизайн-системы — Компьютерный зал 2</p>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="font-bold text-xs text-slate-800 flex justify-between items-center mb-1">
          <span>Четверг</span>
          <span class="text-indigo-600 font-semibold">10:15 - 14:00</span>
        </div>
        <p class="text-xs text-slate-600">2-3 пара: Алгоритмы и структуры данных — Ауд. 312, преп. Власов М. Г.</p>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="font-bold text-xs text-slate-800 flex justify-between items-center mb-1">
          <span>Пятница</span>
          <span class="text-indigo-600 font-semibold">08:30 - 11:50</span>
        </div>
        <p class="text-xs text-slate-600">1-2 пара: Практикум на тренажерах EDU SPACE (Сдача контрольных ДЗ)</p>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal(); showToast('Расписание синхронизировано с календарем!', 'success');" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Экспорт в календарь</button>
    </div>
  `);
}

// 2. Academic Calendar Modal
function openCalendarModal() {
  openModal('📆 Академический календарь и дедлайны сдачи', `
    <div class="space-y-3">
      <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-amber-600 text-[22px]">alarm</span>
        <div>
          <div class="font-bold text-xs text-amber-900">Ближайший дедлайн: Сегодня, 23:59</div>
          <p class="text-xs text-amber-700">Задание №1: Настройка окружения и первый модуль на JavaScript V8</p>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-indigo-600 text-[22px]">event</span>
        <div>
          <div class="font-bold text-xs text-indigo-900">Завтра в 09:00: Открытие Задания №2</div>
          <p class="text-xs text-indigo-700">Адаптивная верстка карточки курса с Flexbox/CSS Grid</p>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-slate-600 text-[22px]">school</span>
        <div>
          <div class="font-bold text-xs text-slate-900">20-25 Декабря: Зимняя зачетно-экзаменационная сессия</div>
          <p class="text-xs text-slate-600">Защита курсовых проектов и демонстрация цифрового портфолио компетенций</p>
        </div>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Понятно</button>
    </div>
  `);
}

// 3. Messenger / Chat Modal
function openMessengerModal(recipientName = 'Преподаватель Михаил Власов') {
  openModal(`💬 Сообщения — ${recipientName}`, `
    <div class="flex flex-col h-72 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
      <div id="edu-chat-box" class="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
        <div class="flex items-start gap-2">
          <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">МВ</div>
          <div class="bg-white p-2.5 rounded-xl border border-slate-200 max-w-[80%] shadow-sm">
            <div class="font-bold text-[10px] text-slate-500 mb-0.5">${recipientName}</div>
            <p>Здравствуйте, Константин! Вы начинаете обучение по курсу «Программное обеспечение». Задание №1 уже доступно. Начните с него.</p>
            <span class="text-[9px] text-slate-400 block mt-1">Сегодня, 10:14</span>
          </div>
        </div>
      </div>

      <form id="edu-chat-form" class="p-2 bg-white border-t border-slate-200 flex gap-2" onsubmit="event.preventDefault(); sendChatMessage();">
        <input type="text" id="edu-chat-input" placeholder="Введите сообщение..." class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600" required />
        <button type="submit" class="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1">
          <span>Отправить</span>
          <span class="material-symbols-outlined text-[14px]">send</span>
        </button>
      </form>
    </div>
  `);
}

function sendChatMessage() {
  const input = document.getElementById('edu-chat-input');
  const chatBox = document.getElementById('edu-chat-box');
  if (!input || !chatBox || !input.value.trim()) return;

  const msg = input.value.trim();
  input.value = '';

  const userMsg = document.createElement('div');
  userMsg.className = 'flex items-start justify-end gap-2';
  userMsg.innerHTML = `
    <div class="bg-indigo-600 text-white p-2.5 rounded-xl max-w-[80%] shadow-sm text-xs">
      <p>${msg}</p>
      <span class="text-[9px] text-indigo-200 block mt-1 text-right">Только что</span>
    </div>
  `;
  chatBox.appendChild(userMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'flex items-start gap-2';
    reply.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">МВ</div>
      <div class="bg-white p-2.5 rounded-xl border border-slate-200 max-w-[80%] shadow-sm text-xs">
        <div class="font-bold text-[10px] text-slate-500 mb-0.5">Преподаватель Михаил Власов</div>
        <p>Сообщение принято! Желаю успешного выполнения практического задания.</p>
        <span class="text-[9px] text-slate-400 block mt-1">Только что</span>
      </div>
    `;
    chatBox.appendChild(reply);
    chatBox.scrollTop = chatBox.scrollHeight;
    showToast('Новый ответ в чате от преподавателя', 'info');
  }, 900);
}

// 4. Notifications Drawer
function openNotificationsModal() {
  openModal('🔔 Центр уведомлений', `
    <div class="space-y-3">
      <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
        <div class="flex-1">
          <div class="font-bold text-xs text-emerald-900">Зачисление на курс подтверждено!</div>
          <p class="text-xs text-emerald-700">Добро пожаловать в учебный процесс группы ИС-21. Вам открыто первое вводное задание.</p>
          <span class="text-[10px] text-emerald-500 block mt-1">Сегодня</span>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-indigo-600 text-[20px]">lock_clock</span>
        <div class="flex-1">
          <div class="font-bold text-xs text-indigo-900">График обучения активен</div>
          <p class="text-xs text-indigo-700">Последующие практические работы будут открываться строго по расписанию каждый день в 09:00.</p>
          <span class="text-[10px] text-indigo-500 block mt-1">Сегодня</span>
        </div>
      </div>
    </div>
    <div class="pt-2 flex justify-between items-center">
      <button onclick="showToast('Все уведомления прочитаны', 'success'); closeModal();" class="text-xs text-indigo-600 hover:underline font-semibold">Отметить все</button>
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Закрыть</button>
    </div>
  `);
}

// 5. Settings Modal
function openSettingsModal() {
  const user = getActiveUser();
  openModal('⚙️ Настройки аккаунта', `
    <form onsubmit="event.preventDefault(); saveUserSettings();" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">ФИО пользователя</label>
        <input type="text" id="settingsFullName" value="${user.full_name || 'Константин Воронов'}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Email для уведомлений</label>
        <input type="email" id="settingsEmail" value="${user.email || 'voronov@student.amk.kz'}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>

      <div class="border-t border-slate-200 pt-3">
        <div class="font-bold text-xs text-slate-800 mb-2">Параметры уведомлений</div>
        <label class="flex items-center gap-2 text-xs text-slate-700 mb-1 cursor-pointer">
          <input type="checkbox" checked class="rounded text-indigo-600" />
          <span>Получать email при открытии нового задания по графику</span>
        </label>
        <label class="flex items-center gap-2 text-xs text-slate-700 mb-1 cursor-pointer">
          <input type="checkbox" checked class="rounded text-indigo-600" />
          <span>Оповещения об оценке преподавателя</span>
        </label>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Сохранить</button>
      </div>
    </form>
  `);
}

function saveUserSettings() {
  const nameInput = document.getElementById('settingsFullName');
  const emailInput = document.getElementById('settingsEmail');
  if (nameInput && emailInput) {
    const user = getActiveUser();
    user.full_name = nameInput.value.trim();
    user.email = emailInput.value.trim();
    setActiveUser(user);
    showToast('Настройки сохранены!', 'success');
    closeModal();
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.full_name);
  }
}

// 6. Subjects Modal (Student)
function openSubjectsModal() {
  openModal('📚 Мои дисциплины — Семестр II', `
    <div class="space-y-3">
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Front-end разработка и веб-технологии</div>
          <div class="text-[10px] text-slate-500">Прогресс: 10% • 1 задание открыто</div>
        </div>
        <a href="simulator.html?task=1" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Тренажер</a>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Реляционные базы данных (SQL & PostgreSQL)</div>
          <div class="text-[10px] text-slate-500">Откроется на День 4</div>
        </div>
        <span class="text-xs text-slate-400 font-bold">🔒 Заблокировано</span>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Алгоритмы и структуры данных</div>
          <div class="text-[10px] text-slate-500">Откроется на День 3</div>
        </div>
        <span class="text-xs text-slate-400 font-bold">🔒 Заблокировано</span>
      </div>
    </div>
    <div class="pt-2 flex justify-between items-center">
      <a href="tasks.html" class="text-xs text-indigo-600 hover:underline font-bold">Смотреть каталог заданий →</a>
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Закрыть</button>
    </div>
  `);
}

// 7. Electronic Gradebook Modal
function openGradesModal() {
  openModal('📊 Электронный табель успеваемости — АМК', `
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left">
        <thead class="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
          <tr>
            <th class="p-2.5">Дисциплина</th>
            <th class="p-2.5">Задание №1</th>
            <th class="p-2.5">Задание №2</th>
            <th class="p-2.5">Итог</th>
            <th class="p-2.5">Статус</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr>
            <td class="p-2.5 font-medium">Front-end разработка</td>
            <td class="p-2.5 font-bold text-indigo-600">В процессе</td>
            <td class="p-2.5 text-slate-400">🔒 День 2</td>
            <td class="p-2.5 font-bold text-slate-800">—</td>
            <td class="p-2.5"><span class="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">Текущий модуль</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pt-3 flex justify-between items-center border-t border-slate-100">
      <div class="text-xs font-bold text-slate-700">Начало обучения: <span class="text-indigo-600">День 1 (0% пройдено)</span></div>
      <button onclick="exportCsvJournal()" class="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">download</span>
        <span>Скачать CSV</span>
      </button>
    </div>
  `);
}

// 8. Teacher Tasks & Review Modals
function openCreateTaskModal() {
  openModal('➕ Создать новое задание для студентов', `
    <form onsubmit="event.preventDefault(); submitNewTask();" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Название задания</label>
        <input type="text" id="newTaskTitle" placeholder="например: Реализация REST API на FastAPI" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Специальность / Предмет</label>
          <select id="newTaskSubject" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">
            <option>Front-end разработка</option>
            <option>UI/UX Дизайн</option>
            <option>Базы данных PostgreSQL</option>
            <option>Алгоритмы и структуры</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">День открытия по графику</label>
          <select id="newTaskDay" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">
            <option value="1">День 1 (Открыто сразу)</option>
            <option value="2">День 2</option>
            <option value="3">День 3</option>
            <option value="4">День 4</option>
            <option value="5">День 5</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Описание и требования</label>
        <textarea id="newTaskDesc" rows="3" placeholder="Требования к работе..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required></textarea>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Опубликовать</button>
      </div>
    </form>
  `);
}

function submitNewTask() {
  const title = document.getElementById('newTaskTitle')?.value;
  closeModal();
  showToast(`Задание «${title}» добавлено в учебный график!`, 'success');
}

function openReviewModal(studentName = 'Константин Воронов', taskName = 'Задание №1', currentScore = 96) {
  openModal(`📝 Рецензирование работы — ${studentName}`, `
    <div class="space-y-3">
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div class="text-xs font-bold text-slate-900">${taskName}</div>
        <div class="text-[10px] text-slate-500">Студент: ${studentName} • Группа ИС-21</div>
        <p class="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded border border-slate-200 font-mono">
          Решение отправлено через тренажер EDU SPACE V8.<br>
          Автоматические тесты выполнены успешно: 10/10.
        </p>
      </div>

      <form onsubmit="event.preventDefault(); submitGrade('${studentName}');" class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Оценка (0 - 100 баллов)</label>
          <input type="number" id="reviewScoreInput" value="${currentScore}" min="0" max="100" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-indigo-600 focus:outline-none focus:border-indigo-600" required />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Рецензия преподавателя</label>
          <textarea id="reviewCommentInput" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">Отличная реализация валидации и чистота синтаксиса!</textarea>
        </div>

        <div class="pt-2 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
          <button type="submit" class="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700">Утвердить оценку</button>
        </div>
      </form>
    </div>
  `);
}

async function submitGrade(studentName) {
  const score = document.getElementById('reviewScoreInput')?.value || 95;
  const feedback = document.getElementById('reviewCommentInput')?.value || 'Отлично!';

  try {
    await fetch('/api/teacher/grade_submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: 1, grade: score, feedback })
    });
  } catch (e) {}

  closeModal();
  showToast(`Оценка ${score}/100 для ${studentName} утверждена в журнал!`, 'success');
}

// 9. Zoom / Meet Modal
function openZoomModal(title = 'Онлайн-лекция в прямом эфире') {
  openModal(`🎥 ${title}`, `
    <div class="rounded-xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center text-white p-6 relative">
      <div class="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center mb-3">
        <span class="material-symbols-outlined text-[36px] text-indigo-400 animate-pulse">videocam</span>
      </div>
      <div class="font-bold text-sm mb-1">Трансляция аудитории 304 (AMK EDU)</div>
      <p class="text-xs text-slate-400 text-center max-w-sm mb-4">Преподаватель подключен. Микрофон и виртуальная доска активны.</p>
      <div class="flex items-center gap-3">
        <button onclick="showToast('Микрофон включен', 'info')" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">mic</span></button>
        <button onclick="showToast('Камера включена', 'info')" class="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">videocam</span></button>
        <button onclick="showToast('Трансляция экрана запущена', 'success')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold">Демонстрация</button>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal(); showToast('Вы вышли из конференции', 'info');" class="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700">Завершить звонок</button>
    </div>
  `);
}

// 10. Consultation Booking
function openConsultationModal() {
  openModal('🤝 Запись на индивидуальную консультацию', `
    <form onsubmit="event.preventDefault(); closeModal(); showToast('Запись подтверждена! Время забронировано.', 'success');" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Преподаватель</label>
        <select class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">
          <option>Власов М. Г. (Алгоритмы & Базы данных)</option>
          <option>Иванов С. П. (Front-end & Архитектура)</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Дата</label>
          <input type="date" value="2026-11-05" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Время</label>
          <select class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">
            <option>15:00 - 15:30</option>
            <option>16:00 - 16:30</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Вопрос</label>
        <textarea rows="2" placeholder="Опишите вопрос..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Записаться</button>
      </div>
    </form>
  `);
}

// 11. Task Details Modal
function openTaskDetailsModal(taskTitle = 'Задание №1') {
  openModal(`📋 ${taskTitle}`, `
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Доступно сейчас</span>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">100 баллов max</span>
      </div>
      <div class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <h4 class="font-bold text-slate-900 mb-1">Критерии успешной сдачи:</h4>
        <ul class="list-disc pl-4 space-y-1 text-slate-600">
          <li>Реализация функции форматирования карточки успеваемости</li>
          <li>Валидация типов данных и обработка граничных случаев</li>
          <li>Прохождение всех 10 модульных тестов V8</li>
        </ul>
      </div>
    </div>
    <div class="pt-3 flex justify-between items-center">
      <button onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Закрыть</button>
      <a href="simulator.html?task=1" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-1.5">
        <span>Открыть в тренажере</span>
        <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
      </a>
    </div>
  `);
}

// 12. Groups & Students Modals (Teacher)
function openGroupsModal() {
  openModal('👥 Академические группы колледжа', `
    <div class="space-y-3">
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Группа ИС-21 (Программное обеспечение)</div>
          <div class="text-[10px] text-slate-500">25 студентов • 2 курс • Куратор Власов М. Г.</div>
        </div>
        <button onclick="showToast('Выбрана группа ИС-21', 'info'); closeModal();" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Открыть</button>
      </div>

      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Группа ИС-22 (Программное обеспечение)</div>
          <div class="text-[10px] text-slate-500">24 студента • 2 курс • Куратор Иванов С. П.</div>
        </div>
        <button onclick="showToast('Выбрана группа ИС-22', 'info'); closeModal();" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Открыть</button>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Закрыть</button>
    </div>
  `);
}

function openStudentsModal() {
  openModal('🎓 Список студентов потока', `
    <div class="space-y-2 text-xs">
      <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <span class="font-bold text-slate-900">Воронов Константин</span>
          <span class="text-slate-500 text-[10px] block">Группа ИС-21 • Статус: Обучается</span>
        </div>
        <span class="text-indigo-600 font-bold">День 1</span>
      </div>
      <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <span class="font-bold text-slate-900">Семёнова Алина</span>
          <span class="text-slate-500 text-[10px] block">Группа ДИЗ-19 • Статус: Обучается</span>
        </div>
        <span class="text-emerald-600 font-bold">98 баллов</span>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Закрыть</button>
    </div>
  `);
}

function openTeacherSubjectsModal() {
  openModal('📖 Учебные планы и курсы кафедры', `
    <div class="space-y-2 text-xs">
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="font-bold text-slate-900">06130100 - Программное обеспечение (10 модулей)</div>
        <p class="text-slate-500 text-[11px] mt-0.5">Включает тренажеры V8, реляционные базы данных и Docker.</p>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div class="font-bold text-slate-900">02110100 - Графический дизайн (10 модулей)</div>
        <p class="text-slate-500 text-[11px] mt-0.5">Figma UI-kit, прототипирование, дизайн-токены.</p>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Закрыть</button>
    </div>
  `);
}

function openBroadcastModal() {
  openModal('📢 Рассылка объявления студентам', `
    <form onsubmit="event.preventDefault(); showToast('Объявление отправлено всем студентам потока!', 'success'); closeModal();" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Тема объявления</label>
        <input type="text" placeholder="например: Завтра в 09:00 открывается Задание №2" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Текст</label>
        <textarea rows="3" placeholder="Введите текст..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Отправить</button>
      </div>
    </form>
  `);
}

// 13. Export Functions
function exportCsvJournal() {
  const bom = "\uFEFF";
  const csvContent = bom 
    + "№,Студент,Группа,Специальность,Задание,Балл,Оценка,Статус\n"
    + "1,Константин Воронов,ИС-21,Программное обеспечение,Задание №1 (V8 Engine),96,A,Сдано\n"
    + "2,Алина Семёнова,ДИЗ-19,Дизайн,Задание №1 (Figma Tokens),98,A+,Сдано\n"
    + "3,Артур Исмагулов,ИС-22,Программное обеспечение,Задание №1,92,A,Сдано\n";
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "vedomost_uspevaemosti_amk.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Сводная ведомость AMK выгружена в формате CSV/Excel!', 'success');
}

function exportPdfStatement() {
  showToast('Формирование официальной академической справки (PDF)...', 'info');
  setTimeout(() => window.print(), 500);
}

function sharePortfolio() {
  const url = window.location.origin + '/amk-skillhub/profile.html?user=voronov';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Ссылка на цифровое портфолио скопирована!', 'success');
    }).catch(() => {
      showToast('Ссылка на портфолио готова к отправке!', 'success');
    });
  } else {
    showToast('Ссылка на портфолио скопирована!', 'success');
  }
}
