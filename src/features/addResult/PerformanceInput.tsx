import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Choice, Field, Text } from '@/components/ui';
import { GAUNTLET_RULES, GAUNTLET_STATIONS, GAUNTLET_VERSION } from '@/data/hybridProtocol';
import { estimateOneRepMax, MAX_ESTIMABLE_REPS } from '@/services/repMax';
import { alpha, colors, radius, spacing } from '@/theme';
import type { RawEntry, TestDefinition, UnitPreferences } from '@/types';
import { formatDuration, parseDuration, toKg, fromKg } from '@/utils/units';

export interface PerformanceValue {
  /** Free-form strings, kept as typed so the field never fights the keyboard. */
  weight: string;
  reps: string;
  count: string;
  duration: string;
}

export const EMPTY_PERFORMANCE: PerformanceValue = {
  weight: '',
  reps: '1',
  count: '',
  duration: '',
};

/** Converts the typed values into the canonical `RawEntry` the engines expect. */
export function toRawEntry(
  test: TestDefinition,
  value: PerformanceValue,
  units: UnitPreferences,
): RawEntry | null {
  switch (test.inputKind) {
    case 'weight_reps': {
      const weight = Number(value.weight);
      const reps = Number(value.reps || '1');
      if (!(weight > 0) || !(reps >= 1)) return null;
      return { weightKg: toKg(weight, units.weight), reps: Math.round(reps) };
    }
    case 'reps': {
      const count = Number(value.count);
      if (!(count >= 0) || value.count === '') return null;
      return { count: Math.round(count) };
    }
    case 'duration': {
      const seconds = parseDuration(value.duration);
      if (seconds == null || seconds <= 0) return null;
      return { seconds };
    }
    default: {
      const points = Number(value.count);
      if (!(points > 0)) return null;
      return { points };
    }
  }
}

export interface PerformanceInputProps {
  test: TestDefinition;
  value: PerformanceValue;
  onChange: (value: PerformanceValue) => void;
  units: UnitPreferences;
  bodyWeightKg: number;
  touched: boolean;
}

export function PerformanceInput({
  test,
  value,
  onChange,
  units,
  bodyWeightKg,
  touched,
}: PerformanceInputProps) {
  const patch = (next: Partial<PerformanceValue>) => onChange({ ...value, ...next });
  const tint = colors.category[test.category];

  if (test.inputKind === 'weight_reps') {
    const weightKg = toKg(Number(value.weight || '0'), units.weight);
    const reps = Number(value.reps || '1');
    const oneRM = estimateOneRepMax(weightKg, reps);
    const ratio = oneRM.value > 0 ? oneRM.value / Math.max(1, bodyWeightKg) : 0;

    return (
      <View style={styles.root}>
        <View style={styles.row}>
          <Field
            label="Charge"
            value={value.weight}
            onChangeText={(v) => patch({ weight: v })}
            placeholder={units.weight === 'lb' ? '380' : '175'}
            keyboardType="decimal-pad"
            suffix={units.weight}
            style={styles.flex2}
            error={touched && !(Number(value.weight) > 0) ? 'Requis' : undefined}
          />
          <Field
            label="Répétitions"
            value={value.reps}
            onChangeText={(v) => patch({ reps: v })}
            placeholder="1"
            keyboardType="number-pad"
            style={styles.flex1}
            error={touched && !(reps >= 1) ? 'Requis' : undefined}
          />
        </View>

        {oneRM.value > 0 ? (
          <View style={[styles.readout, { borderColor: alpha(tint, 0.3) }]}>
            <View style={styles.readoutRow}>
              <Text variant="overline" color={colors.text.faint} upper>
                {reps === 1 ? '1RM réel' : '1RM estimé'}
              </Text>
              <Text variant="stat" color={tint}>
                {`${Math.round(fromKg(oneRM.value, units.weight))} ${units.weight}`}
              </Text>
            </View>
            <View style={styles.readoutRow}>
              <Text variant="overline" color={colors.text.faint} upper>
                Ratio / poids de corps
              </Text>
              <Text variant="statSm" color={colors.text.secondary}>
                {`${ratio.toFixed(2)}× BW`}
              </Text>
            </View>
            {oneRM.estimated ? (
              <Text variant="caption" color={colors.text.faint}>
                {oneRM.lowConfidence
                  ? `Au-delà de ${MAX_ESTIMABLE_REPS} répétitions, l’estimation devient peu fiable. Entre un vrai 1RM si tu peux.`
                  : 'Estimation par la moyenne des formules Epley et Brzycki.'}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  if (test.inputKind === 'reps') {
    return (
      <View style={styles.root}>
        <Field
          label={test.id === 'push_ups_60s' ? 'Répétitions valides en 60 s' : 'Répétitions valides'}
          value={value.count}
          onChangeText={(v) => patch({ count: v })}
          placeholder="22"
          keyboardType="number-pad"
          suffix="reps"
          error={touched && value.count === '' ? 'Requis' : undefined}
        />
      </View>
    );
  }

  const parsed = parseDuration(value.duration);

  return (
    <View style={styles.root}>
      <Field
        label="Temps"
        value={value.duration}
        onChangeText={(v) => patch({ duration: v })}
        placeholder={test.id === 'run_400m' ? '1:14' : '20:42'}
        keyboardType="numbers-and-punctuation"
        suffix="mm:ss"
        hint={parsed ? `= ${formatDuration(parsed)} (${Math.round(parsed)} s)` : 'Format m:ss ou h:mm:ss'}
        error={touched && (parsed == null || parsed <= 0) ? 'Temps invalide' : undefined}
      />

      {test.id === 'hybrid_gauntlet' ? <GauntletBrief /> : null}
    </View>
  );
}

/** The Hybrid protocol has to be visible at entry time or scores are not comparable. */
function GauntletBrief() {
  return (
    <View style={[styles.protocol, { borderColor: alpha(colors.palette.orange, 0.3) }]}>
      <View style={styles.protocolHead}>
        <Ionicons name="flame" size={14} color={colors.palette.orange} />
        <Text variant="overline" color={colors.palette.orange} upper>
          {`Protocole officiel ${GAUNTLET_VERSION}`}
        </Text>
      </View>

      {GAUNTLET_STATIONS.map((station) => (
        <View key={station.order} style={styles.station}>
          <Text variant="statSm" color={colors.palette.orange}>
            {station.order}
          </Text>
          <View style={styles.stationBody}>
            <Text variant="bodySm" color={colors.text.primary}>
              {station.name}
            </Text>
            <Text variant="caption" color={colors.text.faint}>
              {station.standard}
            </Text>
          </View>
        </View>
      ))}

      <Text variant="caption" color={colors.text.faint} style={styles.rules}>
        {GAUNTLET_RULES[0]}
      </Text>
    </View>
  );
}

/** RPE picker, shared by every input kind. */
export function RPEPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Choice
      label="RPE (optionnel)"
      options={['6', '7', '8', '9', '10'].map((v) => ({ value: v, label: v }))}
      value={value || null}
      onChange={(v) => onChange(v === value ? '' : v)}
      accent={colors.palette.orange}
    />
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  readout: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  readoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  protocol: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.card,
  },
  protocolHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  station: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stationBody: { flex: 1, gap: 1 },
  rules: { marginTop: spacing.sm },
});
