// ============ INIT ============
(async () => {
  // 1. Restore session
  await loadCurrentUser();

  // 2. Load user data if logged in
  if (currentUser) {
    await loadCharacters();
  }

  // 3. Load campaigns (public)
  await loadCampaigns();

  // 4. Render static pages
  renderBestiary(monsters);
  renderSpells(spells);
  renderReference();
  filterCampaigns();
  renderMyCharacters();
  initDiceRoller();

  // 5. Music player
  MusicPlayer.init();

  // 6. Reload campaigns when user navigates to that page
  window.addEventListener('pageShown', async (e) => {
    if (e.detail === 'campaigns') {
      await loadCampaigns();
      filterCampaigns();
    }
    if (e.detail === 'mychars' && currentUser) {
      await loadCharacters();
    }
  });

  // 7. Global keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
})();
