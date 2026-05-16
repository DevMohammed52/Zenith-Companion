# Current Release Context

Updated: 2026-05-16

Use this as the short handoff for the current large release.

## Release Focus

This release adds or stabilizes:

- Optional IdleMMO profile import through Cloudflare.
- Multi-character profile handling with visible alts.
- Museum import support for the main hash and visible alts.
- Guild Database and Conquest pages.
- Forge planner, Museum page, and BIS recommender work.
- Broad UI polish across database, planning, and world/combat pages.
- Metadata, favicon, manifest, robots, sitemap, and private admin `noindex`.

## Remaining Product Work

- Final Combat page/rework.
- Tutorial/onboarding flow.
- Final release smoke test across desktop and mobile.
- Better final brand icon later; current icon is acceptable but not final-brand quality.

## Profile Import State

- The intended backend is Cloudflare Workers, not Vercel or GitHub Actions.
- Users enter a character hashed ID only. Users never provide an IdleMMO API key.
- The Worker fetches root character data and visible alts, normalizes/sanitizes, then the browser reviews and saves to local profiles.
- Final profile data is stored in the browser, not committed to GitHub and not permanently stored server-side.
- Manual profile overrides must be preserved unless the user explicitly overwrites them.
- Missing/private sections should be shown plainly to the user.

## Rate Limit Direction

- IdleMMO API limit is treated as 60 requests/minute.
- GitHub scrapers and Cloudflare imports should coordinate instead of assuming fixed idle windows.
- Current preferred approach is a Cloudflare-side coordinator:
  - GitHub workflows report scraper start/end with a shared secret.
  - Imports use a lower budget while scraper is active.
  - Imports can use a higher budget while scraper is idle.
  - Stale/unknown coordinator state falls back to conservative limits.
  - Any 429 should trigger cooldown/conservative behavior.

## Guild And Conquest Direction

- Guild Database is general guild discovery/details.
- Conquest is a separate richer page for conquest-specific status and analysis.
- "All guilds" discovery is guild-first, not conquest-first.
- Guild scraping should be incremental where possible because full discovery can be slow.

## Release Safety Checklist

- Inspect `git status --short` and staged diff before committing.
- Exclude local caches, raw API payloads, logs, screenshots, and secrets.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Restore unrelated generated churn from build scripts unless intentionally included.
- Smoke test profile import, profile switcher, guilds, conquest, key database pages, and mobile navigation.
- After deploy, check Vercel errors and Cloudflare import health.
