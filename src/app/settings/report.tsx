import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { accountApi, errorMessage, fieldErrors } from '@/api';
import { Button, ChipGroup, contentWidth, FieldLabel, FormScroll, Header, Screen, TextField } from '@/components/ui';
import { go, goBack } from '@/lib/nav';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';
import type { TicketType } from '@/types';

const TYPES: { key: TicketType; label: string }[] = [
  { key: 'help', label: 'Something isn’t working' },
  { key: 'appeal', label: 'Appeal a decision' },
  { key: 'other', label: 'Other' },
];

export default function ReportProblemScreen() {
  const [type, setType] = useState<TicketType>('help');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  const submit = async () => {
    const local: Record<string, string> = {};
    if (!subject.trim()) local.subject = 'Add a short summary.';
    if (!message.trim()) local.message = 'Describe what happened.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const res = await accountApi.createTicket({ type, subject: subject.trim(), message: message.trim(), contact: contact.trim() || undefined });
      setSent(res.id);
    } catch (e) {
      const f = fieldErrors(e);
      if (Object.keys(f).length) setErrors(f);
      else Alert.alert('Could not send', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (sent !== null) {
    return (
      <Screen>
        <Header title="Report a problem" />
        <View style={[styles.done, contentWidth]}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={30} color={Colors.success} />
          </View>
          <Text style={styles.doneTitle}>Thanks — we got it</Text>
          <Text style={styles.doneText}>Your ticket number is #{sent}. We will reply in Help & support → My tickets.</Text>
          <Button label="View my tickets" onPress={() => go('/settings/help')} variant="secondary" />
          <Button label="Done" onPress={() => goBack('/settings')} variant="ghost" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Report a problem" />
      <FormScroll footer={<Button label="Send" onPress={submit} loading={busy} />}>
        <Text style={styles.lead}>Tell us about a bug, a wrong review decision, or anything else that went wrong.</Text>
        <View style={styles.field}>
          <FieldLabel>What is it about?</FieldLabel>
          <ChipGroup options={TYPES} selected={[type]} onToggle={setType} />
        </View>
        <TextField label="Summary" value={subject} onChangeText={setSubject} maxLength={150} error={errors.subject} />
        <TextField
          label="What happened?"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={3000}
          placeholder="What were you doing, and what did you expect?"
          error={errors.message}
        />
        <TextField
          label="Contact"
          optional
          value={contact}
          onChangeText={setContact}
          maxLength={120}
          placeholder="Email or phone, if different from your account"
          error={errors.contact}
        />
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { ...Type.body, color: Colors.muted },
  field: { gap: Spacing.sm },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ScreenPadding, gap: Spacing.md },
  doneIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.successTint, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { ...Type.title, color: Colors.ink },
  doneText: { ...Type.body, color: Colors.muted, textAlign: 'center', marginBottom: Spacing.sm },
});
