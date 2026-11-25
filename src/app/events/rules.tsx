import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { competitionApi } from '@/api';
import { useEvent } from '@/components/modules/EventCard';
import { Card, CardSkeleton, ErrorState, FeatureOff, Header, Screen, contentWidth } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { stripHtml } from '@/lib/format';
import { useFeature, useSession } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';
import type { ActivityResult } from '@/types';

const RESULT_ORDER: ActivityResult[] = ['first', 'second', 'third', 'participation'];

/** Event rules (GET /events/{id} → rules) + scoring for its level + general notes (GET /scoring-rules). */
export default function EventRulesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('events');
  const results = useSession((s) => s.config?.results);
  const q = useEvent(enabled ? id : undefined);
  const rules = useQuery(() => competitionApi.rules(), [], { enabled });
  const e = q.data;
  const text = stripHtml(e?.rules);
  const levelPoints = e ? RESULT_ORDER.filter((r) => e.points?.[r] !== undefined) : [];

  return (
    <Screen>
      <Header title="Rules & scoring" subtitle={e?.title} />
      {!enabled ? (
        <FeatureOff name="Events" />
      ) : q.loading ? (
        <CardSkeleton count={3} height={120} />
      ) : !e ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Events" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, contentWidth]}
          refreshControl={
            <RefreshControl
              refreshing={q.refreshing}
              onRefresh={() => {
                q.refresh();
                rules.reload();
              }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }>
          <Card style={styles.gap}>
            <Text style={styles.cardTitle}>Event rules</Text>
            <Text style={styles.body}>{text || 'The organiser has not published specific rules for this event. General ActiveSchool rules apply.'}</Text>
          </Card>

          {levelPoints.length ? (
            <Card style={styles.gap}>
              <Text style={styles.cardTitle}>Points at {e.level_label} level</Text>
              {levelPoints.map((r, i) => (
                <View key={r} style={[styles.row, i < levelPoints.length - 1 && styles.rowBorder]}>
                  <Text style={styles.rowLabel}>{results?.[r] ?? r}</Text>
                  <Text style={styles.rowValue}>{e.points[r]} pts</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {rules.data?.notes?.length ? (
            <Card style={styles.gap}>
              <Text style={styles.cardTitle}>How scoring works</Text>
              {rules.data.notes.map((n) => (
                <View key={n} style={styles.note}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.noteIcon} />
                  <Text style={styles.noteText}>{n}</Text>
                </View>
              ))}
              {rules.data.eligibility ? <Text style={styles.muted}>Leaderboard eligibility: {rules.data.eligibility}</Text> : null}
            </Card>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  gap: { gap: Spacing.sm },
  cardTitle: { ...Type.subheading, color: Colors.ink },
  body: { ...Type.body, color: Colors.body },
  muted: { ...Type.small, color: Colors.muted, marginTop: Spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm + 2 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.hairline },
  rowLabel: { ...Type.body, color: Colors.body },
  rowValue: { ...Type.body, fontWeight: '600', color: Colors.primary },
  note: { flexDirection: 'row', gap: Spacing.sm },
  noteIcon: { marginTop: 2 },
  noteText: { ...Type.small, color: Colors.body, flex: 1 },
});
