// ============ BESTIARY ============
function renderBestiary(list) {
  const grid = document.getElementById('bestiary-grid');
  if (!list.length) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div><p>Монстры не найдены. Попробуйте изменить фильтры.</p></div>';
    return;
  }
  grid.innerHTML = list.map(m => {
    const crBadge = m.cr >= 16 ? 'badge-red' : m.cr >= 9 ? 'badge-purple' : m.cr >= 3 ? 'badge-pink' : 'badge-green';
    return `
      <div class="card" onclick='openMonsterModal(${JSON.stringify(m).replace(/'/g, "&apos;")})'>
        <div class="card-icon">${m.icon}</div>
        <h3>${m.name}</h3>
        <p>${m.desc}</p>
        <div class="card-meta">
          <span class="badge ${crBadge}">CR ${m.cr}</span>
          <span class="badge">${m.type}</span>
          <span class="badge badge-purple">HP ${m.hp}</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterBestiary() {
  const search = document.getElementById('bestiary-search').value.toLowerCase();
  const type = document.getElementById('bestiary-type').value;
  const cr = document.getElementById('bestiary-cr').value;
  let filtered = monsters.filter(m => {
    if (search && !m.name.toLowerCase().includes(search)) return false;
    if (type && m.type !== type) return false;
    if (cr === 'low' && m.cr > 2) return false;
    if (cr === 'mid' && (m.cr < 3 || m.cr > 8)) return false;
    if (cr === 'high' && (m.cr < 9 || m.cr > 15)) return false;
    if (cr === 'deadly' && m.cr < 16) return false;
    return true;
  });
  renderBestiary(filtered);
}

function openMonsterModal(m) {
  const crBadge = m.cr >= 16 ? 'badge-red' : m.cr >= 9 ? 'badge-purple' : m.cr >= 3 ? 'badge-pink' : 'badge-green';
  document.getElementById('modal-content').innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="font-size: 4rem; margin-bottom: 1rem;">${m.icon}</div>
    <h2>${m.name}</h2>
    <div class="card-meta" style="margin-bottom: 1rem;">
      <span class="badge ${crBadge}">CR ${m.cr}</span>
      <span class="badge">${m.type}</span>
    </div>
    <p style="color: var(--text-dim); line-height: 1.7; margin-bottom: 1.5rem;">${m.desc}</p>
    <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem; color: var(--accent);">Характеристики</h3>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-label">HP</div><div class="stat-value">${m.hp}</div></div>
      <div class="stat-box"><div class="stat-label">КД</div><div class="stat-value">${m.ac}</div></div>
      <div class="stat-box"><div class="stat-label">CR</div><div class="stat-value">${m.cr}</div></div>
    </div>
    <h3 style="font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: var(--accent);">Атаки</h3>
    <ul style="color: var(--text-dim); margin-left: 1.5rem; line-height: 1.8;">
      ${m.attacks.map(a => `<li>${a}</li>`).join('')}
    </ul>
  `;
  document.getElementById('modal-overlay').classList.add('active');
}
