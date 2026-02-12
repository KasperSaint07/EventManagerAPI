// CONFIG
const API_URL = window.location.origin + '/api';

// STATE
let currentPage = 'home';
let currentUser = null;
let token = localStorage.getItem('token') || null;
let eventsCache = [];
let citiesCache = [];
let currentEventPage = 1;
const EVENTS_PER_PAGE = 9;

// INIT
document.addEventListener('DOMContentLoaded', () => {
  if (token) loadProfile();
  updateNav();
  loadEvents();
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchEvents();
  });
});

// NAVIGATION
function navigateTo(page, data) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('active'));
  const navLink = document.getElementById(`nav-${page}`);
  if (navLink) navLink.classList.add('active');

  currentPage = page;

  switch (page) {
    case 'home':
      window.scrollTo(0, 0);
      loadEvents(currentEventPage);
      break;
    case 'event':
      window.scrollTo(0, 0);
      if (data && data.eventId) loadEventDetail(data.eventId);
      break;
    case 'profile':
      if (!token) { navigateTo('login'); return; }
      loadProfile();
      loadMyRegistrations();
      break;
    case 'create-event':
      if (!token) { navigateTo('login'); return; }
      clearFormErrors();
      break;
    case 'admin':
      if (!token || !currentUser || currentUser.role !== 'super_admin') { navigateTo('home'); return; }
      loadAdminOrganizerRequests();
      break;
    case 'login':
    case 'register':
      clearFormErrors();
      break;
  }
}

// NAV UPDATE
function updateNav() {
  const navAuth = document.getElementById('nav-auth');
  if (token && currentUser) {
    let links = '';
    if (currentUser.role === 'organizer' || currentUser.role === 'super_admin') {
      links += `<a href="#" class="nav__link" onclick="navigateTo('create-event')" id="nav-create-event">+ Мероприятие</a>`;
    }
    if (currentUser.role === 'super_admin') {
      links += `<a href="#" class="nav__link" onclick="navigateTo('admin')" id="nav-admin">Админка</a>`;
    }
    links += `<a href="#" class="nav__link" onclick="navigateTo('profile')" id="nav-profile">${currentUser.email.split('@')[0]}</a>`;
    navAuth.innerHTML = links;
  } else {
    navAuth.innerHTML = `<a href="#" class="nav__link" onclick="navigateTo('login')" id="nav-login">Войти</a>`;
  }
}

// API HELPER
async function apiRequest(endpoint, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options;
  const config = {
    ...restOptions,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  };
  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  try {
    const url = config.method && config.method !== 'GET'
      ? `${API_URL}${endpoint}`
      : `${API_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `HTTP Error ${response.status}`);
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') throw new Error('Сервер недоступен. Убедитесь, что backend запущен.');
    throw error;
  }
}

// LOAD EVENTS
async function loadEvents(page = 1) {
  const grid = document.getElementById('events-grid');
  grid.innerHTML = '<div class="loader">Загрузка мероприятий...</div>';

  try {
    const data = await apiRequest(`/events?page=${page}&limit=${EVENTS_PER_PAGE}`);
    eventsCache = data.data || [];

    const cities = [...new Set(eventsCache.map(e => e.city).filter(Boolean))];
    if (cities.length > citiesCache.length) {
      citiesCache = cities;
      populateCityFilter(cities);
    }

    currentEventPage = page;
    renderEvents(eventsCache);
    renderPagination(data.total || eventsCache.length, page);
  } catch (error) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state__icon">😔</div><p class="empty-state__text">${error.message}</p></div>`;
  }
}

function renderEvents(events) {
  const grid = document.getElementById('events-grid');
  if (!events || events.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><p class="empty-state__text">Мероприятий пока нет</p></div>`;
    return;
  }

  grid.innerHTML = events.map(event => {
    const date = formatDate(event.dateTime);
    const gradient = getEventGradient(event.title);
    const emoji = getEventEmoji(event.title);
    return `
      <div class="event-card" onclick="navigateTo('event', { eventId: '${event._id}' })">
        <div class="event-card__image" style="background: ${gradient}">${emoji}</div>
        <div class="event-card__body">
          <div class="event-card__date">${date}</div>
          <h3 class="event-card__title">${escapeHtml(event.title)}</h3>
          <div class="event-card__location">📍 ${escapeHtml(event.city || 'Город не указан')}${event.address ? ', ' + escapeHtml(event.address) : ''}</div>
          <div class="event-card__footer">
            <span class="event-card__capacity">👥 ${event.availableSpots !== undefined ? event.availableSpots : event.capacity} из ${event.capacity} мест</span>
            <span class="event-card__tag">${event.availableSpots === 0 ? 'Мест нет' : 'Подробнее'}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderPagination(total, page) {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(total / EVENTS_PER_PAGE);
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = `<button class="pagination__btn" onclick="loadEvents(${page - 1})" ${page === 1 ? 'disabled' : ''}>←</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="pagination__btn ${i === page ? 'active' : ''}" onclick="loadEvents(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="color: var(--text-light);">...</span>`;
    }
  }
  html += `<button class="pagination__btn" onclick="loadEvents(${page + 1})" ${page === totalPages ? 'disabled' : ''}>→</button>`;
  pagination.innerHTML = html;
}

// SEARCH & FILTER
let currentSearchQuery = '';

async function searchEvents() {
  const query = document.getElementById('search-input').value.trim();
  currentSearchQuery = query;
  if (!query) { loadEvents(1); return; }

  const grid = document.getElementById('events-grid');
  grid.innerHTML = '<div class="loader">Поиск...</div>';

  try {
    const data = await apiRequest(`/events?search=${encodeURIComponent(query)}&limit=50`);
    const results = data.data || [];
    renderEvents(results);
    document.getElementById('pagination').innerHTML = '';
  } catch (error) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state__icon">😔</div><p class="empty-state__text">${error.message}</p></div>`;
  }
}

function filterEvents() {
  const city = document.getElementById('filter-city').value;
  if (!city) { renderEvents(eventsCache); return; }
  renderEvents(eventsCache.filter(e => e.city === city));
}

function populateCityFilter(cities) {
  const select = document.getElementById('filter-city');
  select.innerHTML = '<option value="">Все города</option>';
  cities.sort().forEach(city => {
    select.innerHTML += `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`;
  });
}

// EVENT DETAIL
async function loadEventDetail(eventId) {
  const container = document.getElementById('event-detail');
  container.innerHTML = '<div class="loader">Загрузка...</div>';

  try {
    const data = await apiRequest(`/events/${eventId}`);
    const event = data.data || data;
    renderEventDetail(event);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">😔</div><p class="empty-state__text">${error.message}</p></div>`;
  }
}

function renderEventDetail(event) {
  const container = document.getElementById('event-detail');
  const fullDate = formatFullDate(event.dateTime);
  const gradient = getEventGradient(event.title);
  const emoji = getEventEmoji(event.title);
  const isLoggedIn = !!token;
  const spots = event.availableSpots !== undefined ? event.availableSpots : event.capacity;
  const isFull = spots <= 0;
  const isRegistered = event.isUserRegistered;

  let actionBtn = '';
  if (!isLoggedIn) {
    actionBtn = `<button class="btn btn--primary" onclick="navigateTo('login')">Войдите, чтобы зарегистрироваться</button>`;
  } else if (isRegistered) {
    actionBtn = `<button class="btn btn--accent" disabled style="opacity:0.9;cursor:default">✓ Вы зарегистрированы</button>
                 <button class="btn btn--outline" style="border-color:var(--danger);color:var(--danger)" onclick="cancelAndRefresh('${event._id}')">Отменить регистрацию</button>`;
  } else if (isFull) {
    actionBtn = `<button class="btn btn--primary" disabled>Мест нет</button>`;
  } else {
    actionBtn = `<button class="btn btn--primary" onclick="registerForEvent('${event._id}')">🎫 Зарегистрироваться</button>`;
  }

  container.innerHTML = `
    <div class="event-detail__hero" style="background: ${gradient}">${emoji}</div>
    <div class="event-detail__content">
      <div class="event-detail__date-badge">📅 ${fullDate}</div>
      <h1 class="event-detail__title">${escapeHtml(event.title)}</h1>
      <div class="event-detail__meta">
        <div class="event-detail__meta-item">📍 ${escapeHtml(event.city || 'Не указан')}${event.address ? ', ' + escapeHtml(event.address) : ''}</div>
        <div class="event-detail__meta-item">👥 Свободно: ${spots} из ${event.capacity} мест</div>
        ${event.createdBy ? `<div class="event-detail__meta-item">🎤 Организатор: ${escapeHtml(event.createdBy.email || 'Unknown')}</div>` : ''}
      </div>
      <div class="event-detail__description">${escapeHtml(event.description || 'Описание отсутствует')}</div>
      <div class="event-detail__actions">
        ${actionBtn}
        <button class="btn btn--outline" onclick="navigateTo('home')">← Назад</button>
      </div>
    </div>`;
}

// EVENT REGISTRATION
async function registerForEvent(eventId) {
  try {
    await apiRequest(`/events/${eventId}/register`, { method: 'POST' });
    showToast('Вы успешно зарегистрировались на мероприятие!', 'success');
    loadEventDetail(eventId); // Refresh page to show updated state
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function cancelAndRefresh(eventId) {
  if (!confirm('Вы уверены, что хотите отменить регистрацию?')) return;
  try {
    await apiRequest(`/events/${eventId}/register`, { method: 'DELETE' });
    showToast('Регистрация отменена', 'info');
    loadEventDetail(eventId); // Refresh page
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// LOGIN
async function handleLogin(e) {
  e.preventDefault();
  clearFormErrors();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showFormError('login-error', 'Заполните все поля'); return; }

  try {
    const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    const userData = data.data || data;
    token = userData.token;
    localStorage.setItem('token', token);
    currentUser = { email: userData.email, role: userData.role, _id: userData.id };

    showToast('Добро пожаловать!', 'success');
    updateNav();
    navigateTo('home');
    loadEvents();
  } catch (error) {
    showFormError('login-error', error.message);
  }
}

// REGISTER
async function handleRegister(e) {
  e.preventDefault();
  clearFormErrors();

  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;

  if (!email || !password || !confirm) { showFormError('register-error', 'Заполните все поля'); return; }
  if (password !== confirm) { showFormError('register-error', 'Пароли не совпадают'); return; }
  if (password.length < 6) { showFormError('register-error', 'Пароль должен быть не менее 6 символов'); return; }

  try {
    const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
    const userData = data.data || data;
    token = userData.token;
    localStorage.setItem('token', token);
    currentUser = { email: userData.email, role: userData.role, _id: userData.id };

    showToast('Регистрация прошла успешно!', 'success');
    updateNav();
    navigateTo('home');
    loadEvents();
  } catch (error) {
    showFormError('register-error', error.message);
  }
}

// LOGOUT
function handleLogout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  updateNav();
  showToast('Вы вышли из аккаунта', 'info');
  navigateTo('home');
}

// PROFILE
async function loadProfile() {
  try {
    const data = await apiRequest('/users/me');
    currentUser = data.data || data;
    document.getElementById('profile-email').textContent = currentUser.email || '—';

    const roleEl = document.getElementById('profile-role');
    const role = currentUser.role || 'user';
    const roleNames = { user: 'Пользователь', organizer: 'Организатор', super_admin: 'Администратор' };
    roleEl.textContent = roleNames[role] || role;
    roleEl.className = `profile__role badge badge--${role}`;

    updateNav();
    updateOrganizerBanner();
  } catch (error) {
    if (error.message.includes('401') || error.message.toLowerCase().includes('token')) {
      handleLogout();
    }
  }
}

// MY REGISTRATIONS
async function loadMyRegistrations() {
  const container = document.getElementById('my-registrations');
  container.innerHTML = '<div class="loader">Загрузка регистраций...</div>';

  try {
    const data = await apiRequest('/users/registrations');
    const registrations = data.data || [];
    const now = new Date();

    const upcoming = registrations.filter(r => { const ev = r.eventId || {}; return ev.dateTime && new Date(ev.dateTime) > now; });
    const past = registrations.filter(r => { const ev = r.eventId || {}; return ev.dateTime && new Date(ev.dateTime) <= now; });

    const statReg = document.getElementById('stat-registrations');
    const statUpcoming = document.getElementById('stat-upcoming');
    const statPast = document.getElementById('stat-past');
    if (statReg) statReg.textContent = registrations.length;
    if (statUpcoming) statUpcoming.textContent = upcoming.length;
    if (statPast) statPast.textContent = past.length;

    if (registrations.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><p class="empty-state__text">Вы пока не зарегистрированы ни на одно мероприятие</p><button class="btn btn--primary" style="margin-top:16px" onclick="navigateTo('home')">Найти мероприятие</button></div>`;
      return;
    }

    container.innerHTML = registrations.map(reg => {
      const event = reg.eventId || {};
      const date = formatDate(event.dateTime);
      const gradient = getEventGradient(event.title || '');
      const emoji = getEventEmoji(event.title || '');
      const isPast = event.dateTime && new Date(event.dateTime) <= now;

      return `
        <div class="event-card">
          <div class="event-card__image" style="background: ${gradient}; cursor:pointer" onclick="navigateTo('event', { eventId: '${event._id}' })">${emoji}</div>
          <div class="event-card__body">
            <div class="event-card__date">${date} ${isPast ? '<span style="color:var(--text-light)">(прошло)</span>' : ''}</div>
            <h3 class="event-card__title" style="cursor:pointer" onclick="navigateTo('event', { eventId: '${event._id}' })">${escapeHtml(event.title || 'Неизвестное мероприятие')}</h3>
            <div class="event-card__location">📍 ${escapeHtml(event.city || 'Город не указан')}</div>
            <div class="event-card__footer">
              <span class="event-card__tag" style="background:rgba(0,184,148,0.1);color:var(--success)">✓ Зарегистрирован</span>
              ${!isPast ? `<button class="cancel-reg-btn" onclick="cancelRegistration('${event._id}')">Отменить</button>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">😔</div><p class="empty-state__text">${error.message}</p></div>`;
  }
}

// ORGANIZER REQUEST
async function requestOrganizerRole() {
  try {
    await apiRequest('/organizer/request', { method: 'POST' });
    showToast('Заявка отправлена! Ожидайте одобрения администратора.', 'success');
    updateOrganizerBanner();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function updateOrganizerBanner() {
  const banner = document.getElementById('organizer-request-banner');
  if (!banner || !currentUser) { if (banner) banner.style.display = 'none'; return; }

  if (currentUser.role === 'user') {
    banner.style.display = 'block';
    // Check if there's already a pending request
    apiRequest('/organizer/request/status').then(data => {
      const status = (data.data && data.data.status) || null;
      if (status === 'pending') {
        banner.className = 'organizer-banner organizer-banner--pending';
        banner.querySelector('.organizer-banner__text h3').textContent = 'Заявка на рассмотрении';
        banner.querySelector('.organizer-banner__text p').textContent = 'Администратор скоро рассмотрит вашу заявку';
        const btn = document.getElementById('request-organizer-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Ожидание...'; }
      }
    }).catch(() => {});
  } else {
    banner.style.display = 'none';
  }
}

// CREATE EVENT
async function handleCreateEvent(e) {
  e.preventDefault();
  clearFormErrors();

  const title = document.getElementById('event-title').value.trim();
  const description = document.getElementById('event-description').value.trim();
  const dateTime = document.getElementById('event-datetime').value;
  const capacity = parseInt(document.getElementById('event-capacity').value);
  const city = document.getElementById('event-city').value.trim();
  const address = document.getElementById('event-address').value.trim();

  if (!title || !description || !dateTime || !capacity || !city || !address) {
    showFormError('create-event-error', 'Заполните все поля');
    return;
  }

  try {
    await apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify({ title, description, dateTime, capacity, city, address })
    });
    showToast('Мероприятие создано!', 'success');
    document.getElementById('create-event-form').reset();
    navigateTo('home');
  } catch (error) {
    showFormError('create-event-error', error.message);
  }
}

// ADMIN PANEL
let currentAdminTab = 'requests';

function switchAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  if (tab === 'requests') loadAdminOrganizerRequests();
  else if (tab === 'users') loadAdminUsers();
}

async function loadAdminOrganizerRequests() {
  const container = document.getElementById('admin-content');
  container.innerHTML = '<div class="loader">Загрузка заявок...</div>';

  try {
    const data = await apiRequest('/admin/organizer-requests?limit=50');
    const requests = data.data || [];

    if (requests.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><p class="empty-state__text">Заявок пока нет</p></div>`;
      return;
    }

    container.innerHTML = requests.map(req => {
      const user = req.userId || {};
      const date = formatDate(req.createdAt);
      const isPending = req.status === 'pending';

      return `
        <div class="request-card">
          <div class="request-card__info">
            <div class="request-card__email">${escapeHtml(user.email || 'Неизвестный')}</div>
            <div class="request-card__date">Подана: ${date}</div>
          </div>
          <span class="request-card__status request-card__status--${req.status}">${req.status === 'pending' ? 'Ожидает' : req.status === 'approved' ? 'Одобрена' : 'Отклонена'}</span>
          ${isPending ? `
            <div class="request-card__actions">
              <button class="btn btn--success btn--sm" onclick="handleOrganizerRequest('${req._id}', 'approve')">Одобрить</button>
              <button class="btn btn--danger btn--sm" onclick="handleOrganizerRequest('${req._id}', 'reject')">Отклонить</button>
            </div>
          ` : ''}
        </div>`;
    }).join('');
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">😔</div><p class="empty-state__text">${error.message}</p></div>`;
  }
}

async function handleOrganizerRequest(requestId, action) {
  try {
    await apiRequest(`/admin/organizer-requests/${requestId}/${action}`, { method: 'POST' });
    showToast(action === 'approve' ? 'Заявка одобрена!' : 'Заявка отклонена', action === 'approve' ? 'success' : 'info');
    loadAdminOrganizerRequests();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadAdminUsers() {
  const container = document.getElementById('admin-content');
  container.innerHTML = '<div class="loader">Загрузка пользователей...</div>';

  try {
    const data = await apiRequest('/admin/users');
    const users = data.data || [];

    if (users.length === 0) {
      container.innerHTML = `<div class="empty-state"><p class="empty-state__text">Пользователей нет</p></div>`;
      return;
    }

    container.innerHTML = users.map(user => `
      <div class="user-card">
        <div class="user-card__email">${escapeHtml(user.email)}</div>
        <span class="badge badge--${user.role}">${user.role}</span>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">😔</div><p class="empty-state__text">${error.message}</p></div>`;
  }
}

// CANCEL REGISTRATION
async function cancelRegistration(eventId) {
  if (!confirm('Вы уверены, что хотите отменить регистрацию?')) return;
  try {
    await apiRequest(`/events/${eventId}/register`, { method: 'DELETE' });
    showToast('Регистрация отменена', 'info');
    loadMyRegistrations();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// TOAST
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// FORM HELPERS
function showFormError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

// UTILS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'Дата не указана';
  return new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFullDate(dateString) {
  if (!dateString) return 'Дата не указана';
  return new Date(dateString).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getEventGradient(title) {
  const gradients = [
    'linear-gradient(135deg, #6C5CE7, #a18cd1)', 'linear-gradient(135deg, #00CEC9, #81ecec)',
    'linear-gradient(135deg, #FF6B6B, #ee5a6f)', 'linear-gradient(135deg, #FDCB6E, #f9a825)',
    'linear-gradient(135deg, #00B894, #55efc4)', 'linear-gradient(135deg, #E17055, #fab1a0)',
    'linear-gradient(135deg, #0984E3, #74b9ff)', 'linear-gradient(135deg, #D63031, #ff7675)',
    'linear-gradient(135deg, #6C5CE7, #00CEC9)', 'linear-gradient(135deg, #E84393, #fd79a8)',
  ];
  const hash = (title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

function getEventEmoji(title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('концерт') || lower.includes('music') || lower.includes('музык')) return '🎵';
  if (lower.includes('конференц') || lower.includes('conference') || lower.includes('tech')) return '💻';
  if (lower.includes('спорт') || lower.includes('sport') || lower.includes('футбол')) return '⚽';
  if (lower.includes('театр') || lower.includes('theater') || lower.includes('спектакль')) return '🎭';
  if (lower.includes('выставк') || lower.includes('exhibit') || lower.includes('арт')) return '🎨';
  if (lower.includes('кино') || lower.includes('film') || lower.includes('фильм')) return '🎬';
  if (lower.includes('мастер') || lower.includes('workshop') || lower.includes('класс')) return '🛠️';
  if (lower.includes('еда') || lower.includes('food') || lower.includes('кулинар')) return '🍽️';
  if (lower.includes('фестиваль') || lower.includes('festival')) return '🎉';
  if (lower.includes('лекц') || lower.includes('lecture') || lower.includes('образован')) return '📚';
  return '🎫';
}
 