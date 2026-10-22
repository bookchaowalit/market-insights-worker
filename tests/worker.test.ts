import assert from 'node:assert/strict';
import { test } from 'node:test';
import generated from '../worker.js';
import worker, { type Env } from '../src/worker.js';

const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} };
type Handler = { fetch(request: Request, env: Env, ctx: object): Promise<Response> };

test('the Sentry-wrapped entry serves the generated pages unchanged when SENTRY_DSN is unset', async () => {
  for (const path of ['/', '/jobs', '/nope']) {
    const request = new Request(`https://insights.example${path}`);
    const wrapped = await (worker as unknown as Handler).fetch(request, {}, ctx);
    const direct = await generated.fetch(new Request(request.url));
    assert.equal(wrapped.status, direct.status, path);
    assert.equal(wrapped.headers.get('cache-control'), direct.headers.get('cache-control'), path);
    assert.equal(await wrapped.text(), await direct.text(), path);
  }
});
