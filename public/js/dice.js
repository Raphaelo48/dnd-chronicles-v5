// ============ DICE ROLLER ============
let diceState = {
  die: 20,
  count: 1,
  mod: 0,
};
let diceHistory = [];

function selectDie(n) {
  diceState.die = n;
  document.querySelectorAll('.die-btn').forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.die) === n);
  });
  if (window.dice3dSelectDie) window.dice3dSelectDie(n);
}

function changeCount(delta) {
  diceState.count = Math.max(1, Math.min(20, diceState.count + delta));
  document.getElementById('dice-count').textContent = diceState.count;
}

function changeMod(delta) {
  diceState.mod = Math.max(-20, Math.min(20, diceState.mod + delta));
  document.getElementById('dice-mod').textContent = diceState.mod >= 0
    ? '+' + diceState.mod
    : diceState.mod;
}

function rollSingle(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDice() {
  const { die, count, mod } = diceState;
  const label = document.getElementById('dice-label').value.trim() || `${count}d${die}`;
  _doRoll(count, die, mod, label, false);
}

function quickRoll(count, die, mod, label) {
  const isAdvantage = label === 'С преим.';
  const isDisadvantage = label === 'Без преим.';
  if (isAdvantage || isDisadvantage) {
    if (window.dice3dRoll) window.dice3dRoll();
    const r1 = rollSingle(20);
    const r2 = rollSingle(20);
    const total = isAdvantage ? Math.max(r1, r2) : Math.min(r1, r2);
    const now = new Date();
    const entry = {
      label,
      formula: `2d20 → ${isAdvantage ? 'макс' : 'мин'}`,
      rolls: [r1, r2],
      mod: 0,
      total,
      isCrit: total === 20,
      isFail: total === 1,
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    showResult(entry);
    addToHistory(entry);
    return;
  }
  if (label === '4d6 drop lowest') {
    if (window.dice3dRoll) window.dice3dRoll();
    const rolls = [rollSingle(6), rollSingle(6), rollSingle(6), rollSingle(6)];
    const dropped = Math.min(...rolls);
    const total = rolls.reduce((a, b) => a + b, 0) - dropped;
    const now = new Date();
    const entry = {
      label: '4d6 — мин',
      formula: `4d6 drop lowest`,
      rolls,
      mod: 0,
      total,
      isCrit: false,
      isFail: false,
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    showResult(entry);
    addToHistory(entry);
    return;
  }
  _doRoll(count, die, mod, label, false);
}

function _doRoll(count, die, mod, label) {
  if (window.dice3dRoll) window.dice3dRoll();
  const rolls = [];
  for (let i = 0; i < count; i++) rolls.push(rollSingle(die));
  const sum = rolls.reduce((a, b) => a + b, 0);
  const total = sum + mod;
  const isCrit = die === 20 && count === 1 && rolls[0] === 20;
  const isFail = die === 20 && count === 1 && rolls[0] === 1;
  const modStr = mod === 0 ? '' : (mod > 0 ? ` + ${mod}` : ` − ${Math.abs(mod)}`);
  const now = new Date();
  const entry = {
    label,
    formula: `${count}d${die}${modStr}`,
    rolls,
    mod,
    total,
    isCrit,
    isFail,
    time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  };
  showResult(entry);
  addToHistory(entry);
}

function showResult(entry) {
  const el = document.getElementById('dice-result');
  el.classList.remove('hidden');

  let statusText = '';
  if (entry.isCrit) statusText = '⚡ КРИТ!';
  else if (entry.isFail) statusText = '💀 ПРОВАЛ!';

  document.getElementById('dice-result-formula').textContent = entry.formula;
  document.getElementById('dice-result-total').textContent = entry.total;
  const modStr = entry.mod === 0 ? '' : (entry.mod > 0 ? ` + ${entry.mod}` : ` − ${Math.abs(entry.mod)}`);
  document.getElementById('dice-result-breakdown').textContent =
    `[${entry.rolls.join(', ')}]${modStr} ${statusText}`;
}

function addToHistory(entry) {
  diceHistory.unshift(entry);
  if (diceHistory.length > 50) diceHistory.pop();
  renderDiceHistory();
}

function renderDiceHistory() {
  const el = document.getElementById('dice-history');
  if (!diceHistory.length) {
    el.innerHTML = '<div class="empty" style="padding:2rem 0;"><div class="empty-icon">🎲</div><p>Бросков пока не было</p></div>';
    return;
  }
  const diceIcon = { 4: '🔺', 6: '🎲', 8: '🔷', 10: '🔟', 12: '💜', 20: '⚡', 100: '💯' };
  el.innerHTML = diceHistory.map(e => {
    const cls = e.isCrit ? 'crit' : e.isFail ? 'fail' : '';
    const dieSize = e.rolls.length ? (e.rolls.length === 1 ? e.rolls[0] : null) : null;
    const icon = '🎲';
    const modStr = e.mod === 0 ? '' : (e.mod > 0 ? ` + ${e.mod}` : ` − ${Math.abs(e.mod)}`);
    const breakdown = `[${e.rolls.join(', ')}]${modStr}`;
    return `
      <div class="dice-history-row ${cls}">
        <div class="dice-history-left">
          <div class="dice-history-icon">${icon}</div>
          <div>
            <div class="dice-history-label">${e.label}${e.isCrit ? ' ⚡ КРИТ' : e.isFail ? ' 💀 ПРОВАЛ' : ''}</div>
            <div class="dice-history-formula">${breakdown}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:1rem;">
          <div class="dice-history-total">${e.total}</div>
          <div class="dice-history-time">${e.time}</div>
        </div>
      </div>
    `;
  }).join('');
}

function clearDiceHistory() {
  diceHistory = [];
  renderDiceHistory();
}

function initDiceRoller() {
  selectDie(20);
}

// External entry point for quick ability rolls from character sheet
function addDiceHistoryEntry(entry) {
  entry.time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  addToHistory(entry);
}
