const CACHE_NAME = "hn-cache-v1";
const STATIC_ASSETS = ["/icon-512.png", "/manifest.json"];

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
                    .filter((key) => key !== CACHE_NAME)
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

    // Skip HN API calls - always fetch fresh
    if (url.hostname === "hacker-news.firebaseio.com") return;

    // For navigation requests, try network first
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // For static assets, use cache-first strategy
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
