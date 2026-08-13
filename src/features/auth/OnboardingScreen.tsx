import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Choice, Field, ProgressBar, Text } from '@/components/ui';
import { useAthleteStore } from '@/store/athleteStore';
import { useAuthStore } from '@/store/authStore';
import { alpha, colors, gradients, radius, spacing } from '@/theme';
import type {
  ExperienceLevel,
  Sex,
  TrainingFrequency,
  User,
  WeightUnit,
} from '@/types';
import { ageFromBirthDate } from '@/utils/date';
import { createId } from '@/utils/id';
import { inchesToCm, toKg } from '@/utils/units';

/**
 * Everything asked here exists for one reason: it defines the comparison group.
 * The copy says so explicitly, because "why do you need my weight" is the first
 * question a fitness app has to answer honestly.
 */

const STEPS = ['Identité', 'Corps', 'Entraînement'] as const;

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Débutant', hint: 'Moins d’un an d’entraînement structuré' },
  { value: 'intermediate', label: 'Intermédiaire', hint: '1 à 3 ans, technique solide' },
  { value: 'advanced', label: 'Avancé', hint: '3 ans et plus, programmation sérieuse' },
  { value: 'elite', label: 'Élite', hint: 'Niveau compétition' },
];

const FREQUENCY_OPTIONS: { value: TrainingFrequency; label: string }[] = [
  { value: '1-2', label: '1–2 / sem' },
  { value: '3-4', label: '3–4 / sem' },
  { value: '5-6', label: '5–6 / sem' },
  { value: '7+', label: '7+ / sem' },
];

const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const age = ageFromBirthDate(value);
  return age >= 13 && age <= 100;
};

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const completeOnboarding = useAthleteStore((s) => s.completeOnboarding);
  const existing = useAthleteStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);

  const [displayName, setDisplayName] = useState(
    existing?.displayName ?? session?.displayName ?? '',
  );
  const [username, setUsername] = useState(existing?.username ?? '');
  const [sex, setSex] = useState<Sex | null>(existing?.sex ?? null);
  const [birthDate, setBirthDate] = useState(existing?.birthDate ?? '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(existing?.avatarUri);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(existing?.units.weight ?? 'lb');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ftin'>(existing?.units.height ?? 'cm');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  const [experience, setExperience] = useState<ExperienceLevel | null>(
    existing?.experience ?? null,
  );
  const [frequency, setFrequency] = useState<TrainingFrequency | null>(
    existing?.trainingFrequency ?? null,
  );
  const [city, setCity] = useState(existing?.location?.city ?? '');
  const [country, setCountry] = useState(existing?.location?.country ?? 'Canada');

  const resolvedHeightCm = useMemo(() => {
    if (heightUnit === 'cm') return Number(heightCm);
    return inchesToCm(Number(heightFt || 0) * 12 + Number(heightIn || 0));
  }, [heightUnit, heightCm, heightFt, heightIn]);

  const stepValid = [
    displayName.trim().length >= 2 && sex != null && isValidDate(birthDate),
    Number(weight) > 20 && resolvedHeightCm > 100 && resolvedHeightCm < 250,
    experience != null && frequency != null,
  ];

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setAvatarUri(result.assets[0]?.uri);
  };

  const finish = () => {
    setTouched(true);
    if (!stepValid[2] || sex == null || experience == null || frequency == null) return;

    const user: User = {
      id: session?.uid ?? existing?.id ?? createId('user'),
      remoteUid: session?.uid,
      username: (username.trim() || displayName.trim().toLowerCase().replace(/\s+/g, '')).slice(0, 20),
      displayName: displayName.trim(),
      avatarUri,
      sex,
      birthDate,
      heightCm: Math.round(resolvedHeightCm),
      bodyWeightKg: Math.round(toKg(Number(weight), weightUnit) * 10) / 10,
      experience,
      trainingFrequency: frequency,
      units: { weight: weightUnit, distance: 'km', height: heightUnit },
      location: { city: city.trim() || undefined, country: country.trim() || undefined },
      createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    };

    completeOnboarding(user);
    router.replace('/(tabs)');
  };

  const next = () => {
    setTouched(true);
    if (!stepValid[step]) return;
    setTouched(false);
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.huge },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="overline" color={colors.text.faint} upper>
            {`Étape ${step + 1} / ${STEPS.length} · ${STEPS[step]}`}
          </Text>
          <ProgressBar
            progress={(step + 1) / STEPS.length}
            gradient={gradients.primary}
            height={6}
          />
        </View>

        {step === 0 ? (
          <View style={styles.section}>
            <Text variant="h1" color={colors.text.primary}>
              Qui es-tu?
            </Text>
            <Text variant="bodySm" color={colors.text.secondary}>
              Ton sexe et ton âge servent à te comparer aux bonnes personnes —
              jamais à la population générale.
            </Text>

            <Pressable onPress={pickAvatar} style={styles.avatarRow}>
              <View style={styles.avatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <Ionicons name="camera-outline" size={22} color={colors.text.faint} />
                )}
              </View>
              <Text variant="bodySm" color={colors.accent.secondary}>
                {avatarUri ? 'Changer la photo' : 'Ajouter une photo (optionnel)'}
              </Text>
            </Pressable>

            <Field
              label="Nom affiché"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nick"
              autoCapitalize="words"
              error={touched && displayName.trim().length < 2 ? 'Au moins 2 caractères.' : undefined}
            />
            <Field
              label="Nom d’utilisateur"
              value={username}
              onChangeText={setUsername}
              placeholder="nick"
              hint="Utilisé dans les classements. Laisse vide pour le générer."
              maxLength={20}
            />
            <Choice label="Sexe" options={SEX_OPTIONS} value={sex} onChange={setSex} />
            <Field
              label="Date de naissance"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1997-03-14"
              keyboardType="numbers-and-punctuation"
              hint="Format AAAA-MM-JJ"
              error={touched && !isValidDate(birthDate) ? 'Date invalide (13 à 100 ans).' : undefined}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.section}>
            <Text variant="h1" color={colors.text.primary}>
              Ton gabarit
            </Text>
            <Text variant="bodySm" color={colors.text.secondary}>
              Le poids de corps sert aux ratios de force et à l’ajustement
              allométrique des percentiles. Tu peux le modifier n’importe quand.
            </Text>

            <Choice
              label="Unité de poids"
              options={[
                { value: 'lb', label: 'lb' },
                { value: 'kg', label: 'kg' },
              ]}
              value={weightUnit}
              onChange={(v) => setWeightUnit(v as WeightUnit)}
            />
            <Field
              label="Poids de corps"
              value={weight}
              onChangeText={setWeight}
              placeholder={weightUnit === 'lb' ? '180' : '82'}
              keyboardType="decimal-pad"
              suffix={weightUnit}
              error={touched && !(Number(weight) > 20) ? 'Entre un poids valide.' : undefined}
            />

            <Choice
              label="Unité de taille"
              options={[
                { value: 'cm', label: 'cm' },
                { value: 'ftin', label: 'pi / po' },
              ]}
              value={heightUnit}
              onChange={(v) => setHeightUnit(v as 'cm' | 'ftin')}
            />
            {heightUnit === 'cm' ? (
              <Field
                label="Taille"
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="180"
                keyboardType="number-pad"
                suffix="cm"
                error={
                  touched && !(resolvedHeightCm > 100 && resolvedHeightCm < 250)
                    ? 'Entre une taille valide.'
                    : undefined
                }
              />
            ) : (
              <View style={styles.row}>
                <Field
                  label="Pieds"
                  value={heightFt}
                  onChangeText={setHeightFt}
                  placeholder="5"
                  keyboardType="number-pad"
                  suffix="pi"
                  style={styles.flex}
                />
                <Field
                  label="Pouces"
                  value={heightIn}
                  onChangeText={setHeightIn}
                  placeholder="11"
                  keyboardType="number-pad"
                  suffix="po"
                  style={styles.flex}
                />
              </View>
            )}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Text variant="h1" color={colors.text.primary}>
              Ton entraînement
            </Text>
            <Text variant="bodySm" color={colors.text.secondary}>
              Ça calibre tes objectifs et le seuil de ta série hebdomadaire.
            </Text>

            <Choice
              label="Niveau d’expérience"
              options={EXPERIENCE_OPTIONS}
              value={experience}
              onChange={setExperience}
              stacked
            />
            <Choice
              label="Fréquence"
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={setFrequency}
            />
            <View style={styles.row}>
              <Field
                label="Ville"
                value={city}
                onChangeText={setCity}
                placeholder="Montréal"
                autoCapitalize="words"
                style={styles.flex}
              />
              <Field
                label="Pays"
                value={country}
                onChangeText={setCountry}
                placeholder="Canada"
                autoCapitalize="words"
                style={styles.flex}
              />
            </View>
            <Text variant="caption" color={colors.text.faint}>
              La localisation ne sert qu’aux filtres de classement. Elle est
              optionnelle et modifiable dans les réglages.
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={step === STEPS.length - 1 ? 'Créer ma carte d’athlète' : 'Continuer'}
            onPress={next}
            icon={step === STEPS.length - 1 ? 'sparkles' : 'arrow-forward'}
          />
          {step > 0 ? (
            <Button
              label="Retour"
              variant="ghost"
              onPress={() => {
                setTouched(false);
                setStep(step - 1);
              }}
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xxl },
  header: { gap: spacing.sm },
  section: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: alpha(colors.accent.primary, 0.3),
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  actions: { gap: spacing.sm },
});
