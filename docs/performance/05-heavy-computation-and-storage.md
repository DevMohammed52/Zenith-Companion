# Heavy Computation & Client-Side Storage

Reference: [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), [web.dev/articles/storage-for-the-web](https://web.dev/articles/storage-for-the-web)

## 1. Offloading Computation with Web Workers

When an algorithm takes more than **50ms** to run on a mid-range phone, executing it synchronously on the main thread will cause dropped frames and high INP.

### Workloads Qualified for Web Workers
1. **Recursive EV Engine**: Calculating deep expected value trees for recipes with multiple nested material drops and variable quality levels.
2. **Skill Profit Multivariate Matrix**: Calculating hourly gold, exp, and resource throughput across hundreds of active recipes against custom profile levels and bartering boosts.
3. **Combat Simulator**: Running Monte Carlo combat turns (10,000 battle iterations) to find exact survival probability against high-tier world bosses.

### Implementation Pattern
Use standard Web Workers via `new Worker(new URL('./calculator.worker.ts', import.meta.url))` to transfer inputs, run heavy loops in background threads, and post serialized results back without ever locking the UI.

## 2. Storage for the Web: IndexedDB vs `localStorage`

### The Trap of `localStorage`
- `localStorage` is completely **synchronous** and operates on the browser main thread.
- Executing `JSON.parse(localStorage.getItem('zenith_big_cache'))` during initial app startup blocks the main thread for 50ms - 200ms, delaying hydration and inflating LCP.
- `localStorage` has a strict storage ceiling of ~5 MB.

### When to Use IndexedDB
- Any data structure exceeding **100 KB** (such as cached item registries, offline market price history, or character museum records).
- Structured datasets that benefit from indexed queries and async key-value reads.
- Zenith uses IndexedDB (or async storage helpers) to store offline manifests and historical market curves, keeping startup hydration non-blocking.

### When to Use `localStorage`
- Small, single-value player preferences: active theme, sound enabled/muted, dismissed tips timestamp, active view mode (`'table' | 'cards'`).
- Always wrap `localStorage` access in `try/catch` to handle private browsing mode and storage quota exceptions safely.

## 3. Freshness Windows & Data Caching

Avoid fetching remote data on every component mount:
1. **Stale-While-Revalidate (SWR)**: Render cached data immediately from memory or storage, then check network freshness in the background.
2. **Freshness Windows**: Cache price and guild data with explicit TTLs (e.g. 5 minutes for market prices, 1 hour for game wiki content).
3. **Visual Freshness Indicators**: Display the sync age in the header (`Sync: 4d ago` or `Live`) so players understand data age without triggering redundant fetch waterfalls.
