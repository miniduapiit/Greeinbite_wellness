const CACHE_NAME = 'gb-cache-v2';
const assets = [
  'index.html',
  'recipes.html',
  'calculator.html',
  'workout.html',
  'mindfulness.html',
  'contact.html',
  'css/style.css',
  'css/home.css',
  'css/calculator.css',
  'css/recipes.css',
  'css/workout.css',
  'css/mindfulness.css',
  'css/contact.css',
  'js/common.js'
];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(assets))); self.skipWaiting();});
self.addEventListener('fetch', e=>{ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));});
