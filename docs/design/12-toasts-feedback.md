# Zenith Design Standards: Toasts, Feedback & Status

This document specifies the timing algorithms, accessibility roles, layout stability, and queue limits for notifications and status feedback across Zenith Companion.

## 1. Adaptive Duration & Auto-Dismissal
* **Adaptive Word-Count Timing**: Never use a flat blanket timer.
  * Brief affirmations (e.g. "Copied"): 2.5 seconds.
  * Complete sentences: 5 to 6 seconds.
  * Notifications containing actions (e.g. Undo): 8 to 10 seconds.
* **Hover & Focus Pause**: Pause auto-dismiss countdowns immediately on mouse hover (`mouseenter`) or keyboard focus (`focusin`).
* **Non-Dismissible Errors**: Never auto-dismiss error alerts or notifications requiring user decisions. Errors must remain persistent until manually dismissed with a close button or resolved.

## 2. Roles, Live Regions & Focus Discipline
* **Role Semantics**:
  * Use `role="status"` (`aria-live="polite"`, `aria-atomic="true"`) for success, info, and warning toasts.
  * Reserve `role="alert"` (`aria-live="assertive"`) strictly for critical system errors.
  * Never steal keyboard focus when a toast renders.
* **Pre-Mounted Live Region**: Mount the toast viewport live region in the DOM at initial page load (root shell layout), and inject text nodes dynamically. Live regions created simultaneously with their text content are frequently dropped by screen readers.

## 3. Layout Stability & Mobile Dock Clearance
* **Fixed Overlay & Zero CLS**: Position toasts with `position: fixed` overlays so they never shift page content or induce Cumulative Layout Shift (CLS). Top banners must either be fixed overlays or reserve layout space.
* **Mobile Dock Clearance**: On mobile viewports, offset fixed bottom toasts above the navigation dock:
  ```css
  bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px);
  ```
* **Queue Cap & Repetition Collapsing**: Limit visible stacked toasts to a maximum of 3. Collapse identical consecutive triggers (repeated clicks increment a count badge and reset timer rather than flooding the viewport).
* **Action Non-Exclusivity**: Never place the sole path to complete an action inside an ephemeral toast.
* **In-Place Status Indicators**: For character profile and market data sync, display persistent in-place status indicators (syncing spinner, synced checkmark, failed retry trigger) directly in the header or profile card. Toasts serve only as ambient notifications.
