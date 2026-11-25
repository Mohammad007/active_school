import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { competitionApi } from '@/api';
import { claimTone } from '@/components/competition/claimStatus';
import { Button, Card, contentWidth, ErrorState, FeatureOff, Header, InfoRow, Loading, Notice, Pill, Screen, Steps } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate, formatDateTime, ordinal } from '@/lib/format';
import { go } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';

/** Claim timeline: GET /rewards/claims/{id}. */
export default function RewardTrackingScreen() {
  const { claim: claimParam } = useLocalSearchParams<{ claim: string }>();
  const claimId = Number(Array.isArray(claimParam) ? claimParam[0] : claimParam);
  const enabled = useFeature('rewards');
  const q = useQuery(() => competitionApi.claim(claimId), [claimId], { enabled: enabled && !!claimId, refetchOnFocus: true });
  const c = q.data;

  const body = () => {
    if (!enabled) return <FeatureOff name="Rewards" />;
    if (q.loading) return <Loading />;
    if (q.error || !c) return <ErrorState error={q.error} onRetry={q.reload} feature="Rewards" />;
    const failed = c.status === 'rejected' || c.status === 'expired';
    const t = claimTone(c.status);
    const STAGE_KEYS = ['requested', 'under_review', 'approved', 'prepared', 'dispatched', 'completed'];
    // stage_index is -1 for available / rejected / expired: mark the stage after the last one reached as failed.
    const lastReached = Math.max(-1, ...c.history.map((h) => STAGE_KEYS.indexOf(h.status)));
    const current = failed ? Math.min(lastReached + 1, c.stages.length - 1) : Math.max(0, c.stage_index);
    const historyFor = (i: number) => {
      const key = STAGE_KEYS[i];
      const h = [...c.history].reverse().find((x) => x.status === key);
      return h ? [formatDateTime(h.at), h.note].filter(Boolean).join(' · ') : null;
    };

    return (
      <ScrollView
        contentContainerStyle={[contentWidth, styles.content]}
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
        <Card style={styles.head}>
          <View style={styles.headRow}>
            <View style={styles.flex}>
              <Text style={styles.place}>
                {ordinal(c.rank)} place · {c.season?.name ?? 'Season'}
              </Text>
              <Text style={styles.title}>{c.reward?.title ?? 'Reward'}</Text>
            </View>
            <Pill label={c.status_label} tone={t.tone} icon={t.icon} />
          </View>
          {c.delivery_reference ? <InfoRow label="Delivery ref." value={c.delivery_reference} last /> : null}
        </Card>

        {c.status === 'available' ? (
          <>
            <Notice tone="warning" message={`You have not claimed this reward yet${c.claim_deadline ? `. Claim by ${formatDate(c.claim_deadline)}` : ''}.`} />
            <Button label="Claim reward" icon="gift-outline" onPress={() => go(`/rewards/claim?claim=${c.id}`)} />
          </>
        ) : null}
        {failed ? (
          <Notice
            tone="danger"
            title={c.status_label}
            message={c.status === 'expired' ? 'The claim deadline passed. Contact support if you think this is a mistake.' : 'This claim was not approved. Contact support for details.'}
          />
        ) : null}

        {c.status !== 'available' ? (
          <Card>
            <Text style={styles.section}>Progress</Text>
            <Steps
              steps={c.stages.map((s, i) => ({ title: s, caption: historyFor(i) }))}
              current={current}
              failed={failed}
            />
          </Card>
        ) : null}

        {c.delivery.name || c.delivery.address ? (
          <Card>
            <Text style={styles.section}>Delivery details</Text>
            <InfoRow label="Name" value={c.delivery.name} />
            <InfoRow label="Mobile" value={c.delivery.phone} />
            <InfoRow label="Address" value={c.delivery.address} last />
            <Text style={styles.private}>Only you and the rewards team can see this.</Text>
          </Card>
        ) : null}

        {c.history.length ? (
          <Card>
            <Text style={styles.section}>History</Text>
            {[...c.history].reverse().map((h, i) => (
              <View key={`${h.status}-${h.at}-${i}`} style={styles.hist}>
                <Text style={styles.histTitle}>{h.note || h.status.replace(/_/g, ' ')}</Text>
                <Text style={styles.histDate}>{formatDateTime(h.at)}</Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <Screen>
      <Header title="Reward status" />
      {body()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.xxl },
  head: { gap: Spacing.sm },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  place: { ...Type.caption, fontWeight: '600', color: Colors.muted },
  title: { ...Type.heading, color: Colors.ink, marginTop: 2 },
  section: { ...Type.subheading, color: Colors.ink, marginBottom: Spacing.md },
  private: { ...Type.caption, color: Colors.muted, marginTop: Spacing.sm },
  hist: { paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  histTitle: { ...Type.body, color: Colors.ink, textTransform: 'capitalize' },
  histDate: { ...Type.caption, color: Colors.muted, marginTop: 2 },
});
