/**
 * Shapes returned by the ActiveSchool API (/api/activeschool/v1).
 * Field names are kept in snake_case exactly as the server sends them —
 * see app/Http/Controllers/Api/MobileApp/Presenter.php and the controllers.
 */

// ───────────────────────────── Envelope ─────────────────────────────

export interface PageMeta {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  has_more?: boolean;
  /** Cursor-paginated lists (the feed). */
  next_cursor?: string | null;
}

export interface Envelope<T, M = PageMeta> {
  data: T;
  meta?: M;
}

export interface Paged<T, M = PageMeta> {
  data: T[];
  meta: M;
}

// ───────────────────────────── Config ─────────────────────────────

export type ActivityLevel = 'local' | 'district' | 'state' | 'national';
export type ActivityResult = 'participation' | 'third' | 'second' | 'first';
export type FeatureKey = 'challenges' | 'events' | 'goals' | 'portfolio' | 'rewards' | 'comments';

export interface AppConfig {
  app_name: string;
  min_app_version: string | null;
  maintenance: { enabled: boolean; message: string | null };
  features: Record<FeatureKey, boolean>;
  uploads: { max_photos: number; max_photo_mb: number; types: string[] };
  support: { email: string | null; phone: string | null };
  links: { terms: string; privacy: string; website: string };
  logo_url: string;
  logo_white_url: string;
  brand: { primary: string; accent: string; success: string };
  levels: Record<ActivityLevel, string>;
  results: Record<ActivityResult, string>;
  report_reasons: Record<string, string>;
  require_guardian_phone: boolean;
}

// ───────────────────────────── Schools ─────────────────────────────

export interface School {
  id: number;
  name: string;
  code: string | null;
  city: string | null;
  state: string | null;
}

export interface SchoolClass {
  id: number;
  grade: string;
  section: string | null;
  label: string;
}

export interface SitePage {
  slug: string;
  title: string;
  body: string;
  updated_at: string | null;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string | null;
}

// ───────────────────────────── Auth / me ─────────────────────────────

export interface OtpRequestResult {
  sent: boolean;
  phone: string;
  expires_in: number;
  resend_after: number;
  /** Only present when the server runs in OTP test mode. */
  debug_code?: string;
}

export interface AuthResult {
  token: string;
  onboarding_required: boolean;
  enrollment_status: EnrollmentStatus | null;
}

export type EnrollmentStatus = 'pending_enrollment' | 'active' | 'rejected' | string;
export type Gender = 'boy' | 'girl' | 'self_describe' | 'prefer_not_to_say';

export interface StudentSummary {
  id: number | null;
  display_name: string;
  avatar_url: string | null;
  school?: { id: number; name: string; city: string | null } | null;
  class_label: string | null;
  grade?: string | null;
  section?: string | null;
  is_me: boolean;
}

export interface Preferences {
  privacy: { profile_visibility: 'class' | 'school' | 'private'; show_on_leaderboard: boolean; allow_tagging: boolean };
  notifications: { activities: boolean; challenges: boolean; events: boolean; rewards: boolean; push: boolean };
  language: 'en' | 'hi';
}

export interface MyProfile extends StudentSummary {
  id: number;
  name: string;
  student_uid: string | null;
  bio: string | null;
  interests: string[];
  /** Stored as M / F / Other server-side. */
  gender: string | null;
  dob: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_relation: 'mother' | 'father' | 'guardian' | 'other' | null;
  student_identifier: string | null;
  enrollment_status: EnrollmentStatus | null;
  consent_status: 'pending' | 'granted' | 'not_required' | string | null;
  account_status: string | null;
  status_reason: string | null;
  preferences: Preferences | null;
  class_id: number | null;
}

export interface MyStats {
  points_total: number;
  points_season: number;
  posts: number;
  verified_activities: number;
  badges: number;
  rank: number | null;
}

export interface Me {
  user: { id: number; phone: string | null; has_password?: boolean };
  onboarding_required: boolean;
  can_participate?: boolean;
  student: MyProfile | null;
  stats?: MyStats;
}

export interface OnboardingInput {
  school_id: number;
  class_id: number;
  full_name: string;
  display_name: string;
  dob: string;
  gender: Gender;
  gender_label?: string | null;
  student_identifier?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_relation?: 'mother' | 'father' | 'guardian' | 'other' | null;
  bio?: string | null;
  interests?: string[];
  avatar_media_id?: number | null;
}

export interface ProfileUpdateInput {
  display_name?: string;
  bio?: string | null;
  interests?: string[];
  avatar_media_id?: number | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_relation?: 'mother' | 'father' | 'guardian' | 'other' | null;
}

// ───────────────────────────── Content ─────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  colour: string | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  colour: string | null;
  route: string | null;
  image_url: string | null;
}

export interface Media {
  id: number;
  url?: string;
  thumb_url: string;
  width?: number;
  height?: number;
  kind?: 'photo' | 'evidence' | 'avatar';
}

export type ContentStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested' | 'rejected' | 'hidden' | 'removed';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | string;

export interface Activity {
  id: number;
  title: string;
  caption: string | null;
  category: Category | null;
  level: ActivityLevel;
  level_label: string;
  result: ActivityResult;
  result_label: string;
  occurred_on: string | null;
  organizer: string | null;
  photos: Media[];
  author: StudentSummary | null;
  appreciations_count: number;
  comments_count: number;
  appreciated_by_me: boolean;
  saved_by_me: boolean;
  comments_enabled: boolean;
  verified: boolean;
  points: number | null;
  challenge: { id: number; title: string } | null;
  event: { id: number; title: string } | null;
  published_at: string | null;
  created_at: string | null;
  is_mine: boolean;
  // Owner-only fields
  content_status?: ContentStatus;
  content_status_label?: string;
  verification_status?: VerificationStatus;
  review_note?: string | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
  event_link?: string | null;
  evidence?: { id: number; thumb_url: string; url: string }[];
  expected_points?: number;
  revision?: number;
  can_edit?: boolean;
}

export type Post = Activity;

export interface ActivityInput {
  title: string;
  category_id: number;
  caption?: string | null;
  occurred_on: string;
  level: ActivityLevel;
  result: ActivityResult;
  organizer?: string | null;
  event_link?: string | null;
  event_id?: number | null;
  challenge_id?: number | null;
  photo_ids: number[];
  evidence_ids: number[];
  submit: boolean;
}

export type SubmissionFilter = 'all' | 'draft' | 'pending' | 'verified' | 'changes_requested' | 'rejected';

export interface Comment {
  id: number;
  body: string;
  author: StudentSummary | null;
  created_at: string | null;
  is_mine: boolean;
  pending: boolean;
}

export interface PeerBadge {
  id: number;
  name: string;
  icon: string | null;
  colour: string | null;
}

export interface PeerProfile extends StudentSummary {
  bio: string | null;
  interests: string[];
  posts_count: number;
  badges: PeerBadge[];
  blocked_by_me: boolean;
}

export interface BlockedStudent extends StudentSummary {
  blocked_at: string;
}

export type ReportType = 'activity' | 'comment' | 'student' | 'other';

// ───────────────────────────── Notifications / support ─────────────────────────────

export interface AppNotification {
  id: number;
  tab: string;
  title: string;
  body: string | null;
  route: string | null;
  icon: string | null;
  read: boolean;
  created_at: string;
}

export type TicketType = 'help' | 'recovery' | 'data_export' | 'class_change' | 'appeal' | 'other';

export interface SupportTicket {
  id: number;
  type: TicketType;
  type_label: string;
  subject: string;
  message: string;
  status: string;
  reply: string | null;
  created_at: string;
  replied_at: string | null;
}

// ───────────────────────────── Competition ─────────────────────────────

export interface Season {
  id: number;
  name: string;
  starts_on: string;
  ends_on: string;
  status: 'active' | 'review' | 'finalized' | string;
  status_label: string;
  scope: string | null;
  min_activities: number;
}

export interface PointsEntry {
  id: number;
  type: 'activity' | 'event' | 'bonus' | 'adjustment' | string;
  title: string;
  reason: string | null;
  points: number;
  status: 'credited';
  route: string | null;
  created_at: string | null;
}

export interface PointsSummary {
  total: number;
  season: number;
  season_name: string | null;
  pending: number;
  by_type: { activity: number; event: number; bonus: number };
}

export interface PointsMeta extends PageMeta {
  summary: PointsSummary;
}

export interface ScoringRules {
  version: string;
  season: Season | null;
  table: Record<ActivityLevel, Record<ActivityResult, number>>;
  levels: Record<ActivityLevel, string>;
  results: Record<ActivityResult, string>;
  notes: string[];
  eligibility: string;
  tie_break: string[];
}

export interface LeaderboardEntry {
  rank: number;
  points: number;
  verified_activities: number;
  eligible: boolean;
  student: StudentSummary;
}

export interface Leaderboard {
  season: Season | null;
  period: 'season' | 'all_time';
  status: 'final' | 'provisional';
  scope_label: string;
  entries: LeaderboardEntry[];
  me: { rank: number | null; points: number; verified_activities: number; eligible: boolean; min_activities: number };
}

export interface RewardItem {
  id: number;
  rank: number;
  title: string;
  description: string | null;
  image_url: string | null;
  status: 'announced' | 'announcing_soon';
}

export interface RewardClaim {
  id: number;
  rank: number;
  status: 'available' | 'requested' | 'under_review' | 'approved' | 'prepared' | 'dispatched' | 'completed' | 'rejected' | 'expired' | string;
  status_label: string;
  stage_index: number;
  stages: string[];
  season: { id: number; name: string } | null;
  reward: { title: string; description: string | null; image_url: string | null } | null;
  claim_deadline: string | null;
  requested_at: string | null;
  delivery_reference: string | null;
  delivery: { name: string | null; phone: string | null; address: string | null };
  history: { status: string; note: string | null; at: string }[];
}

export interface RewardsOverview {
  season: Season | null;
  items: RewardItem[];
  claims: RewardClaim[];
}

// ───────────────────────────── Modules ─────────────────────────────

export type ChallengeTab = 'ongoing' | 'upcoming' | 'completed' | 'mine';

export interface Challenge {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  category: Category | null;
  starts_at: string;
  ends_at: string;
  days_left: number;
  state: 'upcoming' | 'ongoing' | 'ended';
  target: number;
  progress: number;
  badge: { name: string; icon: string; colour: string } | null;
  participants: number;
  joined: boolean;
  completed: boolean;
}

export interface ChallengeDetail extends Challenge {
  instructions: string | null;
  my_submissions: { id: number; title: string; content_status: ContentStatus; submitted_at: string | null }[];
}

export type EventTab = 'upcoming' | 'completed' | 'mine';

export interface EventRegistration {
  code: string;
  status: 'registered' | 'waitlisted' | 'attended' | 'cancelled' | string;
  team_name: string | null;
  result: ActivityResult | null;
  result_verified: boolean;
  registered_at: string;
  /** 0 Registered · 1 Event started · 2 Attendance confirmed · 3 Result under review · 4 Points approved · 5 Points credited */
  stage: number;
}

export interface AppEvent {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  category: Category | null;
  level: ActivityLevel;
  level_label: string;
  starts_at: string;
  ends_at: string | null;
  registration_closes_at: string | null;
  venue: string | null;
  venue_hidden: boolean;
  organizer: string | null;
  eligibility: string | null;
  capacity: number | null;
  registered_count: number;
  spots_left: number | null;
  team_event: boolean;
  status: 'upcoming' | 'completed' | 'cancelled' | string;
  results_status: string | null;
  points: Partial<Record<ActivityResult, number>>;
  registration: EventRegistration | null;
  rules?: string | null;
}

export interface EventLeaderboard {
  event: { id: number; title: string };
  status: string | null;
  entries: {
    rank: number;
    student: StudentSummary;
    result: ActivityResult;
    result_label: string;
    points: number;
    verified: boolean;
  }[];
}

export interface Achievement {
  id: number;
  name: string;
  description: string | null;
  bucket: string | null;
  icon: string | null;
  colour: string | null;
  earned: boolean;
  earned_at: string | null;
  certificate_code: string | null;
}

export interface AchievementDetail extends Achievement {
  activity: { id: number; title: string } | null;
  challenge: { id: number; title: string } | null;
  verify_url: string | null;
}

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  colour: string | null;
  category: Category | null;
  target: number;
  progress: number;
  period: 'weekly' | 'monthly';
  period_label: string;
  period_starts: string;
  period_ends: string;
  deadline: string | null;
  reminder: boolean;
  status: 'active' | 'paused' | string;
  achieved: boolean;
  completed_at: string | null;
  activities?: { id: number; title: string; occurred_on: string }[];
}

export interface GoalInput {
  title?: string;
  description?: string | null;
  icon?: string | null;
  colour?: string | null;
  category_id?: number | null;
  target?: number;
  period?: 'weekly' | 'monthly';
  deadline?: string | null;
  reminder?: boolean;
  status?: 'active' | 'paused';
}
