# Zenith Companion Agent Guide

Read this before changing the repo. Zenith Companion is a production-facing IdleMMO tool, not a scratch app.

## First Steps

- Inspect `git status --short` before editing. Other chats may be working in the same tree.
- Read the task-relevant files before changing them. Do not overwrite unrelated dirty work.
- For broad context, read:
  - `docs/agent/codebase_map.md`
  - `docs/agent/current_release_context.md`
  - `docs/agent/security_boundaries.md`
- For profile import work, also read:
  - `docs/agent/profile_import_notes.md`

## Architecture Direction

- Prefer generated-data-driven pages. Heavy IdleMMO data should be fetched by scripts or GitHub Actions, committed as cleaned public JSON, then rendered lightly by the frontend.
- Keep presentation, state, and data transformation separate. Do not put scraper/API normalization logic directly into UI components.
- Reuse shared data contracts and profile helpers in `src/lib` instead of inventing parallel shapes.
- Use React context carefully. Avoid broad context updates that rerender large parts of the app.
- Keep user profile data browser-local unless a feature explicitly needs short-lived server job/status state.

## Security Rules

- Never expose `IDLEMMO_API_KEY`, Cloudflare tokens, GitHub tokens, Vercel tokens, or admin secrets to the browser.
- Normal users must never paste an IdleMMO API key into Zenith.
- Do not commit `.env`, `.env.local`, raw private API payloads, local profile data, temporary screenshots, or unreviewed local scraper output.
- Public generated data must be sanitized and intentional.
- `/admin/*` is private tooling and should stay hidden from navigation, excluded from sitemap, blocked in robots, and protected by server-side/admin secrets.

## UI Rules

- Keep wording plain and user-facing. Avoid AI-ish phrases like "market intelligence" or "companion suite" in public copy.
- Use custom controls that match the existing UI. Do not introduce vanilla browser selects unless the page already uses them intentionally.
- Prioritize compact, responsive layouts. Avoid wasted space, text collisions, and decorative clutter.
- Test desktop and mobile for frontend changes when practical.

## Verification

- Run `npx tsc --noEmit` for TypeScript changes.
- Run `npm run build` for App Router, metadata, generated-data, or route changes. If build scripts change generated cache files unrelated to the task, restore them unless the task intentionally updates that data.
- Use Playwright/browser checks for UI behavior, modals, dropdowns, responsive layouts, and anything the user will click.

## Git Discipline

- Stage only intended files. Many unrelated files may be dirty.
- Do not push unless the user explicitly asks.
- Before a release push, inspect diffs and make sure no local cache, secrets, logs, or raw user data are included.
