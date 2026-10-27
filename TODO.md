# Zenith Companion - Task Backlog & TODO

## 1. Profile Import Caching & Session Recovery Proposal

### Context & Problem Statement
* When a player imports their profile via a hashed ID (e.g. `VM29l7kQZZ0JbQ80q6WD` or `leApVoENkk32ZN7nRPy2`) and accidentally closes the browser tab or refreshes, their active in-memory state is lost.
* Re-importing currently triggers a complete Cloudflare Workers + D1 SQLite scrape cycle and Turnstile re-verification, consuming:
  - User API rate limit quota (IdleMMO limit: 60 req/min).
  - D1 SQLite database write/read operations.
  - 10–25s scrape lease lock.

---

### Architectural Design: Two-Tier Caching Model

#### Tier 1: Client-Side Tab Recovery (Immediate & Zero Cost)
* **Storage Target**: Browser `localStorage` / `sessionStorage` under `zenith_imported_profiles_v1`.
* **Mechanism**:
  - Automatically persist the last active imported profile and timestamp upon successful import.
  - On page load / return, detect if cached profile matches the URL/state and restore instantly without network requests.
  - Add an explicit **"Refresh Data"** / **"Force Re-fetch"** button to allow players to bypass local cache when their in-game state has changed.
* **Benefits**:
  - Instant (0ms) recovery from accidental tab closures.
  - Zero Cloudflare Worker, D1, or IdleMMO API overhead.

#### Tier 2: Cloudflare Edge D1 Cache with Configurable TTL
* **Storage Target**: Existing D1 `profiles` table.
* **Mechanism**:
  - Store a `last_updated_at` timestamp with each completed profile record in D1.
  - Set a cache validity TTL (e.g., 15 minutes or 1 hour).
  - If a player or duplicate client requests an import for the same hashed ID within the TTL window, return the cached record immediately (`HTTP 200 { cached: true, age: ... }`) instead of initiating a 4-step scraper job.
  - Support a `?force=true` query flag or bypass header when the user explicitly triggers "Force Refresh".
* **Benefits**:
  - Protects the 60 req/min IdleMMO API rate limit.
  - Eliminates redundant queue congestion on D1 workers.
  - Reduces import latency from ~15s to < 200ms for repeated queries.

---

### Implementation Milestones (For Future Review)
- [ ] **Phase 1**: Add client-side draft auto-recovery in `src/app/profiles/` using `localStorage` with a 24-hour expiration window.
- [ ] **Phase 2**: Add `Force Refresh` toggle to the Profile Import modal and UI.
- [ ] **Phase 3**: Update Cloudflare Worker `/api/profile/import` to check existing D1 timestamp before dispatching new scraper tasks.
