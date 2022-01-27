const staticCacheName = "sw-cache"; // this is given a unique name on build

self.addEventListener("activate", (event) => {
  caches.keys().then((names) => {
    for (let name of names) {
      if (name !== staticCacheName) event.waitUntil(caches.delete(name));
    }
  });
  event.waitUntil(self.clients.claim());
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      // Cache the base file(s)
      return cache.add("/");
    })
  );
});

self.addEventListener("fetch", async (event) => {
  const host = new URL(event.request.url).host;
  if (
    [
      "localhost:5005",
      "api.monkeytype.com",
      "api.github.com",
      "www.google-analytics.com",
    ].includes(host) ||
    host.endsWith("wikipedia.org")
  ) {
    // if hostname is a non-static api, fetch request
    event.respondWith(fetch(event.request));
  } else {
    // Otherwise, assume host is serving a static file, check cache and add response to cache if not found
    event.respondWith(
      caches.open(staticCacheName).then((cache) => {
        return cache.match(event.request).then(async (response) => {
          // Check if request in cache
          if (response) {
            // if response was found in the cache, send from cache
            return response;
          } else {
            // if response was not found in cache fetch from server, cache it and send it
            response = await fetch(event.request);
            cache.put(event.request.url, response.clone());
            return response;
          }
        });
      })
    );
  }
});
