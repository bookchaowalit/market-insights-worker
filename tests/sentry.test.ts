import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scrubEvent, sentryOptions } from '../src/sentry.js';

test('Sentry stays off when SENTRY_DSN is unset or blank', () => {
  assert.equal(sentryOptions({}).enabled, false);
  assert.equal(sentryOptions({ SENTRY_DSN: ' ' }).dsn, undefined);
});

test('errors only: no tracing, trace headers or breadcrumbs, default PII left off', () => {
  const options = sentryOptions({ SENTRY_DSN: 'https://key@o0.ingest.sentry.io/1' });
  assert.equal(options.enabled, true);
  assert.notEqual((options as { sendDefaultPii?: boolean }).sendDefaultPii, true);
  assert.equal(options.tracesSampleRate, undefined);
  assert.deepEqual(options.tracePropagationTargets, []);
  assert.equal(options.maxBreadcrumbs, 0);
});

test('events keep only allowlisted fields: no request, user, IP, extra or frame locals', () => {
  const event: Record<string, unknown> = scrubEvent({
    event_id: 'e1',
    level: 'error',
    request: { url: 'https://insights.example/jobs?email=a@b.c', headers: { 'cf-connecting-ip': '1.2.3.4', cookie: 'c=1' } },
    user: { ip_address: '1.2.3.4' },
    breadcrumbs: [{ message: 'fetch' }],
    extra: { body: 'raw' },
    contexts: { runtime: { name: 'cloudflare' }, culture: { locale: 'th' } },
    exception: { values: [{ type: 'Error', value: 'boom', stacktrace: { frames: [{ function: 'fetch', lineno: 1, vars: { request: 'x' } }] } }] },
  });
  assert.equal(event.event_id, 'e1');
  for (const key of ['request', 'user', 'breadcrumbs', 'extra']) assert.equal(event[key], undefined, key);
  assert.deepEqual(Object.keys(event.contexts as object), ['runtime']);
  assert.doesNotMatch(JSON.stringify(event), /1\.2\.3\.4|a@b\.c|cookie|vars/);
});

test('exception and event messages are redacted (this Worker throws no static app messages); type is kept', () => {
  const event = scrubEvent({
    message: 'GET /jobs?email=a@b.c failed',
    exception: {
      values: [
        { type: 'TypeError', value: "Cannot read properties of undefined (reading 'https://insights.example/jobs?email=a@b.c')" },
        { type: 'Error', value: 'cause text', mechanism: { type: 'chained', source: 'cause', handled: true } },
      ],
    },
  }) as { message?: string; exception: { values: { type?: string; value?: string }[] } };
  assert.equal(event.message, '[redacted]');
  assert.deepEqual(event.exception.values.map((v) => [v.type, v.value]), [['TypeError', '[redacted]'], ['Error', undefined]]);
});

test('tags and cloud_resource context are dropped; runtime keeps only name and version', () => {
  const event = scrubEvent({
    tags: { url: 'https://insights.example/jobs?email=a@b.c' },
    contexts: { runtime: { name: 'cloudflare', version: '1', extra: 'x' }, cloud_resource: { 'cloud.region': 'SIN', 'host.id': 'h-1' } },
  }) as Record<string, unknown>;
  assert.equal(event.tags, undefined);
  assert.deepEqual(event.contexts, { runtime: { name: 'cloudflare', version: '1' } });
});
