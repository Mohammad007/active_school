import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { authApi, errorMessage, fieldErrors } from '@/api';
import { AuthBadge } from '@/components/auth/AuthArt';
import { Button, FormScroll, Header, Notice, Screen } from '@/components/ui';
import { goReplace } from '@/lib/nav';
import { deviceName, homeRoute, useSession } from '@/stores/session';
import { Colors, Radius, Spacing, Type } from '@/theme';

const LENGTH = 6;

/** Enter the one-time code sent to the phone (POST /auth/verify). */
export default function VerifyOtp() {
  const params = useLocalSearchParams<{ phone?: string; resend?: string; debug?: string }>();
  const phone = String(params.phone ?? '');
  const [debugCode, setDebugCode] = useState<string | undefined>(params.debug ? String(params.debug) : undefined);
  const [code, setCode] = useState(debugCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [wait, setWait] = useState(Number(params.resend) || 30);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (value = code) => {
    if (value.length !== LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await authApi.verifyOtp(phone, value, deviceName());
      await useSession.getState().signIn(res.token);
      goReplace(homeRoute() as string);
    } catch (e) {
      const f = fieldErrors(e);
      setError(f.code || f.phone || errorMessage(e));
      setCode('');
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await authApi.requestOtp(phone);
      setWait(res.resend_after ?? 30);
      setDebugCode(res.debug_code);
      setCode(res.debug_code ?? '');
      Alert.alert('Code sent', `A new code was sent to +91 ${phone}.`);
    } catch (e) {
      Alert.alert('Could not resend', errorMessage(e));
    } finally {
      setResending(false);
    }
  };

  const onChange = (t: string) => {
    const v = t.replace(/\D/g, '').slice(0, LENGTH);
    setCode(v);
    setError(null);
    if (v.length === LENGTH) verify(v);
  };

  return (
    <Screen background={Colors.surface}>
      <Header border={false} />
      <FormScroll footer={<Button label="Verify OTP" onPress={() => verify()} loading={busy} disabled={code.length !== LENGTH} />}>
        <AuthBadge icon="phone-portrait-outline" secondary="chatbubble-ellipses" />
        <Text style={styles.title} accessibilityRole="header">
          Verify Your Phone
        </Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
        <Pressable onPress={() => goReplace('/phone')} accessibilityRole="button" accessibilityLabel={`Change number, +91 ${phone}`} style={styles.number}>
          <Text style={styles.strong}>+91 {phone}</Text>
          <Ionicons name="pencil" size={16} color={Colors.primary} />
        </Pressable>

        {debugCode ? <Notice tone="warning" icon="flask-outline" title="Test mode" message={`Use code ${debugCode}`} /> : null}

        {/*
          The real input lies on top of the six boxes, nearly transparent, so a
          tap lands on it directly and Android opens the number pad itself. A
          1x1 / opacity-0 input that is focused from code does not reliably show
          the keyboard on Android, and re-focusing an already focused input
          after the keyboard was dismissed does nothing.
        */}
        <View style={styles.boxes}>
          {Array.from({ length: LENGTH }).map((_, i) => {
            const active = i === code.length && !busy;
            return (
              <View key={i} style={[styles.box, active && styles.boxActive, !!error && styles.boxError]}>
                <Text style={styles.digit}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
          <TextInput
            ref={input}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={LENGTH}
            autoFocus
            caretHidden
            selection={{ start: code.length, end: code.length }}
            style={styles.overlay}
            accessibilityLabel="Six digit code"
          />
        </View>
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <View style={styles.resend}>
          {wait > 0 ? (
            <Text style={styles.muted}>Resend Code (00:{String(wait).padStart(2, '0')})</Text>
          ) : (
            <Button label="Resend code" variant="ghost" size="sm" onPress={resend} loading={resending} />
          )}
        </View>
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Type.title, color: Colors.ink, textAlign: 'center' },
  subtitle: { ...Type.body, color: Colors.muted, textAlign: 'center' },
  number: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, minHeight: 36 },
  strong: { ...Type.heading, color: Colors.ink },
  boxes: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.md },
  box: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: Colors.surface },
  boxError: { borderColor: Colors.danger },
  digit: { ...Type.title, color: Colors.ink },
  // Covers the boxes; not 0 opacity, which Android treats as non-interactive.
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: 'transparent', fontSize: 16, textAlign: 'center' },
  error: { ...Type.small, color: Colors.danger, textAlign: 'center' },
  resend: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  muted: { ...Type.small, color: Colors.muted },
});
