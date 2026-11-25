import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, competitionApi, errorMessage, fieldErrors } from '@/api';
import { PhotoThumb } from '@/components/create/PhotoThumb';
import { FIELD_LABELS, saveActivity, validateDraft } from '@/components/create/submitActivity';
import { PhotoCarousel } from '@/components/social/PhotoCarousel';
import { Avatar, Button, Card, contentWidth, EmptyState, Header, InfoRow, Notice, Pill, ProgressBar, Screen } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { formatDate } from '@/lib/format';
import { go, goBack, goReplace } from '@/lib/nav';
import { useDraftStore } from '@/stores/draftStore';
import { useSession } from '@/stores/session';
import { useUploads } from '@/stores/uploads';
import { Colors, ScreenPadding, Spacing, Type } from '@/theme';
import type { Media } from '@/types';

type Phase = 'idle' | 'working' | 'failed';

/** Review the activity as classmates will see it, then upload and submit. */
export default function PreviewActivityScreen() {
  const draft = useDraftStore();
  const me = useSession((s) => s.me);
  const config = useSession((s) => s.config);
  const categories = useSession((s) => s.categories);
  const progress = useUploads((s) => s.progress);
  const failed = useUploads((s) => s.failed);
  const rules = useQuery(() => competitionApi.rules(), []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<'submit' | 'draft'>('submit');
  const [error, setError] = useState<unknown>(null);

  const category = categories.find((c) => c.id === draft.categoryId);
  const levelLabel = config?.levels?.[draft.level] ?? draft.level;
  const resultLabel = config?.results?.[draft.result] ?? draft.result;
  const expected = rules.data?.table?.[draft.level]?.[draft.result];
  const maxPhotos = config?.uploads?.max_photos ?? 5;
  const editing = !!draft.editingId;

  if (!draft.photos.length && !draft.title.trim()) {
    return (
      <Screen>
        <Header title="Review" />
        <EmptyState icon="create-outline" title="Nothing to review" message="Start a new activity first." actionLabel="Create activity" onAction={() => goReplace('/(tabs)/create')} />
      </Screen>
    );
  }

  const media: Media[] = draft.photos.map((p, i) => ({ id: i + 1, url: p.uri, thumb_url: p.uri, width: p.width, height: p.height }));
  const all = [...draft.photos.map((p) => ({ ...p, kind: 'Photo' })), ...draft.evidence.map((p) => ({ ...p, kind: 'Evidence' }))];
  const pending = all.filter((p) => !p.mediaId);
  const done = all.length - pending.length;
  const overall = all.length ? (done + pending.reduce((s, p) => s + (progress[p.key] ?? 0), 0)) / all.length : 1;

  const fe = fieldErrors(error);
  const apiErr = error instanceof ApiError ? error : null;

  const send = async (submit: boolean) => {
    const v = validateDraft(useDraftStore.getState(), submit, maxPhotos);
    if (Object.keys(v).length) {
      setError(new ApiError(422, 'validation_failed', Object.values(v)[0], Object.fromEntries(Object.entries(v).map(([k, m]) => [k, [m]]))));
      setPhase('failed');
      return;
    }
    setMode(submit ? 'submit' : 'draft');
    setPhase('working');
    setError(null);
    try {
      const a = await saveActivity(submit);
      Alert.alert(
        submit ? (editing ? 'Changes submitted' : 'Activity submitted') : 'Draft saved',
        submit ? 'A reviewer will check it. You will get a notification when it is published and verified.' : 'You can finish it later from My submissions.',
      );
      goReplace(`/submissions/${a.id}`);
    } catch (e) {
      setError(e);
      setPhase('failed');
    }
  };

  const working = phase === 'working';

  return (
    <Screen>
      <Header title={editing ? 'Review changes' : 'Review & submit'} />
      <ScrollView contentContainerStyle={[styles.body, contentWidth]}>
        <Text style={styles.lead}>This is how classmates will see your post once it is approved.</Text>

        <Card style={styles.preview}>
          <View style={styles.author}>
            <Avatar uri={me?.student?.avatar_url} name={me?.student?.display_name} size={36} />
            <View style={styles.flex}>
              <Text style={styles.name}>{me?.student?.display_name ?? 'You'}</Text>
              {me?.student?.class_label ? <Text style={styles.meta}>{me.student.class_label}</Text> : null}
            </View>
            <Pill label={levelLabel} tone="info" />
          </View>
          <PhotoCarousel photos={media} title={draft.title} />
          <View style={styles.previewBody}>
            <Text style={styles.title}>{draft.title || 'Untitled activity'}</Text>
            {draft.caption.trim() ? <Text style={styles.caption}>{draft.caption.trim()}</Text> : null}
            <View style={styles.tags}>
              {category ? <Pill label={category.name} colour={category.colour} /> : null}
              {draft.result !== 'participation' ? <Pill label={resultLabel} tone="accent" icon="trophy" /> : null}
            </View>
          </View>
        </Card>

        <Card>
          <InfoRow label="Date" value={formatDate(draft.occurredOn)} icon="calendar-outline" />
          <InfoRow label="Level" value={levelLabel} icon="podium-outline" />
          <InfoRow label="Result" value={resultLabel} icon="trophy-outline" />
          <InfoRow label="Organiser" value={draft.organizer.trim() || null} icon="business-outline" />
          <InfoRow label="Event link" value={draft.eventLink.trim() || null} icon="link-outline" />
          <InfoRow label="Challenge" value={draft.challenge?.title} icon="flag-outline" />
          <InfoRow label="Event" value={draft.event?.title} icon="calendar-number-outline" />
          <InfoRow label="Evidence" value={draft.evidence.length ? `${draft.evidence.length} file${draft.evidence.length > 1 ? 's' : ''} (private)` : 'None'} icon="lock-closed-outline" last />
        </Card>

        {typeof expected === 'number' ? (
          <Notice
            tone="info"
            icon="star-outline"
            title={`Worth ${expected} points if verified`}
            message="Points are credited only after a reviewer verifies the activity. Appreciations never affect your rank."
          />
        ) : null}

        {phase !== 'idle' && all.length ? (
          <Card style={styles.uploads}>
            <View style={styles.uploadHead}>
              <Text style={styles.uploadTitle}>{working ? (overall < 1 ? 'Uploading photos…' : mode === 'submit' ? 'Submitting…' : 'Saving…') : 'Upload status'}</Text>
              <Text style={styles.meta}>
                {done}/{all.length}
              </Text>
            </View>
            <ProgressBar value={overall} />
            {all.map((p, i) => (
              <View key={p.key} style={styles.uploadRow}>
                <PhotoThumb uri={p.uri} size={40} label={`${p.kind} ${i + 1}`} />
                <View style={styles.flex}>
                  <Text style={styles.uploadName}>
                    {p.kind} {p.kind === 'Photo' ? i + 1 : i + 1 - draft.photos.length}
                  </Text>
                  {failed[p.key] ? (
                    <Text style={styles.uploadFail}>{failed[p.key]}</Text>
                  ) : (
                    <ProgressBar value={p.mediaId ? 1 : (progress[p.key] ?? 0)} height={4} colour={p.mediaId ? Colors.success : Colors.primary} />
                  )}
                </View>
                <Ionicons
                  name={p.mediaId ? 'checkmark-circle' : failed[p.key] ? 'alert-circle' : 'cloud-upload-outline'}
                  size={20}
                  color={p.mediaId ? Colors.success : failed[p.key] ? Colors.danger : Colors.subtle}
                  accessibilityLabel={p.mediaId ? 'Uploaded' : failed[p.key] ? 'Failed' : 'Waiting'}
                />
              </View>
            ))}
          </Card>
        ) : null}

        {phase === 'failed' && error ? (
          <View style={styles.errorBox}>
            <Notice
              tone="danger"
              title={apiErr?.isNetwork ? 'Connection problem' : apiErr?.status === 422 ? 'Please fix the following' : 'Could not submit'}
              message={
                Object.keys(fe).length
                  ? Object.entries(fe)
                      .map(([k, m]) => `${FIELD_LABELS[k] ?? k}: ${m}`)
                      .join('\n')
                  : errorMessage(error)
              }
            />
            {Object.keys(fe).length ? <Button label="Edit details" variant="outline" icon="create-outline" onPress={() => goBack('/(tabs)/create')} /> : null}
          </View>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={[styles.actions, contentWidth]}>
          {!editing ? (
            <Button label="Save draft" variant="outline" onPress={() => send(false)} disabled={working} loading={working && mode === 'draft'} full={false} style={styles.flex} />
          ) : (
            <Button label="Edit" variant="outline" onPress={() => go('/(tabs)/create')} disabled={working} full={false} style={styles.flex} />
          )}
          <Button
            label={phase === 'failed' && !Object.keys(fe).length ? 'Retry' : editing ? 'Resubmit' : 'Submit'}
            icon={phase === 'failed' && !Object.keys(fe).length ? 'refresh' : 'paper-plane-outline'}
            onPress={() => send(true)}
            loading={working && mode === 'submit'}
            disabled={working}
            full={false}
            style={styles.flex}
          />
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: ScreenPadding, gap: Spacing.md, paddingBottom: Spacing.xl },
  lead: { ...Type.small, color: Colors.muted },
  preview: { padding: 0, overflow: 'hidden' },
  author: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, padding: Spacing.md },
  name: { ...Type.small, fontWeight: '600', color: Colors.ink },
  meta: { ...Type.caption, color: Colors.muted },
  previewBody: { padding: Spacing.md, gap: Spacing.xs },
  title: { ...Type.subheading, color: Colors.ink },
  caption: { ...Type.body, color: Colors.body },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2, marginTop: Spacing.xs },
  uploads: { gap: Spacing.md },
  uploadHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  uploadTitle: { ...Type.subheading, color: Colors.ink },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  uploadName: { ...Type.small, color: Colors.ink, marginBottom: Spacing.xs },
  uploadFail: { ...Type.caption, color: Colors.danger },
  errorBox: { gap: Spacing.sm },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
