const CACHE_NAME = "zenith-offline-v2";
const OFFLINE_URL = "/offline.html";
const MANIFEST_URL = "/offline-cache-manifest.json";
const CORE_URLS = ["/", OFFLINE_URL, MANIFEST_URL];
const OFFLINE_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="Offline image"><rect width="96" height="96" rx="14" fill="#141416"/><rect x="1" y="1" width="94" height="94" rx="13" fill="none" stroke="#f5b041" stroke-opacity=".42" stroke-width="2"/><circle cx="48" cy="48" r="22" fill="#f5b041" fill-opacity=".12" stroke="#f5b041" stroke-width="4"/><path d="M42 58l5-13 13-5-5 13-13 5z" fill="none" stroke="#f5b041" stroke-width="4" stroke-linejoin="round"/></svg>`;
const PUBLIC_API_PREFIXES = ["/api/items/"];
const BYPASS_PREFIXES = [
  "/admin/",
  "/api/admin/",
  "/api/debug/",
  "/api/profile-import/",
  "/api/usage/",
  "/error-preview",
  "/loading-preview",
  "/scraper-status.json",
  "/sw.js",
];

let manifestRefreshPromise = null;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cacheUrls(cache, CORE_URLS, { cache: "reload" })),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("zenith-offline-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => refreshPublicDataCache()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "ZENITH_REFRESH_PUBLIC_DATA_CACHE") {
    event.waitUntil(replyToClient(event, refreshPublicDataCache()));
    return;
  }

  if (event.data?.type === "ZENITH_CLEAR_PUBLIC_DATA_CACHE") {
    event.waitUntil(replyToClient(event, clearPublicDataCache()));
    return;
  }

  if (event.data?.type === "ZENITH_ACTIVATE_WAITING_WORKER") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (event.request.destination === "image") {
    if (url.origin !== self.location.origin) return;
    event.respondWith(handleImageRequest(event.request));
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (shouldBypass(url.pathname)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  if (isPublicDataRequest(url) || isPublicItemApi(url)) {
    event.respondWith(networkFirst(event.request, normalizeCacheRequest(url)));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

async function handleNavigation(request) {
  const cacheKey = normalizeCacheRequest(new URL(request.url));

  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    if (response.ok) await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    const cachedPage = await caches.match(cacheKey);
    const cachedOffline = await caches.match(OFFLINE_URL);

    return (
      cachedPage ||
      cachedOffline ||
      new Response("Offline", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function networkFirst(request, cacheKey = request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    return new Response("Offline", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response.ok) return cache.put(request, response.clone()).then(() => response);
    return response;
  });

  if (cached) return cached;

  try {
    return await refresh;
  } catch {
    return new Response("Offline", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

async function handleImageRequest(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return fetch(request);
  }

  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const fallback = await cache.match(request) || await cache.match(normalizeCacheRequest(new URL("/icon.svg", self.location.origin)));
    return (
      cached ||
      fallback ||
      new Response(OFFLINE_IMAGE_SVG, {
        status: 200,
        headers: { "content-type": "image/svg+xml" },
      })
    );
  }
}

async function refreshPublicDataCache() {
  if (manifestRefreshPromise) return manifestRefreshPromise;

  manifestRefreshPromise = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const previousManifest = await readCachedManifest(cache);
    const manifestResponse = await fetch(MANIFEST_URL, { cache: "no-cache" });
    if (!manifestResponse.ok) return;

    const manifest = await manifestResponse.clone().json();
    await cache.put(MANIFEST_URL, manifestResponse);

    if (previousManifest?.version === manifest.version) return;

    const urls = Array.isArray(manifest.urls) ? manifest.urls : [];
    await cacheUrls(cache, urls, { cache: "no-cache" });
  })().finally(() => {
    manifestRefreshPromise = null;
  });

  return manifestRefreshPromise;
}

async function clearPublicDataCache() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("zenith-offline-"))
      .map((key) => caches.delete(key)),
  );

  const cache = await caches.open(CACHE_NAME);
  await cacheUrls(cache, CORE_URLS, { cache: "reload" });
}

async function replyToClient(event, promise) {
  try {
    await promise;
    event.ports?.[0]?.postMessage({ ok: true });
  } catch (error) {
    event.ports?.[0]?.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "Offline cache action failed.",
    });
    throw error;
  }
}

async function readCachedManifest(cache) {
  const cached = await cache.match(MANIFEST_URL);
  if (!cached) return null;

  try {
    return await cached.json();
  } catch {
    return null;
  }
}

async function cacheUrls(cache, urls, requestInit = {}) {
  const chunkSize = 16;

  for (let index = 0; index < urls.length; index += chunkSize) {
    const chunk = urls.slice(index, index + chunkSize);
    await Promise.all(
      chunk.map(async (url) => {
        try {
          const requestUrl = new URL(url, self.location.origin);
          const request = new Request(requestUrl, requestInit);
          const response = await fetch(request);
          if (response.ok) await cache.put(normalizeCacheRequest(requestUrl), response);
        } catch {
          // Keep the service worker active even if one optional public asset is unavailable.
        }
      }),
    );
  }
}

function normalizeCacheRequest(url) {
  return new Request(`${url.origin}${url.pathname}`);
}

function shouldBypass(pathname) {
  return BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function isPublicDataRequest(url) {
  return url.pathname.endsWith(".json") || url.pathname.endsWith(".webmanifest");
}

function isPublicItemApi(url) {
  return PUBLIC_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  );
}
