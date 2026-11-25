import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { authApi, errorMessage, fieldErrors } from '@/api';
import { AuthBadge } from '@/components/auth/AuthArt';
import { Button, FormScroll, Header, Screen, TextField } from '@/components/ui';
import { go } from '@/lib/nav';
import { Colors, Spacing, Type } from '@/theme';

/**
 * Verify your phone: sends a one-time code (POST /auth/otp). The same code
 * signs in an existing student or creates a new account.
 */
export default function Phone() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const valid = /^[6-9]\d{9}$/.test(digits);

  const send = async () => {
    if (!valid) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await authApi.requestOtp(digits);
      const debug = res.debug_code ? `&debug=${encodeURIComponent(res.debug_code)}` : '';
      go(`/verify-otp?phone=${encodeURIComponent(res.phone)}&resend=${res.resend_after ?? 30}${debug}`);
    } catch (e) {
      const f = fieldErrors(e);
      if (f.phone) setError(f.phone);
      else Alert.alert('Could not send code', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen background={Colors.surface}>
      <Header border={false} />
      <FormScroll footer={<Button label="Send OTP" onPress={send} loading={busy} disabled={!valid} />}>
        <AuthBadge icon="phone-portrait-outline" secondary="chatbubble-ellipses" />
        <View style={styles.copy}>
          <Text style={styles.title} accessibilityRole="header">
            Verify Your Phone
          </Text>
          <Text style={styles.subtitle}>We’ll send a 6-digit code to your mobile number. New here? The same code creates your account.</Text>
        </View>
        <TextField
          label="Mobile number"
          prefix="+91"
          placeholder="98765 43210"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={14}
          value={phone}
          onChangeText={(t) => {
            setPhone(t.replace(/[^\d ]/g, ''));
            setError(null);
          }}
          onSubmitEditing={send}
          error={error}
          autoFocus
        />
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: { gap: Spacing.xs, alignItems: 'center', marginBottom: Spacing.sm },
  title: { ...Type.title, color: Colors.ink, textAlign: 'center' },
  subtitle: { ...Type.body, color: Colors.muted, textAlign: 'center' },
  alt: { ...Type.small, color: Colors.muted, textAlign: 'center', marginTop: Spacing.sm },
  link: { color: Colors.primary, fontWeight: '600' },
});
