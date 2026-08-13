import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Screen, SectionHeader, Text } from '@/components/ui';
import { INTEGRATIONS } from '@/services/integrations';
import { alpha, colors, radius, spacing } from '@/theme';

/**
 * Honest status board. Each integration says exactly what is missing rather
 * than showing a Connect button that does nothing.
 */
export function IntegrationsScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
        <Text variant="bodySm" color={colors.text.secondary}>
          Retour
        </Text>
      </Pressable>

      <View style={styles.header}>
        <Text variant="h1" color={colors.text.primary}>
          Connexions
        </Text>
        <Text variant="bodySm" color={colors.text.secondary}>
          TitiFit n’a pas vocation à devenir un énième carnet d’entraînement.
          L’objectif est de lire ce que ces apps enregistrent déjà et de
          l’injecter dans le système de rating.
        </Text>
      </View>

      <View style={styles.list}>
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.id} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={[styles.icon, { backgroundColor: alpha(colors.accent.secondary, 0.14) }]}>
                <Ionicons
                  name={integration.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={colors.accent.secondary}
                />
              </View>
              <View style={styles.flex}>
                <Text variant="h3" color={colors.text.primary}>
                  {integration.label}
                </Text>
                <Text variant="caption" color={colors.text.faint}>
                  {integration.description}
                </Text>
              </View>
              <View style={[styles.status, { borderColor: alpha(colors.state.warning, 0.35) }]}>
                <Text variant="caption" color={colors.state.warning}>
                  à venir
                </Text>
              </View>
            </View>

            {integration.requirement ? (
              <View style={styles.requirement}>
                <Ionicons name="information-circle-outline" size={13} color={colors.text.faint} />
                <Text variant="caption" color={colors.text.faint} style={styles.flex}>
                  {integration.requirement}
                </Text>
              </View>
            ) : null}
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Le principe" />
        <Card accent={colors.accent.primary}>
          <Text variant="bodySm" color={colors.text.secondary}>
            Aucune activité ne sera jamais importée en silence. Un fournisseur
            renvoie des <Text variant="bodySm" color={colors.text.primary}>candidats</Text> —
            « cette course de 5,02 km du 12 août pourrait être ton test 5 km » —
            et c’est toi qui confirmes.
          </Text>
          <Text variant="bodySm" color={colors.text.secondary} style={styles.paragraph}>
            La raison est simple : un 5 km importé automatiquement alors que
            c’était un échauffement corromprait un rating auquel tu fais
            confiance. Le contrat est déjà figé dans l’interface
            `IntegrationProvider`.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  status: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  requirement: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  section: { marginTop: spacing.xxl },
  paragraph: { marginTop: spacing.md },
});
