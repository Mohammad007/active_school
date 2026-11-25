import { create } from 'zustand';

import type { Gender, MyProfile, OnboardingInput, School, SchoolClass } from '@/types';


/**
 * In-memory onboarding answers collected across select-school →
 * student-details → complete-profile, sent in one POST /onboarding.
 */
export interface OnboardingData {
  school: Pick<School, 'id' | 'name' | 'city'> | null;
  schoolClass: SchoolClass | null;
  fullName: string;
  displayName: string;
  /** DD/MM/YYYY as typed. */
  dob: string;
  gender: Gender | null;
  genderLabel: string;
  bio: string;
  interests: string[];
  avatarMediaId: number | null;
  avatarUri: string | null;
}

interface OnboardingState extends OnboardingData {
  set: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
  /** Prefill from an existing (pending) profile so details can be corrected. */
  prefill: (s: MyProfile) => void;
}

const initial: OnboardingData = {
  school: null,
  schoolClass: null,
  fullName: '',
  displayName: '',
  dob: '',
  gender: null,
  genderLabel: '',
  bio: '',
  interests: [],
  avatarMediaId: null,
  avatarUri: null,
};

function genderFromServer(g: string | null): Gender | null {
  if (g === 'M') return 'boy';
  if (g === 'F') return 'girl';
  return null;
}

function toUser(iso: string | null): string {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export const useOnboarding = create<OnboardingState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
  prefill: (s) =>
    set({
      ...initial,
      school: s.school ? { id: s.school.id, name: s.school.name, city: s.school.city } : null,
      schoolClass: s.class_id ? { id: s.class_id, grade: s.grade ?? '', section: s.section ?? null, label: s.class_label ?? '' } : null,
      fullName: s.name ?? '',
      displayName: s.display_name ?? '',
      dob: toUser(s.dob),
      gender: genderFromServer(s.gender),
      bio: s.bio ?? '',
      interests: s.interests ?? [],
      avatarUri: s.avatar_url,
    }),
}));

/** Which onboarding step owns a server field (for 422 errors on the last step). */
export const FIELD_STEP: Record<string, { label: string; path: string }> = {
  school_id: { label: 'School', path: '/select-school' },
  class_id: { label: 'Class', path: '/student-details' },
  full_name: { label: 'Full name', path: '/student-details' },
  display_name: { label: 'Display name', path: '/student-details' },
  dob: { label: 'Date of birth', path: '/student-details' },
  gender: { label: 'Gender', path: '/student-details' },
  gender_label: { label: 'Gender', path: '/student-details' },
};

export function toOnboardingInput(d: OnboardingData, dobIso: string): OnboardingInput {
  return {
    school_id: d.school?.id ?? 0,
    class_id: d.schoolClass?.id ?? 0,
    full_name: d.fullName.trim(),
    display_name: d.displayName.trim(),
    dob: dobIso,
    gender: d.gender ?? 'prefer_not_to_say',
    gender_label: d.gender === 'self_describe' ? d.genderLabel.trim() || null : null,
    bio: d.bio.trim() || null,
    interests: d.interests,
    avatar_media_id: d.avatarMediaId,
  };
}
