/** Display formatting. The API sends ISO strings (timestamps) and YYYY-MM-DD (dates). */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  // Plain dates are calendar dates: read them as local, not UTC.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** 4 Nov 2026 */
export function formatDate(value: string | null | undefined, withYear = true): string {
  const d = parse(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
}

/** 3:30 PM */
export function formatTime(value: string | null | undefined): string {
  const d = parse(value);
  if (!d) return '';
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** 4 Nov, 3:30 PM */
export function formatDateTime(value: string | null | undefined): string {
  const d = parse(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${formatTime(value)}`;
}

/** Short month name + day parts for calendar tiles. */
export function dateParts(value: string | null | undefined): { day: string; month: string; weekday: string } {
  const d = parse(value);
  if (!d) return { day: '', month: '', weekday: '' };
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()].toUpperCase(), weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] };
}

/** just now · 5m · 3h · 2d · 4 Nov */
export function timeAgo(value: string | null | undefined): string {
  const d = parse(value);
  if (!d) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return formatDate(value, d.getFullYear() !== new Date().getFullYear());
}

/** Local calendar date as YYYY-MM-DD (what the API expects for dates). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function today(): string {
  return toIsoDate(new Date());
}

/** Parse DD/MM/YYYY (or YYYY-MM-DD) typed by the user. Returns YYYY-MM-DD or null. */
export function parseUserDate(input: string): string | null {
  const s = input.trim();
  let y: number;
  let m: number;
  let d: number;
  let match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (match) {
    d = Number(match[1]);
    m = Number(match[2]);
    y = Number(match[3]);
  } else {
    match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (!match) return null;
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return toIsoDate(date);
}

/** YYYY-MM-DD → DD/MM/YYYY for editing. */
export function toUserDate(iso: string | null | undefined): string {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Auto-insert slashes while typing a DD/MM/YYYY date. */
export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** 1,234 · 12.5k */
export function compactNumber(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 100000) return `${Math.round(v / 1000)}k`;
  if (v >= 10000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return v.toLocaleString('en-IN');
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Strip HTML from CMS bodies for plain-text rendering. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
