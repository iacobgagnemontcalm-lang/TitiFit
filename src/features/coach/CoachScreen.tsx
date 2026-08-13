import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Field, Screen, SectionHeader, Text } from '@/components/ui';
import { useAthlete } from '@/hooks/useAthlete';
import { getCoach, type CoachAnswer } from '@/services/coach';
import { alpha, colors, radius, spacing } from '@/theme';

export function CoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, state } = useAthlete();
  const coach = getCoach();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<CoachAnswer | null>(null);
  const [asked, setAsked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user || !state) return null;

  const ask = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setAsked(text);
    try {
      setAnswer(await coach.ask(text, { user, state }));
    } finally {
      setBusy(false);
      setQuestion('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <Screen>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          <Text variant="bodySm" color={colors.text.secondary}>
            Retour
          </Text>
        </Pressable>

        <View style={styles.header}>
          <Text variant="h1" color={colors.text.primary}>
            Ask Coach
          </Text>
          <Text variant="bodySm" color={colors.text.secondary}>
            Chaque réponse explique son raisonnement et cite les chiffres sur
            lesquels elle s’appuie.
          </Text>
        </View>

        {/* --- Suggested questions ------------------------------------------ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {coach.suggestions({ user, state }).map((suggestion) => (
            <Pressable
              key={suggestion.id}
              onPress={() => void ask(suggestion.label)}
              style={styles.chip}
            >
              <Text variant="bodySm" color={colors.accent.secondary}>
                {suggestion.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Field
          label="Ta question"
          value={question}
          onChangeText={setQuestion}
          placeholder="Comment améliorer mon Overall?"
          autoCapitalize="sentences"
          icon="chatbubble-ellipses-outline"
        />
        <Pressable
          onPress={() => void ask(question)}
          style={({ pressed }) => [styles.askButton, pressed && styles.pressed]}
        >
          <Ionicons name="send" size={15} color={colors.accent.primary} />
          <Text variant="h3" color={colors.accent.primary}>
            Demander
          </Text>
        </Pressable>

        {/* --- Answer -------------------------------------------------------- */}
        {busy ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent.primary} />
          </View>
        ) : answer ? (
          <View style={styles.answer}>
            {asked ? (
              <View style={styles.askedBubble}>
                <Text variant="bodySm" color={colors.text.secondary}>
                  {asked}
                </Text>
              </View>
            ) : null}

            <Card accent={colors.accent.primary}>
              <Text variant="h2" color={colors.text.primary}>
                {answer.headline}
              </Text>

              {answer.paragraphs.map((paragraph, i) => (
                <Text
                  key={i}
                  variant="body"
                  color={colors.text.secondary}
                  style={styles.paragraph}
                >
                  {paragraph}
                </Text>
              ))}

              {answer.actions.length > 0 ? (
                <View style={styles.actions}>
                  <Text variant="overline" color={colors.text.faint} upper>
                    À faire
                  </Text>
                  {answer.actions.map((action) => (
                    <View key={action} style={styles.actionRow}>
                      <Ionicons name="arrow-forward" size={13} color={colors.accent.secondary} />
                      <Text variant="bodySm" color={colors.text.primary} style={styles.flex}>
                        {action}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {answer.citations.length > 0 ? (
                <View style={styles.citations}>
                  <Text variant="overline" color={colors.text.faint} upper>
                    Basé sur
                  </Text>
                  <View style={styles.citationRow}>
                    {answer.citations.map((citation) => (
                      <View key={citation.label} style={styles.citation}>
                        <Text variant="caption" color={colors.text.faint}>
                          {citation.label}
                        </Text>
                        <Text variant="statSm" color={colors.text.primary}>
                          {citation.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </Card>

            <Text variant="caption" color={colors.text.faint} style={styles.source}>
              {`Source : ${answer.source}`}
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <SectionHeader title="Comment ça marche" />
            <Card>
              <Text variant="bodySm" color={colors.text.secondary}>
                Ce coach n’est pas un modèle de langage : c’est une analyse
                déterministe branchée sur les mêmes moteurs que le reste de
                l’app. Il ne peut donc jamais inventer un chiffre — tout ce
                qu’il cite est une valeur que l’app détient réellement.
              </Text>
              <Text variant="bodySm" color={colors.text.secondary} style={styles.paragraph}>
                Il vit derrière une interface `CoachProvider`. Brancher un
                modèle de langage plus tard ne demandera qu’un nouveau
                fournisseur, sans toucher à cet écran — et avec le même
                contrat : toujours expliquer le pourquoi.
              </Text>
            </Card>
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  header: { gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg },
  chips: { gap: spacing.sm, paddingBottom: spacing.lg, paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: alpha(colors.accent.secondary, 0.35),
    backgroundColor: alpha(colors.accent.secondary, 0.1),
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: alpha(colors.accent.primary, 0.4),
    backgroundColor: alpha(colors.accent.primary, 0.12),
  },
  pressed: { opacity: 0.75 },
  loading: { paddingVertical: spacing.huge, alignItems: 'center' },
  answer: { marginTop: spacing.xl, gap: spacing.md },
  askedBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.input,
  },
  paragraph: { marginTop: spacing.md },
  actions: { gap: 6, marginTop: spacing.lg },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  citations: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  citationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  citation: { gap: 1 },
  source: { textAlign: 'center' },
  section: { marginTop: spacing.xl },
});
