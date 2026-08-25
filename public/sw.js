/* global self, caches, URL, fetch, Response */

const CACHE_NAME = "zigo-shell-v3";
const SHELL_ASSETS = ["/manifest.json", "/icon.svg", "/icon-maskable.svg", "/offline.html"];
const STATIC_ASSET_PATTERN = /\.(?:css|js|svg|png|jpg|jpeg|webp|gif|ico|woff2?)$/i;

// Read-tolerant API paths: network-first with per-session cache fallback.
// Mutations and auth-sensitive endpoints are never intercepted.
const OFFLINE_READABLE_APIS = [
  "/api/feed",
  "/api/social/posts",
  "/api/games/leaderboard",
  "/api/games/progress",
];

const API_CACHE_PREFIX = "zigo-api-";
const NAV_CACHE_PREFIX = "zigo-nav-";
const MAX_NAV_ENTRIES = 25;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE_NAME &&
                !key.startsWith(API_CACHE_PREFIX) &&
                !key.startsWith(NAV_CACHE_PREFIX),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Per-cookie-profile cache bucket so multiple accounts never share cached data. */
function apiCacheName(request) {
  const raw = request.headers.get("cookie") || "";
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash * 33) ^ raw.charCodeAt(i)) >>> 0;
  }
  return `${API_CACHE_PREFIX}${hash.toString(36)}`;
}

function isOfflineReadableApi(pathname) {
  return OFFLINE_READABLE_APIS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith(`${path}?`),
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Same-origin read APIs: network-first, fall back to this profile's cache.
  if (url.origin === self.location.origin && isOfflineReadableApi(url.pathname)) {
    const cacheName = apiCacheName(request);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(cacheName).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .open(cacheName)
            .then((cache) => cache.match(request))
            .then(
              (cached) =>
                cached ??
                new Response(JSON.stringify({ error: "offline", code: "OFFLINE_CACHE_MISS" }), {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }),
            ),
        ),
    );
    return;
  }

  // Everything else API-ish (auth, mutations, Supabase): pass straight through.
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase")) return;

  if (request.mode === "navigate") {
    // Network-first with cached-HTML fallback: the last-rendered version of
    // every visited page stays readable offline (per profile bucket).
    const cacheName = apiCacheName(request);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && (response.headers.get("content-type") || "").includes("text/html")) {
            const copy = response.clone();
            caches.open(cacheName).then((cache) =>
              cache.put(request, copy).then(() =>
                cache.keys().then((keys) => {
                  if (keys.length > MAX_NAV_ENTRIES) {
                    return cache.delete(keys[0]);
                  }
                }),
              ),
            );
          }
          return response;
        })
        .catch(() =>
          caches
            .open(cacheName)
            .then((cache) => cache.match(request))
            .then((cached) => cached || caches.match("/offline.html")),
        ),
    );
    return;
  }

  if (url.origin !== self.location.origin || !STATIC_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Zigo Bildirim";
  const options = {
    body: data.body || "Yeni bir bildiriminiz var.",
    icon: "/icon-192.png",
    badge: "/icon.svg",
    data: { url: data.url || "/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      const targetUrl = event.notification.data.url;
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
