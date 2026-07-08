// ============ MY CHARACTERS / CHARACTER SHEET ============
const ABILITY_LABELS = { str:'СИЛ', dex:'ЛОВ', con:'ТЕЛ', int:'ИНТ', wis:'МДР', cha:'ХАР' };
const SKILLS = [
  ['Атлетика','str'],['Акробатика','dex'],['Ловкость рук','dex'],['Скрытность','dex'],
  ['Магия','int'],['История','int'],['Расследование','int'],['Природа','int'],
  ['Уход за животными','wis'],['Проницательность','wis'],['Медицина','wis'],['Восприятие','wis'],['Выживание','wis'],
  ['Обман','cha'],['Запугивание','cha'],['Выступление','cha'],['Убеждение','cha'],['Религия','int']
];

// ---- API-backed persistence ----
async function loadCharacters() {
  if (!currentUser) { characters = []; renderMyCharacters(); return; }
  try {
    const data = await API.get('/characters');
    characters = data.characters;
    renderMyCharacters();
  } catch {
    characters = [];
  }
}

async function saveCharactersToStorage() {
  // No-op: individual saves are done via API in each operation
}

async function _apiSaveChar(char) {
  // char already has an id from DB — PATCH; otherwise POST
  if (char._isNew) {
    const { _isNew, ...payload } = char;
    const data = await API.post('/characters', { character: payload });
    return data.character;
  } else {
    const data = await API.patch('/characters/' + char.id, { character: char });
    return data.character;
  }
}

// ---- Helpers ----
function abMod(score) { return Math.floor((score - 10) / 2); }
function fmtMod(n)    { return n >= 0 ? '+' + n : '' + n; }
function profBonus(l) { return Math.ceil(l / 4) + 1; }

function renderMyCharacters() {
  const grid = document.getElementById('mychars-grid');
  if (!grid) return;
  if (!currentUser) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🔐</div><p>Войдите, чтобы видеть своих персонажей.</p></div>';
    return;
  }
  if (!characters.length) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon">🧙</div><p>У вас пока нет персонажей. Создайте первого героя!</p></div>';
    return;
  }
  grid.innerHTML = characters.map(c => `
    <div class="card">
      <div class="char-card-thumb" onclick="openCharacterSheet(${c.id})" style="cursor:pointer;">
        <div class="ccico">🧝</div>
        <div>
          <h3>${c.name}</h3>
          <p>${c.race} · ${c.cls}</p>
        </div>
      </div>
      <div class="card-meta" style="justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <span class="badge">Ур. ${c.level}</span>
          <span class="badge badge-green">${c.hpCurrent}/${c.hpMax} HP</span>
          <span class="badge badge-purple">${c.alignment || ''}</span>
        </div>
        <button class="btn btn-danger btn-sm" style="padding:0.3rem 0.6rem; font-size:0.8rem;"
          onclick="deleteCharacter(${c.id})" title="Удалить персонажа">🗑️</button>
      </div>
    </div>
  `).join('');
}

function getCharacter(id) { return characters.find(c => c.id == id); }

function openCharacterSheet(id) {
  const c = getCharacter(id);
  if (!c) { showPage('mychars'); return; }
  showPage('charsheet');
  renderCharacterSheet(c);
}

async function deleteCharacter(id) {
  if (!confirm('Удалить этого персонажа?')) return;
  try {
    await API.delete('/characters/' + id);
    characters = characters.filter(c => c.id != id);
    renderMyCharacters();
    showToast('Персонаж удалён');
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---- Patching helpers ----
async function _patchChar(id, updates) {
  const idx = characters.findIndex(c => c.id == id);
  if (idx === -1) return;
  Object.assign(characters[idx], updates);
  try {
    const saved = await _apiSaveChar(characters[idx]);
    characters[idx] = saved;
  } catch (err) {
    showToast('Не удалось сохранить: ' + err.message, true);
  }
}

// ---- Character Sheet Rendering ----
function renderCharacterSheet(c) {
  const pb = profBonus(c.level);
  const hpPct   = Math.max(0, Math.min(100, Math.round((c.hpCurrent / c.hpMax) * 100)));
  const hpColor = hpPct > 50 ? 'var(--success)' : hpPct > 20 ? 'var(--accent)' : 'var(--danger)';

  const statsHtml = Object.entries(c.stats || {}).map(([k, v]) => {
    const mod = abMod(v);
    return `
      <div class="stat-box">
        <div class="stat-label">${ABILITY_LABELS[k] || k}</div>
        <div class="stat-value">${v}</div>
        <div class="stat-mod">${fmtMod(mod)}</div>
      </div>`;
  }).join('');

  const savesHtml = Object.entries(c.stats || {}).map(([k, v]) => {
    const proficient = (c.savingThrows || []).includes(k);
    const val = abMod(v) + (proficient ? pb : 0);
    return `
      <div class="skill-row" onclick="toggleSave('${c.id}','${k}')">
        <span class="skill-prof ${proficient ? 'proficient' : ''}"></span>
        <span class="skill-name">${ABILITY_LABELS[k]}</span>
        <span class="skill-val">${fmtMod(val)}</span>
      </div>`;
  }).join('');

  const skillsHtml = SKILLS.map(([name, attr]) => {
    const proficient = (c.skills || []).includes(name);
    const val = abMod((c.stats || {})[attr] || 10) + (proficient ? pb : 0);
    return `
      <div class="skill-row" onclick="toggleSkill('${c.id}','${name}')">
        <span class="skill-prof ${proficient ? 'proficient' : ''}"></span>
        <span class="skill-name">${name} <span style="color:var(--text-dim);font-size:0.78rem;">(${ABILITY_LABELS[attr]})</span></span>
        <span class="skill-val">${fmtMod(val)}</span>
      </div>`;
  }).join('');

  const invHtml = (c.inventory || []).length
    ? c.inventory.map((item, i) => `
        <div class="inv-item">
          <span>⚔️ ${item}</span>
          <button class="btn btn-sm" onclick="removeInventoryItem('${c.id}',${i})">✕</button>
        </div>`).join('')
    : '<div style="color:var(--text-dim);font-size:0.9rem;padding:0.5rem 0;">Инвентарь пуст</div>';

  const spellsHtml = (c.spells || []).length
    ? c.spells.map((sp, i) => `
        <div class="inv-item">
          <span>✨ ${sp}</span>
          <button class="btn btn-sm" onclick="removeSpell('${c.id}',${i})">✕</button>
        </div>`).join('')
    : '<div style="color:var(--text-dim);font-size:0.9rem;padding:0.5rem 0;">Заклинания не выбраны</div>';

  document.getElementById('page-charsheet').innerHTML = `
    <section class="section">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="showPage('mychars')">← Мои персонажи</button>
        <h1 style="flex:1;margin:0;">${c.name}</h1>
        <span class="badge badge-gold">Ур. ${c.level}</span>
      </div>

      <div class="sheet-grid">

        <!-- Left: identity + stats -->
        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem;">
              <div style="font-size:3rem;">🧝</div>
              <div>
                <div style="font-size:1.1rem;font-weight:700;color:var(--accent);">${c.race} · ${c.cls}</div>
                <div style="color:var(--text-dim);font-size:0.9rem;">${c.background || ''} ${c.alignment ? '· '+c.alignment : ''}</div>
                <div style="color:var(--text-dim);font-size:0.85rem;">Возраст: ${c.age || '?'} · Скорость: ${c.speed || 30} фт.</div>
              </div>
            </div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
              <div class="mini-stat">
                <div class="mini-stat-label">КД</div>
                <div class="mini-stat-val" id="cs-ac">${c.ac || 10}</div>
              </div>
              <div class="mini-stat">
                <div class="mini-stat-label">Иниц.</div>
                <div class="mini-stat-val">${fmtMod(abMod((c.stats||{}).dex||10))}</div>
              </div>
              <div class="mini-stat">
                <div class="mini-stat-label">Бонус мастерства</div>
                <div class="mini-stat-val">+${pb}</div>
              </div>
            </div>
          </div>

          <!-- HP block -->
          <div class="card" style="margin-bottom:1.5rem;">
            <h3 style="color:var(--accent);margin-bottom:0.75rem;">❤️ Хиты</h3>
            <div style="background:var(--bg-2);border-radius:8px;overflow:hidden;height:12px;margin-bottom:0.75rem;">
              <div style="height:100%;background:${hpColor};width:${hpPct}%;transition:width 0.3s;"></div>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
              <span style="font-size:1.4rem;font-weight:700;">${c.hpCurrent}</span>
              <span style="color:var(--text-dim);">/ ${c.hpMax} (Макс)</span>
              ${c.hpTemp ? `<span class="badge badge-purple">+${c.hpTemp} врем.</span>` : ''}
            </div>
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap;">
              <button class="btn btn-sm btn-danger"   onclick="changeHP('${c.id}',-1)">−1 HP</button>
              <button class="btn btn-sm btn-danger"   onclick="changeHP('${c.id}',-5)">−5 HP</button>
              <button class="btn btn-sm btn-success"  onclick="changeHP('${c.id}',1)">+1 HP</button>
              <button class="btn btn-sm btn-success"  onclick="changeHP('${c.id}',5)">+5 HP</button>
              <button class="btn btn-sm"              onclick="healFull('${c.id}')">♻️ Полное лечение</button>
            </div>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem;align-items:center;">
              <input type="number" id="hp-custom" placeholder="Кол-во" style="width:90px;" class="auth-input" min="1">
              <button class="btn btn-sm btn-danger"  onclick="customHP('${c.id}','dmg')">Урон</button>
              <button class="btn btn-sm btn-success" onclick="customHP('${c.id}','heal')">Лечение</button>
            </div>
          </div>

          <!-- Stats -->
          <div class="card" style="margin-bottom:1.5rem;">
            <h3 style="color:var(--accent);margin-bottom:0.75rem;">🎲 Характеристики</h3>
            <div class="stats-grid">${statsHtml}</div>
          </div>
        </div>

        <!-- Right: saves, skills, inventory, spells -->
        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <h3 style="color:var(--accent);margin-bottom:0.75rem;">🛡️ Спасброски</h3>
            <div class="skills-list">${savesHtml}</div>
          </div>

          <div class="card" style="margin-bottom:1.5rem;">
            <h3 style="color:var(--accent);margin-bottom:0.75rem;">🎯 Навыки</h3>
            <div class="skills-list">${skillsHtml}</div>
          </div>

          <div class="card" style="margin-bottom:1.5rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h3 style="color:var(--accent);margin:0;">🎒 Инвентарь</h3>
              <button class="btn btn-sm btn-primary" onclick="addInventoryItem('${c.id}')">+ Добавить</button>
            </div>
            <div id="inv-list-${c.id}">${invHtml}</div>
          </div>

          <div class="card" style="margin-bottom:1.5rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h3 style="color:var(--accent);margin:0;">✨ Заклинания</h3>
              <button class="btn btn-sm btn-primary" onclick="addSpell('${c.id}')">+ Добавить</button>
            </div>
            <div id="spell-list-${c.id}">${spellsHtml}</div>
          </div>

          ${c.appearance || c.ideals || c.bio ? `
          <div class="card">
            <h3 style="color:var(--accent);margin-bottom:0.75rem;">📜 История</h3>
            ${c.appearance ? `<p><strong>Внешность:</strong> ${c.appearance}</p>` : ''}
            ${c.ideals     ? `<p><strong>Идеалы:</strong> ${c.ideals}</p>` : ''}
            ${c.bio        ? `<p><strong>Предыстория:</strong> ${c.bio}</p>` : ''}
          </div>` : ''}
        </div>

      </div>
    </section>
  `;
}

// ---- HP operations ----
async function changeHP(id, delta) {
  const c = getCharacter(id);
  if (!c) return;
  const newHP = Math.min(c.hpMax, Math.max(0, c.hpCurrent + delta));
  await _patchChar(id, { hpCurrent: newHP });
  openCharacterSheet(id);
}
async function healFull(id) {
  const c = getCharacter(id);
  if (!c) return;
  await _patchChar(id, { hpCurrent: c.hpMax });
  openCharacterSheet(id);
}
async function customHP(id, mode) {
  const val = parseInt(document.getElementById('hp-custom')?.value);
  if (!val || val <= 0) return;
  const c = getCharacter(id);
  if (!c) return;
  const newHP = mode === 'dmg'
    ? Math.max(0, c.hpCurrent - val)
    : Math.min(c.hpMax, c.hpCurrent + val);
  await _patchChar(id, { hpCurrent: newHP });
  openCharacterSheet(id);
}

// ---- Saves/Skills toggles ----
async function toggleSave(id, key) {
  const c = getCharacter(id);
  if (!c) return;
  const saves = [...(c.savingThrows || [])];
  const idx   = saves.indexOf(key);
  if (idx >= 0) saves.splice(idx, 1); else saves.push(key);
  await _patchChar(id, { savingThrows: saves });
  openCharacterSheet(id);
}
async function toggleSkill(id, name) {
  const c = getCharacter(id);
  if (!c) return;
  const skills = [...(c.skills || [])];
  const idx    = skills.indexOf(name);
  if (idx >= 0) skills.splice(idx, 1); else skills.push(name);
  await _patchChar(id, { skills });
  openCharacterSheet(id);
}

// ---- Inventory ----
async function addInventoryItem(id) {
  const item = prompt('Название предмета:');
  if (!item?.trim()) return;
  const c = getCharacter(id);
  if (!c) return;
  const inventory = [...(c.inventory || []), item.trim()];
  await _patchChar(id, { inventory });
  openCharacterSheet(id);
}
async function removeInventoryItem(id, i) {
  const c = getCharacter(id);
  if (!c) return;
  const inventory = [...(c.inventory || [])];
  inventory.splice(i, 1);
  await _patchChar(id, { inventory });
  openCharacterSheet(id);
}

// ---- Spells ----
async function addSpell(id) {
  const sp = prompt('Название заклинания:');
  if (!sp?.trim()) return;
  const c = getCharacter(id);
  if (!c) return;
  const spells = [...(c.spells || []), sp.trim()];
  await _patchChar(id, { spells });
  openCharacterSheet(id);
}
async function removeSpell(id, i) {
  const c = getCharacter(id);
  if (!c) return;
  const spells = [...(c.spells || [])];
  spells.splice(i, 1);
  await _patchChar(id, { spells });
  openCharacterSheet(id);
}
