# market-insights-worker — Product Brief

Status on 2026-10-22: **built, not live.** `https://solo-empire-insights.bookchaowalit.workers.dev/` answers
`404` with Cloudflare `error code: 1042` (no Worker serving that name), and nothing deploys from `main`: there is
no deploy workflow and no Cloudflare Git integration. The pages embedded in `worker.js` are a snapshot generated
on 2026-07-07. The GitHub Pages copy (`bookchaowalit.github.io/solo-empire-insights/`) also answers `404`.

## Who it is for

The owner: a free-hosted place to read the dashboards that the scrapers produce. No other users.

## What exists

| Capability | Detail |
|---|---|
| Pages | 12 static HTML dashboards (overview, crypto, exchange rates, stocks, DeFi, GitHub trending, jobs, flights, opportunities, property, SEO, AI tools), Chart.js from jsDelivr |
| Routes | `/`, `/index`, `/index.html` and `/<page>`; a trailing slash is ignored; one-hour public cache on known routes |
| Fallback | any unknown path returns the overview page with status `200` and no cache header (soft 404; pinned by a test, not changed) |
| Generation | `worker.js` is written by `scripts/publish_pages.py` in `bookchaowalit/career-job-scraper` (`--generate-only`), then copied here |
| Entry | `src/worker.ts` wraps the generated worker; `wrangler.toml` points `main` at it |
| Error reporting | Sentry (`@sentry/cloudflare`) when the `SENTRY_DSN` secret is set; errors only, events reduced to an allowlist (no URL, headers or IP) |
| Checks | `npm run typecheck` (strict), `npm test` (4 files in `tests/`), `npm run build` (Wrangler dry-run bundle); shared CI on every push |

## How to run

```bash
npm ci
npm test
npm run build              # wrangler deploy --dry-run --outdir dist
npx wrangler dev --local   # serves the pages on localhost
```

Deploying is an owner action (`npx wrangler deploy`). Note: `publish_pages.py` deploys its own generated file
with `--compatibility-date 2024-01-01` and without this wrapper, so a deploy from that script skips Sentry.

## AI

None. The Worker serves static HTML and calls no model or external API.

## Limits

- Data is a static snapshot; nothing refreshes it automatically.
- `worker.js` must not be edited by hand; regenerate it instead.
- Disposition: personal showcase (product card verdict `showcase`). Recommendation for the owner: either redeploy
  or record it as an archive candidate, since the live URL is gone.
