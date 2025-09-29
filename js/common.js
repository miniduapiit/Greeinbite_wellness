// js/common.js
/* common helpers reused across pages */
export function showToast(msg, type = 'info', timeout = 3500) {
  // create or reuse a toast container
  let container = document.getElementById('gb-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'gb-toast-container';
    container.setAttribute('aria-live','polite');
    Object.assign(container.style, {
      position: 'fixed', right: '20px', bottom: '20px', zIndex: 9999
    });
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `gb-toast gb-toast-${type}`;
  t.textContent = msg;
  t.style.marginTop = '8px';
  container.appendChild(t);
  setTimeout(() => { t.classList.add('gb-toast-show'); }, 10);
  setTimeout(() => { t.classList.remove('gb-toast-show'); setTimeout(()=>t.remove(),300); }, timeout);
}

/* small helper: format seconds -> mm:ss */
export function formatTime(s) {
  const mm = Math.floor(s/60).toString().padStart(2,'0');
  const ss = (s%60).toString().padStart(2,'0');
  return `${mm}:${ss}`;
}

// Header scroll effect
window.addEventListener('scroll', () => {
  const header = document.querySelector('.site-header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// Hamburger menu
const hb = document.getElementById('hamburger');
const nav = document.getElementById('main-nav');
if (hb && nav) {
  hb.addEventListener('click', () => nav.classList.toggle('open'));
}
