/* Turn Dealer service worker — offline-first, opt-in updates.
   To ship an update: change VERSION below (and upload the new files).
   Users keep their current version until they tap the update note in the app. */

var VERSION = 'v3';
var CORE_CACHE = 'turn-dealer-' + VERSION;
var FONT_CACHE = 'turn-dealer-fonts';

var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png'
];

// Install: save a complete copy of the app.
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CORE_CACHE).then(function (c) { return c.addAll(CORE_ASSETS); })
    // NOTE: no skipWaiting() here — a new version waits politely
    // until the user opts in from the page.
  );
});

// Activate: clean up caches from older versions.
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CORE_CACHE && k !== FONT_CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// The page sends this only when the user taps "Update".
self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: cache-first for everything.
// Fonts (Google Fonts) are cached the first time they load, then served offline.
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONT_CACHE).then(function (c) {
        return c.match(e.request).then(function (hit) {
          if (hit) return hit;
          return fetch(e.request).then(function (res) {
            if (res && (res.ok || res.type === 'opaque')) c.put(e.request, res.clone());
            return res;
          }).catch(function () { return hit; }); // offline & uncached: page falls back to system fonts
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request);
    })
  );
});
