// Sentry settings for the Worker (@sentry/cloudflare).
// Errors only: no tracing, no trace headers, no breadcrumbs. Allowlist scrubber:
// the event is rebuilt from exception type, frame locations and runtime name/version.
// This Worker throws no static messages of its own, so every exception value and
// event message is sent as "[redacted]" (free text can carry the visitor's URL and
// query string); linked cause errors keep their type only. Request, headers, IP,
// cookies, user, tags, extra and frame locals are never sent.

export const REDACTED = '[redacted]';

type Json = Record<string, unknown>;

const EVENT_FIELDS = ['event_id', 'timestamp', 'platform', 'level', 'logger', 'release', 'environment'] as const;
const FRAME_FIELDS = ['filename', 'function', 'module', 'lineno', 'colno', 'in_app'] as const;

const isRecord = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);

function pick(source: Json, fields: readonly string[]): Json {
  const out: Json = {};
  for (const field of fields) if (source[field] !== undefined) out[field] = source[field];
  return out;
}

function scrubException(value: unknown): Json | null {
  if (!isRecord(value)) return null;
  const out = pick(value, ['type']);
  const mechanism = isRecord(value.mechanism) ? value.mechanism : undefined;
  const isCause = mechanism?.type === 'chained' || mechanism?.source !== undefined;
  if (value.value !== undefined && !isCause) out.value = REDACTED;
  if (mechanism) out.mechanism = pick(mechanism, ['type', 'handled']);
  if (isRecord(value.stacktrace) && Array.isArray(value.stacktrace.frames)) {
    out.stacktrace = { frames: value.stacktrace.frames.filter(isRecord).map((frame) => pick(frame, FRAME_FIELDS)) };
  }
  return out;
}

export function scrubEvent<T extends object>(input: T): T {
  const source = input as Json;
  const out = pick(source, EVENT_FIELDS);
  if (source.message !== undefined) out.message = REDACTED;
  if (isRecord(source.exception) && Array.isArray(source.exception.values)) {
    out.exception = { values: source.exception.values.map(scrubException).filter((v): v is Json => v !== null) };
  }
  if (isRecord(source.contexts) && isRecord(source.contexts.runtime)) {
    out.contexts = { runtime: pick(source.contexts.runtime, ['name', 'version']) };
  }
  if (isRecord(source.sdk)) out.sdk = pick(source.sdk, ['name', 'version']);
  return out as T;
}

export function sentryOptions(env: { SENTRY_DSN?: string }) {
  const dsn = (env.SENTRY_DSN || '').trim() || undefined;
  return {
    dsn,
    enabled: Boolean(dsn),
    tracesSampleRate: undefined,
    tracePropagationTargets: [] as string[],
    maxBreadcrumbs: 0,
    beforeSend: scrubEvent,
    beforeSendTransaction: () => null,
  };
}
