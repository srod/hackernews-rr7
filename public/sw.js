const API_CACHE_NAME = "hn-api-v1";
const STATIC_CACHE_PREFIX = "hn-static-";
const STATIC_ASSETS = ["/icon-512.png", "/manifest.json"];

let CACHE_NAME = "hn-static-v1";

self.addEventListener("install", (event) => {
    event.waitUntil(
        fetch("/sw-manifest.json")
            .then((res) => res.json())
            .then(async (manifest) => {
                CACHE_NAME = `${STATIC_CACHE_PREFIX}${manifest.version}`;
                const cache = await caches.open(CACHE_NAME);
                await cache.addAll([...STATIC_ASSETS, ...manifest.assets]);
            })
            .catch(() => {
                // Fallback: just cache static assets
                return caches
                    .open(CACHE_NAME)
                    .then((cache) => cache.addAll(STATIC_ASSETS));
            })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter(
                        (key) =>
                            key.startsWith(STATIC_CACHE_PREFIX) &&
                            key !== CACHE_NAME
                    )
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("message", (event) => {
    if (event.data === "skipWaiting") {
        self.skipWaiting();
    }
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== "GET") return;

    // HN API: stale-while-revalidate
    if (url.hostname === "hacker-news.firebaseio.com") {
        event.respondWith(
            caches.open(API_CACHE_NAME).then(async (cache) => {
                const cached = await cache.match(request);

                // Return cached immediately if available
                if (cached) {
                    // Revalidate in background
                    fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                cache.put(request, response.clone());
                            }
                        })
                        .catch(() => {});
                    return cached;
                }

                // No cache - must fetch
                return fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline with no cache - return error response
                        return new Response(JSON.stringify({ error: "offline" }), {
                            status: 503,
                            headers: { "Content-Type": "application/json" },
                        });
                    });
            })
        );
        return;
    }

    // Navigation: network-first
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
