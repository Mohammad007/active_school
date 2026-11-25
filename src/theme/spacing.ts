/** 8pt spacing scale (with a 4 half-step). */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const ScreenPadding = Spacing.lg;

/** Max readable content width; content is centred on tablets. */
export const MaxContentWidth = 640;

/** Max width for grid screens (feed, challenges, events) on tablets. */
export const MaxWideWidth = 1160;

/** Minimum touch target. */
export const HitSize = 44;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;
