// ============ CHARACTER CREATOR ============
let currentStep = 1;

const RACE_BONUSES = {
  'Человек':         { str:1, dex:1, con:1, int:1, wis:1, cha:1 },
  'Эльф':            { dex:2, int:1 },
  'Высший эльф':     { dex:2, int:1 },
  'Лесной эльф':     { dex:2, wis:1 },
  'Тёмный эльф':     { dex:2, cha:1 },
  'Дварф':           { con:2, str:2 },
  'Горный дварф':    { con:2, str:2 },
  'Холмовой дварф':  { con:2, wis:1 },
  'Полурослик':      { dex:2, cha:1 },
  'Лёгкая стопа':    { dex:2, cha:1 },
  'Крепыш':          { dex:2, con:1 },
  'Драконорождённый':{ str:2, cha:1 },
  'Гном':            { int:2, con:1 },
  'Лесной гном':     { int:2, dex:1 },
  'Полуорк':         { str:2, con:1 },
  'Тифлинг':         { int:1, cha:2 },
};
const CLASS_BONUSES = {
  'Воин':      { str:1, con:1 }, 'Варвар':    { str:2, con:1 },
  'Паладин':   { str:1, cha:1 }, 'Следопыт':  { dex:1, wis:1 },
  'Плут':      { dex:2 },        'Монах':     { dex:1, wis:1 },
  'Волшебник': { int:2 },        'Чародей':   { cha:2 },
  'Колдун':    { cha:2 },        'Бард':      { cha:2 },
  'Жрец':      { wis:2 },        'Друид':     { wis:2, int:1 },
};
const BASE_SCORES = { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
const STAT_LABELS = {
  str:'💪 Сила (STR)', dex:'🏃 Ловкость (DEX)', con:'❤️ Телосложение (CON)',
  int:'🧠 Интеллект (INT)', wis:'👁️ Мудрость (WIS)', cha:'✨ Харизма (CHA)',
};
const STAT_SHORT = { str:'СИЛ', dex:'ЛОВ', con:'ТЕЛ', int:'ИНТ', wis:'МДР', cha:'ХАР' };

function getRaceBonus()  { return RACE_BONUSES[document.getElementById('char-race')?.value || '']  || {}; }
function getClassBonus() { return CLASS_BONUSES[document.getElementById('char-class')?.value || ''] || {}; }
function computeFinalStat(key) {
  const base = parseInt(document.getElementById('stat-' + key)?.value) || 10;
  return Math.min(20, Math.max(1, base + (getRaceBonus()[key]||0) + (getClassBonus()[key]||0)));
}

function updateStatDisplay() {
  const rb = getRaceBonus(), cb = getClassBonus();
  ['str','dex','con','int','wis','cha'].forEach(key => {
    const input = document.getElementById('stat-' + key);
    if (!input) return;
    const base = parseInt(input.value) || 10;
    const r = rb[key]||0, c = cb[key]||0;
    const total = Math.min(20, Math.max(1, base+r+c));
    const mod   = Math.floor((total-10)/2);
    const maxBase = 20-r-c;
    if (base > maxBase) input.value = maxBase;
    input.min = 1; input.max = maxBase;
    const bonusEl = document.getElementById('stat-bonus-'+key);
    if (bonusEl) {
      const parts = [];
      if (r) parts.push(`<span class="bonus-race">Раса ${r>0?'+':''}${r}</span>`);
      if (c) parts.push(`<span class="bonus-class">Класс ${c>0?'+':''}${c}</span>`);
      bonusEl.innerHTML = parts.join(' ') || '';
    }
    const totalEl = document.getElementById('stat-total-'+key);
    if (totalEl) { totalEl.textContent = total; totalEl.className = 'stat-total'+(total===20?' stat-max':total>=16?' stat-high':''); }
    const modEl = document.getElementById('stat-mod-'+key);
    if (modEl) modEl.textContent = mod>=0?'+'+mod:''+mod;
  });
}

function renderStatStep() {
  const rb = getRaceBonus(), cb = getClassBonus();
  const race = document.getElementById('char-race')?.value||'', cls = document.getElementById('char-class')?.value||'';
  const bonusSummary = [];
  if (race && RACE_BONUSES[race]) {
    const b = RACE_BONUSES[race];
    bonusSummary.push(`<span class="badge badge-green">🧝 ${race}: ${Object.entries(b).map(([k,v])=>STAT_SHORT[k]+(v>0?'+':'')+v).join(', ')}</span>`);
  }
  if (cls && CLASS_BONUSES[cls]) {
    const b = CLASS_BONUSES[cls];
    bonusSummary.push(`<span class="badge badge-purple">⚔️ ${cls}: ${Object.entries(b).map(([k,v])=>STAT_SHORT[k]+(v>0?'+':'')+v).join(', ')}</span>`);
  }
  const statsHtml = ['str','dex','con','int','wis','cha'].map(key => {
    const r=rb[key]||0, c=cb[key]||0, maxBase=Math.max(1,20-r-c);
    const base=Math.min(parseInt(document.getElementById('stat-'+key)?.value||10),maxBase);
    const total=Math.min(20,Math.max(1,base+r+c)), mod=Math.floor((total-10)/2);
    const modStr=mod>=0?'+'+mod:''+mod;
    const rParts=[];
    if(r) rParts.push(`<span class="bonus-race">Раса +${r}</span>`);
    if(c) rParts.push(`<span class="bonus-class">Класс +${c}</span>`);
    return `
      <div class="stat-row-builder">
        <div class="stat-builder-label">${STAT_LABELS[key]}</div>
        <div class="stat-builder-controls">
          <button class="stat-btn" onclick="adjustStat('${key}',-1)">−</button>
          <input type="number" id="stat-${key}" value="${base}" min="1" max="${maxBase}"
            class="stat-input-num" onchange="updateStatDisplay()" oninput="updateStatDisplay()">
          <button class="stat-btn" onclick="adjustStat('${key}',1)">+</button>
        </div>
        <div class="stat-builder-bonuses" id="stat-bonus-${key}">${rParts.join(' ')}</div>
        <div class="stat-builder-total">
          <span class="stat-total-label">Итого</span>
          <span id="stat-total-${key}" class="stat-total${total===20?' stat-max':total>=16?' stat-high':''}">${total}</span>
          <span id="stat-mod-${key}" class="stat-mod-display">${modStr}</span>
        </div>
      </div>`;
  }).join('');
  document.getElementById('step-3').innerHTML = `
    <div class="stat-builder-header">
      <p style="color:var(--text-dim);margin-bottom:0.75rem;">Базовые значения: <strong>15, 14, 13, 12, 10, 8</strong>. Максимум — <strong>20</strong>.</p>
      ${bonusSummary.length ? `<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">${bonusSummary.join('')}</div>` : ''}
    </div>
    <div class="stats-builder-grid">${statsHtml}</div>
    <div style="display:flex;justify-content:space-between;gap:1rem;margin-top:2rem;">
      <button class="btn btn-secondary" onclick="nextStep(2)">← Назад</button>
      <button class="btn btn-primary"   onclick="nextStep(4)">Далее →</button>
    </div>`;
}

function adjustStat(key, delta) {
  const input = document.getElementById('stat-'+key);
  if (!input) return;
  const rb=getRaceBonus()[key]||0, cb=getClassBonus()[key]||0;
  const maxBase = Math.max(1,20-rb-cb);
  input.value = Math.min(maxBase, Math.max(1,(parseInt(input.value)||10)+delta));
  updateStatDisplay();
}

function nextStep(step) {
  if (step===2 && currentStep===1) {
    if (!document.getElementById('char-name')?.value.trim() || !document.getElementById('char-race')?.value)
      { showToast('Заполните имя и выберите расу!', true); return; }
  }
  if (step===3 && currentStep===2) {
    if (!document.getElementById('char-class')?.value)
      { showToast('Выберите класс персонажа!', true); return; }
    renderStatStep(); currentStep=step; _activateStep(step); return;
  }
  if (step===5) renderCharacterSummary();
  currentStep=step; _activateStep(step);
}

function _activateStep(step) {
  document.querySelectorAll('.step').forEach(s => {
    const n=parseInt(s.dataset.step);
    s.classList.remove('active','completed');
    if(n===step) s.classList.add('active');
    else if(n<step) s.classList.add('completed');
  });
  document.querySelectorAll('.step-content').forEach(c=>c.classList.remove('active'));
  const sc=document.getElementById('step-'+step);
  if(sc) sc.classList.add('active');
  window.scrollTo({top:200,behavior:'smooth'});
}

function renderCharacterSummary() {
  const name=document.getElementById('char-name')?.value||'Безымянный';
  const race=document.getElementById('char-race')?.value||'—';
  const cls=document.getElementById('char-class')?.value||'—';
  const level=document.getElementById('char-level')?.value||'1';
  const alignment=document.getElementById('char-alignment')?.value||'';
  const finals={};
  ['str','dex','con','int','wis','cha'].forEach(k=>finals[k]=computeFinalStat(k));
  const mod=v=>{const m=Math.floor((v-10)/2);return(m>=0?'+':'')+m;};
  document.getElementById('character-summary').innerHTML = `
    <div style="background:var(--card);border:1px solid var(--accent);border-radius:16px;padding:1.5rem;">
      <h3 style="color:var(--accent);margin-bottom:0.5rem;">${name}</h3>
      <p style="color:var(--text-dim);margin-bottom:1rem;">${race} · ${cls} · ${level} ур.</p>
      <div class="card-meta" style="margin-bottom:1rem;"><span class="badge">${alignment}</span></div>
      <h4 style="color:var(--accent);margin-bottom:0.5rem;">Итоговые характеристики</h4>
      <div class="stats-grid">
        ${Object.entries(finals).map(([k,v])=>`
          <div class="stat-box">
            <div class="stat-label">${STAT_SHORT[k]}</div>
            <div class="stat-value">${v}<span style="font-size:0.8rem;color:var(--text-dim);"> (${mod(v)})</span></div>
          </div>`).join('')}
      </div>
    </div>`;
}

function resetCharacter() {
  ['char-name','char-age','char-appearance','char-ideals','char-bio'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ['char-race','char-class','char-alignment','char-background'].forEach(id=>{const el=document.getElementById(id);if(el)el.selectedIndex=0;});
  const lvl=document.getElementById('char-level');if(lvl)lvl.value=1;
  ['str','dex','con','int','wis','cha'].forEach(k=>{const el=document.getElementById('stat-'+k);if(el)el.value=10;});
  currentStep=1; _activateStep(1);
}

async function saveCharacter() {
  if (!requireAuth()) return;

  const finals={};
  ['str','dex','con','int','wis','cha'].forEach(k=>finals[k]=computeFinalStat(k));
  const hpDice={Воин:10,Варвар:12,Паладин:10,Следопыт:10,Плут:8,Монах:8,Волшебник:6,Чародей:6,Колдун:8,Бард:8,Жрец:8,Друид:8};
  const cls=document.getElementById('char-class')?.value||'Воин';
  const level=parseInt(document.getElementById('char-level')?.value)||1;
  const conMod=Math.floor((finals.con-10)/2);
  const hpMax=(hpDice[cls]||8)+conMod+((level-1)*(Math.floor((hpDice[cls]||8)/2)+1+conMod));

  const char = {
    _isNew:     true,
    ownerId:    currentUser.id,
    ownerName:  currentUser.name,
    name:       document.getElementById('char-name')?.value||'Безымянный',
    race:       document.getElementById('char-race')?.value||'—',
    cls,
    level,
    age:        document.getElementById('char-age')?.value||'?',
    alignment:  document.getElementById('char-alignment')?.value||'',
    background: document.getElementById('char-background')?.value||'',
    appearance: document.getElementById('char-appearance')?.value||'',
    ideals:     document.getElementById('char-ideals')?.value||'',
    bio:        document.getElementById('char-bio')?.value||'',
    stats:      finals,
    hpMax:      Math.max(1,hpMax),
    hpCurrent:  Math.max(1,hpMax),
    hpTemp:     0,
    ac:         10+Math.floor((finals.dex-10)/2),
    speed:      30,
    savingThrows:[], skills:[], inventory:[], spells:[],
  };

  const saveBtn = document.getElementById('char-save-btn');
  if (saveBtn) { saveBtn.disabled=true; saveBtn.textContent='⏳ Сохранение...'; }

  try {
    const saved = await _apiSaveChar(char);
    characters.unshift(saved);
    showToast('Персонаж сохранён! 🎉');
    setTimeout(() => openCharacterSheet(saved.id), 1200);
  } catch (err) {
    showToast('Ошибка сохранения: ' + err.message, true);
    if (saveBtn) { saveBtn.disabled=false; saveBtn.textContent='💾 Сохранить персонажа'; }
  }
}
