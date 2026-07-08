// ============ CAMPAIGNS ============

async function loadCampaigns() {
  try {
    const data = await API.get('/campaigns');
    campaigns = data.campaigns;
  } catch (err) {
    campaigns = [];
    console.error('loadCampaigns:', err);
  }
}

function getUserCampaigns() { return campaigns; }

function filterCampaigns() {
  const q      = (document.getElementById('camp-search')?.value || '').toLowerCase();
  const status = document.getElementById('camp-filter')?.value || 'all';
  const grid   = document.getElementById('campaigns-grid');
  if (!grid) return;

  let list = campaigns;
  if (status !== 'all') list = list.filter(c => c.status === status);
  if (q)                list = list.filter(c => c.name.toLowerCase().includes(q) || (c.desc||'').toLowerCase().includes(q));

  if (!list.length) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🎲</div><p>Кампании не найдены.</p></div>';
    return;
  }

  const statusLabel = { active:'⚔️ Активна', paused:'⏸ Пауза', completed:'✅ Завершена' };

  grid.innerHTML = list.map(c => {
    const myBadge = currentUser
      ? (c.dmId === currentUser.id
          ? '<span class="badge badge-gold">👑 Вы ДМ</span>'
          : c.isMember
            ? '<span class="badge badge-green">✅ Вы в группе</span>'
            : '')
      : '';
    return `
      <div class="card" onclick="openCampaignModal(${c.id})">
        <div class="card-header">
          <div>
            <h3>${c.name}</h3>
            <div class="card-meta">
              <span class="badge badge-gold">👑 ДМ: ${c.dm}</span>
              <span class="badge">${statusLabel[c.status] || c.status}</span>
              <span class="badge badge-purple">Ур. ${c.level}</span>
              ${myBadge}
            </div>
          </div>
        </div>
        <p class="card-text">${(c.desc||c.description||'').length > 120 ? (c.desc||c.description||'').slice(0,117)+'…' : (c.desc||c.description||'')}</p>
        <div class="card-footer">
          <span>👥 ${(c.members||[]).length} игроков</span>
          <span>📖 ${c.sessions} сессий</span>
        </div>
      </div>`;
  }).join('');
}

async function openCampaignModal(id) {
  let c = campaigns.find(x => x.id === id);
  if (!c) return;

  const statusText = { active:'⚔️ Активна', paused:'⏸ Пауза', completed:'✅ Завершена' }[c.status] || c.status;
  const isOwner  = currentUser && c.dmId === currentUser.id;
  const isMember = currentUser && c.isMember;

  const membersHtml = (c.members||[]).length
    ? (c.members||[]).map(m => `
        <div class="member-row">
          <span>🧝 ${m.name}${m.charName ? ` — <em>${m.charName}</em>` : ''}</span>
          ${isOwner ? `<button class="btn btn-sm btn-danger" onclick="kickMember(${id},'${m.userId}')">Исключить</button>` : ''}
        </div>`).join('')
    : '<div style="color:var(--text-dim);">Пока нет участников</div>';

  const logHtml = (c.log||[]).slice(-10).reverse().map(e => `
    <div class="log-entry">
      <span class="log-time">${e.date ? new Date(e.date).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}</span>
      <span>${e.text}</span>
    </div>`).join('') || '<div style="color:var(--text-dim);">Журнал пуст</div>';

  let actionsHtml = '';
  if (isOwner) {
    actionsHtml = `
      <button class="btn btn-primary"   onclick="addSession(${id})">📝 Добавить сессию</button>
      <button class="btn btn-secondary" onclick="addLogEntry(${id})">📖 Запись в журнал</button>
      <button class="btn btn-danger"    onclick="deleteCampaign(${id})">🗑️ Удалить</button>`;
  } else if (isMember) {
    actionsHtml = `<button class="btn btn-secondary" onclick="leaveCampaign(${id})">🚪 Покинуть кампанию</button>`;
  } else if (currentUser) {
    actionsHtml = `<button class="btn btn-primary" onclick="joinCampaign(${id})">⚔️ Вступить</button>`;
  } else {
    actionsHtml = `<button class="btn btn-secondary" onclick="showPage('auth');renderAuthPage('login');closeModal()">🔐 Войти для участия</button>`;
  }

  document.getElementById('modal-content').innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="font-size:3rem;margin-bottom:0.75rem;">🎲</div>
    <h2 style="margin-bottom:0.5rem;">${c.name}</h2>
    <div class="card-meta" style="margin-bottom:1rem;flex-wrap:wrap;gap:0.4rem;">
      <span class="badge badge-gold">👑 ДМ: ${c.dm}</span>
      <span class="badge">${statusText}</span>
      <span class="badge badge-purple">Ур. ${c.level}</span>
      <span class="badge">${c.sessions} сессий</span>
    </div>
    <p style="color:var(--text-dim);line-height:1.7;margin-bottom:1.5rem;">${c.desc||c.description||''}</p>
    <h3 style="color:var(--accent);margin-bottom:0.75rem;">👥 Игроки (${(c.members||[]).length})</h3>
    <div class="members-list">${membersHtml}</div>
    <h3 style="color:var(--accent);margin:1.25rem 0 0.75rem;">📖 Журнал</h3>
    <div class="camp-log">${logHtml}</div>
    <div style="display:flex;gap:0.75rem;margin-top:1.5rem;flex-wrap:wrap;">${actionsHtml}</div>
  `;
  document.getElementById('modal-overlay').classList.add('active');
}

function renderCreateCampaignForm() {
  if (!requireAuth('создать кампанию')) return;
  document.getElementById('modal-content').innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>⚔️ Создать кампанию</h2>
    <div class="form-group" style="margin-top:1rem;">
      <label>Название кампании</label>
      <input type="text" id="camp-name" placeholder="Потерянные копи Фандалина" class="auth-input">
    </div>
    <div class="form-group">
      <label>Описание</label>
      <textarea id="camp-desc" rows="4" placeholder="Опишите сюжет и атмосферу..." class="auth-input" style="resize:vertical;"></textarea>
    </div>
    <div class="form-group">
      <label>Уровни игроков</label>
      <select id="camp-level" class="auth-input">
        <option value="1-5">1–5</option><option value="6-10">6–10</option>
        <option value="11-15">11–15</option><option value="16-20">16–20</option>
      </select>
    </div>
    <div class="form-group">
      <label>Статус</label>
      <select id="camp-status" class="auth-input">
        <option value="active">⚔️ Активна</option>
        <option value="paused">⏸ Пауза</option>
      </select>
    </div>
    <div id="camp-error" class="auth-error" style="display:none;"></div>
    <button class="btn btn-primary" id="camp-create-btn" style="width:100%;margin-top:1rem;"
      onclick="doCreateCampaign()">👑 Создать кампанию</button>
  `;
  document.getElementById('modal-overlay').classList.add('active');
}

async function doCreateCampaign() {
  const name   = document.getElementById('camp-name')?.value.trim();
  const desc   = document.getElementById('camp-desc')?.value.trim();
  const level  = document.getElementById('camp-level')?.value;
  const status = document.getElementById('camp-status')?.value;
  const errEl  = document.getElementById('camp-error');
  const btn    = document.getElementById('camp-create-btn');

  if (!name || !desc) {
    if (errEl) { errEl.textContent = 'Заполните название и описание.'; errEl.style.display=''; }
    return;
  }
  if (btn) { btn.disabled=true; btn.textContent='⏳ Создание...'; }
  try {
    const data = await API.post('/campaigns', { name, description: desc, level, status });
    campaigns.unshift(data.campaign);
    currentUser.isDM = true;
    applyAuthState();
    closeModal();
    filterCampaigns();
    showToast('Кампания создана! 👑');
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.style.display=''; }
    if (btn) { btn.disabled=false; btn.textContent='👑 Создать кампанию'; }
  }
}

async function joinCampaign(id) {
  if (!requireAuth('вступить в кампанию')) return;
  const c = campaigns.find(x => x.id === id);
  if (!c) return;

  const myChars = characters.filter(ch => ch.ownerId === currentUser.id || !ch.ownerId);

  if (!myChars.length) {
    document.getElementById('modal-content').innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div style="text-align:center;padding:1.5rem 0;">
        <div style="font-size:3rem;margin-bottom:1rem;">🧝</div>
        <h2>Нет персонажей</h2>
        <p style="color:var(--text-dim);margin:1rem 0;">Создайте персонажа для вступления в кампанию!</p>
        <button class="btn btn-primary" onclick="closeModal();showPage('character');">➕ Создать персонажа</button>
      </div>`;
    return;
  }

  const charCards = myChars.map(ch => `
    <div class="char-pick-card" onclick="confirmJoinWithChar(${id},${ch.id})">
      <div style="font-size:2rem;">🧝</div>
      <div>
        <div style="font-weight:700;">${ch.name}</div>
        <div style="font-size:0.85rem;color:var(--text-dim);">${ch.race} · ${ch.cls} · Ур.${ch.level}</div>
      </div>
    </div>`).join('');

  document.getElementById('modal-content').innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>⚔️ Выберите персонажа</h2>
    <p style="color:var(--text-dim);margin:0.75rem 0 1.25rem;">С кем войдёте в «${c.name}»?</p>
    <div class="char-pick-list">${charCards}</div>
    <div style="text-align:center;margin-top:1rem;">
      <button class="btn btn-secondary" onclick="closeModal();showPage('character');">➕ Создать нового</button>
    </div>`;
}

async function confirmJoinWithChar(campId, charId) {
  const char = characters.find(c => c.id == charId);
  if (!char) return;
  try {
    const data = await API.post('/campaigns/' + campId + '/join', { charId, charName: char.name });
    const idx  = campaigns.findIndex(c => c.id === campId);
    if (idx >= 0) campaigns[idx] = data.campaign;
    closeModal();
    filterCampaigns();
    showToast(`Вы вступили как ${char.name}! ⚔️`);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function leaveCampaign(id) {
  if (!confirm('Покинуть кампанию?')) return;
  try {
    await API.post('/campaigns/' + id + '/leave');
    const idx = campaigns.findIndex(c => c.id === id);
    if (idx >= 0) {
      campaigns[idx].members = campaigns[idx].members.filter(m => m.userId !== currentUser.id);
      campaigns[idx].isMember = false;
    }
    closeModal();
    filterCampaigns();
    showToast('Вы покинули кампанию');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function kickMember(campId, userId) {
  const c = campaigns.find(x => x.id === campId);
  const m = c?.members?.find(m => String(m.userId) === String(userId));
  if (!m || !confirm(`Исключить ${m.name}?`)) return;
  try {
    await API.post('/campaigns/' + campId + '/kick', { userId });
    c.members = c.members.filter(m => String(m.userId) !== String(userId));
    closeModal();
    filterCampaigns();
    showToast(`${m.name} исключён`);
  } catch (err) {
    showToast(err.message, true);
  }
}

async function addSession(id) {
  try {
    const text = `Сессия #${(campaigns.find(c=>c.id===id)?.sessions||0)+1} проведена`;
    const data = await API.post('/campaigns/' + id + '/log', { text });
    const c = campaigns.find(x => x.id === id);
    if (c) { c.sessions++; c.log = [...(c.log||[]), data.entry]; }
    closeModal();
    filterCampaigns();
    showToast('Сессия добавлена! 📝');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function addLogEntry(id) {
  const text = prompt('Запись в журнал:');
  if (!text?.trim()) return;
  try {
    const data = await API.post('/campaigns/' + id + '/log', { text: text.trim() });
    const c = campaigns.find(x => x.id === id);
    if (c) c.log = [...(c.log||[]), data.entry];
    closeModal();
    filterCampaigns();
    showToast('Запись добавлена 📖');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteCampaign(id) {
  if (!confirm('Удалить кампанию? Все данные будут потеряны.')) return;
  try {
    await API.delete('/campaigns/' + id);
    campaigns = campaigns.filter(c => c.id !== id);
    closeModal();
    filterCampaigns();
    showToast('Кампания удалена');
  } catch (err) {
    showToast(err.message, true);
  }
}
