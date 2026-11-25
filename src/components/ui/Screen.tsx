import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type RefreshControlProps,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { goBack } from '@/lib/nav';
import { Colors, MaxContentWidth, MaxWideWidth, ScreenPadding, Spacing, Type } from '@/theme';

import { Touchable } from './Touchable';

/** Centre content at MaxContentWidth on tablets. Use as FlatList contentContainerStyle too. */
export const contentWidth: ViewStyle = { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' };

/** Wider centred column for grid screens on tablets. */
export const wideWidth: ViewStyle = { width: '100%', maxWidth: MaxWideWidth, alignSelf: 'center' };

interface ScreenProps {
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  background?: string;
}

/** Safe-area scaffold with the app background. Tabs use edges=['top']. */
export function Screen({ children, edges = ['top', 'left', 'right'], style, background = Colors.background }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: background }, style]}>
      {children}
    </SafeAreaView>
  );
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  /** Show the back chevron (default true). */
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  /** Large left-aligned title for tab roots. */
  large?: boolean;
  /** Custom content instead of the title (e.g. logo). */
  children?: ReactNode;
  border?: boolean;
  /** Align with wide (grid) content on tablets. */
  wide?: boolean;
}

export function Header({ title, subtitle, back = true, onBack, right, large, children, border = true, wide }: HeaderProps) {
  return (
    <View style={[styles.header, border && styles.headerBorder]}>
      <View style={[styles.headerInner, wide ? wideWidth : contentWidth]}>
        {back ? (
          <Touchable
            onPress={onBack ?? (() => goBack())}
            accessibilityLabel="Go back"
            hitSlop={8}
            scaleTo={0.9}
            style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={Colors.ink} />
          </Touchable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <View style={[styles.titles, !large && back && styles.titlesCompact]}>
          {children ?? (
            <>
              {title ? (
                <Text style={large ? styles.titleLarge : styles.title} numberOfLines={1} accessibilityRole="header">
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

interface FormScrollProps extends ScrollViewProps {
  children: ReactNode;
  footer?: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

/** Keyboard-avoiding scroll container for forms, with an optional sticky footer (e.g. submit button). */
export function FormScroll({ children, footer, contentContainerStyle, ...rest }: FormScrollProps) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.form, contentWidth, contentContainerStyle]}
        {...rest}>
        {children}
      </ScrollView>
      {footer ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={contentWidth}>{footer}</View>
        </SafeAreaView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  header: { backgroundColor: Colors.surface },
  headerBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  headerInner: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backSpacer: { width: Spacing.md },
  titles: { flex: 1, justifyContent: 'center' },
  titlesCompact: { marginLeft: -Spacing.xs },
  title: { ...Type.heading, color: Colors.ink },
  titleLarge: { ...Type.title, color: Colors.ink },
  subtitle: { ...Type.caption, color: Colors.muted, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.xs },
  form: { padding: ScreenPadding, paddingBottom: Spacing.xxl, gap: Spacing.md },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
});
