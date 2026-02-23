const CACHE_NAME = "patlayan-balon-v3";
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
  "/characters/ostrich.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match("/index.html"));
    })
  );
});
