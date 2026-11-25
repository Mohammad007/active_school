import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { achievementsApi } from '@/api';
import { BadgeIcon } from '@/components/profile/BadgeIcon';
import { Button, Card, contentWidth, ErrorState, FeatureOff, Header, ListRow, Loading, Notice, Pill, Screen, Section } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate } from '@/lib/format';
import { go, openUrl } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';

export default function AchievementDetailScreen() {
  const params = useLocalSearchParams<{ achievementId: string }>();
  const id = Array.isArray(params.achievementId) ? params.achievementId[0] : params.achievementId;
  const enabled = useFeature('portfolio');
  const q = useQuery(() => achievementsApi.get(id!), [id], { enabled: enabled && !!id });
  const b = q.data;

  const body = () => {
    if (!enabled) return <FeatureOff name="Achievements" />;
    if (q.loading) return <Loading />;
    if (q.error || !b) return <ErrorState error={q.error} onRetry={q.reload} feature="Achievements" />;
    return (
      <ScrollView
        contentContainerStyle={[contentWidth, styles.content]}
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
        <View style={styles.hero}>
          <Animated.View entering={ZoomIn.duration(300)}>
            <BadgeIcon icon={b.icon} colour={b.colour} size={112} locked={!b.earned} />
          </Animated.View>
          <Text style={styles.name} accessibilityRole="header">
            {b.name}
          </Text>
          {b.earned ? (
            <Pill label={b.earned_at ? `Earned ${formatDate(b.earned_at)}` : 'Earned'} tone="success" icon="checkmark-circle" />
          ) : (
            <Pill label="Not earned yet" tone="neutral" icon="lock-closed" />
          )}
          {b.description ? <Text style={styles.desc}>{b.description}</Text> : null}
        </View>

        {!b.earned ? (
          <Notice message="Earn this badge by completing the matching challenge or getting qualifying activities verified." />
        ) : null}

        {b.certificate_code ? (
          <Card style={styles.cert}>
            <Text style={styles.certLabel}>Certificate code</Text>
            <Text style={styles.certCode} selectable accessibilityLabel={`Certificate code ${b.certificate_code.split('').join(' ')}`}>
              {b.certificate_code}
            </Text>
            <Text style={styles.certHint}>Anyone can check this certificate on the ActiveSchool website with this code.</Text>
            {b.verify_url ? <Button label="Verify certificate" icon="shield-checkmark-outline" variant="secondary" onPress={() => openUrl(b.verify_url)} /> : null}
          </Card>
        ) : null}

        {b.activity || b.challenge ? (
          <Section title="Earned for">
            {b.activity ? (
              <ListRow icon="images-outline" title={b.activity.title} subtitle="Activity" onPress={() => go(`/submissions/${b.activity!.id}`)} last={!b.challenge} />
            ) : null}
            {b.challenge ? <ListRow icon="flag-outline" title={b.challenge.title} subtitle="Challenge" onPress={() => go(`/challenges/${b.challenge!.id}`)} last /> : null}
          </Section>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <Screen>
      <Header title="Achievement" />
      {body()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  name: { ...Type.title, color: Colors.ink, textAlign: 'center', marginTop: Spacing.sm },
  desc: { ...Type.bodyLg, color: Colors.body, textAlign: 'center', maxWidth: 420 },
  cert: { gap: Spacing.sm },
  certLabel: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  certCode: {
    ...Type.heading,
    color: Colors.primary,
    letterSpacing: 1.5,
    backgroundColor: Colors.primaryTint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    textAlign: 'center',
    overflow: 'hidden',
  },
  certHint: { ...Type.small, color: Colors.muted },
});
