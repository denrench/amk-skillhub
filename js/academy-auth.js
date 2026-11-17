(() => {
  const params = new URLSearchParams(location.search);
  const modes = ['login', 'register', 'reset'];
  const initial = modes.includes(params.get('mode')) ? params.get('mode') : 'login';
  const isStaticHost = location.hostname.endsWith('.github.io');
  const forms = document.getElementById('account-forms');
  const status = document.getElementById('account-status');
  const register = document.getElementById('account-register');
  const registerRole = register.elements.role;
  let pending = false;
  let active;

  function tell(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }
  function setMode(mode) {
    active = mode;
    for (const name of modes) document.getElementById('account-' + name).hidden = name !== mode;
    forms.querySelectorAll('[data-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    tell('');
  }
  function setRole() {
    const teacher = registerRole.value === 'teacher';
    register.querySelectorAll('[data-teacher]').forEach(field => { field.hidden = !teacher; });
    register.querySelector('[data-student]').hidden = teacher;
    register.elements.group_name.disabled = teacher;
    register.elements.department.disabled = !teacher;
    register.elements.teacher_code.required = teacher;
    register.elements.teacher_code.disabled = !teacher;
  }
  function localAuthFallback(path, payload) {
    const STORE_KEY = 'amk.local_accounts.v1';
    let db = {};
    try { db = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { db = {}; }
    const email = String(payload.email || '').trim().toLowerCase();
    if (path === 'send_code') {
      return { success: true, message: 'Локальный режим: используйте код 123456 для подтверждения.' };
    }
    if (path === 'register') {
      const user = {
        id: 'local-' + Date.now(),
        email,
        first_name: payload.first_name || 'Студент',
        last_name: payload.last_name || '',
        middle_name: payload.middle_name || '',
        role: payload.role === 'teacher' ? 'teacher' : 'student',
        specialty_slug: payload.specialty_slug || 'it',
        group_name: payload.group_name || 'АМК-1',
        password: payload.password || '',
      };
      db[email] = user;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch {}
      return { success: true, user };
    }
    if (path === 'login') {
      const user = db[email];
      if (!user || (payload.password && user.password && user.password !== payload.password)) {
        return { success: false, message: 'Аккаунт не найден локально. Перейдите на вкладку «Регистрация».' };
      }
      return { success: true, user };
    }
    return { success: false, message: 'Сброс пароля недоступен без сервера.' };
  }
  async function api(path, payload, control, done) {
    if (pending) return;
    if (isStaticHost) {
      const res = localAuthFallback(path, payload);
      if (!res.success) { tell(res.message, true); return; }
      done(res);
      return;
    }
    pending = true;
    control.disabled = true;
    tell('Отправляем запрос…');
    try {
      const response = await fetch('/api/auth/' + path, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(16000),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        tell(data.message || 'Запрос не выполнен. Попробуйте ещё раз.', true);
        return;
      }
      done(data);
    } catch {
      tell('Сервер аккаунтов недоступен. Попробуйте ещё раз.', true);
    } finally {
      pending = false;
      control.disabled = false;
    }
  }
  function signedIn(data) {
    if (!data.user) return tell('Сервер не подтвердил вход.', true);
    try { window.EduSpace?.setActiveUser(data.user); } catch {}
    const destination = { admin: 'admin.html', teacher: 'teacher.html', student: 'student.html' };
    location.assign(destination[data.user.role] || 'student.html');
  }
  forms.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    if (!pending) setMode(button.dataset.mode);
  }));
  forms.querySelectorAll('[data-send]').forEach(button => button.addEventListener('click', () => {
    const email = button.form.elements.email;
    if (!email.reportValidity()) return;
    api('send_code', { email: email.value, purpose: button.dataset.send }, button, data => tell(data.message));
  }));
  forms.querySelectorAll('form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const submit = event.submitter || form.querySelector('[type="submit"]');
    if (active === 'reset') {
      api('reset_password', data, submit, response => {
        setMode('login');
        document.getElementById('account-login').elements.email.value = data.email;
        tell(response.message);
      });
    } else {
      api(active, data, submit, signedIn);
    }
  }));
  registerRole.addEventListener('change', setRole);
  if (params.get('role') === 'teacher') registerRole.value = 'teacher';
  setRole();
  setMode(initial);
  forms.hidden = false;
})();
