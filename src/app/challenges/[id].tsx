import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { challengesApi, errorMessage } from '@/api';
import { ArtHero } from '@/components/modules/ArtHero';
import { challengeState } from '@/components/modules/ChallengeCard';
import { startLinkedDraft } from '@/components/modules/draft';
import {
  Button,
  Card,
  CardSkeleton,
  ErrorState,
  FeatureOff,
  Header,
  InfoRow,
  ListRow,
  Pill,
  ProgressBar,
  Screen,
  Section,
  contentWidth,
  submissionLabel,
  submissionTone,
} from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate, plural, stripHtml } from '@/lib/format';
import { artFor } from '@/lib/art';
import { iconName } from '@/lib/icons';
import { go } from '@/lib/nav';
import { useFeature } from '@/stores/session';
import { Colors, Radius, ScreenPadding, Spacing, Type, safeColour, tint } from '@/theme';

/** Challenge detail: GET /challenges/{id}, join / leave, submit an activity to it. */
export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useFeature('challenges');
  const q = useQuery(() => challengesApi.get(id), [id], { enabled: enabled && !!id, refetchOnFocus: true });
  const [busy, setBusy] = useState(false);
  const c = q.data;

  const join = async () => {
    if (!c) return;
    setBusy(true);
    try {
      const updated = await challengesApi.join(c.id);
      q.setData((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (e) {
      Alert.alert('Could not join', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const leave = () => {
    if (!c) return;
    Alert.alert('Leave this challenge?', 'Your progress will stop counting. You can join again while it is running.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await challengesApi.leave(c.id);
            q.setData((prev) => (prev ? { ...prev, joined: false, progress: 0, participants: Math.max(0, prev.participants - 1) } : prev));
          } catch (e) {
            Alert.alert('Could not leave', errorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const submit = () => {
    if (!c) return;
    startLinkedDraft({ challenge: { id: c.id, title: c.title }, categoryId: c.category?.id ?? null });
  };

  if (!enabled) {
    return (
      <Screen>
        <Header title="Challenge" />
        <FeatureOff name="Challenges" />
      </Screen>
    );
  }

  const colour = safeColour(c?.category?.colour);
  const state = c ? challengeState(c) : null;
  const instructions = stripHtml(c?.instructions);

  return (
    <Screen>
      <Header title={c?.title ?? 'Challenge'} />
      {q.loading ? (
        <CardSkeleton count={2} height={180} />
      ) : !c ? (
        <ErrorState error={q.error} onRetry={q.reload} feature="Challenges" />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, contentWidth]}
          refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
          {c.image_url ? (
            <Image source={{ uri: c.image_url }} style={styles.hero} contentFit="cover" transition={150} accessibilityLabel={c.title} />
          ) : (
            <ArtHero art={artFor(c.category?.slug, c.title)} colour={colour} icon={c.category?.icon ?? c.category?.slug} label={c.title} />
          )}

          <View style={styles.titleBlock}>
            <View style={styles.pills}>
              {state ? <Pill label={state.label} tone={state.tone} /> : null}
              {c.joined && !c.completed ? <Pill label="Joined" tone="info" icon="checkmark" /> : null}
              {c.category ? <Pill label={c.category.name} colour={c.category.colour} /> : null}
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {c.title}
            </Text>
            {c.description ? <Text style={styles.body}>{c.description}</Text> : null}
          </View>

          {c.joined ? (
            <Card style={styles.gap}>
              <Text style={styles.cardTitle}>{c.completed ? 'Challenge complete' : 'Your progress'}</Text>
              <ProgressBar value={c.target ? c.progress / c.target : 0} colour={c.completed ? Colors.success : Colors.primary} height={8} />
              <Text style={styles.muted}>
                {c.progress} of {plural(c.target, 'approved activity', 'approved activities')}
                {c.completed && c.badge ? ` · ${c.badge.name} badge earned` : ''}
              </Text>
            </Card>
          ) : null}

          <Card>
            <InfoRow label="Starts" value={formatDate(c.starts_at)} icon="play-outline" />
            <InfoRow label="Ends" value={formatDate(c.ends_at)} icon="flag-outline" />
            <InfoRow label="Goal" value={plural(c.target, 'approved activity', 'approved activities')} icon="checkmark-done-outline" />
            <InfoRow label="Participants" value={String(c.participants)} icon="people-outline" last={!c.badge} />
            {c.badge ? (
              <View style={styles.badgeRow}>
                <View style={[styles.badgeIcon, { backgroundColor: tint(safeColour(c.badge.colour), 0.14) }]}>
                  <Ionicons name={iconName(c.badge.icon)} size={18} color={safeColour(c.badge.colour)} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{c.badge.name}</Text>
                  <Text style={styles.muted}>Badge for completing this challenge. Challenges award badges, not leaderboard points.</Text>
                </View>
              </View>
            ) : null}
          </Card>

          {instructions ? (
            <Card style={styles.gap}>
              <Text style={styles.cardTitle}>How to take part</Text>
              <Text style={styles.body}>{instructions}</Text>
            </Card>
          ) : null}

          {c.my_submissions.length ? (
            <Section title="Your submissions">
              {c.my_submissions.map((s, i) => {
                const tone = submissionTone(s.content_status);
                return (
                  <ListRow
                    key={s.id}
                    title={s.title}
                    subtitle={s.submitted_at ? `Submitted ${formatDate(s.submitted_at)}` : 'Not submitted yet'}
                    right={<Pill label={submissionLabel(s.content_status, undefined)} tone={tone.tone} icon={tone.icon} />}
                    onPress={() => go(`/submissions/${s.id}`)}
                    last={i === c.my_submissions.length - 1}
                  />
                );
              })}
            </Section>
          ) : null}

          <View style={styles.actions}>
            {!c.joined ? (
              c.state !== 'ended' ? (
                <Button label="Join challenge" icon="add-circle-outline" onPress={join} loading={busy} />
              ) : (
                <Text style={[styles.muted, styles.center]}>This challenge has ended.</Text>
              )
            ) : (
              <>
                {c.state === 'ongoing' && !c.completed ? <Button label="Submit an activity" icon="camera-outline" onPress={submit} /> : null}
                {c.state === 'upcoming' ? <Text style={[styles.muted, styles.center]}>You can submit activities once the challenge starts.</Text> : null}
                {!c.completed && c.state !== 'ended' ? <Button label="Leave challenge" variant="ghost" onPress={leave} loading={busy} /> : null}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: ScreenPadding, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.lg, backgroundColor: Colors.skeleton },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  titleBlock: { gap: Spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  title: { ...Type.title, color: Colors.ink },
  body: { ...Type.body, color: Colors.body },
  gap: { gap: Spacing.sm },
  cardTitle: { ...Type.subheading, color: Colors.ink },
  muted: { ...Type.small, color: Colors.muted },
  center: { textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.md, alignItems: 'flex-start' },
  badgeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: Spacing.sm },
});
