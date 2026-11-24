# Core Web Vitals & INP Optimization Guide

Reference: [web.dev/articles/vitals](https://web.dev/articles/vitals), [web.dev/articles/inp](https://web.dev/articles/inp), [web.dev/articles/optimize-long-tasks](https://web.dev/articles/optimize-long-tasks)

## 1. Google Core Web Vitals Benchmarks

All pages in Zenith must adhere to the three Core Web Vitals thresholds assessed at the 75th percentile of user visits:

1. **Interaction to Next Paint (INP) <= 200ms**
   - Assesses page responsiveness throughout the entire session lifecycle, not just initial load.
   - Measures the latency between user input (clicks, taps, keypresses) and the next frame painted by the browser.
   - Good: <= 200ms. Needs improvement: 200ms - 500ms. Poor: > 500ms.

2. **Largest Contentful Paint (LCP) <= 2.5s**
   - Measures perceived loading speed by recording when the largest main content element finishes rendering.
   - Good: <= 2.5s. Needs improvement: 2.5s - 4.0s. Poor: > 4.0s.

3. **Cumulative Layout Shift (CLS) <= 0.1**
   - Measures visual stability and prevents jarring layout jumps while content, images, or ads load.
   - Good: <= 0.1. Needs improvement: 0.1 - 0.25. Poor: > 0.25.

## 2. INP Breakdown & Anatomy of an Interaction

An interaction consists of three sequential phases:

```
[ User Interaction ]
         │
         ▼
┌───────────────────────────┐
│ 1. Input Delay            │  Queued on main thread waiting for previous tasks to finish
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 2. Processing Duration    │  Executing JavaScript event handlers & React reconciliation
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│ 3. Presentation Delay     │  Style calculations, layout, compositing & next frame paint
└───────────────────────────┘
```

Total Interaction Latency = Input Delay + Processing Duration + Presentation Delay.

### Eliminating Input Delay
- Do not clog the main thread with long script execution during idle periods.
- Defer non-critical analytics, background sync, or telemetry using `requestIdleCallback()` or worker threads.

### Eliminating Processing Duration
- Keep event handlers lean. Do not compute expensive calculations directly inside `onClick`, `onChange`, or `onKeyDown`.
- Defer non-urgent state updates using `useDeferredValue` or `useTransition`.
- Provide immediate visual confirmation (e.g. active press scale `transform: scale(0.98)`) within 16ms so the next paint is unblocked.

### Eliminating Presentation Delay
- Avoid deeply nested DOM updates that trigger broad style recalculations and layout thrashing.
- Keep the active DOM tree concise (< 1,000 nodes) through list virtualization.

## 3. Long Tasks & Main Thread Yielding

A **Long Task** is any JavaScript task that executes continuously for **> 50ms**, blocking the browser from responding to user interactions.

### Breaking Up Long Tasks
When processing large arrays (such as calculating recursive EV trees or sorting 1,355 items), yield execution back to the browser:

```ts
// Modern main-thread yielding pattern
async function yieldToMain() {
  if ('scheduler' in window && 'yield' in (window as any).scheduler) {
    return await (window as any).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Processing items in non-blocking batches
async function processLargeCatalog(items: Item[]) {
  const BATCH_SIZE = 50;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    processChunk(chunk);
    await yieldToMain();
  }
}
```

## 4. Hardware Baseline: 4x CPU Throttling

Development machines have multi-core desktop CPUs that execute JavaScript 5x to 10x faster than real-world mobile devices.
- Always test interactions in Chrome DevTools with **4x CPU slowdown** enabled in the Performance panel.
- An interaction that takes 35ms on a desktop will take 140ms on mobile, teetering near the 200ms INP failure threshold.
