const cacheName = "init_cache";
const precachedResources = ["/", "/app.js", "/style.css"];

async function precache() {
  const cache = await caches.open(cacheName);
  return cache.addAll(precachedResources);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
});

async function cacheFirst(request, fallbackUrl) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open("fetch_cache");
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
        const fallbackResponse = await caches.match(fallbackUrl);
        if (fallbackResponse) {
        return fallbackResponse;
        }
        // When even the fallback response is not available,
        // there is nothing we can do, but we must always
        // return a Response object.
        return new Response("Network error happened", {
        status: 408,
        headers: { "Content-Type": "text/plain" },
        });

        //Or
        return Response.error();
    }
  }
  
  function isCacheable(request) {
    const url = new URL(request.url);
    return !url.pathname.endsWith(".json");
  }
  
  async function cacheFirstWithRefresh(request) {
    const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open("fetch_cache");
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });
  
    return (await caches.match(request)) || (await fetchResponsePromise);
  }
  
  async function networkFirst(request) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open("MyCache_1");
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse || Response.error();
    }
  }

  //cache first with refresh
  self.addEventListener("fetch", (event) => {
    if (isCacheable(event.request)) {
      event.respondWith(cacheFirstWithRefresh(event.request));
    }
  });
  
  //cache first
  self.addEventListener("fetch", (event) => {
    if (precachedResources.includes(url.pathname)) {
      event.respondWith(cacheFirst(event.request, "/fallback.html"));
    }
  });

  //network first
  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.match(/^\/inbox/)) {
      event.respondWith(networkFirst(event.request));
    }
  });

  //free cache
  self.addEventListener("activate", (event) => {
    const cacheAllowlist = ["v2"];
  
    event.waitUntil(
      caches.forEach((cache, cacheName) => {
        if (!cacheAllowlist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      }),
    );
  });
  
  //handling sync event
  async function registerSync() {
  const swRegistration = await navigator.serviceWorker.ready;
  swRegistration.sync.register("send-message");
}

  self.addEventListener("sync", (event) => {
    if (event.tag == "send-message") {
      event.waitUntil(sendMessage());
    }
  });

  //background fetch
  async function requestBackgroundFetch(movieData) {
    const swRegistration = await navigator.serviceWorker.ready;
    const fetchRegistration = await swRegistration.backgroundFetch.fetch(
      "download-movie",
      ["/my-movie-part-1.webm", "/my-movie-part-2.webm"],
      {
        icons: movieIcons,
        title: "Downloading my movie",
        downloadTotal: 60 * 1024 * 1024,
      },
    );
    //...
  }

  self.addEventListener("backgroundfetchsuccess", (event) => {
    const registration = event.registration;
  
    event.waitUntil(async () => {
      const registration = event.registration;
      const records = await registration.matchAll();
      const responsePromises = records.map(
        async (record) => await record.responseReady,
      );
  
      const responses = Promise.all(responsePromises);
      // do something with the responses
      event.updateUI({ title: "Finished your download!" });
    });
  });

  self.addEventListener("backgroundfetchfail", (event) => {
    event.updateUI({ title: "Could not complete download" });
  });

  self.addEventListener("backgroundfetchclick", (event) => {
    const registration = event.registration;
  
    if (registration.result === "success") {
      clients.openWindow("/play-movie");
    } else {
      clients.openWindow("/movie-download-progress");
    }
  });

  //register periodic sync
  async function registerPeriodicSync() {
    const swRegistration = await navigator.serviceWorker.ready;
    swRegistration.periodicSync.register("update-news", {
      // try to update every 24 hours
      minInterval: 24 * 60 * 60 * 1000,
    });
  }

  //unregister periodic sync
  async function unregisterPeriodicSync() {
    const swRegistration = await navigator.serviceWorker.ready;
    swRegistration.periodicSync.unregister("update-news");
  }
  
  