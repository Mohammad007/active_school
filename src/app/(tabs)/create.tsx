import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddTile, PhotoThumb } from '@/components/create/PhotoThumb';
import { pickFromLibrary } from '@/components/create/pickers';
import { FIELD_LABELS, saveActivity, validateDraft } from '@/components/create/submitActivity';
import {
  Button,
  ChipGroup,
  FieldError,
  FieldLabel,
  FormScroll,
  Header,
  IconButton,
  Notice,
  Screen,
  TextField,
  Touchable,
} from '@/components/ui';
import { errorMessage, fieldErrors } from '@/api';
import { maskDateInput, parseUserDate, toUserDate, today, toIsoDate } from '@/lib/format';
import { go, goReplace } from '@/lib/nav';
import { evidenceRequired, MAX_EVIDENCE, useDraftStore } from '@/stores/draftStore';
import { useSession } from '@/stores/session';
import { Colors, Radius, Spacing, Type, safeColour } from '@/theme';
import type { ActivityLevel, ActivityResult } from '@/types';

const LEVELS: Record<ActivityLevel, string> = { local: 'Local', district: 'District', state: 'State', national: 'National' };
const RESULTS: Record<ActivityResult, string> = { participation: 'Participation', third: 'Third Place', second: 'Second Place', first: 'First Place' };

/** Create / edit an activity. The draft is persisted locally (draftStore). */
export default function CreateScreen() {
  const draft = useDraftStore();
  const config = useSession((s) => s.config);
  const categories = useSession((s) => s.categories);
  const maxPhotos = config?.uploads?.max_photos ?? 5;
  const maxMb = config?.uploads?.max_photo_mb ?? 10;
  const levels = (config?.levels ?? LEVELS) as Record<ActivityLevel, string>;
  const results = (config?.results ?? RESULTS) as Record<ActivityResult, string>;

  const [dateText, setDateText] = useState(toUserDate(draft.occurredOn));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Keep the date field in step when the draft is replaced (reset / edit loaded).
  // (Not on every occurredOn change, or a half-typed date would be wiped.)
  useEffect(() => {
    setDateText(toUserDate(useDraftStore.getState().occurredOn));
  }, [draft.editingId, draft.idempotencyKey]);

  useEffect(() => {
    if (!categories.length) useSession.getState().loadCategories().catch(() => undefined);
  }, [categories.length]);

  const needsEvidence = evidenceRequired(draft.level, draft.result);
  const editing = !!draft.editingId;

  const clearError = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));

  const onDate = (text: string) => {
    const masked = maskDateInput(text);
    setDateText(masked);
    const iso = parseUserDate(masked);
    if (iso) {
      draft.set('occurredOn', iso);
      clearError('occurred_on');
    } else {
      draft.set('occurredOn', '');
    }
  };

  const setQuickDate = (d: Date) => {
    const iso = toIsoDate(d);
    draft.set('occurredOn', iso);
    setDateText(toUserDate(iso));
    clearError('occurred_on');
  };

  const addEvidence = async () => {
    const picked = await pickFromLibrary(MAX_EVIDENCE - draft.evidence.length, maxMb);
    if (picked.length) {
      draft.addEvidence(picked);
      clearError('evidence_ids');
    }
  };

  const review = () => {
    const e = validateDraft(useDraftStore.getState(), true, maxPhotos);
    setErrors(e);
    if (Object.keys(e).length) {
      Alert.alert('Check your activity', Object.values(e)[0]);
      return;
    }
    go('/preview-activity');
  };

  const saveDraft = async () => {
    const e = validateDraft(useDraftStore.getState(), false, maxPhotos);
    setErrors(e);
    if (Object.keys(e).length) {
      Alert.alert('Check your activity', Object.values(e)[0]);
      return;
    }
    setSaving(true);
    try {
      const a = await saveActivity(false);
      Alert.alert('Draft saved', 'You can finish and submit it from My submissions.');
      goReplace(`/submissions/${a.id}`);
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      const first = Object.entries(fe)[0];
      Alert.alert('Could not save draft', first ? `${FIELD_LABELS[first[0]] ?? first[0]}: ${first[1]}` : errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    Alert.alert(editing ? 'Stop editing?' : 'Discard draft?', editing ? 'Your changes will be lost. The activity stays as it was.' : 'This removes everything you have entered.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: editing ? 'Stop editing' : 'Discard',
        style: 'destructive',
        onPress: () => {
          draft.reset();
          setErrors({});
        },
      },
    ]);
  };

  const hasContent = draft.title.trim() || draft.caption.trim() || draft.photos.length || draft.evidence.length || editing;

  return (
    <Screen>
      <Header
        title={editing ? 'Edit activity' : 'New activity'}
        back={false}
        large
        right={
          <>
            <IconButton icon="document-text-outline" label="My submissions" onPress={() => go('/submissions')} />
            {hasContent ? <IconButton icon="trash-outline" label={editing ? 'Stop editing' : 'Discard draft'} onPress={discard} /> : null}
          </>
        }
      />
      <FormScroll
        footer={
          <View style={styles.footer}>
            {!editing ? <Button label="Save draft" variant="outline" onPress={saveDraft} loading={saving} full={false} style={styles.flex} /> : null}
            <Button label={editing ? 'Review changes' : 'Review'} iconRight="arrow-forward" onPress={review} disabled={saving} full={false} style={styles.flex} />
          </View>
        }>
        {editing ? <Notice tone="info" message="Editing a published activity sends it back for review. Points stay pending until it is verified again." /> : null}

        <View style={styles.block}>
          <FieldLabel>{`Photos (${draft.photos.length}/${maxPhotos})`}</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {draft.photos.map((p, i) => (
              <PhotoThumb key={p.key} uri={p.uri} size={88} order={draft.photos.length > 1 ? i + 1 : undefined} onPress={() => go('/select-photos')} label={`Photo ${i + 1}`} />
            ))}
            {draft.photos.length < maxPhotos ? (
              <AddTile size={88} label={draft.photos.length ? 'Add more' : 'Add photos'} icon="images-outline" onPress={() => go('/select-photos')} />
            ) : null}
          </ScrollView>
          <FieldError>{errors.photo_ids}</FieldError>
        </View>

        <TextField
          label="Title"
          placeholder="e.g. Inter-school football final"
          value={draft.title}
          onChangeText={(t) => {
            draft.set('title', t);
            clearError('title');
          }}
          maxLength={120}
          error={errors.title}
        />

        <View style={styles.block}>
          <FieldLabel>Category</FieldLabel>
          {categories.length ? (
            <ChipGroup
              options={categories.map((c) => ({ key: c.id, label: c.name, colour: safeColour(c.colour) }))}
              selected={draft.categoryId ? [draft.categoryId] : []}
              onToggle={(id) => {
                draft.set('categoryId', id);
                clearError('category_id');
              }}
            />
          ) : (
            <Text style={styles.muted}>Loading categories…</Text>
          )}
          <FieldError>{errors.category_id}</FieldError>
        </View>

        <View style={styles.block}>
          <TextField
            label="Date of activity"
            placeholder="DD/MM/YYYY"
            value={dateText}
            onChangeText={onDate}
            keyboardType="number-pad"
            maxLength={10}
            icon="calendar-outline"
            error={errors.occurred_on}
          />
          <View style={styles.quick}>
            <Touchable onPress={() => setQuickDate(new Date())} style={styles.quickBtn} accessibilityLabel="Set date to today">
              <Text style={[styles.quickText, draft.occurredOn === today() && styles.quickOn]}>Today</Text>
            </Touchable>
            <Touchable
              onPress={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setQuickDate(d);
              }}
              style={styles.quickBtn}
              accessibilityLabel="Set date to yesterday">
              <Text style={styles.quickText}>Yesterday</Text>
            </Touchable>
          </View>
        </View>

        <View style={styles.block}>
          <FieldLabel>Level</FieldLabel>
          <ChipGroup
            options={(Object.keys(levels) as ActivityLevel[]).map((k) => ({ key: k, label: levels[k] }))}
            selected={[draft.level]}
            onToggle={(k) => draft.set('level', k)}
          />
          <FieldError>{errors.level}</FieldError>
        </View>

        <View style={styles.block}>
          <FieldLabel>Result</FieldLabel>
          <ChipGroup
            options={(Object.keys(results) as ActivityResult[]).map((k) => ({ key: k, label: results[k] }))}
            selected={[draft.result]}
            onToggle={(k) => draft.set('result', k)}
          />
          <FieldError>{errors.result}</FieldError>
        </View>

        <View style={[styles.evidence, needsEvidence && styles.evidenceRequired]}>
          <View style={styles.evidenceHead}>
            <Ionicons name="lock-closed" size={16} color={needsEvidence ? Colors.warning : Colors.muted} />
            <Text style={styles.evidenceTitle}>Evidence{needsEvidence ? ' · required' : ' · optional'}</Text>
          </View>
          <Text style={styles.evidenceText}>
            {needsEvidence
              ? 'A certificate or organiser proof is needed for a placement or a District / State / National activity.'
              : 'A certificate or proof helps reviewers verify your activity faster.'}{' '}
            Evidence is private: only you and reviewers can see it.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {draft.evidence.map((p, i) => (
              <PhotoThumb key={p.key} uri={p.uri} size={72} onRemove={() => draft.removeEvidence(p.key)} label={`Evidence ${i + 1}`} />
            ))}
            {draft.evidence.length < MAX_EVIDENCE ? <AddTile size={72} label="Add evidence" icon="document-attach-outline" onPress={addEvidence} /> : null}
          </ScrollView>
          <FieldError>{errors.evidence_ids}</FieldError>
        </View>

        {draft.challenge || draft.event ? (
          <View style={styles.block}>
            <FieldLabel>Linked to</FieldLabel>
            {draft.challenge ? (
              <LinkedChip icon="flag-outline" label={`Challenge · ${draft.challenge.title}`} onRemove={() => draft.set('challenge', null)} />
            ) : null}
            {draft.event ? <LinkedChip icon="calendar-outline" label={`Event · ${draft.event.title}`} onRemove={() => draft.set('event', null)} /> : null}
            <FieldError>{errors.challenge_id || errors.event_id}</FieldError>
          </View>
        ) : null}

        <TextField
          label="Caption"
          optional
          placeholder="What did you do? What did you learn?"
          value={draft.caption}
          onChangeText={(t) => draft.set('caption', t)}
          multiline
          maxLength={2000}
          hint={`${draft.caption.length}/2000`}
          error={errors.caption}
        />
        <TextField
          label="Organiser"
          optional
          placeholder="School, club or federation"
          value={draft.organizer}
          onChangeText={(t) => draft.set('organizer', t)}
          maxLength={150}
          error={errors.organizer}
        />
        <TextField
          label="Event link"
          optional
          placeholder="https://"
          value={draft.eventLink}
          onChangeText={(t) => {
            draft.set('eventLink', t);
            clearError('event_link');
          }}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={255}
          error={errors.event_link}
        />
        {Object.entries(errors).some(([k, v]) => v && !['title', 'category_id', 'occurred_on', 'photo_ids', 'evidence_ids', 'caption', 'organizer', 'event_link', 'level', 'result', 'challenge_id', 'event_id'].includes(k)) ? (
          <Notice tone="danger" message={Object.entries(errors).find(([, v]) => v)?.[1] ?? ''} />
        ) : null}
      </FormScroll>
    </Screen>
  );
}

function LinkedChip({ icon, label, onRemove }: { icon: keyof typeof Ionicons.glyphMap; label: string; onRemove: () => void }) {
  return (
    <View style={styles.linked}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.linkedText} numberOfLines={1}>
        {label}
      </Text>
      <IconButton icon="close" size={18} label={`Remove ${label}`} onPress={onRemove} color={Colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { flexDirection: 'row', gap: Spacing.sm },
  block: { gap: Spacing.sm },
  strip: { gap: Spacing.sm, paddingVertical: Spacing.xxs },
  muted: { ...Type.small, color: Colors.muted },
  quick: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: { minHeight: 36, justifyContent: 'center', paddingHorizontal: Spacing.xs },
  quickText: { ...Type.small, color: Colors.primary, fontWeight: '600' },
  quickOn: { color: Colors.muted },
  evidence: { gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.hairline },
  evidenceRequired: { backgroundColor: Colors.warningTint, borderColor: Colors.accent },
  evidenceHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2 },
  evidenceTitle: { ...Type.small, fontWeight: '600', color: Colors.ink },
  evidenceText: { ...Type.caption, color: Colors.body },
  linked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryTint,
  },
  linkedText: { ...Type.small, color: Colors.primary, fontWeight: '600', flex: 1 },
});
