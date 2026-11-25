import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { competitionApi } from '@/api';
import { claimTone } from '@/components/competition/claimStatus';
import { MEDALS } from '@/components/competition/Podium';
import { TrophyHero } from '@/components/competition/TrophyHero';
import {
  Button,
  Card,
  CardSkeleton,
  contentWidth,
  EmptyState,
  ErrorState,
  FeatureOff,
  Header,
  Notice,
  Pill,
  Screen,
  Touchable,
} from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate, ordinal } from '@/lib/format';
import { go } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { RewardClaim, RewardItem } from '@/types';

export default function RewardsScreen() {
  const enabled = useFeature('rewards');
  const q = useQuery(() => competitionApi.rewards(), [], { enabled, refetchOnFocus: true });
  const data = q.data;

  const body = () => {
    if (!enabled) return <FeatureOff name="Rewards" />;
    if (q.loading) return <CardSkeleton count={4} height={96} />;
    if (q.error && !data) return <ErrorState error={q.error} onRetry={q.reload} feature="Rewards" />;
    if (!data) return null;
    const available = data.claims.filter((c) => c.status === 'available');
    return (
      <ScrollView
        contentContainerStyle={[contentWidth, styles.content]}
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}>
        {data.season ? (
          <View style={styles.season}>
            <View style={styles.flex}>
              <Text style={styles.seasonName}>{data.season.name}</Text>
              <Text style={styles.seasonDates}>
                {formatDate(data.season.starts_on, false)} – {formatDate(data.season.ends_on)}
              </Text>
            </View>
            <Pill label={data.season.status_label} tone={data.season.status === 'finalized' ? 'success' : 'info'} />
          </View>
        ) : null}

        {available.map((c) => (
          <Card key={c.id} style={styles.winner}>
            <View style={styles.winnerRow}>
              <Ionicons name="trophy" size={22} color={Colors.gold} />
              <View style={styles.flex}>
                <Text style={styles.winnerTitle}>You placed {ordinal(c.rank)}!</Text>
                <Text style={styles.winnerSub}>
                  {c.reward?.title ?? 'Your reward'}
                  {c.claim_deadline ? ` · claim by ${formatDate(c.claim_deadline)}` : ''}
                </Text>
              </View>
            </View>
            <Button label="Claim reward" icon="gift-outline" onPress={() => go(`/rewards/claim?claim=${c.id}`)} />
          </Card>
        ))}

        <TrophyHero title="Top 3 students each season win exciting rewards!" subtitle="Share verified activities, climb your class leaderboard and win." />

        <Text style={styles.section}>Top 3 rewards</Text>
        {data.items.length ? (
          data.items.map((item) => <RewardCard key={item.id} item={item} />)
        ) : (
          <EmptyState art="basketball" title="No rewards announced" message="Rewards for this season will appear here once they are configured." compact />
        )}
        <Notice message="Ranks 1, 2 and 3 on the final season leaderboard win. Appreciations never affect your rank." />

        {data.claims.length ? (
          <>
            <Text style={styles.section}>My claims</Text>
            <Card style={styles.claims}>
              {data.claims.map((c, i) => (
                <ClaimRow key={c.id} claim={c} last={i === data.claims.length - 1} />
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <Screen>
      <Header title="Rewards" />
      {body()}
    </Screen>
  );
}

function RewardCard({ item }: { item: RewardItem }) {
  const m = MEDALS[(item.rank as 1 | 2 | 3)] ?? MEDALS[3];
  return (
    <Card style={styles.reward}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.rewardImage} contentFit="cover" transition={150} accessibilityLabel={item.title} />
      ) : (
        <View style={[styles.rewardImage, styles.rewardPlaceholder, { backgroundColor: m.tint }]}>
          <Ionicons name="gift" size={26} color={m.colour} />
        </View>
      )}
      <View style={styles.flex}>
        <View style={styles.rankRow}>
          <View style={[styles.rankBadge, { backgroundColor: m.colour }]}>
            <Text style={styles.rankText}>{ordinal(item.rank)}</Text>
          </View>
          {item.status === 'announcing_soon' ? <Pill label="Announcing soon" tone="neutral" /> : <Pill label="Announced" tone="success" />}
        </View>
        <Text style={styles.rewardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.rewardDesc} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function ClaimRow({ claim, last }: { claim: RewardClaim; last: boolean }) {
  const t = claimTone(claim.status);
  return (
    <Touchable
      onPress={() => go(claim.status === 'available' ? `/rewards/claim?claim=${claim.id}` : `/rewards/tracking?claim=${claim.id}`)}
      scaleTo={0.99}
      accessibilityLabel={`${claim.reward?.title ?? 'Reward'}, ${claim.status_label}`}
      style={[styles.claim, !last && styles.claimBorder]}>
      <View style={styles.flex}>
        <Text style={styles.claimTitle} numberOfLines={1}>
          {claim.reward?.title ?? `${ordinal(claim.rank)} place reward`}
        </Text>
        <Text style={styles.claimSub}>{[claim.season?.name, `${ordinal(claim.rank)} place`].filter(Boolean).join(' · ')}</Text>
      </View>
      <Pill label={claim.status_label} tone={t.tone} icon={t.icon} />
      <Ionicons name="chevron-forward" size={18} color={Colors.subtle} />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.xxl },
  season: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  seasonName: { ...Type.heading, color: Colors.ink },
  seasonDates: { ...Type.caption, color: Colors.muted, marginTop: 2 },
  winner: { gap: Spacing.md, borderColor: Colors.accent, backgroundColor: Colors.accentTint },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  winnerTitle: { ...Type.subheading, color: Colors.ink },
  winnerSub: { ...Type.small, color: Colors.body, marginTop: 2 },
  section: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.sm },
  reward: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  rewardImage: { width: 76, height: 76, borderRadius: Radius.md, backgroundColor: Colors.skeleton },
  rewardPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  rankBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  rankText: { ...Type.micro, color: Colors.white, fontWeight: '700' },
  rewardTitle: { ...Type.subheading, color: Colors.ink },
  rewardDesc: { ...Type.small, color: Colors.muted, marginTop: 2 },
  claims: { padding: 0 },
  claim: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 60, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  claimBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  claimTitle: { ...Type.body, fontWeight: '600', color: Colors.ink },
  claimSub: { ...Type.caption, color: Colors.muted, marginTop: 1 },
});
