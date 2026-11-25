import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { errorMessage, fieldErrors, publicApi } from '@/api';
import { Button, EmptyState, FormScroll, Header, Notice, Screen, TextField } from '@/components/ui';
import { goBack } from '@/lib/nav';
import { useSession } from '@/stores/session';
import { Colors, Type } from '@/theme';

/** Public account-recovery request (POST /support/recovery) — works signed out. */
export default function AccountRecovery() {
  const support = useSession((s) => s.config?.support);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<number | null>(null);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (subject.trim().length < 3) e.subject = 'Add a short subject.';
    if (message.trim().length < 10) e.message = 'Tell us a little more so we can find your account.';
    if (contact.trim().length < 5) e.contact = 'Add a phone number or email so we can reach you.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const res = await publicApi.recovery({ subject: subject.trim(), message: message.trim(), contact: contact.trim() });
      setTicket(res.id);
    } catch (err) {
      const f = fieldErrors(err);
      if (Object.keys(f).length) setErrors(f);
      else Alert.alert('Could not send', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (ticket) {
    return (
      <Screen>
        <Header title="Account recovery" />
        <EmptyState
          icon="checkmark-circle-outline"
          title="Request received"
          message={`Your reference is #${ticket}. Our team will verify your identity with your school or guardian and contact you.`}
          actionLabel="Done"
          onAction={() => goBack('/welcome')}
        />
      </Screen>
    );
  }

  return (
    <Screen background={Colors.surface}>
      <Header title="Account recovery" />
      <FormScroll footer={<Button label="Send request" onPress={submit} loading={busy} />}>
        <Text style={styles.lead}>
          Lost access to your phone or forgot your password? Tell us who you are. We verify every request with your school or guardian before restoring access.
        </Text>
        <TextField label="Subject" placeholder="e.g. New phone number" value={subject} onChangeText={setSubject} maxLength={150} error={errors.subject} />
        <TextField
          label="Details"
          placeholder="Your full name, school, class, student ID and old phone number"
          multiline
          value={message}
          onChangeText={setMessage}
          maxLength={3000}
          error={errors.message}
        />
        <TextField
          label="How can we reach you?"
          placeholder="Phone number or email"
          autoCapitalize="none"
          value={contact}
          onChangeText={setContact}
          maxLength={120}
          error={errors.contact}
        />
        {support?.email || support?.phone ? (
          <Notice message={`You can also contact support${support.email ? ` at ${support.email}` : ''}${support.phone ? `${support.email ? ' or' : ''} on ${support.phone}` : ''}.`} />
        ) : null}
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { ...Type.body, color: Colors.muted },
});
