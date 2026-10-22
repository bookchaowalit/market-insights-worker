// Sentry settings for the Worker (@sentry/cloudflare).
// Errors only: no tracing, no trace headers, no breadcrumbs, and an allowlist
// so nothing from the visitor's request (URL, headers, IP, cookies) is sent.

const EVENT_KEYS = new Set(['event_id', 'timestamp', 'platform', 'level', 'logger', 'release', 'environment', 'exception', 'message', 'tags', 'sdk', 'contexts']);
const CONTEXT_KEYS = new Set(['runtime', 'cloud_resource']);
const FRAME_KEYS = new Set(['filename', 'function', 'module', 'lineno', 'colno', 'in_app']);

type Frame = Record<string, unknown>;
type ScrubbableEvent = Record<string, unknown> & {
  contexts?: Record<string, unknown>;
  exception?: { values?: { stacktrace?: { frames?: Frame[] } }[] };
};

export function scrubEvent<T extends object>(input: T): T {
  const event = input as ScrubbableEvent;
  for (const key of Object.keys(event)) if (!EVENT_KEYS.has(key)) delete event[key];
  if (event.contexts) {
    for (const key of Object.keys(event.contexts)) if (!CONTEXT_KEYS.has(key)) delete event.contexts[key];
  }
  for (const value of event.exception?.values ?? []) {
    for (const frame of value.stacktrace?.frames ?? []) {
      for (const key of Object.keys(frame)) if (!FRAME_KEYS.has(key)) delete frame[key];
    }
  }
  return input;
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
  };
}
