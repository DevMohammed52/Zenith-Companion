# Large Tables & List Virtualization

Reference: [tanstack.com/virtual](https://tanstack.com/virtual/latest), [web.dev/articles/virtualize-long-lists-react-window](https://web.dev/articles/virtualize-long-lists-react-window), [web.dev/articles/content-visibility](https://web.dev/articles/content-visibility)

## 1. The Large List Problem (1,355 Items)

In an application like Zenith Companion with 1,355 items, rendering the full catalog into the DOM creates:
- 1,355 rows x 9 table cells = 12,195 `<td>` elements
- 1,355 thumbnails, tags, and badge components
- Over 15,000 active DOM nodes

### Consequences of a Massive DOM Tree
1. **Memory Exhaustion**: The browser allocates dozens of megabytes of memory to maintain layout boundaries and event listener maps.
2. **Layout Thrashing**: Any search input keystroke or sort toggle forces the browser to recalculate styles and layout geometry across all 15,000 nodes, resulting in 200ms - 800ms main-thread freezes (disastrous INP).
3. **Scroll Jitter**: Scrolling stutters and drops frames (well below 60fps) as the compositor struggles to paint offscreen DOM geometry.

## 2. List Virtualization (Windowing) Architecture

Virtualization (or windowing) renders **only the small subset of elements visible within the viewport**, plus a small overscan buffer (5-10 rows above and below).

```
┌─────────────────────────────────┐
│ Virtual Total Container (70,460px)│
│                                 │
│  [ Top Spacer / translateY ]    │  Height = startIndex * rowHeight (e.g. 10,400px)
│                                 │
│  ┌───────────────────────────┐  │
│  │ Visible Window (25-30 rows)│  │  Actual DOM Elements Rendered
│  │ ├─ Row 200                │  │  (Total DOM nodes: ~250 instead of 15,000)
│  │ ├─ Row 201                │  │
│  │ └─ Row 225                │  │
│  └───────────────────────────┘  │
│                                 │
│  [ Bottom Spacer ]              │  Height = (total - endIndex) * rowHeight
│                                 │
└─────────────────────────────────┘
```

### Core Mathematical Model
For a fixed row height ($H = 52\text{px}$) and scroll position ($S = \text{scrollTop}$):
- $\text{startIndex} = \max(0, \lfloor S / H \rfloor - \text{overscan})$
- $\text{endIndex} = \min(N, \lceil (S + V) / H \rceil + \text{overscan})$
- $\text{topSpacer} = \text{startIndex} \times H$
- $\text{bottomSpacer} = (N - \text{endIndex}) \times H$
- Visible slice: $\text{items.slice}(\text{startIndex}, \text{endIndex})$

### Benefits of Virtualization
1. **Constant DOM Footprint**: Whether the catalog has 50 items or 10,000 items, the DOM always contains only ~25-35 rows.
2. **Instant Search Re-rendering**: Filtering 1,355 items recalculates an array slice in 1ms, and React reconciles only 30 rows. Keystrokes remain 60fps with zero input lag.
3. **Smooth Scroll Performance**: The browser GPU compositor easily maintains 60fps / 120fps scrolling because offscreen geometry does not exist in memory.

## 3. CSS Rendering Containment (`content-visibility: auto`)

For hybrid lists where virtualization is not yet applied, always enforce CSS rendering containment:

```css
.items-table tbody tr {
  content-visibility: auto;
  contain-intrinsic-size: 0 53px;
}
```

- `content-visibility: auto`: Instructs Chromium to skip layout and rendering calculations for elements outside the viewport.
- `contain-intrinsic-size: 0 53px`: Provides an estimated placeholder height so scrollbars do not jump or jitter as rows scroll into view.

## 4. Preventing Infinite Scroll Runaway Loops

When combining infinite loading or sentinels with large datasets:
- Never attach the growing item count to the `useEffect` dependencies of an `IntersectionObserver`.
- Use a boolean `isLoadingRef` guard to prevent duplicate concurrent load requests while the previous batch is rendering.
- Ensure the sentinel element is properly offset or unobserved while new items are appending.
