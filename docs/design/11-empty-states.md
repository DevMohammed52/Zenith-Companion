# Zenith Design Standards: Empty States & Error Tone

This document defines the taxonomy, messaging tone, live region updates, and offline resilience rules for empty states across Zenith Companion.

## 1. Distinct State Taxonomy
* **Bespoke Empty Cases**: Treat each empty state as a distinct case with bespoke copy and icons.
  * Search miss: `searchEmpty` (`SearchX`) with actionable button to clear query.
  * Unlinked profile: `emptyInbox` (`Inbox`) with direct action link to `/profiles`.
  * System fault: `error` (`AlertCircle`) with retry action.
  * Network disconnection: `offline` (`WifiOff`) with cached data explanation.
* **Never Conflate Zero-Results with System Errors**: Users must instantly distinguish "nothing found" from "something broke".

## 2. Action Limits & Clear Copy
* **Single Primary Action Limit**: Show at most one primary call-to-action button. Purely informational empty states (e.g. an empty queue that populates automatically) must have none.
* **Direct Cause & Remedy Copy**: State the exact cause and the remedy in plain gamer terminology (e.g. "No items match 'glimmer'. Clear the search to see all items"), never generic phrases ("Oops!", "Whoops!", "Nothing here!").
* **Query Echoing**: Always echo the active search string back to the user and suggest concrete fixes (clear search, reset quality filters, verify spelling).

## 3. Accessibility & Loading Guards
* **Live Region Status Updates**: Apply `role="status"` and `aria-live="polite"` to containers when results dynamically update to empty without a page load (WCAG 2.2 SC 4.1.3).
* **Anti-Flash Loading Guard**: Never render or flash an empty state while data is actively fetching. A loading indicator or skeleton screen must persist until data resolution completes, preventing false panic.
* **Transparent Offline Messaging**: When clearing cache or operating offline, explicitly state what was purged (cached images, market history), what was preserved (linked profiles, custom prices), and that fresh data will re-download automatically upon reconnection.
