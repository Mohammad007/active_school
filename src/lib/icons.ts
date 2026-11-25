import { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

/** Server-provided icon names (badges, categories, notifications) mapped safely to Ionicons. */
const ALIASES: Record<string, IconName> = {
  trophy: 'trophy',
  medal: 'medal',
  ribbon: 'ribbon',
  star: 'star',
  heart: 'heart',
  chatbubble: 'chatbubble',
  calendar: 'calendar',
  gift: 'gift',
  flag: 'flag',
  sports: 'football',
  football: 'football',
  art: 'color-palette',
  arts: 'color-palette',
  music: 'musical-notes',
  science: 'flask',
  academics: 'school',
  book: 'book',
  reading: 'book',
  environment: 'leaf',
  leaf: 'leaf',
  community: 'people',
  cultural: 'sparkles',
  dance: 'body',
  tech: 'hardware-chip',
  technology: 'hardware-chip',
  check: 'checkmark-circle',
  bell: 'notifications',
};

export function iconName(name: string | null | undefined, fallback: IconName = 'ribbon'): IconName {
  if (!name) return fallback;
  const key = name.trim().toLowerCase().replace(/^(ion-|ionicons?:|bi-|fa-)/, '');
  if (key in Ionicons.glyphMap) return key as IconName;
  return ALIASES[key] ?? fallback;
}
