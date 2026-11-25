import { activitiesApi, ApiError } from '@/api';
import { parseUserDate, today } from '@/lib/format';
import { evidenceRequired, newKey, useDraftStore, type CreateDraft, type DraftPhoto } from '@/stores/draftStore';
import { useUploads } from '@/stores/uploads';
import type { Activity, ActivityInput } from '@/types';

/** Client-side checks mirroring ActivityController/ActivityService validation. */
export function validateDraft(d: CreateDraft, submit: boolean, maxPhotos: number): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = d.title.trim();
  if (title.length < 3) errors.title = 'Give your activity a title (at least 3 characters).';
  if (title.length > 120) errors.title = 'Keep the title under 120 characters.';
  if (!d.categoryId) errors.category_id = 'Pick a category.';
  if (!d.occurredOn || !parseUserDate(d.occurredOn)) errors.occurred_on = 'Enter the date as DD/MM/YYYY.';
  else if (d.occurredOn > today()) errors.occurred_on = 'The date cannot be in the future.';
  if (d.caption.length > 2000) errors.caption = 'Keep the caption under 2000 characters.';
  if (d.eventLink.trim() && !/^https?:\/\/\S+\.\S+/i.test(d.eventLink.trim())) errors.event_link = 'Enter a full link starting with https://';
  if (d.photos.length > maxPhotos) errors.photo_ids = `You can add up to ${maxPhotos} photos.`;
  if (submit && d.photos.length < 1) errors.photo_ids = 'Add at least one photo.';
  if (submit && evidenceRequired(d.level, d.result) && d.evidence.length === 0) {
    errors.evidence_ids = 'Attach a certificate or other evidence for a placement or a District / State / National level activity.';
  }
  return errors;
}

async function uploadOne(photo: DraftPhoto, kind: 'photo' | 'evidence') {
  const uploads = useUploads.getState();
  uploads.setFailed(photo.key, null);
  uploads.setProgress(photo.key, 0.02);
  try {
    const task = activitiesApi.upload(
      { uri: photo.uri, name: photo.fileName ?? undefined, type: photo.mimeType ?? undefined },
      kind,
      (f) => useUploads.getState().setProgress(photo.key, f),
    );
    const media = await task.promise;
    useDraftStore.getState().setMediaId(kind === 'photo' ? 'photos' : 'evidence', photo.key, media.id);
    useUploads.getState().setProgress(photo.key, 1);
  } catch (e) {
    const msg = e instanceof ApiError ? e.field('file') ?? e.message : 'Upload failed.';
    useUploads.getState().setFailed(photo.key, msg);
    useUploads.getState().setProgress(photo.key, 0);
    throw e;
  }
}

/** Upload everything that has no media id yet, two at a time. */
async function uploadPending() {
  const d = useDraftStore.getState();
  const queue: [DraftPhoto, 'photo' | 'evidence'][] = [
    ...d.photos.filter((p) => !p.mediaId).map((p) => [p, 'photo'] as [DraftPhoto, 'photo']),
    ...d.evidence.filter((p) => !p.mediaId).map((p) => [p, 'evidence'] as [DraftPhoto, 'evidence']),
  ];
  let firstError: unknown = null;
  let i = 0;
  const worker = async () => {
    while (i < queue.length) {
      const [p, kind] = queue[i++];
      try {
        await uploadOne(p, kind);
      } catch (e) {
        firstError ??= e;
      }
    }
  };
  await Promise.all([worker(), worker()]);
  if (firstError) throw firstError;
}

/**
 * Upload pending media, then create (POST with Idempotency-Key) or update (PUT)
 * the activity. Leaves the draft untouched on failure so the user can retry.
 */
export async function saveActivity(submit: boolean): Promise<Activity> {
  await uploadPending();
  const d = useDraftStore.getState();
  const body: ActivityInput = {
    title: d.title.trim(),
    category_id: d.categoryId as number,
    caption: d.caption.trim() || null,
    occurred_on: d.occurredOn,
    level: d.level,
    result: d.result,
    organizer: d.organizer.trim() || null,
    event_link: d.eventLink.trim() || null,
    event_id: d.event?.id ?? null,
    challenge_id: d.challenge?.id ?? null,
    photo_ids: d.photos.map((p) => p.mediaId).filter((v): v is number => typeof v === 'number'),
    evidence_ids: d.evidence.map((p) => p.mediaId).filter((v): v is number => typeof v === 'number'),
    submit,
  };
  const activity = d.editingId ? await activitiesApi.update(d.editingId, body) : await activitiesApi.create(body, d.idempotencyKey);
  useDraftStore.getState().reset();
  useDraftStore.setState({ idempotencyKey: newKey() });
  useUploads.getState().clear();
  return activity;
}

/** Field → friendly label for server validation errors. */
export const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  category_id: 'Category',
  occurred_on: 'Date',
  level: 'Level',
  result: 'Result',
  organizer: 'Organiser',
  event_link: 'Event link',
  caption: 'Caption',
  photo_ids: 'Photos',
  evidence_ids: 'Evidence',
  challenge_id: 'Challenge',
  event_id: 'Event',
  file: 'Upload',
};
