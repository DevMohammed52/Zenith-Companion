# Profiling, Measuring & Performance Budgets

Reference: [Chrome DevTools: Analyze Runtime Performance](https://developer.chrome.com/docs/devtools/performance), [Chrome DevTools: Memory Problems](https://developer.chrome.com/docs/devtools/memory-problems), [react.dev/reference/react/Profiler](https://react.dev/reference/react/Profiler), [web.dev/articles/performance-budgets-101](https://web.dev/articles/performance-budgets-101)

## 1. Golden Rule: Measure Before Optimizing

Never optimize based on intuition or memory. Every performance change must be backed by a diagnostic profile that identifies the root cause, and verified with before/after measurements.

## 2. Chrome DevTools Performance Profiling Protocol

To diagnose UI lag and high INP:
1. Open Chrome DevTools -> **Performance** panel.
2. Click the gear icon to reveal Capture settings.
3. Set **CPU** to **4x slowdown** (or 6x slowdown for low-end mobile simulation).
4. Click **Record**, perform the sluggish interaction (e.g. typing in item search, scrolling the items table, opening ItemModal), and click **Stop**.
5. Inspect the **Main** thread flame chart:
   - Identify red flags labeled **Long Task (> 50ms)**.
   - Drill into the call tree to find the exact function consuming time (e.g. excessive React reconciliation, un-virtualized DOM layout, un-memoized string parsing).

## 3. Detecting Memory Leaks & Detached DOM Nodes

Lag that gets progressively worse as the player uses the app points to a memory leak:
1. Open Chrome DevTools -> **Memory** panel.
2. Take a **Heap Snapshot** on page load.
3. Perform repetitive actions (e.g. opening and closing `ItemModal` 10 times, or filtering the catalog back and forth).
4. Take a second **Heap Snapshot** and select **Comparison**.
5. Check for **Detached HTMLTableRowElement** or **Detached HTMLDivElement**:
   - Detached DOM nodes indicate that an event listener, timer, or global state closure is holding a reference to an unmounted component.
   - Fix: Ensure every `useEffect` cleans up its event listeners, timers, intervals, and observers in its cleanup return function.

## 4. Shared Timers for Countdowns

Having dozens of individual `setInterval` timers for boss countdowns or event tickers wastes CPU cycles:
- **Shared Timer Loop**: Run a single top-level `requestAnimationFrame` loop or a single 1-second `setInterval` that ticks a global second timestamp.
- Components subscribe to the tick or calculate time remaining from static timestamps (`targetTime - now`) without running independent intervals.

## 5. Performance Budgets 101

Set explicit thresholds that must be met before code lands:

| Metric | Budget Target | Critical Failure |
| :--- | :--- | :--- |
| **Interaction to Next Paint (INP)** | <= 150ms | > 200ms |
| **Cumulative Layout Shift (CLS)** | 0.00 | > 0.05 |
| **Largest Contentful Paint (LCP)** | <= 1.8s | > 2.5s |
| **Initial Client JS Bundle** | <= 180 KB gzip | > 250 KB gzip |
| **Active DOM Nodes on Page** | <= 1,000 nodes | > 2,500 nodes |
| **Table Row Render Budget** | <= 40 rows in DOM | > 100 rows in DOM |

Always record before-and-after numbers in the pull request or commit message so performance regressions are immediately visible.
