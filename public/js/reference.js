// ============ REFERENCE ============
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  event?.target?.classList?.add('active') || document.querySelector(`.tab[onclick*="${tabName}"]`)?.classList.add('active');
  document.getElementById('tab-' + tabName).classList.add('active');
}

function renderReference() {
  // Classes
  document.getElementById('tab-classes').innerHTML = referenceData.classes.map(c => `
    <div class="ref-item" onclick="this.classList.toggle('open')">
      <div class="ref-header">
        <div class="ref-title"><span style="font-size: 1.5rem;">${c.icon}</span> ${c.name}</div>
        <div class="ref-toggle">+</div>
      </div>
      <div class="ref-body">
        <div class="ref-content">
          <p>${c.desc}</p>
          <div class="stats-grid" style="margin-top: 1rem;">
            <div class="stat-box"><div class="stat-label">Кость хитов</div><div class="stat-value">${c.hitDie}</div></div>
            <div class="stat-box"><div class="stat-label">Основная</div><div class="stat-value" style="font-size: 0.9rem;">${c.primary}</div></div>
          </div>
          <h4 style="margin-top: 1rem; color: var(--accent);">Особенности:</h4>
          <ul>${c.features.map(f => `<li>${f}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `).join('');

  // Races
  document.getElementById('tab-races').innerHTML = referenceData.races.map(r => `
    <div class="ref-item" onclick="this.classList.toggle('open')">
      <div class="ref-header">
        <div class="ref-title"><span style="font-size: 1.5rem;">${r.icon}</span> ${r.name}</div>
        <div class="ref-toggle">+</div>
      </div>
      <div class="ref-body">
        <div class="ref-content">
          <p>${r.desc}</p>
          <h4 style="margin-top: 1rem; color: var(--accent);">Особенности расы:</h4>
          <ul>${r.traits.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `).join('');

  // Weapons
  document.getElementById('tab-weapons').innerHTML = referenceData.weapons.map(w => `
    <div class="ref-item" onclick="this.classList.toggle('open')">
      <div class="ref-header">
        <div class="ref-title"><span style="font-size: 1.5rem;">${w.icon}</span> ${w.name}</div>
        <div class="ref-toggle">+</div>
      </div>
      <div class="ref-body">
        <div class="ref-content">
          <p>${w.desc}</p>
          <div class="stats-grid" style="margin-top: 1rem;">
            <div class="stat-box"><div class="stat-label">Урон</div><div class="stat-value" style="font-size: 1.25rem;">${w.damage}</div></div>
            <div class="stat-box"><div class="stat-label">Тип</div><div class="stat-value" style="font-size: 1rem;">${w.type}</div></div>
          </div>
          <h4 style="margin-top: 1rem; color: var(--accent);">Свойства:</h4>
          <div class="card-meta">${w.properties.map(p => `<span class="badge">${p}</span>`).join('')}</div>
        </div>
      </div>
    </div>
  `).join('');

  // Armor
  document.getElementById('tab-armor').innerHTML = referenceData.armor.map(a => `
    <div class="ref-item" onclick="this.classList.toggle('open')">
      <div class="ref-header">
        <div class="ref-title"><span style="font-size: 1.5rem;">${a.icon}</span> ${a.name}</div>
        <div class="ref-toggle">+</div>
      </div>
      <div class="ref-body">
        <div class="ref-content">
          <p>${a.desc}</p>
          <div class="stats-grid" style="margin-top: 1rem;">
            <div class="stat-box"><div class="stat-label">КД</div><div class="stat-value" style="font-size: 1.25rem;">${a.ac}</div></div>
            <div class="stat-box"><div class="stat-label">Тип</div><div class="stat-value" style="font-size: 1rem;">${a.type}</div></div>
            <div class="stat-box"><div class="stat-label">Помеха</div><div class="stat-value" style="font-size: 1rem;">${a.stealth ? 'Да' : 'Нет'}</div></div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Equipment
  document.getElementById('tab-equipment').innerHTML = referenceData.equipment.map(e => `
    <div class="ref-item" onclick="this.classList.toggle('open')">
      <div class="ref-header">
        <div class="ref-title"><span style="font-size: 1.5rem;">${e.icon}</span> ${e.name}</div>
        <div class="ref-toggle">+</div>
      </div>
      <div class="ref-body">
        <div class="ref-content">
          <p>${e.desc}</p>
          <h4 style="margin-top: 1rem; color: var(--accent);">Содержимое:</h4>
          <ul>${e.items.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `).join('');
}
