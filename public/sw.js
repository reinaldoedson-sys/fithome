// FitHome PWA Service Worker v4
const CACHE_NAME = 'fithome-cache-v4';

const MANIFEST_DATA = JSON.stringify({
  id: "/",
  name: "FitHome - Treino em Casa & Evolução",
  short_name: "FitHome",
  description: "Aplicativo de treinos em casa com peso corporal e itens domésticos, mapa muscular interativo, registro de séries e acompanhamento de evolução física.",
  start_url: "/",
  scope: "/",
  display_override: ["standalone", "window-controls-overlay"],
  display: "standalone",
  orientation: "portrait-primary",
  background_color: "#020617",
  theme_color: "#020617",
  lang: "pt-BR",
  categories: ["fitness", "health", "lifestyle"],
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-maskable-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    }
  ],
  shortcuts: [
    {
      name: "Iniciar Treino",
      short_name: "Treinar",
      description: "Iniciar uma sessão ativa de treino",
      url: "/",
      icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
    },
    {
      name: "Evolução Corporal",
      short_name: "Evolução",
      description: "Acessar pesagens, medidas e fotos",
      url: "/?tab=evolution",
      icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
    }
  ]
});

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-maskable-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Put embedded manifest in cache immediately
      cache.put(
        '/manifest.json',
        new Response(MANIFEST_DATA, {
          status: 200,
          headers: {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
          }
        })
      );
      cache.put(
        '/manifest.webmanifest',
        new Response(MANIFEST_DATA, {
          status: 200,
          headers: {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
          }
        })
      );
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[FitHome SW] Pre-caching partial warning:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Do not intercept non-GET requests or Firebase / Google Identity / API calls
  if (
    request.method !== 'GET' ||
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.origin.includes('firebaseio.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Guaranteed 200 for manifest to prevent 302 cookie redirects from breaking PWA install
  if (url.pathname === '/manifest.json' || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return new Response(MANIFEST_DATA, {
          status: 200,
          headers: {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      })
    );
    return;
  }

  // Cache First for static PWA icons and assets
  const isPwaAsset =
    url.pathname.startsWith('/pwa-') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/icon.svg';

  if (isPwaAsset) {
    event.respondWith(
      caches.match(request).then(async cached => {
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return networkResponse;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Network First with Cache Fallback for navigation and general assets
  event.respondWith(
    fetch(request)
      .then(response => {
        // If response is valid, clone and update cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        }
        // If response is a redirect (e.g. 302 to cookie_check), attempt cache fallback
        if (response && (response.status === 302 || response.redirected || response.status >= 400)) {
          return caches.match(request).then(cached => cached || response);
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache if network fails (offline experience)
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        // If navigating to an HTML page while offline, return cached index
        if (request.mode === 'navigate') {
          const indexCached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (indexCached) return indexCached;
        }
        return new Response('Offline - FitHome', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
