import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { alpha, colors, radius, spacing, typography } from '@/theme';

import { Text } from './Text';

// ---------------------------------------------------------------------------
// Text input
// ---------------------------------------------------------------------------

export interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  /** Unit rendered inside the field, right-aligned (kg, lb, reps…). */
  suffix?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  maxLength?: number;
  style?: StyleProp<ViewStyle>;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  secure,
  autoCapitalize = 'none',
  suffix,
  icon,
  maxLength,
  style,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tint = error ? colors.state.negative : focused ? colors.accent.secondary : undefined;

  return (
    <View style={[styles.wrap, style]}>
      <Text variant="overline" color={tint ?? colors.text.faint} upper>
        {label}
      </Text>

      <View
        style={[
          styles.input,
          { borderColor: tint ? alpha(tint, 0.5) : colors.border.default },
          focused && styles.inputFocused,
        ]}
      >
        {icon ? <Ionicons name={icon} size={16} color={colors.text.faint} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.faint}
          keyboardType={keyboardType}
          secureTextEntry={secure && !revealed}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.textInput}
        />
        {suffix ? (
          <Text variant="bodySm" color={colors.text.faint}>
            {suffix}
          </Text>
        ) : null}
        {secure ? (
          <Pressable onPress={() => setRevealed((r) => !r)} hitSlop={8}>
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={17}
              color={colors.text.faint}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color={colors.state.negative}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={colors.text.faint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Segmented choice
// ---------------------------------------------------------------------------

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export interface ChoiceProps<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Stacks options vertically with their hints — used for longer labels. */
  stacked?: boolean;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  stacked = false,
  accent = colors.accent.secondary,
  style,
}: ChoiceProps<T>) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text variant="overline" color={colors.text.faint} upper>
          {label}
        </Text>
      ) : null}

      <View style={stacked ? styles.stack : styles.row}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                stacked && styles.optionStacked,
                {
                  borderColor: active ? alpha(accent, 0.6) : colors.border.default,
                  backgroundColor: active ? alpha(accent, 0.14) : colors.bg.input,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="bodySm"
                color={active ? colors.text.primary : colors.text.secondary}
              >
                {option.label}
              </Text>
              {option.hint ? (
                <Text variant="caption" color={colors.text.faint}>
                  {option.hint}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  icon,
  accent = colors.accent.secondary,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}
    >
      {icon ? <Ionicons name={icon} size={17} color={accent} /> : null}
      <View style={styles.toggleBody}>
        <Text variant="h3" color={colors.text.primary}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" color={colors.text.faint}>
            {description}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.switch,
          {
            backgroundColor: value ? alpha(accent, 0.35) : colors.bg.input,
            borderColor: value ? alpha(accent, 0.6) : colors.border.default,
          },
        ]}
      >
        <View
          style={[
            styles.knob,
            { backgroundColor: value ? accent : colors.text.faint },
            value && styles.knobOn,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bg.input,
  },
  inputFocused: { backgroundColor: colors.bg.cardAlt },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    ...typography.body,
    paddingVertical: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  stack: { gap: spacing.sm },
  option: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 62,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  optionStacked: { flexBasis: 'auto', alignItems: 'flex-start' },
  pressed: { opacity: 0.75 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleBody: { flex: 1, gap: 2 },
  switch: {
    width: 48,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 3,
    justifyContent: 'center',
  },
  knob: { width: 20, height: 20, borderRadius: 10 },
  knobOn: { alignSelf: 'flex-end' },
});
