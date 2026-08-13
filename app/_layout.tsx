import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WebFrame } from '@/components/navigation/WebFrame';
import { startSync } from '@/services/syncService';
import { useAthleteStore } from '@/store/athleteStore';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

/**
 * Routing gate. Three states decide where the athlete lands:
 *   - storage not yet read       -> spinner
 *   - no profile                 -> (auth)
 *   - profile present            -> (tabs)
 *
 * A signed-in account with no cloud profile yet is sent to onboarding by the
 * auth screens themselves, so the gate only has to care about "is there a
 * profile at all".
 */
function useAuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useAthleteStore((s) => s.hydrated);
  const onboarded = useAthleteStore((s) => s.onboarded);

  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!onboarded && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (onboarded && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [hydrated, onboarded, segments, router]);

  return hydrated;
}

export default function RootLayout() {
  const ready = useAuthGate();
  const resolved = useAuthStore((s) => s.resolved);
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);

  useEffect(() => startSync(), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <WebFrame>
          <View style={styles.root}>
            {ready && (resolved || !cloudEnabled) ? (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg.base },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="result-summary" options={{ presentation: 'modal' }} />
              </Stack>
            ) : (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.accent.primary} />
              </View>
            )}
          </View>
        </WebFrame>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
