import { Platform } from 'react-native';

import type {
  ImportedActivity,
  IntegrationProvider,
  IntegrationStatus,
} from './types';

export * from './types';

/**
 * Placeholder providers.
 *
 * ⚠️ None of these are functional yet, and they say so rather than pretending.
 * Each needs work that cannot be done from JavaScript alone:
 *  - **Apple Health** — a native HealthKit module and a development build
 *    (HealthKit is unavailable in Expo Go), plus the entitlement.
 *  - **Garmin** — a Garmin Connect developer account and an OAuth 1.0a flow.
 *  - **Strava** — a Strava API application and an OAuth 2.0 redirect.
 *
 * The interface is what matters today: it fixes the contract (`fetchActivities`
 * returns *candidates*, never silent imports) so wiring a real provider later
 * touches only this folder.
 */
abstract class PlaceholderProvider implements IntegrationProvider {
  abstract readonly id: IntegrationProvider['id'];
  abstract readonly label: string;
  abstract readonly description: string;
  abstract readonly icon: string;
  abstract readonly requirement: string;

  async status(): Promise<IntegrationStatus> {
    return 'unavailable';
  }
  async connect(): Promise<IntegrationStatus> {
    return 'unavailable';
  }
  async disconnect(): Promise<void> {}
  async fetchActivities(): Promise<ImportedActivity[]> {
    return [];
  }
}

class AppleHealthProvider extends PlaceholderProvider {
  readonly id = 'apple_health' as const;
  readonly label = 'Apple Health';
  readonly description =
    'Importer les courses et les séances déjà enregistrées sur l’iPhone ou l’Apple Watch.';
  readonly icon = 'heart-outline';
  readonly requirement =
    Platform.OS === 'ios'
      ? 'Nécessite un module natif HealthKit et un build de développement (indisponible dans Expo Go).'
      : 'Disponible sur iOS uniquement.';
}

class GarminProvider extends PlaceholderProvider {
  readonly id = 'garmin' as const;
  readonly label = 'Garmin';
  readonly description = 'Récupérer les activités de Garmin Connect.';
  readonly icon = 'watch-outline';
  readonly requirement = 'Nécessite un compte développeur Garmin Connect et un flux OAuth 1.0a.';
}

class StravaProvider extends PlaceholderProvider {
  readonly id = 'strava' as const;
  readonly label = 'Strava';
  readonly description = 'Importer les courses et sorties enregistrées sur Strava.';
  readonly icon = 'bicycle-outline';
  readonly requirement = 'Nécessite une application Strava API et un flux OAuth 2.0.';
}

export const INTEGRATIONS: IntegrationProvider[] = [
  new AppleHealthProvider(),
  new GarminProvider(),
  new StravaProvider(),
];

export const getIntegration = (id: string): IntegrationProvider | undefined =>
  INTEGRATIONS.find((i) => i.id === id);
