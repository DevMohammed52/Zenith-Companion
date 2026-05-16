# Security Boundaries

Updated: 2026-05-16

This file defines what must stay private and where data is allowed to live.

## Secrets

Never commit or expose:

- `IDLEMMO_API_KEY`
- Cloudflare API tokens
- Cloudflare Worker secrets
- `SCRAPER_COORDINATOR_SECRET`
- Admin dashboard password/token secrets
- Vercel tokens
- GitHub tokens
- `.env` or `.env.local`

Secrets belong in:

- GitHub repository secrets for GitHub Actions.
- Cloudflare Worker secrets for the profile import backend and coordinator.
- Vercel environment variables only for values the Vercel app actually needs.
- Local `.env` files for development only.

## Public Data

Allowed public data:

- Cleaned/generated IdleMMO market, item, pet, enemy, guild, conquest, route, and derived JSON intended for all users.
- Static assets, icons, manifest, sitemap, robots.

Public data must not include:

- Raw private API responses.
- User-entered profile hashes beyond intentionally sanitized display tails.
- Full imported character profile payloads saved from users.
- API keys or server secrets.
- Local test profiles or browser localStorage dumps.

## Profile Import Data

The intended flow:

- Browser sends only a character hashed ID to Cloudflare.
- Cloudflare uses the server-side IdleMMO API key.
- Cloudflare returns sanitized import drafts and missing/private section metadata.
- Browser saves the reviewed result in localStorage.

Server-side storage should be short-lived only:

- Job ID and status.
- Queue/cooldown/rate-limit state.
- Sanitized job result while the user is reviewing it.
- Aggregate health metrics that do not include names, hashes, pets, museum records, or raw payloads.

Do not permanently store full imported profile data on Cloudflare, Vercel, or GitHub unless the architecture is explicitly changed.

## Admin And Internal Routes

- `/admin/*` is private operations UI. Keep it hidden from normal navigation.
- `/admin/*` should be `noindex,nofollow`, excluded from sitemap, and blocked in robots.
- `/api/admin/*` must require server-side secrets and must not leak Worker credentials to the browser.
- Internal scraper coordinator endpoints must require `Authorization: Bearer <secret>`.

## Abuse And Limit Protection

- Profile import must use global rate limiting/cooldowns.
- Do not let each browser tab independently fire IdleMMO API requests.
- Use queueing and retry-after messages instead of rapid retries.
- Keep Cloudflare/Vercel usage free-tier friendly by storing small records and avoiding per-request KV writes unless intentionally designed.

## Git And Logs

- Before commits, inspect staged files for secrets and raw data.
- Logs should not contain full API keys, full profile hashes, or raw private payloads.
- If a secret is accidentally committed or exposed, rotate it. Deleting the file later is not enough.
