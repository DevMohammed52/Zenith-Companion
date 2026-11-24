# Zenith Design Standards: Loading States & Performance

This document governs skeleton screen architecture, Core Web Vitals optimization (INP, LCP, CLS), rendering containment, and list virtualization across Zenith Companion.

## 1. Skeleton Screen Architecture (NN/g, Shopify Polaris & shadcn/ui)
* **Visual Wireframe Placeholders**: Full-page and card-level loading states must utilize structured skeleton screens rather than blank spinners. Skeletons build accurate mental models of the incoming layout and reduce perceived waiting time.
* **Layout Shift Prevention (Zero CLS <= 0.1)**:
  * Skeleton wireframe shapes must strictly match the loaded header and component dimensions down to the exact pixel height and padding so rehydration causes zero Cumulative Layout Shift (CLS).
  * Header placeholder: Match exact title typography height (e.g. 26px for `h1`, 18px for `h2`) and container padding.
  * Subtitle placeholder: Match exact font size (e.g. 15px body text).
  * Avatar / Icon placeholder: Circle or rounded square matching exact dimensions (e.g. 40x40px).
  * Card placeholder: Match standard padding, margin, and border tokens.
* **Accessibility & Screen Reader Protocol (MDN `aria-busy`)**:
  * Mark the parent container with `aria-busy="true"` while content is actively loading, flipping to `aria-busy="false"` once data resolves. This instructs assistive technology to wait before announcing changes.
  * Hide all individual decorative skeleton shapes from screen readers using `aria-hidden="true"`.
  * Announce a single consolidated status message via an offscreen live region (`aria-live="polite"`), e.g. "Loading market item prices". Never announce dozens of individual skeleton elements.
* **Threshold & Spinner Boundary**:
  * Skip skeletons for very short loads (<100ms). A rapid flash of gray wireframe is more distracting than a slight delay.
  * For localized, in-place updates (such as refreshing a single market price or player level), use a small inline spinner or pulse rather than replacing the whole card with a skeleton.
* **Request Timeout Fallback**:
  * Always pair skeletons with a request timeout (e.g. 8-10 seconds).
  * If a request stalls or fails, transition the skeleton into an explicit empty state or retry error card rather than displaying an infinite loading animation.
* **Shimmer Motion & Accessibility**:
  * Shimmer animation must use hardware-accelerated CSS `transform` or `background-position` transitions with a gentle 1.5s linear pulse.
  * Respect `@media (prefers-reduced-motion: reduce)` by disabling movement and displaying a static neutral wireframe.
* **Banish Flash-of-Empty-State**: Never render an empty state while data is actively fetching. A skeleton screen or loading status must persist until data resolution completes to prevent false panic.

## 2. Core Web Vitals Targets & Safeguards
* **Interaction to Next Paint (INP <= 200ms)**:
  * Interactive controls must provide visual feedback within 100ms of user action (e.g. `transform: scale(0.98)` on button press).
  * Break up long computational tasks (>50ms) during large table sorting or EV math calculations using `scheduler.yield()` or microtask chunking.
  * Never block the main thread with heavy calculation loops in click handlers.
* **Cumulative Layout Shift (CLS <= 0.1)**:
  * Reserve structural layout space in CSS before images or dynamic market data loads.
  * Use `scrollbar-gutter: stable` on containers whose content length changes with search filters so the layout does not jitter when scrollbars appear.
* **Largest Contentful Paint (LCP <= 2.5s)**:
  * Pre-render static route shells and entity catalogs during the Next.js static generation build.
  * Cache client-side game datasets in IndexedDB and Service Worker caches for instant local-first rehydration.

## 3. CSS Rendering Containment (`content-visibility`)
* **7x Performance Acceleration**: For long table views and list pages with dozens of entity cards (`/items`, `/enemies`, `/bosses`, `/lore`), apply `content-visibility: auto`.
* **Intrinsic Size Coupling**: Whenever `content-visibility: auto` is used, always specify `contain-intrinsic-size` matching estimated item height (e.g. `contain-intrinsic-size: auto 54px` for table rows) to prevent scrollbar jumping and layout shifts during scrolling.

## 4. Virtualization Protocol (TanStack Virtual)
* Datasets exceeding 100 rows or entities must evaluate windowed virtualization.
* Virtualizers render only the elements visible within the viewport plus an overscan buffer (3-5 items), maintaining a total height spacer. This keeps DOM node counts under 1,000 even when navigating catalogs with 1,355 items.
