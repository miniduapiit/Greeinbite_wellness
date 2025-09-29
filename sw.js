const CACHE_NAME = 'greenbite-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/calculator.html',
  '/contact.html',
  '/mindfulness.html',
  '/recipes.html',
  '/workout.html',
  '/css/style.css',
  '/css/header.css',
  '/css/footer.css',
  '/css/calculator.css',
  '/css/contact.css',
  '/css/home.css',
  '/css/mindfulness.css',
  '/css/recipes.css',
  '/css/workout.css',
  '/js/common.js',
  '/js/calculator.js',
  '/js/contact.js',
  '/js/footer.js',
  '/js/home.js',
  '/js/mindfulness.js',
  '/js/recipes.js',
  '/js/workout.js',
  '/data/recipes.json',
  '/data/workouts.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
