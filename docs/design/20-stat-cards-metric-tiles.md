# Zenith Design Standards: StatCards & MetricTiles

This document establishes the architectural, cognitive, semantic, and accessibility standards for StatCards, MetricTiles, and KPI displays across Zenith Companion.

## 1. Architectural Role & Preattentive Cognition
StatCards present at-a-glance quantitative measurements, summary metrics, and vital performance indicators across `/`, `/profiles`, `/skill-profit`, `/alchemy`, and `/bosses`.

### Operational vs. Analytical Metrics (NN/g Guidance)
* **Operational Metrics**: High-urgency, rapidly updating signals (e.g. Active World Boss timer, Weather window countdown, Stamina cap ETA). These require instantaneous cognitive absorption.
* **Analytical Metrics**: Evaluative, strategic signals (e.g. Median Alchemy EV, Profit per Hour, Conquest bonus multiplier). These support user planning and comparative decision-making.

### Preattentive Attributes in Dashboard Design (NN/g & Cleveland-McGill)
Human visual perception processes certain geometric attributes preattentively (before conscious cognitive search):
1. **2D Position & Linear Length**: The two most accurate quantitative variables for rapid comparison. Use linear representations (progress bars, bullet graphs, rank position) rather than circular ones.
2. **Area & Angle Deficiency**: Humans cannot accurately judge differences in circular areas or angles. **Radial gauges, speedometer graphics, and donut charts are prohibited** inside StatCards. They consume excessive screen space while communicating little quantitative precision.
3. **Color as Category, Not Magnitude**: Color does not convey numeric scale or ordered value naturally. Color in StatCards must only reinforce semantic sentiment (profit vs. loss, safe vs. danger), never encode the raw numeric amount.

### Presentation Dashboard Principles (Carbon Design System)
* **Visual Hierarchy**: Follow the western F-pattern reading flow (top-to-bottom, left-to-right). Primary aggregate KPIs anchor the top of the viewport.
* **Metric Density Budget**: Limit each viewport section to 3 to 6 primary StatCards. Overloading dashboards with 15 simultaneous tiles causes choice paralysis and cognitive fatigue.
* **Whitespace as Structure**: Generous padding (16px to 24px) sets tiles apart. Research demonstrates structured whitespace increases data comprehension by up to 20%.

---

## 2. Semantic Structure & Anatomy
A StatCard is fundamentally a **static presentation element**, not an interactive control. It must never carry button or input semantics.

### Semantic HTML
Construct StatCards using semantic HTML description lists or labeled section groups:
```html
<!-- Pattern A: Semantic Description List (Preferred for metric groups) -->
<dl class="stat-card">
  <dt class="stat-card__label">Median Profit</dt>
  <dd class="stat-card__value">
    <span class="tabular-nums">14,520g</span>
    <span class="stat-card__delta" aria-label="Increased by 4.2 percent over last 24 hours">
      <span aria-hidden="true">▲ +4.2%</span>
    </span>
  </dd>
  <dd class="stat-card__context">vs. last 24h &bull; Updated 2h ago</dd>
</dl>
```

### Visual & DOM Hierarchy (3-Tier Rule)
1. **Tier 1: Label / Descriptor**: Placed at the top. Concise, non-redundant metadata identifying what is measured (e.g. "Median Profit", "XP Throughput", "Stamina Cap").
2. **Tier 2: Primary Quantitative Value**: Prominently scaled (`1.5rem` to `2rem`), bold weight, using high-contrast text (`--text-main`).
3. **Tier 3: Context & Comparison Period**: Supporting subtext placed immediately below the metric, clarifying the baseline timeframe, sample count, or staleness.

### Clickable Tile Rules
If an entire StatCard routes to a deeper analytics view (e.g. clicking the "Market Volume" tile navigates to `/items`):
* Wrap the entire card in a single semantic `<a>` link.
* **Never create a `<div onClick="...">` containing nested links or buttons**. Nested interactive elements violate HTML accessibility specifications and confuse screen readers.
* Focus styling: When focused via keyboard, the outer card receives the standardized `--border-focus` ring with a 2px offset.

---

## 3. Number Formatting & Tabular Numbers
Layout shifts caused by fluctuating character widths on dynamic numeric tickers create severe visual instability.

### Tabular Numbers Requirement (`font-variant-numeric: tabular-nums`)
All numbers in StatCards must strictly apply `font-variant-numeric: tabular-nums` (CSS OpenType feature `tnum`):
```css
.stat-card__value,
.stat-card__delta {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```
Tabular numbers guarantee that the digit `1` occupies the exact same horizontal advance width as `8`, eliminating jitter when live values tick.

### Number Formatting Conventions (`Intl.NumberFormat`)
* Consistent localization: Format all numbers through JavaScript's standard `Intl.NumberFormat('en-US', ...)`.
* Gold currency: Whole numbers format with thousands separators (`1,355g`). Decimal precision is capped at two decimal places (`15.49g`).
* Percentages: Formatted with an explicit sign and fixed decimals (`+4.20%` or `-1.15%`).
* Compact notation (`Intl.NumberFormat('en-US', { notation: 'compact' })`):
  * Allowed only when viewport constraints require abbreviation (e.g. `1.2M`, `45.8k`).
  * **Accessibility Requirement**: Whenever compact notation is displayed visually, the exact, unrounded value must be provided in the accessible label (`aria-label="1,245,890 gold"`) or an accessible tooltip.

---

## 4. Sentiment vs. Direction Decoupling (WCAG 2.2 SC 1.4.1)
A frequent flaw in dashboard widgets is conflating numeric direction with semantic sentiment.

### Independent Axes
Direction and sentiment are mathematically and logically independent:
* **Metric Direction**: Mathematical change in quantity: positive (`+`, `▲`) or negative (`-`, `▼`).
* **Metric Sentiment**: The business/game value of that change:
  * *Profit increasing*: Direction Positive (`+`), Sentiment Good (Green / `--text-success`).
  * *Craft Cost increasing*: Direction Positive (`+`), Sentiment Bad (Red / `--text-danger`).
  * *Cooldown time decreasing*: Direction Negative (`-`), Sentiment Good (Green / `--text-success`).
  * *XP rate decreasing*: Direction Negative (`-`), Sentiment Bad (Red / `--text-danger`).

### Non-Color Cues
In compliance with WCAG 2.2 SC 1.4.1 (Use of Color), color must never be the sole visual indicator of metric health:
* Every delta must include:
  1. An explicit directional glyph: `▲` (U+25B2) or `▼` (U+25BC).
  2. An explicit arithmetic sign: `+` or `-`.
  3. The numeric delta value: `4.2%`.
* Example: `<span class="delta-positive">▲ +4.2%</span>` where the arrow and plus sign convey direction even on monochrome displays or for users with deuteranopia / protanopia.

---

## 5. Comparison Period & Temporal Grounding
A bare percentage change (e.g. `+4.2%`) is meaningless without grounding the baseline.

### Rules
* **Explicit Baseline**: Every delta must declare its comparison window in plain text (e.g. "vs. prior 24h", "vs. 7-day average", "vs. baseline recipe").
* **Data Freshness / Staleness**: If data is cached or synchronized asynchronously, display the data age ("Updated 4d ago", "Sync: 2h ago"), integrating with Zenith's `DataFreshnessIndicator`. Stale data (>24h) shifts subtext to muted warning contrast.

---

## 6. Live Regions & Screen Reader Announcement Rules
StatCards that tick dynamically (e.g. Live Boss Countdown, EV live ticker) must **never** be wrapped in `aria-live="assertive"` or `aria-live="polite"`.

* **Anti-Pattern**: Wrapping a live numeric ticker in `aria-live` causes screen readers to constantly interrupt the user on every second or minute, rendering the page unusable.
* **Standard**: Update the DOM silently in place. Sighted users see the dynamic change. Screen reader users query the stat when they navigate to it.
* **Threshold Announcements**: If a background calculation completes an explicit batch run (e.g. "Monte Carlo combat simulation complete: 94.2% win rate"), announce the milestone once via an offscreen `Toast` or dedicated polite announcement region.

---

## 7. Skeleton Loading & Sparklines
* **Dimension Matching**: Loading skeleton screens for StatCards must match the exact height and width of the rendered card (`height: 110px`, `border-radius: 8px`) to guarantee zero Cumulative Layout Shift (CLS <= 0.1).
* **Sparklines**:
  * Micro sparkline SVG graphs inside tiles must carry `aria-hidden="true"`.
  * The trend information communicated by the sparkline must be fully articulated in the accompanying text (e.g. "Trending upward over past 7 days").
