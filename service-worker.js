const CACHE_NAME = "lotes-cache-v1";

// Lista de arquivos essenciais salvos na memória local do dispositivo (Offline)
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./img/background.jfif",
  "./img/bimbo2.png",
  "./img/favicon.ico",
  // Fotos das embalagens dos produtos para o modo offline
  "./img/produtos/502642.png",
  "./img/produtos/500226.png",
  "./img/produtos/502644.png",
  "./img/produtos/502874.png",
  "./img/produtos/505878.png",
  "./img/produtos/505879.png",
  "./img/produtos/505880.png",
  "./img/produtos/505881.png",
  "./img/produtos/default.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Lotes PWA: Arquivos cacheados com sucesso!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Lotes PWA: Limpando cache antigo", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});