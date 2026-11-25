import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ApiError, competitionApi, errorMessage, fieldErrors } from '@/api';
import { Button, Card, ErrorState, FeatureOff, FormScroll, Header, Loading, Notice, Screen, TextField } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate, ordinal } from '@/lib/format';
import { goReplace } from '@/lib/nav';
import { useFeature, useSession } from '@/stores/session';
import { Colors, Spacing, Type } from '@/theme';

/** Winner submits delivery details: POST /rewards/claims/{id}/request. */
export default function ClaimRewardScreen() {
  const { claim: claimParam } = useLocalSearchParams<{ claim: string }>();
  const claimId = Number(Array.isArray(claimParam) ? claimParam[0] : claimParam);
  const enabled = useFeature('rewards');
  const me = useSession((s) => s.me);
  const q = useQuery(() => competitionApi.claim(claimId), [claimId], { enabled: enabled && !!claimId });
  const claim = q.data;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Prefill from a previous request or the guardian on file.
  useEffect(() => {
    if (!claim) return;
    setName((v) => v || claim.delivery.name || me?.student?.guardian_name || me?.student?.name || '');
    setPhone((v) => v || claim.delivery.phone || me?.student?.guardian_phone || '');
    setAddress((v) => v || claim.delivery.address || '');
  }, [claim, me]);

  const submit = async () => {
    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.delivery_name = 'Enter the name of the person receiving the reward.';
    if (!/^[6-9]\d{9}$/.test(phone.trim())) local.delivery_phone = 'Enter a valid 10-digit mobile number.';
    if (address.trim().length < 10) local.delivery_address = 'Enter the full delivery address with PIN code.';
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      await competitionApi.requestClaim(claimId, { delivery_name: name.trim(), delivery_phone: phone.trim(), delivery_address: address.trim() });
      goReplace(`/rewards/tracking?claim=${claimId}`);
    } catch (e) {
      setErrors(fieldErrors(e));
      if (e instanceof ApiError && (e.code === 'claim_not_available' || e.code === 'claim_expired')) {
        Alert.alert(e.code === 'claim_expired' ? 'Claim expired' : 'Already claimed', e.message, [
          { text: 'View status', onPress: () => goReplace(`/rewards/tracking?claim=${claimId}`) },
        ]);
      } else if (!(e instanceof ApiError && e.fields)) {
        Alert.alert('Could not submit claim', errorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const body = () => {
    if (!enabled) return <FeatureOff name="Rewards" />;
    if (q.loading) return <Loading />;
    if (q.error || !claim) return <ErrorState error={q.error} onRetry={q.reload} feature="Rewards" />;
    if (claim.status !== 'available') {
      return (
        <View style={styles.pad}>
          <Notice tone="info" title={claim.status_label} message="This reward has already been claimed or is closed." />
          <Button label="View claim status" onPress={() => goReplace(`/rewards/tracking?claim=${claimId}`)} style={styles.mt} />
        </View>
      );
    }
    return (
      <FormScroll footer={<Button label="Submit claim" icon="checkmark" onPress={submit} loading={busy} />}>
        <Card style={styles.summary}>
          <Text style={styles.place}>{ordinal(claim.rank)} place · {claim.season?.name ?? 'Season'}</Text>
          <Text style={styles.reward}>{claim.reward?.title ?? 'Your reward'}</Text>
          {claim.reward?.description ? <Text style={styles.desc}>{claim.reward.description}</Text> : null}
          {claim.claim_deadline ? <Text style={styles.deadline}>Claim by {formatDate(claim.claim_deadline)}</Text> : null}
        </Card>
        <Text style={styles.lead}>Ask a parent or guardian to fill in where the reward should be delivered.</Text>
        <TextField label="Receiver name" value={name} onChangeText={setName} error={errors.delivery_name} autoComplete="name" maxLength={120} />
        <TextField
          label="Receiver mobile"
          prefix="+91"
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          error={errors.delivery_phone}
          maxLength={10}
        />
        <TextField
          label="Delivery address"
          value={address}
          onChangeText={setAddress}
          multiline
          error={errors.delivery_address}
          placeholder="House, street, area, city, PIN code"
          maxLength={500}
        />
        <Notice icon="lock-closed-outline" message="These details are only visible to you and the ActiveSchool rewards team. They are never shown on your profile." />
      </FormScroll>
    );
  };

  return (
    <Screen>
      <Header title="Claim reward" />
      {body()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: Spacing.lg },
  mt: { marginTop: Spacing.md },
  summary: { gap: Spacing.xs, backgroundColor: Colors.accentTint, borderColor: Colors.accent },
  place: { ...Type.caption, fontWeight: '600', color: Colors.warning },
  reward: { ...Type.heading, color: Colors.ink },
  desc: { ...Type.small, color: Colors.body },
  deadline: { ...Type.caption, color: Colors.muted, marginTop: Spacing.xs },
  lead: { ...Type.body, color: Colors.muted },
});
