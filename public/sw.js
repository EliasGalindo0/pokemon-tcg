/* Álbum PWA — cache leve de assets estáticos + fallback offline */
const CACHE = "album-pwa-v1";
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map((url) => cache.add(url).catch(() => undefined)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/manifest.webmanifest/"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      "<!doctype html><html lang=pt-BR><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Álbum</title><style>body{font-family:system-ui,sans-serif;background:#f3efe6;color:#1a1f2b;display:grid;place-items:center;min-height:100vh;margin:0;padding:1.5rem;text-align:center}h1{font-size:1.5rem;margin:0 0 .5rem}p{color:#5f6772;margin:0}</style></head><body><div><h1>Você está offline</h1><p>Abra o Álbum de novo quando tiver conexão.</p></div></body></html>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
