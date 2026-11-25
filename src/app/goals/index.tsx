import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { goalsApi } from '@/api';
import { GoalCard } from '@/components/modules/GoalCard';
import { Button, CardSkeleton, EmptyState, ErrorState, FeatureOff, Header, IconButton, Screen, contentWidth } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { go } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';
import type { Goal } from '@/types';

/** Personal goals: GET /goals, grouped active / achieved / paused. */
export default function GoalsScreen() {
  const enabled = useFeature('goals');
  const q = useQuery(() => goalsApi.list(), [], { enabled, refetchOnFocus: true });
  const goals = q.data ?? [];

  const groups: { title: string; data: Goal[] }[] = [
    { title: 'In progress', data: goals.filter((g) => g.status !== 'paused' && !g.achieved) },
    { title: 'Achieved this period', data: goals.filter((g) => g.status !== 'paused' && g.achieved) },
    { title: 'Paused', data: goals.filter((g) => g.status === 'paused') },
  ].filter((s) => s.data.length);

  return (
    <Screen>
      <Header
        title="My goals"
        right={enabled ? <IconButton icon="add" label="New goal" onPress={() => go('/goals/create-new')} color={Colors.primary} /> : null}
      />
      {!enabled ? (
        <FeatureOff name="Goals" />
      ) : q.loading ? (
        <CardSkeleton count={4} height={96} />
      ) : q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Goals" />
      ) : (
        <SectionList
          sections={groups}
          keyExtractor={(g) => String(g.id)}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.content, contentWidth]}
          renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <GoalCard goal={item} />
            </View>
          )}
          ListHeaderComponent={<Text style={styles.note}>Goals are personal. Progress counts your approved activities and never earns leaderboard points.</Text>}
          ListEmptyComponent={
            <EmptyState
              art="yoga"
              title="Set your first goal"
              message="For example: two sports activities this week, or try a new category this month."
              actionLabel="Create a goal"
              onAction={() => go('/goals/create-new')}
            />
          }
          ListFooterComponent={goals.length ? <Button label="New goal" icon="add" variant="secondary" onPress={() => go('/goals/create-new')} style={styles.footer} /> : undefined}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, paddingBottom: Spacing.xxl },
  note: { ...Type.small, color: Colors.muted, marginBottom: Spacing.sm },
  section: { ...Type.caption, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  item: { marginBottom: Spacing.md },
  footer: { marginTop: Spacing.md },
});
