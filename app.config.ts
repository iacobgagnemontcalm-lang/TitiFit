import type { ExpoConfig } from 'expo/config';

import base from './app.json';

/**
 * Static config lives in `app.json`; this file only adds what has to be
 * computed at build time.
 *
 * `EXPO_BASE_URL` exists for GitHub Pages. A project page is served from
 * `https://<user>.github.io/TitiFit/`, not from the domain root, so every asset
 * and route needs that prefix baked in. Firebase Hosting serves from the root
 * and needs no prefix — which is exactly why it is the simpler target.
 *
 *   Firebase :  npm run deploy:web
 *   Pages    :  EXPO_BASE_URL=/TitiFit npm run build:web
 */
export default (): ExpoConfig => {
  const baseUrl = process.env.EXPO_BASE_URL?.trim();

  return {
    ...(base.expo as ExpoConfig),
    experiments: {
      ...base.expo.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
