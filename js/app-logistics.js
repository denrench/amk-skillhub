/* EDU SPACE - Complete Interactive Logistics Engine (UTF-8) */

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

// --- MODAL ENGINE ---
function openModal(title, htmlContent) {
  closeModal(); // Remove any existing modal

  const overlay = document.createElement('div');
  overlay.id = 'edu-modal-overlay';
  overlay.className = 'fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200';
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };

  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 transform scale-95 transition-transform duration-200';
  modal.innerHTML = `
    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
      <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">${title}</h3>
      <button onclick="closeModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
    <div class="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
      ${htmlContent}
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    modal.classList.remove('scale-95');
    modal.classList.add('scale-100');
  });
}

function closeModal() {
  const existing = document.getElementById('edu-modal-overlay');
  if (existing) {
    existing.remove();
    document.body.style.overflow = '';
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

// --- INTERACTIVE MODALS & FEATURES ---

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
        <p class="text-xs text-slate-600">1-2 пара: Front-end разработка (Vue / React) — Ауд. 304, преп. Кузнецов А. В.</p>
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
      <button onclick="closeModal(); showToast('Расписание синхронизировано с Google Calendar!', 'success');" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Экспорт в календарь</button>
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
          <p class="text-xs text-amber-700">Задание №4: Прототипирование интерактивного интерфейса в Figma (UI/UX)</p>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-indigo-600 text-[22px]">event</span>
        <div>
          <div class="font-bold text-xs text-indigo-900">12 Ноября: Рубежный контроль №1</div>
          <p class="text-xs text-indigo-700">Тестирование и автоматическая проверка кода на тренажере (Web-разработка)</p>
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
            <p>Здравствуйте! Напоминаю, что сегодня крайний срок сдачи лабораторной работы. Если возникнут вопросы по Docker или Flexbox — пишите сюда.</p>
            <span class="text-[9px] text-slate-400 block mt-1">Сегодня, 10:14</span>
          </div>
        </div>

        <div class="flex items-start justify-end gap-2">
          <div class="bg-indigo-600 text-white p-2.5 rounded-xl max-w-[80%] shadow-sm">
            <p>Добрый день! Да, я уже завершаю в тренажере верстку мобильного меню и сейчас отправлю на проверку.</p>
            <span class="text-[9px] text-indigo-200 block mt-1 text-right">Сегодня, 10:28</span>
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

  // Simulate automated teacher response after 1 second
  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'flex items-start gap-2';
    reply.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">МВ</div>
      <div class="bg-white p-2.5 rounded-xl border border-slate-200 max-w-[80%] shadow-sm text-xs">
        <div class="font-bold text-[10px] text-slate-500 mb-0.5">Преподаватель Михаил Власов</div>
        <p>Отлично! Сообщение получено. Проверю решение, как только оно поступит в электронный журнал.</p>
        <span class="text-[9px] text-slate-400 block mt-1">Только что</span>
      </div>
    `;
    chatBox.appendChild(reply);
    chatBox.scrollTop = chatBox.scrollHeight;
    showToast('Новый ответ в чате от преподавателя', 'info');
  }, 1000);
}

// 4. Notifications Drawer
function openNotificationsModal() {
  openModal('🔔 Центр уведомлений', `
    <div class="space-y-3">
      <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
        <div class="flex-1">
          <div class="font-bold text-xs text-emerald-900">Задание проверено на 96/100 баллов!</div>
          <p class="text-xs text-emerald-700">Куратор Власов М. Г. оценил лабораторную работу «Прототипирование в Figma». Комментарий: «Отличная визуальная иерархия!»</p>
          <span class="text-[10px] text-emerald-500 block mt-1">20 минут назад</span>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-indigo-600 text-[20px]">assignment</span>
        <div class="flex-1">
          <div class="font-bold text-xs text-indigo-900">Опубликовано новое практическое задание</div>
          <p class="text-xs text-indigo-700">Предмет: «Front-end разработка». Тема: Адаптивная верстка карточек каталога с Flexbox/CSS Grid.</p>
          <span class="text-[10px] text-indigo-500 block mt-1">Сегодня, 09:00</span>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
        <span class="material-symbols-outlined text-slate-600 text-[20px]">update</span>
        <div class="flex-1">
          <div class="font-bold text-xs text-slate-900">Обновление платформы EDU SPACE v2.4</div>
          <p class="text-xs text-slate-600">Добавлен интерактивный тренажер баз данных PostgreSQL и симулятор систем автодиагностики OBD-II.</p>
          <span class="text-[10px] text-slate-400 block mt-1">Вчера</span>
        </div>
      </div>
    </div>
    <div class="pt-2 flex justify-between items-center">
      <button onclick="showToast('Все уведомления отмечены как прочитанные', 'success'); closeModal();" class="text-xs text-indigo-600 hover:underline font-semibold">Отметить все как прочитанные</button>
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
          <input type="checkbox" checked class="rounded text-indigo-600 focus:ring-indigo-500" />
          <span>Получать email при выставлении оценки преподавателем</span>
        </label>
        <label class="flex items-center gap-2 text-xs text-slate-700 mb-1 cursor-pointer">
          <input type="checkbox" checked class="rounded text-indigo-600 focus:ring-indigo-500" />
          <span>Напоминания о приближающихся дедлайнах за 24 часа</span>
        </label>
        <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" checked class="rounded text-indigo-600 focus:ring-indigo-500" />
          <span>Звуковые оповещения в чате</span>
        </label>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Сохранить изменения</button>
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
    showToast('Настройки успешно сохранены!', 'success');
    closeModal();
    // Update displayed names if present
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
          <div class="text-[10px] text-slate-500">Прогресс: 84% • 12 из 14 заданий сдано</div>
        </div>
        <a href="simulator.html?task=frontend_1" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Тренажер</a>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">UI/UX Проектирование интерфейсов</div>
          <div class="text-[10px] text-slate-500">Прогресс: 92% • 10 из 10 заданий сдано</div>
        </div>
        <a href="simulator.html?task=design_1" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Тренажер</a>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Реляционные базы данных (SQL & PostgreSQL)</div>
          <div class="text-[10px] text-slate-500">Прогресс: 75% • 8 из 11 заданий сдано</div>
        </div>
        <a href="simulator.html?task=db_1" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Тренажер</a>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Алгоритмы и структуры данных</div>
          <div class="text-[10px] text-slate-500">Прогресс: 68% • 7 из 10 заданий сдано</div>
        </div>
        <a href="simulator.html?task=algo_1" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Тренажер</a>
      </div>

      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Компьютерные сети и безопасность</div>
          <div class="text-[10px] text-slate-500">Прогресс: 90% • 9 из 10 заданий сдано</div>
        </div>
        <a href="simulator.html?task=net_1" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Тренажер</a>
      </div>
    </div>
    <div class="pt-2 flex justify-between items-center">
      <a href="tasks.html" class="text-xs text-indigo-600 hover:underline font-bold">Смотреть все задания в каталоге →</a>
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Закрыть</button>
    </div>
  `);
}

// 7. Electronic Gradebook Modal (Student)
function openGradesModal() {
  openModal('📊 Электронный табель успеваемости — АМК', `
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left">
        <thead class="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
          <tr>
            <th class="p-2.5">Дисциплина</th>
            <th class="p-2.5">РК 1</th>
            <th class="p-2.5">РК 2</th>
            <th class="p-2.5">Экзамен</th>
            <th class="p-2.5">Итог</th>
            <th class="p-2.5">Оценка</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr>
            <td class="p-2.5 font-medium">Front-end разработка</td>
            <td class="p-2.5">95</td>
            <td class="p-2.5">92</td>
            <td class="p-2.5">96</td>
            <td class="p-2.5 font-bold text-emerald-600">94.3</td>
            <td class="p-2.5"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">A (Отл)</span></td>
          </tr>
          <tr>
            <td class="p-2.5 font-medium">UI/UX Проектирование</td>
            <td class="p-2.5">98</td>
            <td class="p-2.5">96</td>
            <td class="p-2.5">97</td>
            <td class="p-2.5 font-bold text-emerald-600">97.0</td>
            <td class="p-2.5"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">A+ (Отл)</span></td>
          </tr>
          <tr>
            <td class="p-2.5 font-medium">Базы данных SQL</td>
            <td class="p-2.5">88</td>
            <td class="p-2.5">90</td>
            <td class="p-2.5">92</td>
            <td class="p-2.5 font-bold text-indigo-600">90.0</td>
            <td class="p-2.5"><span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">A- (Отл)</span></td>
          </tr>
          <tr>
            <td class="p-2.5 font-medium">Алгоритмы и структуры</td>
            <td class="p-2.5">85</td>
            <td class="p-2.5">84</td>
            <td class="p-2.5">88</td>
            <td class="p-2.5 font-bold text-blue-600">85.6</td>
            <td class="p-2.5"><span class="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">B+ (Хор)</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pt-3 flex justify-between items-center border-t border-slate-100">
      <div class="text-xs font-bold text-slate-700">Текущий средний балл (GPA): <span class="text-emerald-600">3.88 / 4.0</span></div>
      <button onclick="exportCsvJournal()" class="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">download</span>
        <span>Скачать CSV</span>
      </button>
    </div>
  `);
}

// 8. Create Task Modal (Teacher)
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
            <option>Автодиагностика (OBD-II)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Срок сдачи (дедлайн)</label>
          <input type="date" id="newTaskDeadline" value="2026-11-15" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Максимальный балл</label>
        <input type="number" id="newTaskMaxScore" value="100" min="10" max="100" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Подробные инструкции и критерии</label>
        <textarea id="newTaskDesc" rows="4" placeholder="Опишите требования к работе, стартовый шаблон и ожидаемые автотесты..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required></textarea>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Опубликовать задание</button>
      </div>
    </form>
  `);
}

function submitNewTask() {
  const title = document.getElementById('newTaskTitle')?.value;
  const subject = document.getElementById('newTaskSubject')?.value;
  const deadline = document.getElementById('newTaskDeadline')?.value;
  const desc = document.getElementById('newTaskDesc')?.value;

  fetch('/api/teacher/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, subject, deadline, desc, max_score: 100 })
  }).catch(() => {});

  closeModal();
  showToast(`Задание «${title}» успешно опубликовано для студентов!`, 'success');
}

// 9. Review Student Submission Modal (Teacher)
function openReviewModal(studentName = 'Константин Воронов', taskName = 'Прототипирование в Figma', currentScore = 96) {
  openModal(`📝 Проверка работы — ${studentName}`, `
    <div class="space-y-3">
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div class="text-xs font-bold text-slate-900">${taskName}</div>
        <div class="text-[10px] text-slate-500">Студент: ${studentName} • Группа ИС-21</div>
        <p class="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded border border-slate-200 font-mono">
          Ссылка на проект: https://github.com/amk-student/figma-design-case<br>
          Автотесты симулятора пройдены: 10/10 (100% покрытие критериев)
        </p>
      </div>

      <form onsubmit="event.preventDefault(); submitGrade('${studentName}');" class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Выставить балл (0 - 100)</label>
          <input type="number" id="reviewScoreInput" value="${currentScore}" min="0" max="100" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-indigo-600 focus:outline-none focus:border-indigo-600" required />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Рецензия и комментарий преподавателя</label>
          <textarea id="reviewCommentInput" rows="3" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" placeholder="Отличная иерархия элементов, сетка 8pt выдержана идеально...">Отличная визуальная иерархия и проработка компонентов UI-kit!</textarea>
        </div>

        <div class="pt-2 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
          <button type="submit" class="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 font-bold">Утвердить оценку</button>
        </div>
      </form>
    </div>
  `);
}

function submitGrade(studentName) {
  const score = document.getElementById('reviewScoreInput')?.value || 95;
  const comment = document.getElementById('reviewCommentInput')?.value || 'Отлично!';

  fetch('/api/teacher/grade_submission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: 1, grade: score, feedback: comment })
  }).catch(() => {});

  closeModal();
  showToast(`Оценка ${score}/100 для студента ${studentName} сохранена в журнал!`, 'success');
}

// 10. Zoom / Online Class Modal
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
        <button onclick="showToast('Трансляция экрана запущена', 'success')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold">Демонстрация экрана</button>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal(); showToast('Вы отключились от видеоконференции', 'info');" class="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700">Завершить звонок</button>
    </div>
  `);
}

// 11. Upload Homework Modal
function openUploadHomeworkModal(taskTitle = 'Домашнее задание') {
  openModal(`📤 Сдача работы: ${taskTitle}`, `
    <form onsubmit="event.preventDefault(); submitHomeworkFile();" class="space-y-4">
      <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-600 transition-colors bg-slate-50 cursor-pointer" onclick="document.getElementById('hwFileInput').click()">
        <input type="file" id="hwFileInput" class="hidden" onchange="document.getElementById('hwFileName').textContent = this.files[0]?.name || 'Файл выбран';" />
        <span class="material-symbols-outlined text-[36px] text-slate-400 mb-2">cloud_upload</span>
        <div class="font-bold text-xs text-slate-700" id="hwFileName">Нажмите для выбора архива или файла проекта (.zip, .pdf, .fig)</div>
        <p class="text-[10px] text-slate-400 mt-1">Максимальный размер: 50 MB</p>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Или ссылка на репозиторий GitHub / Figma</label>
        <input type="url" placeholder="https://github.com/username/project" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" />
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Пояснительная записка (опционально)</label>
        <textarea rows="2" placeholder="Комментарий к выполненному заданию..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"></textarea>
      </div>

      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Отправить на проверку</button>
      </div>
    </form>
  `);
}

function submitHomeworkFile() {
  closeModal();
  showToast('Работа успешно загружена и отправлена преподавателю!', 'success');
}

// 12. Consultation Booking Modal
function openConsultationModal() {
  openModal('🤝 Запись на индивидуальную консультацию', `
    <form onsubmit="event.preventDefault(); closeModal(); showToast('Запись подтверждена! Ссылка на встречу отправлена в календарь.', 'success');" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Преподаватель / Ментор</label>
        <select class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">
          <option>Кузнецов А. В. (Front-end & Архитектура)</option>
          <option>Власов М. Г. (Алгоритмы & Базы данных)</option>
          <option>Оспанова Д. С. (Технический английский)</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Желаемая дата</label>
          <input type="date" value="2026-11-05" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Время</label>
          <select class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">
            <option>15:00 - 15:30</option>
            <option>16:00 - 16:30</option>
            <option>17:00 - 17:30</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Тема вопроса</label>
        <textarea rows="2" placeholder="Опишите в 1-2 предложениях тему обсуждения..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Записаться</button>
      </div>
    </form>
  `);
}

// 13. Task Details Modal
function openTaskDetailsModal(taskTitle = 'Задание №4: Прототипирование в Figma') {
  openModal(`📋 ${taskTitle}`, `
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Дедлайн: Сегодня, 23:59</span>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">100 баллов max</span>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Тренажер доступен</span>
      </div>
      <div class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
        <h4 class="font-bold text-slate-900 mb-1">Цель работы:</h4>
        Спроектировать интерактивный прототип мобильного приложения личного кабинета студента в Figma с использованием Auto Layout, вариантов компонентов и интерактивных переходов (Smart Animate).
        <h4 class="font-bold text-slate-900 mt-2 mb-1">Критерии оценки:</h4>
        <ul class="list-disc pl-4 space-y-0.5 text-slate-600">
          <li>Использование 8-точечной сетки разметки</li>
          <li>Создание дизайн-токенов цветов и типографики</li>
          <li>Интерактивный кликабельный сценарий сдачи ДЗ</li>
        </ul>
      </div>
    </div>
    <div class="pt-3 flex justify-between items-center">
      <button onclick="closeModal(); openUploadHomeworkModal('${taskTitle}');" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Загрузить файл</button>
      <a href="simulator.html?task=design_1" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-1.5">
        <span>Открыть в онлайн-тренажере</span>
        <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
      </a>
    </div>
  `);
}

// 14. Demo Institution Modal
function openDemoModal() {
  openModal('🏫 Подключение учебного заведения к EDU SPACE', `
    <form onsubmit="event.preventDefault(); showToast('Заявка на подключение принята! Наш методист свяжется с вами в течение 15 минут.'); closeModal();" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Название колледжа / университета</label>
        <input type="text" placeholder="например: Алматинский многопрофильный колледж" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Контактное лицо</label>
          <input type="text" placeholder="ФИО руководителя" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Телефон или Email</label>
          <input type="text" placeholder="+7 (777) 000-00-00" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
        </div>
      </div>
      <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md">Отправить заявку на демонстрацию</button>
    </form>
  `);
}

// 15. New Review Modal
function openNewReviewModal() {
  openModal('⭐ Оставить отзыв о платформе EDU SPACE', `
    <form onsubmit="event.preventDefault(); showToast('Спасибо за ваш отзыв! Он появится на сайте после модерации.', 'success'); closeModal();" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Ваше имя и должность/специальность</label>
        <input type="text" placeholder="например: Айдар С., студент 3 курса АМК" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Оценка платформы</label>
        <div class="flex items-center gap-1 text-amber-500 cursor-pointer">
          <span class="material-symbols-outlined text-[24px]">star</span>
          <span class="material-symbols-outlined text-[24px]">star</span>
          <span class="material-symbols-outlined text-[24px]">star</span>
          <span class="material-symbols-outlined text-[24px]">star</span>
          <span class="material-symbols-outlined text-[24px]">star</span>
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Ваш отзыв</label>
        <textarea rows="3" placeholder="Расскажите о вашем опыте работы с тренажерами и автопроверкой..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Опубликовать отзыв</button>
      </div>
    </form>
  `);
}

// 16. Groups Management Modal (Teacher)
function openGroupsModal() {
  openModal('👥 Академические группы колледжа', `
    <div class="space-y-3">
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Группа ИС-21 (Программное обеспечение)</div>
          <div class="text-[10px] text-slate-500">25 студентов • Средний балл: 4.6 • 96% сдачи в срок</div>
        </div>
        <button onclick="showToast('Выбран журнал группы ИС-21', 'info'); closeModal();" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Открыть журнал</button>
      </div>

      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Группа ИС-22 (Программное обеспечение)</div>
          <div class="text-[10px] text-slate-500">24 студента • Средний балл: 4.4 • 92% сдачи в срок</div>
        </div>
        <button onclick="showToast('Выбран журнал группы ИС-22', 'info'); closeModal();" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Открыть журнал</button>
      </div>

      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <div class="font-bold text-xs text-slate-900">Группа ДИЗ-19 (Графический дизайн)</div>
          <div class="text-[10px] text-slate-500">22 студента • Средний балл: 4.8 • 98% сдачи в срок</div>
        </div>
        <button onclick="showToast('Выбран журнал группы ДИЗ-19', 'info'); closeModal();" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Открыть журнал</button>
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900">Закрыть</button>
    </div>
  `);
}

// 17. Broadcast Announcement Modal (Teacher)
function openBroadcastModal() {
  openModal('📢 Рассылка важного объявления группе', `
    <form onsubmit="event.preventDefault(); showToast('Объявление отправлено всем студентам группы в push и email!', 'success'); closeModal();" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Получатели</label>
        <select class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600">
          <option>Все группы (ИС-21, ИС-22, ДИЗ-19)</option>
          <option>Только группа ИС-21</option>
          <option>Только группа ИС-22</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Заголовок оповещения</label>
        <input type="text" placeholder="например: Перенос лабораторной работы №5" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Текст сообщения</label>
        <textarea rows="3" placeholder="Введите текст сообщения..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required></textarea>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Отправить рассылку</button>
      </div>
    </form>
  `);
}

// 18. Quiz Builder Modal (Teacher)
function openQuizModal() {
  openModal('❓ Создать интерактивный тест / квиз', `
    <form onsubmit="event.preventDefault(); showToast('Квиз успешно сгенерирован и добавлен в симулятор!', 'success'); closeModal();" class="space-y-3">
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Тема квиза</label>
        <input type="text" placeholder="например: Архитектура REST и коды ответов HTTP" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600" required />
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Вопрос №1</label>
        <input type="text" placeholder="Какой HTTP статус означает успешное создание ресурса?" value="Какой HTTP статус означает успешное создание ресурса?" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs mb-1.5 focus:outline-none focus:border-indigo-600" required />
        <div class="grid grid-cols-2 gap-2 text-xs">
          <input type="text" value="200 OK" class="px-2 py-1 border rounded" />
          <input type="text" value="201 Created (Правильный)" class="px-2 py-1 border border-emerald-400 rounded bg-emerald-50 text-emerald-800 font-bold" />
          <input type="text" value="400 Bad Request" class="px-2 py-1 border rounded" />
          <input type="text" value="500 Internal Error" class="px-2 py-1 border rounded" />
        </div>
      </div>
      <div class="pt-2 flex justify-end gap-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100">Отмена</button>
        <button type="submit" class="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">Запустить квиз</button>
      </div>
    </form>
  `);
}

// 19. Export Functions
function exportCsvJournal() {
  // UTF-8 BOM
  const bom = "\uFEFF";
  const csvContent = bom 
    + "№,Студент,Группа,Специальность,Задание,Балл,Оценка,Статус\n"
    + "1,Константин Воронов,ИС-21,Программное обеспечение,UI-прототип Figma,96,A,Сдано\n"
    + "2,Алина Семёнова,ДИЗ-19,Дизайн,UI-прототип Figma,98,A+,Сдано\n"
    + "3,Артур Исмагулов,ИС-22,Программное обеспечение,Docker Compose,92,A,Сдано\n"
    + "4,Дамир Алиев,ТО-18,Автодиагностика,Диагностика OBD-II,90,A,Сдано\n"
    + "5,Елена Ким,ИС-21,Программное обеспечение,Vue.js компоненты,95,A,Сдано\n";
  
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
  setTimeout(() => window.print(), 600);
}

function sharePortfolio() {
  const url = window.location.origin + '/amk-skillhub/profile.html?user=voronov';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Ссылка на цифровое портфолио скопирована в буфер обмена!', 'success');
    }).catch(() => {
      showToast('Ссылка на портфолио готова к отправке!', 'success');
    });
  } else {
    showToast('Ссылка на портфолио скопирована!', 'success');
  }
}

// 20. Task and Submission Filtering
function filterTasks(category, el) {
  if (el) {
    el.parentElement.querySelectorAll('button').forEach(b => {
      b.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
      b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
    });
    el.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
    el.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
  }
  showToast(`Фильтр применен: ${category}`, 'info');
}

function filterSubmissions(status, el) {
  if (el) {
    el.parentElement.querySelectorAll('button').forEach(b => {
      b.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
      b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
    });
    el.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
    el.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
  }
  showToast(`Показаны работы: ${status}`, 'info');
}

// --- GLOBAL DOM INITIALIZER ---
document.addEventListener('DOMContentLoaded', function() {
  // 1. Synchronize User in UI
  const user = getActiveUser();
  if (user) {
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.full_name || 'Константин Воронов');
    document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.role === 'teacher' ? 'Преподаватель' : 'Студент');
  }

  // Helper to match text inside elements
  function matchText(el, pattern) {
    return pattern.test(el.textContent.trim().toLowerCase());
  }

  // 2. Wire inert links and buttons across pages
  document.querySelectorAll('a, button').forEach(el => {
    const text = el.textContent.trim().toLowerCase();
    const href = el.getAttribute('href');

    // Sidebar: Главная
    if (matchText(el, /^главная$|^grid_view\s*главная$/i) && (href === '#' || !href)) {
      el.href = user.role === 'teacher' ? 'teacher.html' : 'student.html';
    }

    // Sidebar: Мои предметы / Предметы
    if (matchText(el, /мои предметы|предметы/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openSubjectsModal();
    }

    // Sidebar: Задания
    if (matchText(el, /задания|задания\s*\d+/) && (href === '#' || !href)) {
      el.href = 'tasks.html';
    }

    // Sidebar: Оценки / Журнал оценок / Электронный журнал
    if (matchText(el, /оценки|журнал оценок|электронный журнал/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => user.role === 'teacher' ? exportCsvJournal() : openGradesModal();
    }

    // Sidebar: Расписание
    if (matchText(el, /расписание/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openScheduleModal();
    }

    // Sidebar: Календарь
    if (matchText(el, /календарь/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openCalendarModal();
    }

    // Sidebar: Сообщения / Чат
    if (matchText(el, /сообщения|чат/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openMessengerModal(user.role === 'teacher' ? 'Группа ИС-21' : 'Преподаватель Михаил Власов');
    }

    // Sidebar: Уведомления
    if (matchText(el, /уведомления/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openNotificationsModal();
    }

    // Sidebar: Профиль
    if (matchText(el, /профиль/) && (href === '#' || !href)) {
      el.href = 'profile.html';
    }

    // Sidebar: Настройки
    if (matchText(el, /настройки/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openSettingsModal();
    }

    // Sidebar: Выход
    if (matchText(el, /выход|выйти/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => logoutUser();
    }

    // Action: Создать задание
    if (matchText(el, /создать задание|add_task/) && !el.onclick) {
      el.onclick = () => openCreateTaskModal();
    }

    // Action: Мои группы / Студенты
    if (matchText(el, /мои группы|студенты/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openGroupsModal();
    }

    // Action: Zoom / Онлайн-сессия
    if (matchText(el, /войти в zoom|начать онлайн-сессию|videocam/) && (href === '#' || !href)) {
      el.href = 'javascript:void(0)';
      el.onclick = () => openZoomModal();
    }

    // Action: Загрузить ДЗ
    if (matchText(el, /загрузить выполненное дз|сдать с опозданием/) && !el.onclick) {
      el.onclick = () => openUploadHomeworkModal();
    }

    // Action: Запись на консультацию
    if (matchText(el, /запись на консультацию/) && !el.onclick) {
      el.onclick = () => openConsultationModal();
    }

    // Action: Рассылка группе
    if (matchText(el, /рассылка группе/) && !el.onclick) {
      el.onclick = () => openBroadcastModal();
    }

    // Action: Создать опрос / квиз
    if (matchText(el, /создать опрос|квиз/) && !el.onclick) {
      el.onclick = () => openQuizModal();
    }

    // Action: Экспорт / Ведомость
    if (matchText(el, /экспорт в xlsx|экспорт ведомости|сводная ведомость/) && !el.onclick) {
      el.onclick = () => exportCsvJournal();
    }

    // Action: Справка PDF
    if (matchText(el, /экспорт справки/) && !el.onclick) {
      el.onclick = () => exportPdfStatement();
    }

    // Action: Поделиться портфолио
    if (matchText(el, /поделиться портфолио/) && !el.onclick) {
      el.onclick = () => sharePortfolio();
    }

    // Action: Редактировать профиль
    if (matchText(el, /редактировать профиль/) && !el.onclick) {
      el.onclick = () => openSettingsModal();
    }

    // Action: Детали задания / Смотреть работу
    if (matchText(el, /^детали$|^смотреть работу$/) && !el.onclick) {
      el.onclick = () => openTaskDetailsModal();
    }

    // Action: Проверить работу (Teacher table)
    if (matchText(el, /^проверить$/) && !el.onclick) {
      el.onclick = () => openReviewModal();
    }

    // Action: Приступить / Открыть задание / Перейти к уроку
    if (matchText(el, /приступить|перейти к сдаче|перейти к уроку|открыть задание/) && (href === '#' || !href)) {
      el.href = 'simulator.html';
    }

    // Action: Все курсы / Перейти в раздел заданий
    if (matchText(el, /все курсы|перейти в раздел заданий|управление пулом заданий/) && (href === '#' || !href)) {
      el.href = 'tasks.html';
    }
  });

  // 3. Header icons (chat & notifications)
  document.querySelectorAll('header button, header a').forEach(el => {
    const text = el.textContent.trim();
    if (text === 'chat') {
      el.onclick = () => openMessengerModal();
    }
    if (text === 'notifications') {
      el.onclick = () => openNotificationsModal();
    }
  });
});
