# Profile Import Notes

Updated: 2026-05-16

This is the compact public handoff for profile import work. The longer research notes currently live under ignored local planning files.

## Product Rules

- User-facing labels should say `Import from IdleMMO`, not `API import`.
- Users paste one character hashed ID, not a URL and never an API key.
- The UI should explain plainly that private/hidden sections cannot be fetched.
- Do not auto-apply silently. Let users review the imported characters and choose where to save them.
- Visible alts should remain available to save after one character is saved.
- Preserve manual overrides unless the user chooses to overwrite them.

## Backend Shape

- Vercel stays frontend/static app.
- Cloudflare Worker handles user-triggered imports.
- GitHub Actions remain responsible for broad public cache scraping.
- Browser localStorage stores the final profile data.
- Cloudflare stores only short-lived jobs/status/cache/cooldown data.

## Import Scope

Default import:

- Root character: information, metrics, pets, characters, museum.
- Visible alts: information, metrics, pets, museum.

Optional/later:

- Effects and current action.
- Any heavier sections that would increase request count or confuse the review UI.

## Rate Limit Behavior

- IdleMMO limit is treated as 60 requests/minute.
- Imports and GitHub scrapers should share a Cloudflare-side budget coordinator.
- If scraper is active, imports run slowly.
- If scraper is idle, imports can run faster.
- Unknown/stale coordinator state must fall back to conservative limits.
- After a 429, pause and retry later instead of hammering the API.

## Data Contract

- Worker returns sanitized drafts compatible with the frontend import normalizer.
- Worker must not return raw IdleMMO payloads.
- Worker must not send `fieldSources`; the local merge step owns that.
- Missing/private sections should be explicit and user-readable.

## Security

- `IDLEMMO_API_KEY` stays only in Cloudflare/GitHub server-side environments.
- Admin/health endpoints must not expose names, full hashes, raw results, pets, museum records, or API responses.
- Abuse controls should include cooldowns, queue limits, global rate limiting, and clear retry messages.
