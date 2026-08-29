#!/usr/bin/env node
/**
 * Dernière étape de `npm run build:web`, sur le `dist/` produit par
 * `expo export`. Deux choses qu'un export seul ne peut pas faire :
 *
 * 1. **Activer le service worker.** `public/index.html` sert aussi de gabarit
 *    au serveur de développement, où un worker qui met le bundle en cache
 *    renverrait le code d'avant à chaque rechargement. Le drapeau n'est donc
 *    levé qu'ici, sur un vrai export.
 *
 * 2. **Préfixer les URLs écrites à la main** (le manifeste, l'icône iOS).
 *    Expo préfixe les siennes avec `EXPO_BASE_URL` (voir app.config.ts), pas
 *    celles-là. Servi depuis un sous-chemin — GitHub Pages, `/TitiFit/` — un
 *    `/manifest.webmanifest` pointe vers la racine du domaine et renvoie 404 :
 *    plus de manifeste, donc plus d'installation sur l'écran d'accueil. Sans
 *    `EXPO_BASE_URL` (Firebase Hosting), il n'y a rien à préfixer.
 *
 * Le manifeste et le service worker, eux, n'utilisent que des URLs relatives :
 * ils fonctionnent tels quels aux deux endroits.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUTPUT_DIR = process.argv[2] ?? 'dist';
const INDEX = resolve(process.cwd(), OUTPUT_DIR, 'index.html');

const FLAG = 'window.__TITIFIT_EXPORT__ = false;';

let html = readFileSync(INDEX, 'utf8');
const steps = [];

// --- 1. Service worker ------------------------------------------------------
if (html.includes(FLAG)) {
  html = html.replace(FLAG, 'window.__TITIFIT_EXPORT__ = true;');
  steps.push('service worker activé');
} else {
  // Le gabarit a changé sans que ce script suive : mieux vaut le dire que de
  // livrer un site sans mode hors ligne, silencieusement.
  console.warn(`finalize-web : drapeau "${FLAG}" introuvable — service worker NON activé.`);
}

// --- 2. Sous-chemin ---------------------------------------------------------
const baseUrl = (process.env.EXPO_BASE_URL ?? '').trim().replace(/\/+$/, '');

if (baseUrl) {
  const prefix = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;

  // Toutes les URLs absolues qui ne commencent pas déjà par le préfixe : celles
  // qu'Expo a injectées (`/TitiFit/_expo/...`) sont donc laissées intactes.
  const escaped = prefix.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(href|src)="/(?!${escaped}/)`, 'g');

  const count = html.match(pattern)?.length ?? 0;
  html = html.replace(pattern, `$1="${prefix}/`);
  steps.push(`${count} URL(s) préfixée(s) par "${prefix}"`);
} else {
  steps.push('site servi à la racine, aucune URL à préfixer');
}

writeFileSync(INDEX, html);
console.log(`finalize-web : ${steps.join(' ; ')} (${OUTPUT_DIR}/index.html).`);
