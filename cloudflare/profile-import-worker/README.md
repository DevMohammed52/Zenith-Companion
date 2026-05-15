# Zenith Profile Import Worker

Cloudflare Worker scaffold for optional IdleMMO profile imports.

This Worker is intentionally separate from the Vercel frontend and the GitHub
Actions public-data scraper. It should never become a generic IdleMMO API proxy.

## Current Scope

Implemented:

- `GET /health`
- `POST /internal/scraper-status`
- `POST /profile-import/start`
- `GET /profile-import/status/:jobId`
- CORS allowlist
- coordinator bearer-secret check
- D1-backed import job creation
- D1 cooldown checks
- queue caps
- KV-backed GitHub scraper/guild active-state detection
- encrypted short-lived target hash storage
- scheduled/manual processing for baseline imports
- root `information`, `metrics`, `pets`, `museum`, and `characters`
- visible alt `information`, `metrics`, `pets`, and `museum`
- sanitized `ImportedProfileDraft`-compatible result envelopes
- local route tests

Not implemented yet:

- Turnstile frontend wiring
- effects/current-action imports

Before public release, enable Turnstile or an equivalent challenge in the
frontend. The Worker has cooldowns, queue caps, and a shared IdleMMO request
budget, but automated browser traffic should still be challenged before it can
create import jobs.

## Setup

1. Copy `wrangler.toml.example` to `wrangler.toml`.
2. Create the D1 database:

```bash
npx wrangler d1 create zenith_profile_import
```

3. Put the returned `database_id` into `wrangler.toml`.
4. Create the KV namespace:

```bash
npx wrangler kv namespace create ZENITH_COORDINATOR
```

5. Put the returned namespace id into `wrangler.toml`.
6. Or generate `wrangler.toml` from the example without editing by hand:

```powershell
$env:D1_DATABASE_ID="..."
$env:KV_NAMESPACE_ID="..."
$env:ALLOWED_ORIGINS="https://your-vercel-domain.vercel.app,http://localhost:3000"
npm run prepare:config
```

`wrangler.toml` is gitignored. Keep `wrangler.toml.example` committed.

7. Apply the D1 migration:

```bash
npx wrangler d1 migrations apply zenith_profile_import
```

8. Set secrets:

```bash
npx wrangler secret put IDLEMMO_API_KEY
npx wrangler secret put SCRAPER_COORDINATOR_SECRET
npx wrangler secret put IMPORT_SIGNING_SECRET
npx wrangler secret put IMPORT_ENCRYPTION_SECRET
npx wrangler secret put TURNSTILE_SECRET_KEY
```

`TURNSTILE_SECRET_KEY` is optional for local development, but should be set for
production once the frontend sends Turnstile tokens.

`IDLEMMO_IMPORT_DELAY_MS` defaults to `1800`, which keeps a single baseline job
near the intended idle-mode request budget. `IMPORT_BASELINE_REQUEST_CAP`
defaults to `45`, and `IMPORT_MUSEUM_MAX_PAGES_PER_CHARACTER` defaults to `8`
so museum pagination cannot become unbounded. Do not reduce the delay or raise
these caps in production unless the Cloudflare coordinator is already protecting
the GitHub workflows.

## GitHub Workflow Coordinator

After the Worker is deployed, add these GitHub repository secrets:

```text
SCRAPER_COORDINATOR_URL=https://your-worker.your-subdomain.workers.dev
SCRAPER_COORDINATOR_SECRET=<same value as the Worker secret>
```

The repository workflows report only start/finish state. They do not send the
IdleMMO API key, scraped data, profile hashes, or raw API payloads.

If these secrets are missing, workflows skip coordinator pings and continue
refreshing public data normally. Cloudflare imports should treat missing/stale
coordinator state as conservative budget mode.

## Local Test

```bash
npm install
npm test
```

The tests use in-memory KV/D1 stubs and do not call IdleMMO.

## Security Rules

- Do not expose `IDLEMMO_API_KEY` to Vercel or the browser.
- Do not add a generic proxy endpoint.
- Do not log full character hash IDs.
- Do not return raw IdleMMO payloads.
- Store import jobs/results short-term only.
- Keep final accepted profiles in browser `localStorage`.
- Treat stale coordinator state as conservative budget mode.
