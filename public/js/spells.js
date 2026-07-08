// ============ SPELLS ============
function renderSpells(list) {
  const container = document.getElementById('spells-list');
  if (!list.length) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">📜</div><p>Заклинания не найдены.</p></div>';
    return;
  }
  container.innerHTML = list.map(s => {
    const levelText = s.level === 0 ? 'Заговор' : `${s.level}-й круг`;
    return `
      <div class="spell-card" onclick='openSpellModal(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
        <div class="spell-header">
          <div class="spell-name">${s.name}</div>
          <div class="spell-level">${levelText}</div>
        </div>
        <div class="spell-desc">${s.desc}</div>
        <div class="spell-meta">
          <span class="badge badge-purple">${s.school}</span>
          <span class="badge">${s.time}</span>
          ${s.classes.slice(0, 3).map(c => `<span class="badge badge-pink">${c}</span>`).join('')}
          ${s.classes.length > 3 ? `<span class="badge">+${s.classes.length - 3}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function filterSpells() {
  const search = document.getElementById('spell-search').value.toLowerCase();
  const level = document.getElementById('spell-level').value;
  const school = document.getElementById('spell-school').value;
  const cls = document.getElementById('spell-class').value;
  let filtered = spells.filter(s => {
    if (search && !s.name.toLowerCase().includes(search) && !s.desc.toLowerCase().includes(search)) return false;
    if (level !== '' && s.level !== parseInt(level)) return false;
    if (school && s.school !== school) return false;
    if (cls && !s.classes.includes(cls)) return false;
    return true;
  });
  renderSpells(filtered);
}

function openSpellModal(s) {
  const levelText = s.level === 0 ? 'Заговор' : `${s.level}-й круг`;
  document.getElementById('modal-content').innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
    <h2>${s.name}</h2>
    <div class="card-meta" style="margin-bottom: 1rem;">
      <span class="badge badge-purple">${levelText}</span>
      <span class="badge">${s.school}</span>
    </div>
    <div class="stats-grid">
      <div class="stat-box"><div class="stat-label">Время</div><div class="stat-value" style="font-size: 1rem;">${s.time}</div></div>
      <div class="stat-box"><div class="stat-label">Дистанция</div><div class="stat-value" style="font-size: 1rem;">60 фт</div></div>
      <div class="stat-box"><div class="stat-label">Длительность</div><div class="stat-value" style="font-size: 1rem;">Мгновенно</div></div>
    </div>
    <h3 style="font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: var(--accent);">Описание</h3>
    <p style="color: var(--text-dim); line-height: 1.7;">${s.desc}</p>
    <h3 style="font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: var(--accent);">Доступно классам</h3>
    <div class="card-meta">
      ${s.classes.map(c => `<span class="badge badge-pink">${c}</span>`).join('')}
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('active');
}
