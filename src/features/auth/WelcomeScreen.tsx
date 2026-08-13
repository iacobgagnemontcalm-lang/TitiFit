import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { CATEGORY_LIST } from '@/data/categories';
import { useAthleteStore } from '@/store/athleteStore';
import { useAuthStore } from '@/store/authStore';
import { alpha, colors, glow, gradients, radius, spacing } from '@/theme';

/**
 * The pitch, in one screen. It has to answer "why would I enter my deadlift
 * into an app?" before asking for an account.
 */
export function WelcomeScreen() {
  const router = useRouter();
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);
  const loadDemoAthlete = useAthleteStore((s) => s.loadDemoAthlete);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2A1364', '#140C31', colors.bg.base]}
        locations={[0, 0.5, 1]}
        style={styles.wash}
        pointerEvents="none"
      />

      <View style={[styles.content, { paddingTop: insets.top + spacing.huge }]}>
        <View style={[styles.logo, glow(colors.accent.primary, 'lg')]}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text variant="h1" color={colors.palette.white}>
            TF
          </Text>
        </View>

        <View style={styles.headline}>
          <Text variant="display" color={colors.text.primary} center style={styles.title}>
            TitiFit
          </Text>
          <Text variant="h2" color={colors.accent.secondary} center>
            Découvre quel athlète tu es.
          </Text>
          <Text variant="body" color={colors.text.secondary} center style={styles.pitch}>
            Entre tes performances, obtiens un Overall Rating sur 100, des
            percentiles face à des gens qui s’entraînent comme toi, et fais
            monter ta carte d’athlète.
          </Text>
        </View>

        <View style={styles.pills}>
          {CATEGORY_LIST.map((category) => (
            <View
              key={category.id}
              style={[
                styles.pill,
                { borderColor: alpha(colors.category[category.id], 0.45) },
              ]}
            >
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={12}
                color={colors.category[category.id]}
              />
              <Text variant="caption" color={colors.text.secondary}>
                {category.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Button
          label="Créer mon profil"
          icon="arrow-forward"
          onPress={() => router.push('/(auth)/sign-up')}
        />
        <Button
          label="J’ai déjà un compte"
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in')}
        />
        <Button
          label="Explorer avec un athlète démo"
          variant="ghost"
          onPress={() => {
            loadDemoAthlete();
            router.replace('/(tabs)');
          }}
        />

        {!cloudEnabled ? (
          <View style={styles.notice}>
            <Ionicons name="cloud-offline-outline" size={13} color={colors.state.warning} />
            <Text variant="caption" color={colors.text.faint} style={styles.noticeText}>
              Firebase n’est pas configuré sur ce build : tes données resteront
              sur cet appareil. Ajoute tes clés EXPO_PUBLIC_FIREBASE_* pour
              activer les comptes et la synchronisation.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base, justifyContent: 'space-between' },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 560 },
  content: { alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.xxl },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headline: { alignItems: 'center', gap: spacing.md },
  title: { letterSpacing: -3 },
  pitch: { maxWidth: 330, marginTop: spacing.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: alpha(colors.palette.white, 0.03),
  },
  actions: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: alpha(colors.state.warning, 0.25),
    backgroundColor: alpha(colors.state.warning, 0.08),
  },
  noticeText: { flex: 1 },
});
