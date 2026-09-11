// Service Worker for Offline Game Support
// Caches game assets, salon pages, and static JS bundles.

const CACHE_NAME = "zigo-games-offline-v1";

const OFFLINE_URLS = [
  "/games",
  "/games/math",
  "/games/word",
  "/games/blocks",
  "/games/2048",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("[SW] Cache addAll partial failure:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache first for game static chunks and assets
  const isGameAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/games") ||
    url.pathname.includes("games");

  if (request.method === "GET" && isGameAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cache and fetch in background to update
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => {
            // If completely offline and fetching a document, serve /games from cache
            if (request.destination === "document") {
              return caches.match("/games");
            }
          });
      })
    );
  }
});
