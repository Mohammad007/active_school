/** Error codes the server uses to gate a signed-in student (see EnsureAppStudent). */
export const GATE_CODES = ['onboarding_required', 'enrollment_pending', 'consent_pending', 'school_disabled'] as const;
export type GateCode = (typeof GATE_CODES)[number];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string[]>;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }

  /** First validation message for a field (also matches nested keys like `photo_ids.0`). */
  field(name: string): string | undefined {
    if (!this.fields) return undefined;
    if (this.fields[name]?.length) return this.fields[name][0];
    const key = Object.keys(this.fields).find((k) => k.startsWith(`${name}.`));
    return key ? this.fields[key][0] : undefined;
  }

  get isNetwork() {
    return this.code === 'network' || this.code === 'timeout';
  }

  get isGate() {
    return (GATE_CODES as readonly string[]).includes(this.code);
  }

  /** A module switched off for the student's school (ModulesController::guard → 403 forbidden). */
  get isFeatureOff() {
    return this.status === 403 && this.code === 'forbidden';
  }

  get isNotFound() {
    return this.status === 404;
  }
}

/** Human message for any thrown value. */
export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (e instanceof ApiError) return e.message || fallback;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

/** Map of field → first message, for forms (nested keys collapse to their base: `photo_ids.0` → `photo_ids`). */
export function fieldErrors(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError) || !e.fields) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e.fields)) {
    const base = k.split('.')[0];
    if (!out[base] && v?.length) out[base] = v[0];
  }
  return out;
}
