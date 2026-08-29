/**
 * Service worker de TitiFit.
 *
 * Deux objectifs, dans cet ordre :
 *   1. démarrage instantané en visite répétée — le bundle est servi depuis le
 *      cache, pas depuis le réseau mobile ;
 *   2. l'app s'ouvre hors ligne (elle sait déjà fonctionner sans réseau : le
 *      backend local vit dans AsyncStorage).
 *
 * Rien n'est pré-listé au build : les noms de fichiers du bundle changent à
 * chaque export. Le cache se remplit à l'usage, avec une stratégie par type de
 * ressource. Tout ce qui n'est pas du même domaine (Firebase, Firestore,
 * Storage) passe directement au réseau — on ne met jamais des données de compte
 * en cache ici.
 */

// À incrémenter pour forcer la purge des anciens caches.
const VERSION = 'v1';
const CACHE = `titifit-${VERSION}`;

// Résolus par rapport à l'emplacement du worker, donc corrects que le site soit
// servi à la racine ou sous un sous-chemin (GitHub Pages).
const START_URL = new URL('./', self.location.href).href;

/** Le bundle est nommé par empreinte : une URL donnée ne change jamais. */
function isImmutable(url) {
  return url.pathname.includes('/_expo/static/');
}

/**
 * Met en cache la page d'accueil et les fichiers qu'elle référence — bundle en
 * tête. Sans ça, l'app ne serait consultable hors ligne qu'à partir de la
 * deuxième visite : à la première, le bundle est chargé avant que le worker ne
 * prenne la main, donc il ne le voit jamais passer.
 *
 * Rien n'est écrit en dur : les noms sont relus dans le HTML fraîchement
 * téléchargé, ce qui suit automatiquement les empreintes de chaque export.
 */
async function precacheShell(cache) {
  // `reload` : on veut la page fraîche du réseau, pas celle du cache HTTP.
  const response = await fetch(new Request(START_URL, { cache: 'reload' }));
  if (!response.ok) return;

  await cache.put(START_URL, response.clone());

  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], START_URL).href)
    .filter((href) => href !== START_URL && href.startsWith(START_URL));

  await Promise.all([...new Set(assets)].map((href) => cache.add(href).catch(() => undefined)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(precacheShell)
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

/** Sert le cache tout de suite, rafraîchit en arrière-plan pour la prochaine fois. */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  const response = cached ?? (await network);
  if (!response) throw new Error('offline');
  return response;
}

/**
 * Navigation : le réseau d'abord, pour ne jamais servir un index.html périmé
 * qui pointerait vers un bundle supprimé. Hors ligne, on retombe sur la page
 * d'accueil mise en cache — le routeur reprend la main côté client.
 */
async function navigate(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(START_URL, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(START_URL);
    if (cached) return cached;
    throw new Error('offline');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Autre domaine (Firebase & co) : on ne s'en mêle pas.
  if (url.origin !== self.location.origin) return;

  // Hors du périmètre de l'app (utile si le site partage un domaine).
  if (!url.href.startsWith(START_URL)) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }

  event.respondWith(isImmutable(url) ? cacheFirst(request) : staleWhileRevalidate(request));
});
