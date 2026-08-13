#!/usr/bin/env node
/**
 * Vérifie la configuration Firebase AVANT de lancer l'app.
 *
 *   npm run check:firebase
 *
 * Lit les fichiers .env comme le fait Expo (.env.local a priorité sur .env)
 * et rapporte exactement ce que l'app verra. Ne fait aucun appel réseau et
 * n'affiche jamais une clé en entier.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
// Ordre de priorité d'Expo : le premier fichier qui définit une clé gagne.
const ENV_FILES = ['.env.local', '.env.development', '.env'];

const REQUIRED = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const OPTIONAL = [
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
];

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Masque une valeur : garde le début et la fin, cache le milieu. */
const mask = (value) =>
  value.length <= 10 ? '•'.repeat(value.length) : `${value.slice(0, 6)}…${value.slice(-4)}`;

const found = {};
const sources = {};
const presentFiles = [];

for (const file of ENV_FILES) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) continue;
  presentFiles.push(file);
  for (const [key, value] of Object.entries(parseEnvFile(path))) {
    if (found[key] === undefined && value !== '') {
      found[key] = value;
      sources[key] = file;
    }
  }
}
// Les variables déjà exportées dans le shell l'emportent sur les fichiers.
for (const key of [...REQUIRED, ...OPTIONAL]) {
  if (process.env[key]) {
    found[key] = process.env[key];
    sources[key] = 'shell';
  }
}

console.log('\n  TitiFit — vérification Firebase\n');

if (presentFiles.length === 0) {
  console.log('  Aucun fichier .env trouvé.');
  console.log('  → cp .env.example .env.local, puis remplis les valeurs.\n');
} else {
  console.log(`  Fichiers lus : ${presentFiles.join(', ')}\n`);
}

const missing = [];
for (const key of REQUIRED) {
  const value = found[key];
  if (value) {
    console.log(`  ✓ ${key}\n      ${mask(value)}   (${sources[key]})`);
  } else {
    missing.push(key);
    console.log(`  ✗ ${key}   MANQUANT`);
  }
}
for (const key of OPTIONAL) {
  const value = found[key];
  console.log(
    value
      ? `  · ${key}\n      ${mask(value)}   (${sources[key]})`
      : `  · ${key}   absent (optionnel)`,
  );
}

// --- Contrôles de cohérence -------------------------------------------------
const warnings = [];
const apiKey = found.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = found.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = found.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const appId = found.EXPO_PUBLIC_FIREBASE_APP_ID;

if (apiKey && !apiKey.startsWith('AIza')) {
  warnings.push(
    'La clé API ne commence pas par "AIza". Tu as peut-être collé un autre identifiant.',
  );
}
if (authDomain && !authDomain.endsWith('.firebaseapp.com')) {
  warnings.push(
    `authDomain vaut "${authDomain}" — attendu quelque chose comme "<projet>.firebaseapp.com".`,
  );
}
if (authDomain && projectId && !authDomain.startsWith(`${projectId}.`)) {
  warnings.push(
    `authDomain ("${authDomain}") et projectId ("${projectId}") ne correspondent pas : deux projets mélangés?`,
  );
}
if (appId && !/^\d+:\d+:(web|android|ios):/.test(appId)) {
  warnings.push('appId ne ressemble pas au format "1:123456789:web:abc123".');
}
if (appId && !appId.includes(':web:')) {
  warnings.push(
    'appId n\'est pas une application "web". TitiFit utilise le SDK JS Firebase : ' +
      'crée une app Web (</>) dans la console, pas iOS/Android.',
  );
}

if (warnings.length) {
  console.log('\n  Avertissements :');
  for (const w of warnings) console.log(`  ! ${w}`);
}

console.log('');
if (missing.length > 0) {
  console.log(`  → ${missing.length} variable(s) manquante(s). L'app démarrera en MODE LOCAL`);
  console.log('     (tout fonctionne, mais rien n\'est synchronisé).\n');
  process.exit(1);
}

if (warnings.length > 0) {
  // Les variables sont toutes présentes, mais au moins une est incohérente :
  // l'app tenterait de joindre Firebase et échouerait à l'exécution.
  console.log('  → Toutes les variables sont présentes, mais la configuration');
  console.log('     semble incorrecte (voir les avertissements ci-dessus).');
  console.log('     Corrige-les avant de lancer l\'app, sinon la connexion échouera.\n');
  process.exit(2);
}

console.log('  → Configuration complète et cohérente. L\'app utilisera Firebase.');
console.log('     Pense à: (1) activer E-mail/Mot de passe dans Authentication,');
console.log('              (2) créer la base Firestore,');
console.log('              (3) firebase deploy --only firestore:rules');
console.log('     Puis relance avec: npx expo start --clear\n');
process.exit(0);
