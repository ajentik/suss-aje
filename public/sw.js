const CACHE_NAME = "aac-near-me-v1";
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
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

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) return;

  if (
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(
      fetch(request).catch(() => caches.match("/"))
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
