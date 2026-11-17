const CACHE_PREFIX = 'doczen-';
const CACHE_VERSION = 'v1';
const SHELL_CACHE = CACHE_PREFIX + CACHE_VERSION + '-shell';
const RUNTIME_CACHE = CACHE_PREFIX + CACHE_VERSION + '-runtime';
const MAX_RUNTIME_ENTRIES = 80;
const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/favicon.jpg'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (cache) {
        return cache.addAll(APP_SHELL).catch(function () { return undefined; });
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key.indexOf(CACHE_PREFIX) === 0 && key !== SHELL_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
          return undefined;
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isExcluded(url) {
  const path = url.pathname;
  if (path.indexOf('/adx/') === 0) return true;
  if (path.indexOf('/api/') === 0) return true;
  if (path.indexOf('/ads') === 0) return true;
  if (path.indexOf('/tag.min.js') !== -1) return true;
  if (path.indexOf('/vignette.min.js') !== -1) return true;
  return false;
}

function isStaticAsset(request, url) {
  if (['script', 'style', 'image', 'font'].indexOf(request.destination) !== -1) return true;
  return /\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|map)$/i.test(url.pathname);
}

function putInCache(cacheName, key, response) {
  if (!response || !response.ok || response.type === 'opaque') return Promise.resolve();
  return caches.open(cacheName).then(function (cache) {
    return cache.put(key, response.clone()).then(function () {
      if (cacheName !== RUNTIME_CACHE) return undefined;
      return cache.keys().then(function (keys) {
        if (keys.length <= MAX_RUNTIME_ENTRIES) return undefined;
        const stale = keys.slice(0, keys.length - MAX_RUNTIME_ENTRIES);
        return Promise.all(stale.map(function (item) { return cache.delete(item); }));
      });
    });
  });
}

function networkFirst(request) {
  return fetch(request).then(function (response) {
    putInCache(RUNTIME_CACHE, '/index.html', response);
    return response;
  }).catch(function () {
    return caches.match(request).then(function (cached) {
      if (cached) return cached;
      return caches.match('/index.html').then(function (shell) {
        if (shell) return shell;
        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(function (cached) {
    const network = fetch(request).then(function (response) {
      putInCache(RUNTIME_CACHE, request, response);
      return response;
    }).catch(function () { return cached; });
    return cached || network;
  });
}

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) return;
  if (isExcluded(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
