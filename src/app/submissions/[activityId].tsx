import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activitiesApi, errorMessage } from '@/api';
import { PhotoCarousel } from '@/components/social/PhotoCarousel';
import {
  Button,
  Card,
  contentWidth,
  ErrorState,
  Header,
  InfoRow,
  ListRow,
  Notice,
  Pill,
  Screen,
  Section,
  Skeleton,
  Steps,
  submissionLabel,
  submissionTone,
  Touchable,
} from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate, formatDateTime } from '@/lib/format';
import { go, goBack, openUrl } from '@/lib/nav';
import { useDraftStore } from '@/stores/draftStore';
import { Colors, Radius, ScreenPadding, Spacing, Type } from '@/theme';
import type { Activity } from '@/types';

function timeline(a: Activity) {
  const s = a.content_status;
  const steps = [
    { title: 'Draft saved', caption: s === 'draft' ? 'Only you can see this. Submit it when ready.' : null },
    {
      title: s === 'changes_requested' ? 'Changes requested' : s === 'rejected' ? 'Not approved' : 'Submitted for review',
      caption: a.submitted_at ? formatDateTime(a.submitted_at) : null,
    },
    {
      title: s === 'hidden' || s === 'removed' ? 'Taken down' : 'Published to your class',
      caption: s === 'approved' && a.published_at ? formatDateTime(a.published_at) : null,
    },
    {
      title: a.verified ? `Verified · ${a.points ?? 0} points credited` : 'Achievement verified',
      caption: a.verified && a.reviewed_at ? formatDateTime(a.reviewed_at) : s === 'approved' ? 'Points are credited after verification.' : null,
    },
  ];
  let current = 0;
  let failed = false;
  if (s === 'submitted') current = 1;
  else if (s === 'changes_requested' || s === 'rejected') {
    current = 1;
    failed = true;
  } else if (s === 'hidden' || s === 'removed') {
    current = 2;
    failed = true;
  } else if (s === 'approved') current = a.verified ? 3 : 2;
  return { steps, current, failed };
}

/** One of my activities: status, reviewer feedback, points and actions (GET /activities/{id}). */
export default function SubmissionDetailScreen() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const q = useQuery(() => activitiesApi.get(activityId), [activityId], { enabled: !!activityId, refetchOnFocus: true });
  const loadFromActivity = useDraftStore((s) => s.loadFromActivity);
  const [deleting, setDeleting] = useState(false);
  const a = q.data;

  const edit = () => {
    if (!a) return;
    const d = useDraftStore.getState();
    const start = () => {
      loadFromActivity(a);
      go('/(tabs)/create');
    };
    if (d.hasContent() && d.editingId !== a.id) {
      Alert.alert('Replace current draft?', 'You have an unsaved draft in Create. Editing this activity will replace it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: start },
      ]);
    } else start();
  };

  const remove = () => {
    if (!a) return;
    Alert.alert(
      'Delete activity?',
      a.verified
        ? `This activity is verified. Deleting it removes the post and reverses its ${a.points ?? 0} points. This cannot be undone.`
        : 'This removes the activity and its photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await activitiesApi.remove(a.id);
              if (useDraftStore.getState().editingId === a.id) useDraftStore.getState().reset();
              goBack('/submissions');
            } catch (e) {
              Alert.alert('Could not delete', errorMessage(e));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (q.loading) {
    return (
      <Screen>
        <Header title="Activity" />
        <View style={[styles.body, contentWidth]}>
          <Skeleton height={280} radius={Radius.lg} />
          <Skeleton width="60%" height={18} />
          <Skeleton height={140} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  if (!a) {
    return (
      <Screen>
        <Header title="Activity" />
        <ErrorState error={q.error} onRetry={q.reload} />
      </Screen>
    );
  }

  const { tone, icon } = submissionTone(a.content_status, a.verified);
  const label = submissionLabel(a.content_status, a.content_status_label, a.verified);
  const t = timeline(a);
  const needsAction = a.content_status === 'changes_requested' || a.content_status === 'draft';

  return (
    <Screen>
      <Header title="Activity" subtitle={a.revision && a.revision > 1 ? `Revision ${a.revision}` : undefined} />
      <ScrollView
        contentContainerStyle={[styles.body, contentWidth]}
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}>
        <View style={styles.photo}>
          <PhotoCarousel photos={a.photos} title={a.title} />
        </View>

        <View style={styles.head}>
          <Pill label={label} tone={tone} icon={icon} />
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.meta}>{[a.category?.name, a.level_label, a.result_label].filter(Boolean).join(' · ')}</Text>
        </View>

        {a.review_note && (a.content_status === 'changes_requested' || a.content_status === 'rejected' || a.content_status === 'removed' || a.content_status === 'hidden') ? (
          <Notice
            tone={a.content_status === 'changes_requested' ? 'warning' : 'danger'}
            icon="chatbox-ellipses-outline"
            title={a.content_status === 'changes_requested' ? 'Reviewer feedback' : 'Reason'}
            message={a.review_note}
          />
        ) : a.review_note ? (
          <Notice tone="info" icon="chatbox-ellipses-outline" title="Reviewer note" message={a.review_note} />
        ) : null}

        <Card>
          <Text style={styles.cardTitle}>Status</Text>
          <Steps steps={t.steps} current={t.current} failed={t.failed} />
        </Card>

        <Card style={styles.points}>
          <View style={styles.pointsCol}>
            <Text style={styles.pointsValue}>{a.verified ? (a.points ?? 0) : '—'}</Text>
            <Text style={styles.pointsLabel}>Points credited</Text>
          </View>
          <View style={styles.pointsDivider} />
          <View style={styles.pointsCol}>
            <Text style={[styles.pointsValue, styles.pointsExpected]}>{a.expected_points ?? '—'}</Text>
            <Text style={styles.pointsLabel}>Expected if verified</Text>
          </View>
        </Card>

        <Card>
          <InfoRow label="Activity date" value={formatDate(a.occurred_on)} icon="calendar-outline" />
          <InfoRow label="Organiser" value={a.organizer} icon="business-outline" />
          <InfoRow label="Submitted" value={a.submitted_at ? formatDateTime(a.submitted_at) : null} icon="paper-plane-outline" />
          <InfoRow label="Reviewed" value={a.reviewed_at ? formatDateTime(a.reviewed_at) : null} icon="shield-checkmark-outline" />
          <InfoRow label="Appreciations" value={a.content_status === 'approved' ? String(a.appreciations_count) : null} icon="heart-outline" />
          <InfoRow label="Comments" value={a.content_status === 'approved' ? String(a.comments_count) : null} icon="chatbubble-outline" last />
          {a.caption ? <Text style={styles.caption}>{a.caption}</Text> : null}
        </Card>

        {a.evidence?.length ? (
          <Section title="Evidence · private">
            <View style={styles.evidence}>
              {a.evidence.map((e, i) => (
                <Touchable key={e.id} onPress={() => openUrl(e.url)} accessibilityLabel={`Open evidence ${i + 1}`}>
                  <Image source={{ uri: e.thumb_url }} style={styles.evidenceImg} contentFit="cover" />
                </Touchable>
              ))}
            </View>
            <Text style={styles.evidenceNote}>Only you and reviewers can see evidence. Links expire after a few minutes; pull to refresh.</Text>
          </Section>
        ) : null}

        {a.challenge || a.event || a.event_link ? (
          <Section title="Linked">
            {a.challenge ? <ListRow icon="flag-outline" title={a.challenge.title} subtitle="Challenge" onPress={() => go(`/challenges/${a.challenge!.id}`)} /> : null}
            {a.event ? <ListRow icon="calendar-outline" title={a.event.title} subtitle="Event" onPress={() => go(`/events/${a.event!.id}`)} /> : null}
            {a.event_link ? <ListRow icon="link-outline" title={a.event_link} subtitle="Event link" onPress={() => openUrl(a.event_link)} last /> : null}
          </Section>
        ) : null}

        <View style={styles.actions}>
          {a.can_edit ? (
            <Button
              label={a.content_status === 'changes_requested' ? 'Edit & resubmit' : a.content_status === 'draft' ? 'Continue editing' : 'Edit activity'}
              icon="create-outline"
              variant={needsAction ? 'primary' : 'secondary'}
              onPress={edit}
            />
          ) : null}
          {a.content_status === 'approved' ? <Button label="View public post" icon="eye-outline" variant="outline" onPress={() => go(`/posts/${a.id}`)} /> : null}
          <Button label="Delete activity" icon="trash-outline" variant="danger" onPress={remove} loading={deleting} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.xxl },
  photo: { borderRadius: Radius.lg, overflow: 'hidden' },
  head: { gap: Spacing.xs + 2 },
  title: { ...Type.title, color: Colors.ink },
  meta: { ...Type.small, color: Colors.muted },
  cardTitle: { ...Type.subheading, color: Colors.ink, marginBottom: Spacing.md },
  points: { flexDirection: 'row', alignItems: 'center' },
  pointsCol: { flex: 1, alignItems: 'center', gap: 2 },
  pointsValue: { ...Type.display, color: Colors.success },
  pointsExpected: { color: Colors.primary },
  pointsLabel: { ...Type.caption, color: Colors.muted },
  pointsDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: Colors.hairline },
  caption: { ...Type.body, color: Colors.body, marginTop: Spacing.sm },
  evidence: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
  evidenceImg: { width: 72, height: 72, borderRadius: Radius.md, backgroundColor: Colors.skeleton },
  evidenceNote: { ...Type.caption, color: Colors.muted, paddingHorizontal: Spacing.xs },
  actions: { gap: Spacing.sm, marginTop: Spacing.sm },
});
