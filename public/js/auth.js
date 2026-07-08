// ============ AUTH ============
let currentUser = null;

// ---- State ----
function applyAuthState() {
  const loggedIn = !!currentUser;

  const createBtn = document.getElementById('nav-create-btn');
  const loginBtn  = document.getElementById('nav-login-btn');
  const userBlock = document.getElementById('nav-user-block');
  const userName  = document.getElementById('nav-user-name');
  if (createBtn) createBtn.style.display = loggedIn ? '' : 'none';
  if (loginBtn)  loginBtn.style.display  = loggedIn ? 'none' : '';
  if (userBlock) userBlock.style.display = loggedIn ? 'flex' : 'none';
  if (userName && currentUser) userName.textContent = currentUser.name;

  const roleBadge = document.getElementById('nav-role-badge');
  if (roleBadge) {
    if (loggedIn && currentUser.isDM) {
      roleBadge.textContent = '👑 ДМ';
      roleBadge.style.display = '';
    } else {
      roleBadge.style.display = 'none';
    }
  }
}

async function loadCurrentUser() {
  try {
    const data = await API.get('/auth/me');
    currentUser = data.user;
  } catch {
    currentUser = null;
  }
  applyAuthState();
}

async function logout() {
  try { await API.post('/auth/logout'); } catch {}
  currentUser = null;
  characters = [];
  applyAuthState();
  showPage('home');
  showToast('Вы вышли из аккаунта');
}

// ---- Auth page rendering ----
function renderAuthPage(mode) {
  const pg = document.getElementById('page-auth');
  if (!pg) return;
  const isReg = mode === 'register';
  pg.innerHTML = `
    <section class="section" style="min-height:80vh; display:flex; align-items:center; justify-content:center;">
      <div class="auth-card">
        <div class="auth-logo">🐉</div>
        <h2 class="auth-title">${isReg ? 'Создать аккаунт' : 'Добро пожаловать!'}</h2>
        <p class="auth-sub">${isReg ? 'Присоединяйтесь к миру приключений' : 'Войдите, чтобы продолжить'}</p>

        ${isReg ? `
        <div class="form-group">
          <label style="display:flex;justify-content:space-between;align-items:center;">Имя героя
            <span id="a-name-counter" style="font-size:0.75rem;color:var(--text-dim);">0/10</span>
          </label>
          <input type="text" id="a-name" placeholder="Элминстер" class="auth-input" maxlength="10"
            oninput="document.getElementById('a-name-counter').textContent=this.value.length+'/10';
                     document.getElementById('a-name-counter').style.color=this.value.length>=10?'var(--danger)':'var(--text-dim)'">
        </div>` : ''}

        <div class="form-group">
          <label>Email</label>
          <input type="email" id="a-email" placeholder="hero@dnd.com" class="auth-input" autocomplete="email">
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input type="password" id="a-password" placeholder="••••••••" class="auth-input">
        </div>

        <div id="a-error" class="auth-error" style="display:none;"></div>

        <button class="btn btn-primary" id="a-submit-btn"
          style="width:100%; margin-top:0.5rem; padding:0.85rem;"
          onclick="${isReg ? 'doRegister()' : 'doLogin()'}">
          ${isReg ? '🧙 Создать аккаунт' : '⚔️ Войти'}
        </button>

        <p class="auth-switch">
          ${isReg
            ? 'Уже есть аккаунт? <a onclick="renderAuthPage(\'login\')">Войти</a>'
            : 'Нет аккаунта? <a onclick="renderAuthPage(\'register\')">Зарегистрироваться</a>'
          }
        </p>
      </div>
    </section>
  `;
  setTimeout(() => {
    const pwd = document.getElementById('a-password');
    if (pwd) pwd.addEventListener('keydown', e => { if (e.key === 'Enter') isReg ? doRegister() : doLogin(); });
  }, 0);
}

function showAuthError(msg) {
  const el = document.getElementById('a-error');
  if (el) { el.textContent = msg; el.style.display = ''; }
}

function setAuthLoading(loading) {
  const btn = document.getElementById('a-submit-btn');
  if (btn) { btn.disabled = loading; btn.textContent = loading ? '⏳ Загрузка...' : (document.getElementById('a-name') ? '🧙 Создать аккаунт' : '⚔️ Войти'); }
}

async function doLogin() {
  const email    = (document.getElementById('a-email').value    || '').trim().toLowerCase();
  const password =  document.getElementById('a-password').value || '';
  if (!email || !password) return showAuthError('Заполните все поля.');
  setAuthLoading(true);
  try {
    const data = await API.post('/auth/login', { email, password });
    currentUser = data.user;
    applyAuthState();
    await loadCharacters();
    showPage('home');
    showToast(`Добро пожаловать, ${currentUser.name}! ⚔️`);
  } catch (err) {
    showAuthError(err.message);
  } finally {
    setAuthLoading(false);
  }
}

async function doRegister() {
  const name     = (document.getElementById('a-name').value     || '').trim();
  const email    = (document.getElementById('a-email').value    || '').trim().toLowerCase();
  const password =  document.getElementById('a-password').value || '';
  if (!name || !email || !password) return showAuthError('Заполните все поля.');
  if (name.length > 10) return showAuthError('Имя не может быть длиннее 10 символов.');
  if (password.length < 6) return showAuthError('Пароль слишком короткий (минимум 6 символов).');
  setAuthLoading(true);
  try {
    const data = await API.post('/auth/register', { name, email, password });
    currentUser = data.user;
    applyAuthState();
    showPage('home');
    showToast(`Аккаунт создан! Добро пожаловать, ${name}! 🎉`);
  } catch (err) {
    showAuthError(err.message);
  } finally {
    setAuthLoading(false);
  }
}

function promoteCurrentUserToDM() {
  if (currentUser) currentUser.isDM = true;
  applyAuthState();
}

function requireAuth(action) {
  if (!currentUser || typeof currentUser === 'undefined') {
    showPage('auth');
    renderAuthPage('login');
    showToast('Войдите, чтобы продолжить', true);
    return false;
  }
  return true;
}
