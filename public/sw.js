const CACHE_NAME = "hn-cache-v2";
const API_CACHE_NAME = "hn-api-cache-v1";
const STATIC_ASSETS = ["/icon-512.png", "/manifest.json"];
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // HN API: stale-while-revalidate
    if (url.hostname === "hacker-news.firebaseio.com") {
        event.respondWith(
            caches.open(API_CACHE_NAME).then(async (cache) => {
                const cached = await cache.match(request);

                const fetchPromise = fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            cache.put(request, clone);
                        }
                        return response;
                    })
                    .catch(() => cached);

                // Return cached immediately if available, update in background
                return cached || fetchPromise;
            })
        );
        return;
    }

    // Navigation: network-first, cache response, fallback to cache
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Static assets: cache-first
    if (
        url.pathname.startsWith("/assets/") ||
        url.pathname.endsWith(".css") ||
        url.pathname.endsWith(".js") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".ico")
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }
});
