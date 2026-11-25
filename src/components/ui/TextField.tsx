import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/theme';

export type TextInputInstance = ComponentRef<typeof TextInput>;

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  /** Text shown before the input (e.g. +91). */
  prefix?: string;
  optional?: boolean;
  ref?: Ref<TextInputInstance>;
}

export function TextField({ label, icon, error, hint, secure, prefix, optional, multiline, style, onFocus, onBlur, ref, ...input }: TextFieldProps) {
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {optional ? <Text style={styles.optional}> (optional)</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.field, multiline && styles.fieldMulti, focused && styles.fieldFocus, !!error && styles.fieldError]}>
        {icon ? <Ionicons name={icon} size={18} color={Colors.subtle} style={styles.icon} /> : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={Colors.subtle}
          secureTextEntry={hidden}
          multiline={multiline}
          accessibilityLabel={label ?? input.placeholder}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMulti, style]}
          {...input}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={10}
            style={styles.eye}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Small label used above custom inputs (chips, pickers). */
export function FieldLabel({ children, optional }: { children: string; optional?: boolean }) {
  return (
    <Text style={styles.label}>
      {children}
      {optional ? <Text style={styles.optional}> (optional)</Text> : null}
    </Text>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs + 2 },
  label: { ...Type.small, fontWeight: '600', color: Colors.ink },
  optional: { fontWeight: '400', color: Colors.subtle },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  fieldMulti: { alignItems: 'flex-start', paddingVertical: Spacing.sm + 2, minHeight: 104 },
  fieldFocus: { borderColor: Colors.primary },
  fieldError: { borderColor: Colors.danger },
  icon: { marginRight: Spacing.sm },
  prefix: { ...Type.bodyLg, color: Colors.ink, fontWeight: '600', marginRight: Spacing.sm },
  input: { flex: 1, ...Type.bodyLg, color: Colors.ink, paddingVertical: Spacing.sm },
  inputMulti: { minHeight: 84, textAlignVertical: 'top', paddingVertical: 0 },
  eye: { padding: Spacing.xs },
  hint: { ...Type.caption, color: Colors.muted },
  error: { ...Type.caption, color: Colors.danger },
});
