/* Options shared by the Genesis Roulette feedback form, its API and the admin view. */

export const FEEDBACK_KINDS = ["bug", "playtest"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const BUG_AREAS = [
  "Install or launch",
  "Redeem code or login",
  "Crash or freeze",
  "Gameplay",
  "Controls",
  "User interface or menus",
  "Graphics",
  "Audio",
  "Performance or lag",
  "Online or connection",
  "Text or translation",
  "Other",
] as const;

export const SEVERITIES = [
  { value: "blocker", label: "Blocker", hint: "Crash, freeze or cannot keep playing" },
  { value: "major", label: "Major", hint: "A feature is broken but I can keep playing" },
  { value: "minor", label: "Minor", hint: "Something is wrong but easy to work around" },
  { value: "cosmetic", label: "Cosmetic", hint: "Visual, text or sound glitch only" },
] as const;

export const FREQUENCIES = [
  { value: "always", label: "Every time" },
  { value: "often", label: "Often" },
  { value: "sometimes", label: "Sometimes" },
  { value: "once", label: "Happened once" },
] as const;

export const DIFFICULTIES = [
  { value: "too_easy", label: "Too easy" },
  { value: "bit_easy", label: "A bit easy" },
  { value: "just_right", label: "Just right" },
  { value: "bit_hard", label: "A bit hard" },
  { value: "too_hard", label: "Too hard" },
] as const;

export const PLAY_TIMES = ["Under 15 minutes", "15 to 30 minutes", "30 to 60 minutes", "1 to 3 hours", "More than 3 hours"] as const;

export const KEEP_PLAYING = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
] as const;

export const RATINGS = [
  { key: "rating_overall", label: "Overall" },
  { key: "rating_fun", label: "Fun" },
  { key: "rating_controls", label: "Controls" },
  { key: "rating_visuals", label: "Visuals" },
  { key: "rating_performance", label: "Performance" },
] as const;
export type RatingKey = (typeof RATINGS)[number]["key"];

/* Builds a tester may be playing. The newest one is the default. */
export const KNOWN_BUILDS = ["0.2.1"] as const;

export const STATUSES = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "confirmed", label: "Confirmed" },
  { value: "fixed", label: "Fixed" },
  { value: "duplicate", label: "Duplicate" },
  { value: "wont_fix", label: "Won’t fix" },
] as const;
export type FeedbackStatus = (typeof STATUSES)[number]["value"];

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

export const labelOf = <T extends { value: string; label: string }>(list: readonly T[], value: string | null | undefined) =>
  list.find((item) => item.value === value)?.label ?? value ?? "—";

export type FeedbackReport = {
  id: number;
  kind: FeedbackKind;
  created_at: string;
  name: string | null;
  email: string;
  claim_id: number | null;
  code_verified: number;
  platform: "android" | "windows" | null;
  device: string | null;
  os_version: string | null;
  build: string | null;
  title: string | null;
  area: string | null;
  severity: string | null;
  frequency: string | null;
  steps: string | null;
  expected: string | null;
  actual: string | null;
  media_link: string | null;
  play_time: string | null;
  rating_overall: number | null;
  rating_fun: number | null;
  rating_controls: number | null;
  rating_visuals: number | null;
  rating_performance: number | null;
  difficulty: string | null;
  liked: string | null;
  frustrated: string | null;
  suggestions: string | null;
  keep_playing: string | null;
  recommend: number | null;
  notes: string | null;
  status: FeedbackStatus;
  admin_note: string | null;
};

export type FeedbackFile = { id: number; report_id: number; content_type: string; size: number; original_name: string | null };
