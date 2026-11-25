import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { errorMessage, goalsApi } from '@/api';
import { Button, Card, CardSkeleton, ErrorState, FeatureOff, Header, IconButton, InfoRow, ListRow, Notice, Pill, Screen, Section, contentWidth } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate } from '@/lib/format';
import { iconName } from '@/lib/icons';
import { go, goBack } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, ScreenPadding, Spacing, Type, safeColour, tint } from '@/theme';

function Ring({ value, colour, size = 132, stroke = 10 }: { value: number; colour: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.surfaceAlt} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colour}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - v)}
        strokeLinecap="round"
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

/** Goal progress: GET /goals/{id}; pause/resume (PATCH status), edit, delete. */
export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const enabled = useFeature('goals');
  const q = useQuery(() => goalsApi.get(goalId), [goalId], { enabled: enabled && !!goalId, refetchOnFocus: true });
  const [busy, setBusy] = useState(false);
  const g = q.data;

  const togglePause = async () => {
    if (!g) return;
    setBusy(true);
    try {
      const updated = await goalsApi.update(g.id, { status: g.status === 'paused' ? 'active' : 'paused' });
      q.setData((prev) => (prev ? { ...prev, ...updated, activities: prev.activities } : updated));
    } catch (e) {
      Alert.alert('Could not update goal', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!g) return;
    Alert.alert('Delete this goal?', 'Your activities are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await goalsApi.remove(g.id);
            goBack('/goals');
          } catch (e) {
            Alert.alert('Could not delete goal', errorMessage(e));
          }
        },
      },
    ]);
  };

  const colour = safeColour(g?.colour);
  const paused = g?.status === 'paused';

  return (
    <Screen>
      <Header
        title={g?.title ?? 'Goal'}
        right={g ? <IconButton icon="create-outline" label="Edit goal" onPress={() => go(`/goals/create-new?id=${g.id}`)} /> : null}
      />
      {!enabled ? (
        <FeatureOff name="Goals" />
      ) : q.loading ? (
        <CardSkeleton count={2} height={180} />
      ) : !g ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Goals" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, contentWidth]}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
          <Card style={styles.hero}>
            <View style={styles.ring} accessible accessibilityLabel={`${g.progress} of ${g.target} done ${g.period_label.toLowerCase()}`}>
              <Ring value={g.target ? g.progress / g.target : 0} colour={paused ? Colors.subtle : g.achieved ? Colors.success : colour} />
              <View style={styles.ringCenter}>
                <Text style={styles.ringValue}>
                  {g.progress}/{g.target}
                </Text>
                <Text style={styles.muted}>{g.period_label}</Text>
              </View>
            </View>
            <View style={styles.titleRow}>
              <View style={[styles.icon, { backgroundColor: tint(colour, 0.14) }]}>
                <Ionicons name={iconName(g.icon, 'flag')} size={18} color={colour} />
              </View>
              <Text style={styles.title}>{g.title}</Text>
            </View>
            {g.description ? <Text style={styles.body}>{g.description}</Text> : null}
            <View style={styles.pills}>
              {g.achieved ? <Pill label="Achieved" tone="success" icon="checkmark-circle" /> : null}
              {paused ? <Pill label="Paused" tone="neutral" icon="pause" /> : <Pill label="Active" tone="info" />}
              {g.category ? <Pill label={g.category.name} colour={g.category.colour} /> : null}
            </View>
          </Card>

          {g.achieved ? <Notice tone="success" message="Goal reached for this period. Nice work — keep it going!" /> : null}

          <Card>
            <InfoRow label="Period" value={`${formatDate(g.period_starts, false)} – ${formatDate(g.period_ends, false)}`} icon="calendar-outline" />
            <InfoRow label="Deadline" value={g.deadline ? formatDate(g.deadline) : null} icon="alarm-outline" />
            <InfoRow label="Reminder" value={g.reminder ? 'On' : 'Off'} icon="notifications-outline" last />
          </Card>

          <Section title="Counted this period">
            {g.activities?.length ? (
              g.activities.map((a, i) => (
                <ListRow
                  key={a.id}
                  title={a.title}
                  subtitle={formatDate(a.occurred_on)}
                  icon="checkmark-circle-outline"
                  iconColour={Colors.success}
                  onPress={() => go(`/submissions/${a.id}`)}
                  last={i === (g.activities?.length ?? 0) - 1}
                />
              ))
            ) : (
              <ListRow title="Nothing yet" subtitle="Approved activities in this period count towards your goal." last />
            )}
          </Section>

          <Text style={styles.note}>Personal goals never earn leaderboard points.</Text>

          <View style={styles.actions}>
            <Button label={paused ? 'Resume goal' : 'Pause goal'} icon={paused ? 'play' : 'pause'} variant="secondary" onPress={togglePause} loading={busy} />
            <Button label="Delete goal" variant="ghost" onPress={remove} />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', gap: Spacing.md },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringValue: { ...Type.display, color: Colors.ink },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { ...Type.heading, color: Colors.ink, flexShrink: 1 },
  body: { ...Type.body, color: Colors.body, textAlign: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, justifyContent: 'center' },
  muted: { ...Type.caption, color: Colors.muted },
  note: { ...Type.caption, color: Colors.muted, textAlign: 'center' },
  actions: { gap: Spacing.sm },
});
