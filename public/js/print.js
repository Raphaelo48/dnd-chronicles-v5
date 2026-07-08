// ============ PRINT / PDF EXPORT ============
function printCharacterSheet(id) {
  const c = getCharacter(id);
  if (!c) return;

  const pb = profBonus(c.level);
  const fmtM = n => n >= 0 ? '+' + n : '' + n;

  const statsRows = Object.entries(c.stats).map(([key, score]) => {
    const mod = abMod(score);
    return `<tr><td>${ABILITY_LABELS[key]}</td><td>${score}</td><td>${fmtM(mod)}</td></tr>`;
  }).join('');

  const savesRows = Object.entries(c.stats).map(([key]) => {
    const prof  = c.savingThrows.includes(key);
    const bonus = abMod(c.stats[key]) + (prof ? pb : 0);
    return `<tr><td>${prof ? '●' : '○'}</td><td>${ABILITY_LABELS[key]}</td><td>${fmtM(bonus)}</td></tr>`;
  }).join('');

  const skillsRows = SKILLS.map(([name, ab]) => {
    const prof  = c.skills.includes(name);
    const bonus = abMod(c.stats[ab]) + (prof ? pb : 0);
    return `<tr><td>${prof ? '●' : '○'}</td><td>${name}</td><td>${ABILITY_LABELS[ab]}</td><td>${fmtM(bonus)}</td></tr>`;
  }).join('');

  const hpPct = Math.max(0, Math.min(100, Math.round((c.hpCurrent / c.hpMax) * 100)));

  const inventoryList = c.inventory.length
    ? c.inventory.map(i => `<li>${i}</li>`).join('')
    : '<li style="color:#888">Инвентарь пуст</li>';

  const spellsList = c.spells.length
    ? c.spells.map(s => `<li>${s}</li>`).join('')
    : '<li style="color:#888">Заклинания не добавлены</li>';

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Лист персонажа — ${c.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Montserrat',sans-serif; font-size:11px; color:#1a1a1a; background:#fff; padding:12mm 14mm; }
    h1 { font-family:'Cinzel',serif; font-size:22px; letter-spacing:2px; margin-bottom:2px; }
    h2 { font-family:'Cinzel',serif; font-size:13px; letter-spacing:1px; border-bottom:2px solid #8b4513; padding-bottom:4px; margin:10px 0 6px; color:#5c2f0a; }
    .sub { color:#555; font-size:11px; margin-bottom:8px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #8b4513; padding-bottom:8px; margin-bottom:10px; }
    .header-left h1 { color:#5c2f0a; }
    .badges { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
    .badge { background:#f0e6d3; border:1px solid #c8a96e; border-radius:4px; padding:2px 7px; font-size:10px; font-weight:600; color:#5c2f0a; }
    .grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .panel { border:1px solid #c8a96e; border-radius:6px; padding:8px; background:#fdf8f2; }
    table { width:100%; border-collapse:collapse; }
    td, th { padding:3px 5px; text-align:left; font-size:10px; }
    tbody tr:nth-child(even) { background:#f5ede0; }
    td:last-child { text-align:center; font-weight:700; color:#5c2f0a; }
    .hp-bar { height:8px; background:#e0d0b8; border-radius:4px; margin-top:4px; }
    .hp-bar-fill { height:100%; background:#8b4513; border-radius:4px; width:${hpPct}%; }
    .stat-row { display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dotted #ddd; }
    .stat-row:last-child { border-bottom:none; }
    .big { font-family:'Cinzel',serif; font-size:20px; text-align:center; color:#5c2f0a; font-weight:700; }
    ul { padding-left:14px; line-height:1.7; }
    .bio-text { color:#333; line-height:1.6; margin-top:4px; }
    .notes-box { border:1px solid #c8a96e; border-radius:6px; height:60px; background:#fdf8f2; margin-top:4px; }
    @media print {
      body { padding:8mm 10mm; }
      .no-print { display:none; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <h1>${c.name}</h1>
      <div class="sub">${c.race} · ${c.cls} · ${c.level} уровень · ${c.alignment || ''}</div>
      <div class="badges">
        <span class="badge">Ур. ${c.level}</span>
        <span class="badge">Бонус мастерства: ${fmtM(pb)}</span>
        <span class="badge">КЗ: ${c.ac}</span>
        <span class="badge">Скорость: ${c.speed} фт.</span>
        <span class="badge">Происхождение: ${c.background || '—'}</span>
      </div>
    </div>
    <div style="text-align:right;">
      <div class="big">${c.hpCurrent}/${c.hpMax}</div>
      <div style="font-size:10px; color:#555; text-align:center;">HP</div>
      <div class="hp-bar"><div class="hp-bar-fill"></div></div>
      ${c.hpTemp ? `<div style="font-size:10px; color:#888; margin-top:3px; text-align:center;">Temp HP: ${c.hpTemp}</div>` : ''}
    </div>
  </div>

  <div class="grid">

    <!-- Characteristics -->
    <div class="panel">
      <h2>📊 Характеристики</h2>
      <table>
        <thead><tr><th>Навык</th><th style="text-align:center">Счёт</th><th style="text-align:center">Мод</th></tr></thead>
        <tbody>${statsRows}</tbody>
      </table>
    </div>

    <!-- Saves -->
    <div class="panel">
      <h2>🛡️ Спасброски</h2>
      <table>
        <tbody>${savesRows}</tbody>
      </table>

      <h2 style="margin-top:10px;">⚔️ Боевые</h2>
      <div class="stat-row"><span>КЗ (AC)</span><span style="font-weight:700;color:#5c2f0a;">${c.ac}</span></div>
      <div class="stat-row"><span>Скорость</span><span style="font-weight:700;color:#5c2f0a;">${c.speed} фт.</span></div>
      <div class="stat-row"><span>HP макс.</span><span style="font-weight:700;color:#5c2f0a;">${c.hpMax}</span></div>
      <div class="stat-row"><span>Temp HP</span><span style="font-weight:700;color:#5c2f0a;">${c.hpTemp}</span></div>
      <div class="stat-row"><span>Бонус мастерства</span><span style="font-weight:700;color:#5c2f0a;">${fmtM(pb)}</span></div>
    </div>

    <!-- Skills -->
    <div class="panel">
      <h2>🎯 Навыки</h2>
      <table>
        <tbody>${skillsRows}</tbody>
      </table>
    </div>

  </div>

  <div class="grid-2" style="margin-top:10px;">

    <!-- Inventory -->
    <div class="panel">
      <h2>🎒 Инвентарь</h2>
      <ul>${inventoryList}</ul>
    </div>

    <!-- Spells -->
    <div class="panel">
      <h2>📜 Заклинания</h2>
      <ul>${spellsList}</ul>
    </div>

  </div>

  <div class="panel" style="margin-top:10px;">
    <h2>📖 Предыстория</h2>
    <div class="grid-2">
      <div>
        ${c.appearance ? `<p class="bio-text"><strong>Внешность:</strong> ${c.appearance}</p>` : ''}
        ${c.ideals     ? `<p class="bio-text"><strong>Идеалы:</strong> ${c.ideals}</p>`     : ''}
      </div>
      <div>
        ${c.bio ? `<p class="bio-text"><strong>История:</strong> ${c.bio}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="panel" style="margin-top:10px;">
    <h2>📝 Заметки</h2>
    <div class="notes-box"></div>
  </div>

  <script>window.onload = () => { window.print(); window.close(); };<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
}
