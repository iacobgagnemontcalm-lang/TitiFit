import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, Text } from '@/components/ui';
import { sendPasswordReset, signIn, signUp } from '@/services/syncService';
import { useAuthStore } from '@/store/authStore';
import { alpha, colors, radius, spacing } from '@/theme';

export interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Sign in and sign up share one component: the fields differ by a single line
 * and keeping them together keeps validation and error handling in sync.
 */
export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const busy = useAuthStore((s) => s.busy);
  const authError = useAuthStore((s) => s.error);
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const signUpMode = mode === 'sign-up';

  const errors = {
    displayName:
      signUpMode && touched && displayName.trim().length < 2
        ? 'Entre au moins 2 caractères.'
        : undefined,
    email: touched && !isEmail(email) ? 'Adresse courriel invalide.' : undefined,
    password:
      touched && password.length < 6 ? 'Minimum 6 caractères.' : undefined,
  };

  const valid =
    isEmail(email) && password.length >= 6 && (!signUpMode || displayName.trim().length >= 2);

  const submit = async () => {
    setTouched(true);
    if (!valid) return;

    const session = signUpMode
      ? await signUp(email, password, displayName.trim())
      : await signIn(email, password);

    if (!session) return;
    // syncService pulls the remote profile; a brand-new account has none, so
    // the athlete goes straight to building one.
    router.replace(signUpMode ? '/(auth)/onboarding' : '/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          <Text variant="bodySm" color={colors.text.secondary}>
            Retour
          </Text>
        </Pressable>

        <View style={styles.header}>
          <Text variant="h1" color={colors.text.primary}>
            {signUpMode ? 'Créer un compte' : 'Content de te revoir'}
          </Text>
          <Text variant="bodySm" color={colors.text.secondary}>
            {signUpMode
              ? 'Ton profil, tes résultats et ta progression te suivent sur tous tes appareils.'
              : 'Connecte-toi pour retrouver ta carte d’athlète.'}
          </Text>
        </View>

        <View style={styles.form}>
          {signUpMode ? (
            <Field
              label="Nom affiché"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nick"
              autoCapitalize="words"
              icon="person-outline"
              error={errors.displayName}
              maxLength={30}
            />
          ) : null}

          <Field
            label="Courriel"
            value={email}
            onChangeText={setEmail}
            placeholder="toi@exemple.com"
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />

          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
            icon="lock-closed-outline"
            error={errors.password}
            hint={signUpMode ? 'Minimum 6 caractères.' : undefined}
          />

          {authError ? (
            <View style={styles.error}>
              <Ionicons name="alert-circle" size={14} color={colors.state.negative} />
              <Text variant="bodySm" color={colors.state.negative} style={styles.errorText}>
                {authError}
              </Text>
            </View>
          ) : null}

          {resetSent ? (
            <Text variant="bodySm" color={colors.state.positive}>
              Courriel de réinitialisation envoyé.
            </Text>
          ) : null}

          <Button
            label={busy ? 'Un instant…' : signUpMode ? 'Créer mon compte' : 'Se connecter'}
            onPress={submit}
            disabled={busy || !cloudEnabled}
            style={styles.submit}
          />

          {!signUpMode ? (
            <Pressable
              onPress={async () => {
                if (!isEmail(email)) {
                  setTouched(true);
                  return;
                }
                await sendPasswordReset(email);
                setResetSent(true);
              }}
              hitSlop={8}
            >
              <Text variant="bodySm" color={colors.accent.secondary} center>
                Mot de passe oublié?
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => router.replace(signUpMode ? '/(auth)/sign-in' : '/(auth)/sign-up')}
            hitSlop={8}
          >
            <Text variant="bodySm" color={colors.text.secondary} center>
              {signUpMode ? 'J’ai déjà un compte' : 'Créer un compte'}
            </Text>
          </Pressable>

          {!cloudEnabled ? (
            <View style={styles.notice}>
              <Ionicons name="cloud-offline-outline" size={14} color={colors.state.warning} />
              <Text variant="caption" color={colors.text.faint} style={styles.errorText}>
                Les comptes demandent une configuration Firebase. Ajoute tes
                variables EXPO_PUBLIC_FIREBASE_* (voir .env.example) et relance
                l’app. En attendant, tu peux utiliser l’app en mode local depuis
                l’écran d’accueil.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xxl },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: spacing.sm },
  form: { gap: spacing.lg },
  submit: { marginTop: spacing.sm },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: alpha(colors.state.negative, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.state.negative, 0.28),
  },
  errorText: { flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: alpha(colors.state.warning, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.state.warning, 0.25),
  },
});
