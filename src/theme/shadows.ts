import { Platform } from 'react-native';

import { Colors } from './colors';

/** Very subtle elevation; most surfaces rely on hairline borders instead. */
export const Shadows = {
  card: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(15,23,42,0.06)' },
    ios: { shadowColor: Colors.ink, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    default: { elevation: 1 },
  }),
  raised: Platform.select({
    web: { boxShadow: '0 6px 18px rgba(3,50,136,0.22)' },
    ios: { shadowColor: Colors.primary, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    default: { elevation: 6 },
  }),
} as const;
