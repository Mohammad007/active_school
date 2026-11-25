import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/theme';

import { Touchable } from './Touchable';

type IconName = keyof typeof Ionicons.glyphMap;

/** Bottom sheet modal (max 640 wide, centred on tablets). */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          {title ? (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {children}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface SheetAction {
  label: string;
  icon?: IconName;
  destructive?: boolean;
  onPress: () => void;
}

/** List of actions in a bottom sheet (post menu, profile menu). */
export function ActionSheet({ visible, onClose, title, actions }: { visible: boolean; onClose: () => void; title?: string; actions: SheetAction[] }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {actions.map((a) => (
        <Touchable
          key={a.label}
          scaleTo={0.99}
          onPress={() => {
            onClose();
            a.onPress();
          }}
          style={styles.action}>
          {a.icon ? <Ionicons name={a.icon} size={20} color={a.destructive ? Colors.danger : Colors.ink} /> : null}
          <Text style={[styles.actionText, a.destructive && { color: Colors.danger }]}>{a.label}</Text>
        </Touchable>
      ))}
      <Touchable scaleTo={0.99} onPress={onClose} style={[styles.action, styles.cancel]}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Touchable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    maxHeight: '88%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.hairline, alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md },
  title: { ...Type.heading, color: Colors.ink, marginBottom: Spacing.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 52 },
  actionText: { ...Type.bodyLg, color: Colors.ink },
  cancel: { justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.hairline, marginTop: Spacing.xs },
  cancelText: { ...Type.bodyLg, fontWeight: '600', color: Colors.muted },
});
