import assert from 'node:assert/strict';
import { test } from 'node:test';
import generated from '../worker.js';

const get = (path: string) => generated.fetch(new Request(`https://insights.example${path}`));

const ROUTES: Record<string, string> = {
  '/crypto': 'Crypto',
  '/exchange_rates': 'Exchange',
  '/stocks': 'Stock',
  '/defi': 'DeFi',
  '/github_trending': 'GitHub',
  '/jobs': 'Job',
  '/flights': 'Flight',
  '/opportunities': 'Opportunit',
  '/property': 'Real Estate',
  '/seo': 'SEO',
  '/ai_tools': 'AI Tools',
};

test('every route serves its own HTML page with a one-hour public cache', async () => {
  for (const [path, word] of Object.entries(ROUTES)) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8', path);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=3600', path);
    const html = await response.text();
    assert.match(html, /^<!DOCTYPE html>/, path);
    assert.match(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '', new RegExp(word, 'i'), path);
  }
});

test('the home page answers on /, /index and /index.html, and a trailing slash is ignored', async () => {
  const home = await (await get('/')).text();
  assert.match(home, /<title>[^<]*Insights/i);
  for (const path of ['/index', '/index.html', '/crypto/']) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
  }
  assert.equal(await (await get('/index.html')).text(), home);
  assert.equal(await (await get('/crypto/')).text(), await (await get('/crypto')).text());
});

test('unknown paths fall back to the home page (status 200, no cache header) and never echo the path', async () => {
  const home = await (await get('/')).text();
  const response = await get('/%3Cscript%3Ealert(1)%3C/script%3E?q=<b>x</b>');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), null);
  const body = await response.text();
  assert.equal(body, home);
  assert.doesNotMatch(body, /alert\(1\)/);
});
