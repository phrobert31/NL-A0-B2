/* Service worker for Nederlands A0→B2.
   Strategy: cache-first with background refresh (stale-while-revalidate).
   - First visit online: the page is cached.
   - Every visit after that: served instantly from cache (works fully offline,
     airplane mode included), while a fresh copy is fetched in the background
     so the NEXT load picks up any update you push to GitHub.
*/
var CACHE_NAME = 'nederlands-v4';
var CORE = ['./', './index.html'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(key){
        if(key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return; // never intercept cross-origin requests

  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.match(event.request, {ignoreSearch:true}).then(function(cached){
        var network = fetch(event.request).then(function(response){
          if(response && response.ok){ cache.put(event.request, response.clone()); }
          return response;
        }).catch(function(){ return cached; });
        return cached || network;
      });
    })
  );
});
