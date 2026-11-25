import type { IllustrationKey } from '@/theme';

const RULES: [RegExp, IllustrationKey][] = [
  [/basket|hoop|netball|volley/, 'basketball'],
  [/yoga|meditat|mindful|wellness|health|breath|stretch/, 'yoga'],
  [/run|race|athlet|marathon|step|walk|fitness|sprint|relay|track/, 'running'],
  [/foot|soccer|sport|cricket|hockey|match|cup|tournament|kabaddi|game/, 'football'],
];

/**
 * Pick a drawn illustration for a challenge, event or category from its
 * slug / title, so cards without an uploaded image still look alive.
 */
export function artFor(...hints: (string | null | undefined)[]): IllustrationKey {
  const text = hints.filter(Boolean).join(' ').toLowerCase();
  for (const [re, art] of RULES) if (re.test(text)) return art;
  return 'students';
}
