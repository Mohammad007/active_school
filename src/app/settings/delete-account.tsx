import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { accountApi, errorMessage, fieldErrors } from '@/api';
import { Button, Card, FormScroll, Header, Screen, TextField } from '@/components/ui';
import { goReplace } from '@/lib/nav';
import { useSession } from '@/stores/session';
import { Colors, Spacing, Type } from '@/theme';

const CONSEQUENCES: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'log-out-outline', text: 'You are signed out on every device straight away and can no longer use this account.' },
  { icon: 'images-outline', text: 'Your posts, drafts and submissions are taken down from the class feed.' },
  { icon: 'trophy-outline', text: 'You leave the leaderboard and can’t claim rewards. Points history is kept only as the school’s record.' },
  { icon: 'archive-outline', text: 'Some records are kept for a period required by school policy, then deleted.' },
];

export default function DeleteAccountScreen() {
  const signOut = useSession((s) => s.signOut);
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armed = confirm === 'DELETE';

  const submit = () => {
    if (!armed) return;
    Alert.alert('Delete your account?', 'This cannot be undone from the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setError(null);
          try {
            await accountApi.deleteAccount(reason.trim() || undefined);
            await signOut({ remote: false });
            goReplace('/welcome');
            Alert.alert('Account deletion requested', 'Your account has been closed. Contact support if this was a mistake.');
          } catch (e) {
            const f = fieldErrors(e);
            setError(f.reason ?? f.confirm ?? errorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title="Delete account" />
      <FormScroll footer={<Button label="Delete my account" variant="danger" onPress={submit} disabled={!armed} loading={busy} icon="trash-outline" />}>
        <Card style={styles.card}>
          <Text style={styles.title}>What happens when you delete</Text>
          {CONSEQUENCES.map((c) => (
            <View key={c.icon} style={styles.item}>
              <Ionicons name={c.icon} size={18} color={Colors.danger} style={styles.itemIcon} />
              <Text style={styles.itemText}>{c.text}</Text>
            </View>
          ))}
        </Card>
        <TextField
          label="Why are you leaving?"
          optional
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={300}
          hint={`${reason.length}/300`}
        />
        <TextField
          label="Type DELETE to confirm"
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="DELETE"
          error={error}
        />
      </FormScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  title: { ...Type.subheading, color: Colors.ink },
  item: { flexDirection: 'row', gap: Spacing.md },
  itemIcon: { marginTop: 1 },
  itemText: { ...Type.body, color: Colors.body, flex: 1 },
});
