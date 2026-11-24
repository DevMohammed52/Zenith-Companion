# Zenith Design Standards: Motion & Animation

This document specifies the timing, easing physics, hardware acceleration constraints, and vestibular accessibility requirements for all transitions across Zenith Companion.

## 1. Animation Duration Thresholds (NN/g Usability Research)
The speed of interface animation directly governs perceived software quality:
* **Micro-Interactions (100ms - 150ms)**:
  * Button presses (`transform: scale(0.98)`).
  * Segmented control pill slide.
  * Checkbox toggle and switch thumb movement.
  * *Usability Rationale*: 100ms feels immediate, simulating direct physical manipulation without delay.
* **Structural Transitions (200ms - 250ms)**:
  * Modal sheet sliding up from bottom or expanding from center.
  * Accordion and disclosure container opening.
  * Drawer slide-in from edge.
  * *Usability Rationale*: Provides sufficient visual continuity to prevent spatial disorientation while keeping task completion fast.
* **The Sluggishness Danger Zone (>= 400ms)**:
  * Never exceed 300ms for UI transitions. At 400ms to 500ms, animations feel sluggish, interrupt flow, and trigger user annoyance.

## 2. Easing Physics & Spring Curves (Apple HIG & Material 3)
* **Natural Easing Asymmetry**:
  * **Entrances (Ease-Out)**: Elements entering the screen use ease-out curves (e.g. `cubic-bezier(0.16, 1, 0.3, 1)`). The object starts fast and decelerates as it rests, allowing the eye to track where it lands.
  * **Exits (Ease-In)**: Elements leaving the screen use ease-in curves. The object accelerates away quickly, clearing the viewport immediately.
* **Linear Motion Banned**: Completely linear transitions look robotic and unnatural. Always use spring or cubic-bezier curves.

## 3. Hardware Acceleration & Compositing Constraints
* **Only Animate Composited Properties**:
  * Animate exclusively `transform` and `opacity`.
  * **Never Animate Reflow Properties**: Animating `height`, `width`, `top`, `left`, `margin`, or `padding` forces CPU layout recalculation on every frame, inducing frame drops and scroll stutter.
* **No Bulky External Libraries**:
  * Do NOT install or bundle heavy animation packages (Framer Motion, GSAP, React Spring) for standard UI chrome. Hardware-accelerated CSS keyframes and transitions deliver superior 60/120fps performance with zero bundle overhead.

## 4. Reduced Motion & Vestibular Safety (WCAG 2.2 SC 2.3.3)
Animations with large screen movements or parallax effects trigger dizziness, nausea, and migraines in users with vestibular disorders.
* **Mandatory Reduced Motion Fallback**:
  Every animated transition must include a `@media (prefers-reduced-motion: reduce)` override that either removes the transition or replaces movement with a subtle opacity fade:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
