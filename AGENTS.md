# Agent Guidelines for Zenith Companion

## 1. Tooling & Token Efficiency
* **Fast Search:** Always use `rg` (ripgrep) for regex and code search, and `fd` for fast file listing instead of slow recursive grep/find commands or full-directory dumps.
* **Surgical Reads:** Never read giant files in full unless strictly necessary. Use line-slice ranges with `view_file` to conserve tokens aggressively.
* **Knowledge Graph:** When answering structural architecture questions, check `graphify-out/` or use `graphify query`.

## 2. Strict Logic Invariance
* **Do NOT alter game logic or calculations:** Mathematical formulas (alchemy EV, market pricing guards, combat simulation, boss timers, drop chances, skill profit formulas, pet stat curves) are complex, interconnected, and production-tested.
* **Scope of Review:** All UI/UX polish, refactoring, and code reviews must be strictly presentation-layer (semantic HTML, CSS modules/tokens, responsiveness, accessibility, layout stability, and clean, human copy).

## 3. UI/UX Consistency & "No AI Slop" Standard
* **Design Tokens:** Always adhere to established CSS variables in `globals.css` (`--bg-base`, `--bg-panel`, `--bg-card`, `--border-subtle`, `--text-main`, `--text-muted`, `--text-accent`, `--quality-*`).
* **Clean Copy (Zero Slop):** Eliminate corporate filler, redundant explanatory paragraphs, and AI-sounding fluff. Keep titles, badges, and tooltips concise, natural, and gamer-friendly.
* **Responsive & Accessible:** Ensure interactive elements have $\ge 44\text{px}$ touch targets on mobile, high contrast, and keyboard focus states.
* **Layout Stability:** Prevent Cumulative Layout Shift (CLS) by giving dynamic cards, charts, and image containers defined aspect ratios or minimum heights.

## 4. Quality Verification
* **Zero Regressions:** After any changes, always run:
  ```powershell
  npm run test:unit; npm run typecheck
  ```
* **Production Build Check:** For layout or metadata updates, ensure `npm run build` succeeds cleanly.
