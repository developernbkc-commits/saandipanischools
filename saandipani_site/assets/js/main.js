
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header.site-header');
  const button = document.querySelector('[data-menu-button]');
  if (button && header) {
    button.addEventListener('click', () => {
      header.classList.toggle('open');
      button.setAttribute('aria-expanded', header.classList.contains('open') ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.faq-item button').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
  });
});
