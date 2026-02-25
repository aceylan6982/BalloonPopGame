const CACHE_NAME = "balloon-pop-v6";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/monster.css",
  "/script.js",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/cursor-pop.svg",
  "/characters/dino.svg",
  "/characters/goblin.svg",
  "/characters/troll.svg",
  "/characters/ghost.svg",
  "/characters/dragon.svg",
  "/characters/ostrich.svg",
  "/characters/hq/dino.svg",
  "/characters/hq/goblin.svg",
  "/characters/hq/troll.svg",
  "/characters/hq/ghost.svg",
  "/characters/hq/dragon.svg",
  "/characters/hq/ostrich.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", cloned));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match("/index.html"));
    })
  );
});
