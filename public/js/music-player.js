// ============ MUSIC PLAYER ============
// Папка для треков: /music/
// Поддерживаемые форматы: mp3, ogg, wav, flac, m4a

const MusicPlayer = (() => {
  // ---- State ----
  let audio = new Audio();
  let tracks = [];       // { id, name, src, playlist }
  let playlists = [];    // { id, name, trackIds[] }
  let currentTrackIdx = -1;
  let currentPlaylistFilter = null; // null = все треки
  let isRepeat = false;
  let isShuffle = false;
  let isOpen = false;

  // ---- Persistence ----
  function loadData() {
    try {
      tracks    = JSON.parse(localStorage.getItem('mp_tracks')    || '[]');
      playlists = JSON.parse(localStorage.getItem('mp_playlists') || '[]');
    } catch { tracks = []; playlists = []; }
  }
  function saveData() {
    localStorage.setItem('mp_tracks',    JSON.stringify(tracks));
    localStorage.setItem('mp_playlists', JSON.stringify(playlists));
  }

  // ---- Helpers ----
  function getVisibleTracks() {
    if (!currentPlaylistFilter) return tracks;
    const pl = playlists.find(p => p.id === currentPlaylistFilter);
    if (!pl) return tracks;
    return tracks.filter(t => pl.trackIds.includes(t.id));
  }

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function sanitizeName(filename) {
    return filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  }

  // ---- Playback ----
  function playTrack(idx) {
    const visible = getVisibleTracks();
    if (!visible.length) return;
    currentTrackIdx = idx;
    const track = visible[idx];
    if (!track) return;
    audio.src = track.src;
    audio.play().catch(() => showToast('Не удалось воспроизвести файл', true));
    renderPlayer();
  }

  function playPause() {
    if (audio.paused) {
      if (currentTrackIdx === -1) playTrack(0);
      else audio.play();
    } else {
      audio.pause();
    }
    renderPlayer();
  }

  function prevTrack() {
    const visible = getVisibleTracks();
    if (!visible.length) return;
    let idx = currentTrackIdx - 1;
    if (idx < 0) idx = visible.length - 1;
    playTrack(idx);
  }

  function nextTrack() {
    const visible = getVisibleTracks();
    if (!visible.length) return;
    let idx;
    if (isShuffle) {
      idx = Math.floor(Math.random() * visible.length);
    } else {
      idx = currentTrackIdx + 1;
      if (idx >= visible.length) idx = isRepeat ? 0 : -1;
    }
    if (idx >= 0) playTrack(idx);
    else { audio.pause(); currentTrackIdx = -1; renderPlayer(); }
  }

  audio.addEventListener('ended', nextTrack);
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('play',  renderPlayer);
  audio.addEventListener('pause', renderPlayer);

  function updateProgress() {
    const bar = document.getElementById('mp-progress-bar');
    const cur = document.getElementById('mp-current-time');
    const dur = document.getElementById('mp-duration');
    if (bar && audio.duration) bar.value = (audio.currentTime / audio.duration) * 100;
    if (cur) cur.textContent = formatTime(audio.currentTime);
    if (dur) dur.textContent = formatTime(audio.duration);
  }

  // ---- Add Tracks ----
  function handleFileInput(files) {
    let added = 0;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('audio/')) return;
      const id = Date.now() + Math.random();
      const src = URL.createObjectURL(file);
      const name = sanitizeName(file.name);
      tracks.push({ id, name, src, originalName: file.name });
      added++;
    });
    if (added) {
      saveData();
      renderPlayer();
      showToast(`Добавлено треков: ${added} 🎵`);
    }
  }

  // ---- Playlists ----
  function createPlaylist(name) {
    if (!name.trim()) return;
    playlists.push({ id: Date.now(), name: name.trim(), trackIds: [] });
    saveData();
    renderPlayer();
    showToast(`Плейлист «${name}» создан 🎶`);
  }

  function deletePlaylist(id) {
    playlists = playlists.filter(p => p.id !== id);
    if (currentPlaylistFilter === id) currentPlaylistFilter = null;
    saveData();
    renderPlayer();
  }

  function addTrackToPlaylist(trackId, playlistId) {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    if (!pl.trackIds.includes(trackId)) {
      pl.trackIds.push(trackId);
      saveData();
      renderPlayer();
      showToast('Трек добавлен в плейлист');
    }
  }

  function removeTrackFromPlaylist(trackId, playlistId) {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    pl.trackIds = pl.trackIds.filter(id => id !== trackId);
    saveData();
    renderPlayer();
  }

  function deleteTrack(trackId) {
    tracks = tracks.filter(t => t.id !== trackId);
    playlists.forEach(pl => { pl.trackIds = pl.trackIds.filter(id => id !== trackId); });
    currentTrackIdx = -1;
    audio.pause();
    audio.src = '';
    saveData();
    renderPlayer();
  }

  // ---- Toggle ----
  function toggle() {
    isOpen = !isOpen;
    const player = document.getElementById('music-player-widget');
    if (player) player.classList.toggle('mp-open', isOpen);
  }

  // ---- Render ----
  function renderPlayer() {
    const el = document.getElementById('mp-inner');
    if (!el) return;

    const visible = getVisibleTracks();
    const curTrack = visible[currentTrackIdx];
    const isPlaying = !audio.paused;

    // Build playlist selector options
    const plOpts = playlists.map(pl =>
      `<option value="${pl.id}" ${currentPlaylistFilter === pl.id ? 'selected' : ''}>${pl.name} (${pl.trackIds.length})</option>`
    ).join('');

    // Track list rows
    const trackRows = visible.map((t, i) => {
      const isActive = i === currentTrackIdx;
      const plOptions = playlists.map(pl =>
        `<option value="${pl.id}">${pl.name}</option>`
      ).join('');
      return `
        <div class="mp-track-row ${isActive ? 'mp-track-active' : ''}" onclick="MusicPlayer.playTrack(${i})">
          <span class="mp-track-icon">${isActive && isPlaying ? '🔊' : '🎵'}</span>
          <span class="mp-track-name" title="${t.name}">${t.name}</span>
          <div class="mp-track-actions" onclick="event.stopPropagation()">
            ${playlists.length ? `
            <select class="mp-mini-select" onchange="MusicPlayer.addTrackToPlaylist(${t.id}, +this.value); this.value=''">
              <option value="">+</option>
              ${plOptions}
            </select>` : ''}
            <button class="mp-icon-btn" onclick="MusicPlayer.deleteTrack(${t.id})" title="Удалить">🗑</button>
          </div>
        </div>`;
    }).join('') || '<div class="mp-empty">Нет треков. Добавьте аудиофайлы ⬆</div>';

    // Playlist tabs
    const plTabs = playlists.map(pl => `
      <div class="mp-pl-tab ${currentPlaylistFilter === pl.id ? 'mp-pl-tab-active' : ''}"
           onclick="MusicPlayer.setPlaylistFilter(${pl.id})">
        ${pl.name}
        <button class="mp-pl-del" onclick="event.stopPropagation();MusicPlayer.deletePlaylist(${pl.id})">×</button>
      </div>`).join('');

    el.innerHTML = `
      <!-- Now Playing -->
      <div class="mp-now-playing">
        <div class="mp-disc ${isPlaying ? 'mp-disc-spin' : ''}">🎵</div>
        <div class="mp-track-info">
          <div class="mp-track-title">${curTrack ? curTrack.name : 'Ничего не играет'}</div>
          <div class="mp-track-sub">${curTrack ? (currentPlaylistFilter ? playlists.find(p=>p.id===currentPlaylistFilter)?.name : 'Все треки') : '—'}</div>
        </div>
      </div>

      <!-- Progress -->
      <div class="mp-progress-wrap">
        <span id="mp-current-time">0:00</span>
        <input id="mp-progress-bar" type="range" class="mp-progress" min="0" max="100" value="0"
          oninput="MusicPlayer.seek(this.value)">
        <span id="mp-duration">0:00</span>
      </div>

      <!-- Controls -->
      <div class="mp-controls">
        <button class="mp-ctrl-btn ${isShuffle ? 'mp-ctrl-active' : ''}" onclick="MusicPlayer.toggleShuffle()" title="Случайный порядок">🔀</button>
        <button class="mp-ctrl-btn" onclick="MusicPlayer.prevTrack()">⏮</button>
        <button class="mp-play-btn" onclick="MusicPlayer.playPause()">${isPlaying ? '⏸' : '▶'}</button>
        <button class="mp-ctrl-btn" onclick="MusicPlayer.nextTrack()">⏭</button>
        <button class="mp-ctrl-btn ${isRepeat ? 'mp-ctrl-active' : ''}" onclick="MusicPlayer.toggleRepeat()" title="Повтор">🔁</button>
      </div>

      <!-- Volume -->
      <div class="mp-volume-row">
        <span>🔈</span>
        <input type="range" class="mp-progress" min="0" max="100" value="${Math.round(audio.volume*100)}"
          oninput="MusicPlayer.setVolume(this.value)">
        <span>🔊</span>
      </div>

      <!-- Playlist filter tabs -->
      <div class="mp-pl-bar">
        <div class="mp-pl-tab ${!currentPlaylistFilter ? 'mp-pl-tab-active' : ''}" onclick="MusicPlayer.setPlaylistFilter(null)">Все</div>
        ${plTabs}
      </div>

      <!-- Track list -->
      <div class="mp-track-list">${trackRows}</div>

      <!-- Add tracks -->
      <div class="mp-add-row">
        <label class="btn btn-secondary btn-sm mp-add-btn">
          ➕ Добавить треки
          <input type="file" accept="audio/*" multiple style="display:none" onchange="MusicPlayer.handleFileInput(this.files)">
        </label>
        <button class="btn btn-secondary btn-sm" onclick="MusicPlayer.promptCreatePlaylist()">🎶 Плейлист</button>
      </div>
    `;
  }

  function seek(val) {
    if (audio.duration) audio.currentTime = (val / 100) * audio.duration;
  }
  function setVolume(val) { audio.volume = val / 100; }
  function toggleRepeat()  { isRepeat = !isRepeat; renderPlayer(); }
  function toggleShuffle() { isShuffle = !isShuffle; renderPlayer(); }
  function setPlaylistFilter(id) {
    currentPlaylistFilter = id;
    currentTrackIdx = -1;
    renderPlayer();
  }
  function promptCreatePlaylist() {
    const name = prompt('Название нового плейлиста:');
    if (name) createPlaylist(name);
  }

  // ---- Init ----
  function init() {
    loadData();
    // Create widget DOM
    const widget = document.createElement('div');
    widget.id = 'music-player-widget';
    widget.className = 'music-player-widget';
    widget.innerHTML = `
      <div class="mp-header" onclick="MusicPlayer.toggle()">
        <span>🎵 Плеер</span>
        <span class="mp-chevron">▲</span>
      </div>
      <div id="mp-inner" class="mp-body"></div>
    `;
    document.body.appendChild(widget);
    renderPlayer();
  }

  return {
    init, toggle, playTrack, playPause, prevTrack, nextTrack,
    handleFileInput, seek, setVolume, toggleRepeat, toggleShuffle,
    setPlaylistFilter, promptCreatePlaylist,
    addTrackToPlaylist, removeTrackFromPlaylist, deletePlaylist, deleteTrack,
  };
})();

function toggleMusicPlayer() { MusicPlayer.toggle(); }
