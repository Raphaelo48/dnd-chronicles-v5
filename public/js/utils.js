// ============ UTILS ============
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

function showToast(msg, isError) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) {
    toast.style.borderColor = 'var(--danger)';
    toast.style.borderLeftColor = 'var(--danger)';
  }
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(400px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
