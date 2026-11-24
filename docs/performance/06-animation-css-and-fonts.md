# Animation, CSS Containment & Web Fonts

Reference: [web.dev/articles/animations-guide](https://web.dev/articles/animations-guide), [MDN: CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/contain), [web.dev/articles/font-best-practices](https://web.dev/articles/font-best-practices)

## 1. High-Performance Hardware-Accelerated Animations

Browsers render animations through three stages: Layout -> Paint -> Composite.

### Safe Properties (Composite Stage Only)
Only animate properties that the GPU can composite without triggering geometry recalculations:
- `transform`: `translate`, `scale`, `rotate`
- `opacity`

### Prohibited Animation Properties (Triggers Layout & Paint)
Never animate these properties:
- `width`, `height`, `max-height` (triggers full page layout recalculation on every frame)
- `top`, `left`, `bottom`, `right` (forces position recalculations)
- `margin`, `padding`
- `box-shadow` (heavy CPU rasterization on paint)

### Controlled Motion Timing
- Snappy, responsive durations: **100ms to 200ms**. Anything above 250ms feels sluggish to gamers.
- Use cubic spring curves: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Use `will-change: transform, opacity` sparingly and only during active gestures or transitions, removing it once animations settle to prevent persistent GPU memory reservation.
- Strictly respect `@media (prefers-reduced-motion: reduce)` by removing motion transitions for accessibility.

## 2. CSS Containment (`contain`)

CSS `contain` informs the browser that an element's subtree is independent from the rest of the page, isolating layout, style, and paint:

```css
/* Isolating modal sheets and drawers from page layout */
.modal-overlay {
  contain: layout style paint;
}

/* Scroll containment to prevent background chain scrolling */
.modal-body, .sidebar-drawer {
  overscroll-behavior: contain;
}
```

- `contain: layout`: Prevents internal DOM mutations from triggering layout outside the container.
- `contain: paint`: Prevents descendants from painting outside their bounds, speeding up compositor tiles.
- `overscroll-behavior: contain`: Prevents scroll chaining so scrolling inside a modal or drawer never scrolls the underlying page.

## 3. Web Font Optimization & Zero CLS

Web fonts can cause Cumulative Layout Shift (CLS) if fallback system fonts have different letter geometries:

1. **Use `next/font`**: Next.js automatically self-hosts font files, removes external network roundtrips to Google Fonts, and calculates size-adjust metrics.
2. **Limit Font Weights**: Load only essential font weights (e.g. 400 Regular, 600 Semi-Bold, 700 Bold). Avoid loading unnecessary weights or italic variants.
3. **`font-display: swap`**: Ensures text remains visible during font download.
4. **Size-Adjust Fallback**: Match fallback font metrics (`size-adjust`, `ascent-override`, `descent-override`) so the text swap causes zero pixel shift.
