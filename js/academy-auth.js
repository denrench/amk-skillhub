(() => {
  const params = new URLSearchParams(location.search);
  const modes = ['login', 'register', 'reset'];
  const initial = modes.includes(params.get('mode')) ? params.get('mode') : 'login';
  const forms = document.getElementById('account-forms');
  const status = document.getElementById('account-status');
  const register = document.getElementById('account-register');
  const registerRole = register.elements.role;
  const otpGroup = document.getElementById('register-otp-group');
  const otpInput = register.elements.verification_code;
  const resetForm = document.getElementById('account-reset');
  let pending = false;
  let active;
  let readiness = { email_verification_required: false, mail_configured: false, server_available: true };

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
    if (mode === 'reset' && readiness.server_available && !readiness.mail_configured) {
      tell('Почтовый сервис на этом сервере не настроен — отправка кода восстановления недоступна.', true);
    }
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
  function validatePassword(pw) {
    if (window.EduSpace && typeof window.EduSpace.validatePasswordStrength === 'function') {
      return window.EduSpace.validatePasswordStrength(pw);
    }
    const text = String(pw || '');
    if (text.length < 8) return { ok: false, message: 'Пароль должен содержать минимум 8 символов.' };
    if (!/[A-Za-zА-Яа-яЁё]/.test(text) || !/[0-9]/.test(text)) {
      return { ok: false, message: 'Пароль должен содержать хотя бы одну букву и одну цифру.' };
    }
    return { ok: true };
  }
  async function initReadiness() {
    try {
      const apiBase = (window.EduSpace && window.EduSpace.apiBase) ? window.EduSpace.apiBase() : '';
      const response = await fetch(apiBase + '/api/auth/readiness', {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      readiness = {
        email_verification_required: Boolean(data.email_verification_required),
        mail_configured: Boolean(data.mail_configured),
        server_available: true,
      };
      if (otpGroup) otpGroup.hidden = !readiness.email_verification_required;
      if (otpInput) {
        otpInput.required = readiness.email_verification_required;
        otpInput.disabled = !readiness.email_verification_required;
      }
      const sendResetBtn = resetForm ? resetForm.querySelector('[data-send="reset"]') : null;
      if (sendResetBtn) sendResetBtn.disabled = !readiness.mail_configured;
      if (active === 'reset' && !readiness.mail_configured) {
        tell('Почтовый сервис на этом сервере не настроен — отправка кода восстановления недоступна.', true);
      }
    } catch {
      readiness.server_available = false;
      if (otpGroup) otpGroup.hidden = true;
      if (otpInput) {
        otpInput.required = false;
        otpInput.disabled = true;
      }
      forms.querySelectorAll('button[type="submit"], button[data-send]').forEach(btn => { btn.disabled = true; });
      tell('Сервер авторизации недоступен. Локальный вход отключён.', true);
    }
  }
  async function api(path, payload, control, done) {
    if (pending) return;
    if (!readiness.server_available) {
      tell('Сервер авторизации недоступен. Локальный вход отключён.', true);
      return;
    }
    pending = true;
    control.disabled = true;
    tell('Отправляем запрос…');
    try {
      const apiBase = (window.EduSpace && window.EduSpace.apiBase) ? window.EduSpace.apiBase() : '';
      const csrf = (window.EduSpace && window.EduSpace.getCsrfToken) ? window.EduSpace.getCsrfToken() : '';
      const headers = { 'Content-Type': 'application/json' };
      if (csrf) headers['X-CSRF-Token'] = csrf;
      const response = await fetch(apiBase + '/api/auth/' + path, {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(16000),
      });
      let data = {};
      try { data = await response.json(); } catch {}
      if (data && data.csrf_token && window.EduSpace && window.EduSpace.setCsrfToken) {
        window.EduSpace.setCsrfToken(data.csrf_token);
      }
      if (!response.ok || !data.success) {
        tell((data && data.message) || 'Запрос не выполнен. Попробуйте ещё раз.', true);
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
    try {
      if (data.csrf_token) window.EduSpace?.setCsrfToken?.(data.csrf_token);
      window.EduSpace?.setActiveUser?.(data.user);
    } catch {}
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
    if (active === 'register') {
      const check = validatePassword(data.password);
      if (!check.ok) { tell(check.message, true); return; }
      if (!readiness.email_verification_required && !data.verification_code) {
        delete data.verification_code;
      }
    } else if (active === 'reset') {
      const check = validatePassword(data.new_password);
      if (!check.ok) { tell(check.message, true); return; }
    }
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
  initReadiness();
  forms.hidden = false;
})();
