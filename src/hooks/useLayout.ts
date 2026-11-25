import { useWindowDimensions } from 'react-native';

import { MaxContentWidth, MaxWideWidth, ScreenPadding } from '@/theme';

/**
 * Responsive helpers. Phones get full-width content; tablets (shortest side
 * >= 600dp) get content centred at MaxContentWidth.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const contentWidth = Math.min(width, MaxContentWidth);
  /** Horizontal inset that centres MaxContentWidth content on wide screens. */
  const sideInset = Math.max(0, (width - MaxContentWidth) / 2);

  /** Grid columns for a target tile width, clamped to [min, max]. */
  const columns = (tile: number, min = 2, max = 6, available = contentWidth) =>
    Math.max(min, Math.min(max, Math.floor(available / tile)));

  /** Width available to grid screens (wider than reading width on tablets). */
  const wideWidth = Math.min(width, MaxWideWidth);
  /**
   * Card columns for list screens: 1 on phones, 2 on tablets, 3 on wide
   * landscape tablets. `tile` is the narrowest a card may get.
   */
  const cardColumns = (tile = 340, max = 3) => (width < 600 ? 1 : Math.max(1, Math.min(max, Math.floor((wideWidth - ScreenPadding) / tile))));

  return { width, height, isTablet, isLandscape, contentWidth, sideInset, columns, wideWidth, cardColumns, gutter: ScreenPadding };
}
