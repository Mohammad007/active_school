import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage, socialApi } from '@/api';
import { useSession } from '@/stores/session';
import { Colors, Spacing, Type } from '@/theme';
import type { ReportType } from '@/types';

import { Button } from './Button';
import { ChipGroup } from './Chips';
import { Sheet } from './Sheet';
import { TextField } from './TextField';

const FALLBACK_REASONS: Record<string, string> = {
  bullying: 'Bullying or harassment',
  inappropriate: 'Inappropriate content',
  privacy: 'Privacy exposure',
  false_achievement: 'False achievement',
  spam: 'Spam',
  other: 'Other',
};

/** Report a post, comment or student (POST /reports). Reasons come from GET /config. */
export function ReportSheet({
  visible,
  onClose,
  type,
  targetId,
  title = 'Report',
}: {
  visible: boolean;
  onClose: () => void;
  type: ReportType;
  targetId?: number | null;
  title?: string;
}) {
  const reasons = useSession((s) => s.config?.report_reasons) ?? FALLBACK_REASONS;
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setReason(null);
    setDetails('');
    onClose();
  };

  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await socialApi.report({ type, id: targetId ?? null, reason, details: details.trim() || undefined });
      close();
      Alert.alert('Thanks for telling us', 'A reviewer will look at this. The person you reported is not told who reported them.');
    } catch (e) {
      Alert.alert('Could not send report', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} title={title}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Text style={styles.lead}>Why are you reporting this?</Text>
        <ChipGroup
          options={Object.entries(reasons).map(([key, label]) => ({ key, label }))}
          selected={reason ? [reason] : []}
          onToggle={(k) => setReason(k)}
        />
        <TextField label="Details" optional placeholder="Anything that helps a reviewer" value={details} onChangeText={setDetails} multiline maxLength={1000} />
        <View style={styles.actions}>
          <Button label="Send report" onPress={submit} loading={busy} disabled={!reason} variant="primary" />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.md, paddingBottom: Spacing.sm },
  lead: { ...Type.body, color: Colors.muted },
  actions: { marginTop: Spacing.xs },
});
