import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, SimulatedBadge, Text } from '@/components/ui';
import { TESTS } from '@/data/tests';
import { useAthlete } from '@/hooks/useAthlete';
import { useAthleteStore } from '@/store/athleteStore';
import { alpha, colors, radius, spacing, TAB_BAR_HEIGHT } from '@/theme';
import type { RPE, TestId } from '@/types';
import { todayISO } from '@/utils/date';

import {
  EMPTY_PERFORMANCE,
  PerformanceInput,
  RPEPicker,
  toRawEntry,
  type PerformanceValue,
} from './PerformanceInput';
import { TestPicker } from './TestPicker';

type Step = 'test' | 'performance';

/**
 * ADD RESULT. Two steps on purpose: picking a test is a browsing task (what am
 * I chasing?), entering the number is a focused one. Merging them buried the
 * input under a long list.
 */
export function AddResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, state } = useAthlete();
  const addResult = useAthleteStore((s) => s.addResult);
  const showSimulated = useAthleteStore((s) => s.settings.showSimulatedBadges);

  const [step, setStep] = useState<Step>('test');
  const [testId, setTestId] = useState<TestId | null>(null);
  const [performance, setPerformance] = useState<PerformanceValue>(EMPTY_PERFORMANCE);
  const [date, setDate] = useState(todayISO());
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [bodyWeight, setBodyWeight] = useState('');
  const [touched, setTouched] = useState(false);

  const test = testId ? TESTS[testId] : null;

  const rawEntry = useMemo(
    () => (test && user ? toRawEntry(test, performance, user.units) : null),
    [test, performance, user],
  );

  if (!user || !state) return null;

  const reset = () => {
    setStep('test');
    setTestId(null);
    setPerformance(EMPTY_PERFORMANCE);
    setDate(todayISO());
    setRpe('');
    setNotes('');
    setPhotoUri(undefined);
    setBodyWeight('');
    setTouched(false);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
  };

  const save = () => {
    setTouched(true);
    if (!test || !rawEntry) return;

    const outcome = addResult({
      testId: test.id,
      date,
      raw: rawEntry,
      rpe: rpe ? (Number(rpe) as RPE) : undefined,
      notes: notes.trim() || undefined,
      photoUri,
      bodyWeightKg: bodyWeight ? Number(bodyWeight) : undefined,
    });

    if (!outcome) return;
    Haptics.notificationAsync(
      outcome.isPR
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => undefined);

    reset();
    router.push('/result-summary');
  };

  // --- Step 1: pick a test ------------------------------------------------
  if (step === 'test') {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing.xxxl,
          },
        ]}
      >
        <View style={styles.header}>
          <Text variant="h1" color={colors.text.primary}>
            Ajouter un résultat
          </Text>
          <Text variant="bodySm" color={colors.text.secondary}>
            Choisis un test. Seuls les tests officiels font bouger ton Overall.
          </Text>
        </View>

        <TestPicker
          value={testId}
          onChange={(id) => {
            setTestId(id);
            setPerformance(EMPTY_PERFORMANCE);
            setTouched(false);
            setStep('performance');
          }}
          bests={state.bests}
          units={user.units}
        />
      </ScrollView>
    );
  }

  // --- Step 2: enter the performance --------------------------------------
  const tint = test ? colors.category[test.category] : colors.accent.primary;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + spacing.xxxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => setStep('test')} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          <Text variant="bodySm" color={colors.text.secondary}>
            Changer de test
          </Text>
        </Pressable>

        {test ? (
          <>
            <View style={styles.header}>
              <Text variant="h1" color={colors.text.primary}>
                {test.name}
              </Text>
              <Text variant="bodySm" color={tint}>
                {test.tagline}
              </Text>
            </View>

            <View style={[styles.standard, { borderColor: alpha(tint, 0.28) }]}>
              <Text variant="overline" color={colors.text.faint} upper>
                Standard d’exécution
              </Text>
              {test.standard.map((line) => (
                <View key={line} style={styles.standardRow}>
                  <Ionicons name="checkmark" size={13} color={tint} />
                  <Text variant="caption" color={colors.text.secondary} style={styles.flex}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>

            <PerformanceInput
              test={test}
              value={performance}
              onChange={setPerformance}
              units={user.units}
              bodyWeightKg={bodyWeight ? Number(bodyWeight) : user.bodyWeightKg}
              touched={touched}
            />

            <Field
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder={todayISO()}
              keyboardType="numbers-and-punctuation"
              hint="Format AAAA-MM-JJ"
              icon="calendar-outline"
            />

            <RPEPicker value={rpe} onChange={setRpe} />

            <Field
              label="Poids de corps ce jour-là (optionnel)"
              value={bodyWeight}
              onChangeText={setBodyWeight}
              placeholder={`${user.bodyWeightKg}`}
              keyboardType="decimal-pad"
              suffix="kg"
              hint="Laisse vide pour utiliser le poids de ton profil."
            />

            <Field
              label="Notes (optionnel)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Conditions, ressenti, matériel…"
              autoCapitalize="sentences"
              maxLength={280}
            />

            <Pressable onPress={pickPhoto} style={styles.photoRow}>
              <View style={styles.photo}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImage} contentFit="cover" />
                ) : (
                  <Ionicons name="image-outline" size={20} color={colors.text.faint} />
                )}
              </View>
              <Text variant="bodySm" color={colors.accent.secondary}>
                {photoUri ? 'Changer la photo' : 'Joindre une photo (optionnel)'}
              </Text>
            </Pressable>

            {showSimulated && test.official ? <SimulatedBadge /> : null}

            <Button
              label="Enregistrer et calculer"
              icon="flash"
              onPress={save}
              disabled={!rawEntry}
              style={styles.save}
            />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  header: { gap: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  standard: {
    gap: 6,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  standardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  photo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  save: { marginTop: spacing.sm },
});
