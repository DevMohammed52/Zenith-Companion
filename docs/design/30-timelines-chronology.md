# Zenith Design Standards: Timelines & Chronological Feeds

This document establishes the architectural, accessibility, semantic, and performance standards for Timeline and Event Feed components across Zenith Companion.

## 1. Architectural Role & Boundary Rules

Timelines present chronological sequences of events, milestones, and status changes.

### Timeline vs. Table Decision Rule
* **Use a Timeline**: When the chronological progression, sequence of events, and time intervals are the primary subject (e.g. game patch notes history on `/patch-notes`, world lore historical eras on `/lore`, or character milestone history).
* **Use a Table**: When players need to sort by multiple columns, filter by numeric attributes, compare costs, or calculate totals (e.g. alchemy crafting history with gold spent and net profit). Never force tabular data into a timeline.

---

## 2. Semantic ARIA & HTML Structure

A timeline must use an ordered list with semantic `<time>` elements:

```html
<section class="timeline-container" aria-labelledby="timeline-heading">
  <div class="timeline-header">
    <h3 id="timeline-heading" class="timeline-title">Update History</h3>
    <p class="timeline-direction">Order: Newest updates first &bull; Server Time (UTC)</p>
  </div>

  <ol class="zenith-timeline">
    <li class="timeline-entry">
      <!-- Decorative Spine & Dot -->
      <div class="timeline-entry__marker" aria-hidden="true">
        <span class="timeline-entry__dot timeline-entry__dot--completed"></span>
        <span class="timeline-entry__line"></span>
      </div>

      <!-- Content -->
      <div class="timeline-entry__content">
        <div class="timeline-entry__meta">
          <time
            datetime="2026-11-20T14:30:00Z"
            class="timeline-entry__time tabular-nums"
            title="Nov 20, 2026, 2:30 PM UTC"
          >
            4 days ago
          </time>
          <span class="timeline-entry__status">
            <span class="sr-only">Status: </span>Patch Released
          </span>
        </div>

        <h4 class="timeline-entry__title">Patch 0.86.1 &mdash; Combat Balance</h4>
        
        <p class="timeline-entry__body">
          Adjusted weapon speeds and critical hit multipliers across all melee weapon tiers.
        </p>
      </div>
    </li>
  </ol>
</section>
```

### Critical Semantic Standards
1. **Ordered List**: Use `<ol>` and `<li>`. This informs screen reader users of the total event count and their relative position.
2. **Explicit Direction Statement**: Feeds can flow newest-first or oldest-first. Because assistive technologies cannot deduce visual layout direction, always declare the order in a heading or subhead ("Order: Newest updates first").
3. **Decorative Visual Spine**: The connecting line and status dots are visual ornamentation. Render them via CSS pseudo-elements (`::before`) or mark marker containers with `aria-hidden="true"`.
4. **Machine-Readable Dates**: Every timestamp must use `<time datetime="YYYY-MM-DDTHH:mm:ssZ">`.

---

## 3. Time Formatting & Centralized Tick Loop

### Dual-Format Display (`Intl` APIs)
* **Relative Time**: Display friendly relative durations ("2 hours ago", "3 days ago") using `Intl.RelativeTimeFormat`.
* **Absolute Fallback**: Provide the full localized date and time in the native `title` attribute or via tooltip, formatted with `Intl.DateTimeFormat`.
* **Timezone Declaration**: If the game server operates in UTC, state this clearly to prevent confusion with local device time.

### Single Shared Timer Loop (Performance Requirement)
Never create individual `setInterval` timers inside each timeline entry.
* Derive all relative timestamps from a **single shared global ticker** or timestamp context.
* Ticking 50 separate intervals degrades battery life and causes thread contention.

---

## 4. Feed Accessibility & Layout Stability (CLS)

### Prohibit Blanket Live Regions
Never apply `aria-live="polite"` or `aria-live="assertive"` to an entire timeline container. Injecting new items into a live feed interrupts screen reader speech and confuses navigation.

### The "New Entries" Pattern
When new events arrive in a live stream while the user is reading:
1. Do not inject them immediately at the top, which pushes existing content downward and causes Cumulative Layout Shift (CLS).
2. Display a compact banner button: `"3 new updates available"`. Clicking the button smoothly prepends the new entries and moves focus to the top.

### Long Content Disclosure
Avoid hiding overflow text behind hover-triggered popovers. Truncate long descriptions with an accessible expand button:
```html
<button type="button" aria-expanded="false" class="timeline-expand-btn">
  Show patch details
</button>
```

---

## 5. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Connecting Spine Line | `border-left` | `2px solid var(--border-subtle)` (`#222c44`) |
| Spine Offset | `left` | `15px` from container edge |
| Node Dot Size | `width`, `height` | `12px`, `12px` |
| Node Dot Border | `border` | `2px solid var(--bg-base)` (`#0b0f19`) |
| Standard Node Fill | `background-color` | `var(--accent-primary)` (`#38bdf8`) |
| Completed Node Fill | `background-color` | `var(--accent-success)` (`#4ade80`) |
| Failed / Alert Node Fill | `background-color` | `var(--accent-danger)` (`#f87171`) |
| Content Card Background | `background-color` | `var(--bg-card)` (`#141b2d`) |
| Content Card Border | `border` | `1px solid var(--border-subtle)` |
| Timestamp Text | `color` | `var(--text-muted)` (`#94a3b8`) with `tabular-nums` |
| Title Text | `color` | `var(--text-main)` (`#f8fafc`) |
