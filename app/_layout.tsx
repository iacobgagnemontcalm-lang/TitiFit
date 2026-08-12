import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme';
import { useAthleteStore } from '@/store/athleteStore';

export default function RootLayout() {
  const hydrated = useAthleteStore((s) => s.hydrated);
  const onboarded = useAthleteStore((s) => s.onboarded);
  const loadDemoAthlete = useAthleteStore((s) => s.loadDemoAthlete);

  // Prototype convenience: seed the demo athlete on a cold, empty install so
  // every screen has data. Replaced by the real onboarding flow in Phase 2.
  useEffect(() => {
    if (hydrated && !onboarded) loadDemoAthlete();
  }, [hydrated, onboarded, loadDemoAthlete]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg.base },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
});
