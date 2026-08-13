import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Choice, Field, Screen, SectionHeader, Text, ToggleRow } from '@/components/ui';
import { backendDiagnostics } from '@/services/backend';
import { pushNow, signOut } from '@/services/syncService';
import { useAthleteStore } from '@/store/athleteStore';
import { syncLabel, useAuthStore } from '@/store/authStore';
import { alpha, colors, radius, spacing } from '@/theme';
import type { DistanceUnit, HeightUnit, WeightUnit } from '@/types';
import { ageFromBirthDate } from '@/utils/date';
import { formatHeight, formatWeight } from '@/utils/units';

export function SettingsScreen() {
  const router = useRouter();
  const user = useAthleteStore((s) => s.user);
  const settings = useAthleteStore((s) => s.settings);
  const isDemo = useAthleteStore((s) => s.isDemo);
  const dirty = useAthleteStore((s) => s.dirty);
  const updateSettings = useAthleteStore((s) => s.updateSettings);
  const updateUser = useAthleteStore((s) => s.updateUser);
  const resetAll = useAthleteStore((s) => s.resetAll);

  const session = useAuthStore((s) => s.session);
  const sync = useAuthStore((s) => s.sync);
  const cloudEnabled = useAuthStore((s) => s.cloudEnabled);
  const diagnostics = backendDiagnostics();

  if (!user) return null;

  const confirmReset = () => {
    Alert.alert(
      'Tout réinitialiser?',
      'Ton profil, tes résultats et ta progression seront effacés de cet appareil. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            resetAll();
            router.replace('/(auth)/welcome');
          },
        },
      ],
    );
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Se déconnecter?',
      dirty
        ? 'Des changements ne sont pas encore synchronisés. Ils seront perdus sur cet appareil.'
        : 'Tes données restent dans le nuage et reviendront à la prochaine connexion.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          <Text variant="bodySm" color={colors.text.secondary}>
            Retour
          </Text>
        </Pressable>
        <Text variant="h1" color={colors.text.primary}>
          Réglages
        </Text>
      </View>

      {/* --- Compte & synchronisation ------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Compte & synchronisation" />
        <Card accent={sync.status === 'error' ? colors.state.negative : colors.accent.secondary}>
          <View style={styles.syncRow}>
            <Ionicons
              name={
                sync.status === 'syncing'
                  ? 'sync'
                  : sync.status === 'error'
                    ? 'alert-circle'
                    : session
                      ? 'cloud-done-outline'
                      : 'cloud-offline-outline'
              }
              size={18}
              color={sync.status === 'error' ? colors.state.negative : colors.accent.secondary}
            />
            <View style={styles.flex}>
              <Text variant="h3" color={colors.text.primary}>
                {session?.email ?? (session ? 'Session anonyme' : 'Aucun compte')}
              </Text>
              <Text variant="caption" color={colors.text.faint}>
                {syncLabel(sync)}
                {dirty ? ' · changements en attente' : ''}
              </Text>
            </View>
          </View>

          {isDemo ? (
            <View style={[styles.notice, { borderColor: alpha(colors.state.warning, 0.3) }]}>
              <Ionicons name="flask-outline" size={13} color={colors.state.warning} />
              <Text variant="caption" color={colors.text.faint} style={styles.flex}>
                Tu explores avec l’athlète démo. Ces données ne seront jamais
                envoyées dans un compte réel.
              </Text>
            </View>
          ) : null}

          <View style={styles.accountActions}>
            {session ? (
              <>
                <Button
                  label="Synchroniser maintenant"
                  variant="secondary"
                  icon="sync"
                  onPress={() => void pushNow()}
                />
                <Button label="Se déconnecter" variant="ghost" onPress={confirmSignOut} />
              </>
            ) : (
              <Button
                label={cloudEnabled ? 'Créer un compte / se connecter' : 'Comptes indisponibles'}
                variant="secondary"
                icon="cloud-upload-outline"
                disabled={!cloudEnabled}
                onPress={() => router.push('/(auth)/sign-up')}
              />
            )}
          </View>

          {!cloudEnabled ? (
            <View style={styles.diagnostics}>
              <Text variant="caption" color={colors.text.faint}>
                {`Backend actif : ${diagnostics.adapter}. Variables manquantes :`}
              </Text>
              {diagnostics.missingKeys.map((key) => (
                <Text key={key} variant="statSm" color={colors.state.warning}>
                  {key}
                </Text>
              ))}
            </View>
          ) : null}
        </Card>
      </View>

      {/* --- Profil -------------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Profil" subtitle="Sert à définir ton groupe de comparaison" />
        <Card>
          <View style={styles.profileGrid}>
            <ProfileCell label="Athlète" value={user.displayName} />
            <ProfileCell label="Username" value={`@${user.username}`} />
            <ProfileCell label="Âge" value={`${ageFromBirthDate(user.birthDate)} ans`} />
            <ProfileCell
              label="Sexe"
              value={user.sex === 'male' ? 'Homme' : user.sex === 'female' ? 'Femme' : 'Autre'}
            />
            <ProfileCell label="Taille" value={formatHeight(user.heightCm, user.units.height)} />
            <ProfileCell
              label="Poids"
              value={formatWeight(user.bodyWeightKg, user.units.weight)}
            />
          </View>

          <Field
            label="Poids de corps actuel"
            value={`${user.bodyWeightKg}`}
            onChangeText={(v) => {
              const kg = Number(v);
              if (kg > 20 && kg < 400) updateUser({ bodyWeightKg: kg });
            }}
            keyboardType="decimal-pad"
            suffix="kg"
            hint="Change tes ratios de force et tes percentiles au prochain calcul."
            style={styles.weightField}
          />

          <Button
            label="Modifier mon profil"
            variant="secondary"
            icon="create-outline"
            onPress={() => router.push('/(auth)/onboarding')}
          />
        </Card>
      </View>

      {/* --- Unités -------------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Unités" />
        <Card>
          <Choice
            label="Poids"
            options={[
              { value: 'lb', label: 'lb' },
              { value: 'kg', label: 'kg' },
            ]}
            value={user.units.weight}
            onChange={(v) => updateUser({ units: { ...user.units, weight: v as WeightUnit } })}
          />
          <View style={styles.spacer} />
          <Choice
            label="Distance"
            options={[
              { value: 'km', label: 'km' },
              { value: 'mi', label: 'mi' },
            ]}
            value={user.units.distance}
            onChange={(v) => updateUser({ units: { ...user.units, distance: v as DistanceUnit } })}
          />
          <View style={styles.spacer} />
          <Choice
            label="Taille"
            options={[
              { value: 'cm', label: 'cm' },
              { value: 'ftin', label: 'pi / po' },
            ]}
            value={user.units.height}
            onChange={(v) => updateUser({ units: { ...user.units, height: v as HeightUnit } })}
          />
        </Card>
      </View>

      {/* --- Série --------------------------------------------------------- */}
      <View style={styles.section}>
        <SectionHeader title="Série hebdomadaire" />
        <Card>
          <Choice
            label="Entraînements requis pour qu’une semaine compte"
            options={['1', '2', '3', '4'].map((v) => ({ value: v, label: v }))}
            value={`${settings.streak.activitiesPerWeek}`}
            onChange={(v) =>
              updateSettings({ streak: { ...settings.streak, activitiesPerWeek: Number(v) } })
            }
            accent={colors.palette.orange}
          />
          <View style={styles.spacer} />
          <Choice
            label="Début de semaine"
            options={[
              { value: '1', label: 'Lundi' },
              { value: '0', label: 'Dimanche' },
            ]}
            value={`${settings.streak.weekStartsOn}`}
            onChange={(v) =>
              updateSettings({
                streak: { ...settings.streak, weekStartsOn: Number(v) === 0 ? 0 : 1 },
              })
            }
            accent={colors.palette.orange}
          />
        </Card>
      </View>

      {/* --- Affichage ------------------------------------------------------ */}
      <View style={styles.section}>
        <SectionHeader title="Affichage" />
        <Card>
          <ToggleRow
            label="Beer Earned 🍺"
            description="Fonction humoristique. Désactive-la pour la masquer partout dans l’app."
            value={!settings.hideBeerEarned}
            onChange={(v) => updateSettings({ hideBeerEarned: !v })}
            accent={colors.palette.amber}
          />
          <ToggleRow
            label="Badges « données simulées »"
            description="Rappelle que les benchmarks actuels ne sont pas de vraies normes."
            value={settings.showSimulatedBadges}
            onChange={(v) => updateSettings({ showSimulatedBadges: v })}
            accent={colors.state.warning}
          />
          <ToggleRow
            label="Profil public"
            description="Apparaître dans les classements. Désactivé, ta carte n’est jamais publiée."
            value={settings.publicProfile}
            onChange={(v) => updateSettings({ publicProfile: v })}
          />
        </Card>
      </View>

      {/* --- Zone dangereuse ------------------------------------------------ */}
      <View style={styles.section}>
        <SectionHeader title="Zone dangereuse" />
        <Card accent={colors.state.negative}>
          <Text variant="bodySm" color={colors.text.secondary} style={styles.dangerText}>
            Efface le profil, les résultats, l’XP et les achievements stockés sur
            cet appareil.
          </Text>
          <Button label="Tout réinitialiser" variant="secondary" icon="trash-outline" onPress={confirmReset} />
        </Card>
      </View>
    </Screen>
  );
}

function ProfileCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileCell}>
      <Text variant="overline" color={colors.text.faint} upper>
        {label}
      </Text>
      <Text variant="statSm" color={colors.text.primary}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  section: { marginBottom: spacing.xxl },
  flex: { flex: 1 },
  spacer: { height: spacing.lg },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accountActions: { gap: spacing.sm, marginTop: spacing.lg },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: alpha(colors.state.warning, 0.08),
  },
  diagnostics: { gap: 2, marginTop: spacing.md },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  profileCell: { minWidth: 92, gap: 2 },
  weightField: { marginTop: spacing.lg, marginBottom: spacing.lg },
  dangerText: { marginBottom: spacing.lg },
});
