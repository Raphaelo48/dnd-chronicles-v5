// ============ NAVIGATION ============
const AUTH_REQUIRED_PAGES = ['mychars', 'character'];

function showPage(page) {
  // Guard auth-required pages — only redirect if we know user is not logged in
  if (AUTH_REQUIRED_PAGES.includes(page) && !currentUser) {
    renderAuthPage('login');
    page = 'auth';
  }
  // Guard campaigns (allow viewing, but show auth if not logged in when trying to join/create)
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.nav-links a[data-page="${page}"]`);
  if (link) link.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.dispatchEvent(new CustomEvent('pageShown', { detail: page }));
}
