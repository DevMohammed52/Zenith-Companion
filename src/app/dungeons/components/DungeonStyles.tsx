"use client";

export function DungeonStyles() {
  return (
    <style jsx global>{`
      .dungeons-page {
        max-width: 1480px;
        padding-top: 1.25rem;
        -webkit-tap-highlight-color: transparent;
      }
      .dungeons-page :is(button, input) {
        touch-action: manipulation;
      }
      .dungeons-page .header {
        align-items: center;
        background:
          radial-gradient(circle at 10% 20%, color-mix(in srgb, var(--text-accent), transparent 82%), transparent 36%),
          linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012)),
          rgba(14, 12, 8, 0.72);
        border: 1px solid color-mix(in srgb, var(--text-accent), transparent 78%);
        border-radius: 16px;
        box-shadow: 0 24px 70px rgba(0,0,0,0.28);
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(0, 1fr) auto;
        margin-bottom: 0.85rem;
        overflow: hidden;
        padding: 1rem 1.15rem;
        position: relative;
      }
      .dungeons-page .header::after {
        background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--text-accent), transparent 70%), transparent);
        content: "";
        height: 1px;
        inset: auto 1rem 0;
        opacity: 0.75;
        position: absolute;
      }
      .dungeons-page .header-title {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 950;
        letter-spacing: 0;
        min-width: 0;
      }
      .dungeons-page .header-status {
        border-color: color-mix(in srgb, var(--text-accent), transparent 64%);
        border-radius: 999px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        min-height: 2.4rem;
      }
      .dungeons-page .status-dot {
        animation: none;
      }
      .dungeons-page .dungeon-command,
      .dungeons-page .dungeon-planner,
      .dungeons-page .dungeon-insights {
        margin-bottom: 1rem;
        animation: settingsPanelIn 220ms ease both;
      }
      .dungeons-page .dungeon-command {
        display: grid;
        grid-template-columns: minmax(0, 1.12fr) minmax(20rem, 0.88fr);
        gap: 1rem;
        padding: 1.35rem;
        border: 1px solid color-mix(in srgb, var(--text-accent), transparent 72%);
        border-left: 3px solid color-mix(in srgb, var(--text-accent), transparent 36%);
        border-radius: 8px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.034), rgba(255,255,255,0.012)),
          rgba(10, 13, 15, 0.76);
      }
      .dungeons-page .dungeon-eyebrow,
      .dungeons-page .control-label {
        letter-spacing: 0;
      }
      .dungeons-page .dungeon-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-accent);
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
      }
      .dungeons-page .dungeon-command h2 {
        margin: 0;
        color: #fff;
        font-size: clamp(1.45rem, 2.5vw, 2.2rem);
      }
      .dungeons-page .dungeon-command p {
        margin: 0.65rem 0 0;
        color: var(--text-muted);
        max-width: 620px;
        line-height: 1.5;
      }
      .dungeons-page .dungeon-risk-note {
        border: 1px solid color-mix(in srgb, #f6c85f, transparent 65%);
        border-radius: 8px;
        background: color-mix(in srgb, #f6c85f, transparent 92%);
        color: #f8d983 !important;
        font-size: 0.82rem;
        font-weight: 750;
        padding: 0.6rem 0.7rem;
        max-width: 46rem;
      }
      .dungeons-page .dungeon-command-stats,
      .dungeons-page .dungeon-insights {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }
      .dungeons-page .dungeon-command-stats {
        align-self: center;
      }
      .dungeons-page .dungeon-command-stats:focus-visible {
        border-radius: 12px;
        outline: 2px solid var(--text-accent);
        outline-offset: 4px;
      }
      .dungeons-page .dungeon-command-stats div,
      .dungeons-page .dungeon-insight {
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: rgba(9, 10, 14, 0.72);
        padding: 0.85rem;
      }
      .dungeons-page .dungeon-command-stats div {
        display: flex;
        flex-direction: column;
        gap: 0.42rem;
        justify-content: flex-start;
        border-color: rgba(255,255,255,0.075);
        min-height: 7.2rem;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }
      .dungeons-page .dungeon-command-stats div:hover {
        background: rgba(12, 13, 18, 0.82);
        border-color: color-mix(in srgb, var(--text-accent), transparent 70%);
        transform: translateY(-1px);
      }
      .dungeons-page .dungeon-command-stats span,
      .dungeons-page .dungeon-insight span {
        display: block;
        color: var(--text-muted);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
        margin-bottom: 0.35rem;
      }
      .dungeons-page .dungeon-command-stats strong,
      .dungeons-page .dungeon-insight strong {
        color: #fff;
        font-size: 1rem;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-command-stats small {
        color: var(--text-muted);
        display: block;
        font-size: 0.72rem;
        line-height: 1.32;
        margin-top: 0.5rem;
      }
      .dungeons-page .dungeon-planner {
        display: grid;
        grid-template-columns: minmax(20rem, 0.82fr) minmax(18rem, 0.72fr) minmax(32rem, 1.36fr);
        gap: 0.9rem;
        padding: 1rem;
        border: 1px solid rgba(255,255,255,0.075);
        border-radius: 8px;
        background: color-mix(in srgb, var(--bg-panel), #05070b 18%);
        align-items: stretch;
      }
      .dungeons-page .dungeon-control-panel {
        background: rgba(7, 9, 12, 0.64);
        border: 1px solid rgba(255,255,255,0.075);
        border-radius: 8px;
        display: grid;
        gap: 0.75rem;
        min-width: 0;
        overflow: hidden;
        padding: 0.85rem;
        position: relative;
      }
      .dungeons-page .dungeon-control-panel::before {
        background: linear-gradient(180deg, color-mix(in srgb, var(--text-accent), transparent 42%), transparent);
        content: "";
        inset: 0 auto 0 0;
        opacity: 0.58;
        position: absolute;
        width: 2px;
      }
      .dungeons-page .dungeon-control-panel > .dungeon-planner-field,
      .dungeons-page .dungeon-control-panel > .dungeon-mf-toggle {
        grid-area: auto;
        position: relative;
      }
      .dungeons-page .dungeon-find-panel {
        align-content: start;
        grid-template-rows: auto auto;
      }
      .dungeons-page .dungeon-find-panel .dungeon-input-icon {
        min-height: 54px;
      }
      .dungeons-page .dungeon-find-panel .dungeon-input-icon .control-input {
        font-size: 0.92rem;
        height: 52px;
        min-height: 52px;
      }
      .dungeons-page .dungeon-find-panel .dungeon-segmented {
        min-height: 48px;
      }
      .dungeons-page .dungeon-limits-panel,
      .dungeons-page .dungeon-tuning-panel {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .dungeons-page .dungeon-tuning-panel {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .dungeons-page .dungeon-action-limit-field {
        grid-column: 1 / -1;
      }
      .dungeons-page .dungeon-tuning-panel .dungeon-event-completion-field {
        grid-column: span 2;
      }
      .dungeons-page .dungeon-tuning-panel .dungeon-mf-toggle {
        grid-column: span 1;
      }
      .dungeons-page .dungeon-control-panel .dungeon-planner-field {
        justify-content: flex-start;
      }
      .dungeons-page .dungeon-control-panel .dungeon-readonly-field {
        min-height: 5.55rem;
      }
      .dungeons-page .dungeon-tuning-panel .dungeon-planner-field .control-input,
      .dungeons-page .dungeon-tuning-panel .dungeon-check-toggle {
        min-height: 46px;
      }
      .dungeons-page .dungeon-planner-field {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        min-width: 0;
        justify-content: flex-end;
      }
      .dungeons-page .dungeon-planner-field .control-input {
        width: 100%;
        min-width: 0;
        min-height: 44px;
        border-radius: 8px;
      }
      .dungeons-page .dungeon-planner-field > small {
        color: var(--text-muted);
        font-size: 0.68rem;
        line-height: 1.25;
      }
      .dungeons-page .dungeon-readonly-field {
        justify-content: center;
        min-height: 4.4rem;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: rgba(255,255,255,0.025);
      }
      .dungeons-page .dungeon-readonly-field strong {
        color: #fff;
        font-family: var(--font-mono);
        font-size: 0.95rem;
      }
      .dungeons-page .dungeon-readonly-field small {
        color: var(--text-muted);
        font-size: 0.68rem;
        line-height: 1.25;
      }
      .dungeons-page .dungeon-check-toggle {
        display: grid;
        grid-template-columns: 1.8rem minmax(0, 1fr);
        align-items: center;
        gap: 0.65rem;
        min-height: 44px;
        padding: 0.65rem 0.75rem;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: rgba(255,255,255,0.025);
        color: var(--text-muted);
        text-align: left;
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
      }
      .dungeons-page .dungeon-check-toggle:hover,
      .dungeons-page .dungeon-check-toggle:focus-visible,
      .dungeons-page .dungeon-check-toggle.active {
        border-color: color-mix(in srgb, var(--text-accent), transparent 48%);
        background: color-mix(in srgb, var(--text-accent), transparent 90%);
        outline: none;
      }
      .dungeons-page .dungeon-check-toggle:active {
        transform: scale(0.99);
      }
      .dungeons-page .dungeon-check-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.35rem;
        height: 1.35rem;
        border: 1px solid color-mix(in srgb, var(--text-accent), transparent 50%);
        border-radius: 5px;
        color: #000;
        background: rgba(0,0,0,0.24);
      }
      .dungeons-page .dungeon-check-toggle.active .dungeon-check-box {
        background: var(--text-accent);
      }
      .dungeons-page .dungeon-check-toggle strong {
        display: block;
        color: #fff;
        font-size: 0.78rem;
        line-height: 1.2;
      }
      .dungeons-page .dungeon-check-toggle small {
        display: block;
        margin-top: 0.15rem;
        color: var(--text-muted);
        font-size: 0.68rem;
        line-height: 1.25;
      }
      .dungeons-page .dungeon-input-icon {
        position: relative;
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: 1.05rem minmax(0, 1fr);
        gap: 0.65rem;
        align-items: center;
        min-height: 44px;
        padding: 0 0.85rem;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), var(--bg-base);
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }
      .dungeons-page .dungeon-input-icon:focus-within {
        border-color: color-mix(in srgb, var(--text-accent), transparent 52%);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-accent), transparent 82%);
      }
      .dungeons-page .dungeon-input-icon svg {
        color: var(--text-muted);
        height: 1rem;
        width: 1rem;
        z-index: 1;
        pointer-events: none;
        flex: 0 0 auto;
      }
      .dungeons-page .dungeon-input-icon .control-input {
        display: block;
        width: 100%;
        min-width: 0;
        height: 44px;
        min-height: 44px;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        font-size: 0.86rem;
        line-height: 1;
      }
      .dungeons-page .dungeon-input-icon .control-input:focus {
        border-color: transparent;
        box-shadow: none;
        outline: none;
      }
      .dungeons-page .dungeon-segmented {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        min-height: 44px;
        padding: 0.28rem;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: var(--bg-base);
      }
      .dungeons-page .dungeon-segmented button,
      .dungeons-page .dungeon-readiness-pill {
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--text-muted);
        font-size: 0.74rem;
        font-weight: 900;
        cursor: pointer;
        min-height: 44px;
        transition: background 160ms ease, color 160ms ease, transform 160ms ease;
      }
      .dungeons-page .dungeon-segmented button:hover:not(.active),
      .dungeons-page .dungeon-segmented button:focus-visible:not(.active),
      .dungeons-page .dungeon-readiness-pill:hover:not(.active),
      .dungeons-page .dungeon-readiness-pill:focus-visible:not(.active) {
        background: color-mix(in srgb, var(--text-accent), transparent 91%);
        color: #fff;
        outline: none;
      }
      .dungeons-page .dungeon-segmented button.active,
      .dungeons-page .dungeon-readiness-pill.active {
        background: var(--text-accent);
        color: #000;
      }
      .dungeons-page .dungeon-segmented button:active,
      .dungeons-page .dungeon-readiness-pill:active {
        transform: scale(0.99);
      }
      .dungeons-page .dungeon-advanced-row {
        display: grid;
        grid-template-columns: minmax(40rem, 1.08fr) minmax(30rem, 0.92fr);
        gap: 1.1rem;
        margin-bottom: 1rem;
        align-items: start;
      }
      .dungeons-page .dungeon-modifier-panel {
        display: grid;
        grid-template-columns: minmax(15.5rem, 0.68fr) minmax(21rem, 1.32fr);
        align-items: start;
        gap: 0.75rem;
        min-width: 0;
        min-height: 0;
        margin-bottom: 0;
        padding: 1.05rem 1.1rem;
        border: 1px solid color-mix(in srgb, #a78bfa, transparent 78%);
        border-radius: 8px;
        background:
          linear-gradient(135deg, rgba(167,139,250,0.08), transparent 42%),
          rgba(255,255,255,0.025);
      }
      .dungeons-page .dungeon-modifier-copy,
      .dungeons-page .dungeon-modifier-pickers {
        min-width: 0;
      }
      .dungeons-page .dungeon-modifier-copy {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0.3rem;
        padding-top: 0.05rem;
      }
      .dungeons-page .dungeon-modifier-copy strong {
        color: #fff;
        font-family: var(--font-mono);
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-modifier-copy small {
        color: var(--text-muted);
        line-height: 1.35;
      }
      .dungeons-page .dungeon-empty-menu-hint {
        border-top: 1px solid rgba(255,255,255,0.08);
        padding-top: 0.45rem;
      }
      .dungeons-page .dungeon-modifier-pickers {
        display: grid;
        grid-template-columns: repeat(2, minmax(12rem, 1fr));
        align-items: start;
        gap: 0.75rem;
      }
      .dungeons-page .dungeon-effect-picker {
        position: relative;
        min-width: 0;
        align-self: start;
        height: fit-content;
        z-index: 1;
      }
      .dungeons-page .dungeon-effect-picker.open {
        z-index: 90;
      }
      .dungeons-page .dungeon-effect-trigger {
        width: 100%;
        min-height: 44px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.65rem;
        border: 1px solid var(--border-subtle);
        border-radius: 7px;
        background: rgba(255,255,255,0.03);
        color: #fff;
        padding: 0.65rem 0.75rem;
        text-align: left;
        cursor: pointer;
        transition: transform 160ms ease, border-color 0.18s ease, box-shadow 0.18s ease;
      }
      .dungeons-page .dungeon-effect-trigger:hover,
      .dungeons-page .dungeon-effect-trigger:focus-visible,
      .dungeons-page .dungeon-effect-picker.open .dungeon-effect-trigger {
        border-color: color-mix(in srgb, #a78bfa, transparent 45%);
        box-shadow: 0 0 0 3px rgba(167,139,250,0.14);
        outline: none;
      }
      .dungeons-page .dungeon-effect-trigger span {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.18rem;
      }
      .dungeons-page .dungeon-effect-trigger small,
      .dungeons-page .dungeon-effect-trigger em {
        color: var(--text-muted);
        font-size: 0.68rem;
        font-style: normal;
        line-height: 1.25;
      }
      .dungeons-page .dungeon-effect-trigger strong {
        color: #fff;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-effect-menu {
        position: absolute;
        z-index: 95;
        inset-inline: 0;
        top: calc(100% + 0.45rem);
        display: grid;
        gap: 0.35rem;
        max-height: min(22rem, 60vh);
        overflow-y: auto;
        padding: 0.45rem;
        border: 1px solid color-mix(in srgb, #a78bfa, transparent 48%);
        border-radius: 8px;
        background: #07080d;
        box-shadow: 0 18px 50px rgba(0,0,0,0.48);
      }
      .dungeons-page .dungeon-effect-picker.drop-up .dungeon-effect-menu {
        top: auto;
        bottom: calc(100% + 0.35rem);
      }
      .dungeons-page .dungeon-effect-option {
        min-height: 44px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.6rem;
        border: 1px solid transparent;
        border-radius: 6px;
        background: transparent;
        color: var(--text-muted);
        padding: 0.5rem;
        text-align: left;
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }
      .dungeons-page .dungeon-effect-option:hover,
      .dungeons-page .dungeon-effect-option:focus-visible,
      .dungeons-page .dungeon-effect-option.active {
        border-color: color-mix(in srgb, #a78bfa, transparent 56%);
        background: rgba(167,139,250,0.12);
        color: #fff;
        outline: none;
      }
      .dungeons-page .dungeon-effect-option:focus-visible {
        box-shadow: 0 0 0 2px color-mix(in srgb, #a78bfa, transparent 40%);
      }
      .dungeons-page .dungeon-effect-option img,
      .dungeons-page .dungeon-effect-icon-placeholder {
        width: 30px;
        height: 30px;
        border-radius: 6px;
        object-fit: cover;
        background: rgba(255,255,255,0.06);
      }
      .dungeons-page .dungeon-effect-option span {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.16rem;
      }
      .dungeons-page .dungeon-effect-option strong {
        color: inherit;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-effect-option small,
      .dungeons-page .dungeon-effect-option em {
        color: var(--text-muted);
        font-size: 0.68rem;
        font-style: normal;
        line-height: 1.25;
      }
      .dungeons-page .dungeon-effect-option em {
        grid-column: 2 / -1;
      }
      .dungeons-page .dungeon-valuation-panel {
        display: grid;
        grid-template-columns: minmax(14rem, 0.75fr) minmax(0, 1.25fr);
        align-items: start;
        gap: 0.75rem;
        min-width: 0;
        min-height: 0;
        margin-bottom: 0;
        padding: 1.05rem 1.1rem;
        border: 1px solid color-mix(in srgb, var(--text-accent), transparent 78%);
        border-radius: 8px;
        background:
          linear-gradient(135deg, rgba(56,189,248,0.08), transparent 42%),
          rgba(255,255,255,0.025);
      }
      .dungeons-page .dungeon-valuation-copy,
      .dungeons-page .dungeon-valuation-controls {
        min-width: 0;
      }
      .dungeons-page .dungeon-valuation-copy {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0.3rem;
        padding-top: 0.05rem;
      }
      .dungeons-page .dungeon-valuation-copy strong {
        color: #fff;
        font-family: var(--font-mono);
      }
      .dungeons-page .dungeon-valuation-copy small {
        color: var(--text-muted);
        line-height: 1.35;
      }
      .dungeons-page .dungeon-valuation-controls {
        display: grid;
        grid-template-columns: 1fr;
        justify-items: start;
        justify-self: start;
        max-width: 100%;
        min-width: min(22rem, 100%);
        align-items: start;
        gap: 0.75rem;
      }
      .dungeons-page .dungeon-valuation-segmented {
        align-self: start;
        grid-template-columns: repeat(4, max-content);
        min-height: 44px;
        width: fit-content;
      }
      .dungeons-page .dungeon-valuation-segmented button {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
        min-height: 44px;
      }
      .dungeons-page .dungeon-manual-value-field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        min-width: 0;
      }
      .dungeons-page .dungeon-manual-value-field .control-input {
        width: 100%;
        min-height: 44px;
      }
      .dungeons-page .dungeon-insight {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        column-gap: 0.75rem;
        text-align: left;
        color: inherit;
        cursor: pointer;
        min-height: 44px;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
      }
      .dungeons-page .dungeon-insight:hover,
      .dungeons-page .dungeon-insight:focus-visible {
        border-color: color-mix(in srgb, var(--text-accent), transparent 62%);
        box-shadow: 0 10px 24px rgba(0,0,0,0.16);
        transform: translateY(-1px);
        outline: none;
      }
      .dungeons-page .dungeon-insight:not(.passive):active {
        transform: scale(0.99);
      }
      .dungeons-page .dungeon-insight svg {
        grid-row: span 3;
        color: var(--text-accent);
        margin-top: 0.1rem;
      }
      .dungeons-page .dungeon-insight span,
      .dungeons-page .dungeon-insight strong,
      .dungeons-page .dungeon-insight small {
        grid-column: 2;
        min-width: 0;
      }
      .dungeons-page .dungeon-insight strong {
        line-height: 1.15;
      }
      .dungeons-page .dungeon-insight small {
        display: block;
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
      .dungeons-page .dungeon-insight.passive {
        cursor: default;
      }
      .dungeons-page .dungeon-insight.passive:hover,
      .dungeons-page .dungeon-insight.passive:focus-visible {
        box-shadow: none;
        transform: none;
      }
      .dungeons-page .dungeon-table-wrapper {
        position: relative;
        margin-top: 1rem;
        max-width: 100%;
        min-width: 0;
        overflow: hidden;
      }
      .dungeons-page .dungeon-scroll-hint {
        margin: 0 0 0.45rem;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 850;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .dungeons-page .dungeon-table-wrapper::after {
        content: "";
        position: absolute;
        top: 1.9rem;
        right: 0;
        bottom: 0;
        z-index: 2;
        width: 1.6rem;
        pointer-events: none;
        background: linear-gradient(90deg, rgba(8,11,18,0), rgba(8,11,18,0.58));
      }
      .dungeons-page .dungeon-table {
        max-width: 100%;
        overflow-x: auto;
        overscroll-behavior-x: contain;
        scrollbar-gutter: stable both-edges;
        -webkit-overflow-scrolling: touch;
      }
      .dungeons-page .dungeon-table th,
      .dungeons-page .dungeon-table td {
        vertical-align: middle;
      }
      .dungeons-page .dungeon-sort-button {
        width: 100%;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        letter-spacing: inherit;
        text-transform: inherit;
        cursor: pointer;
        min-height: 44px;
        padding: 0;
      }
      .dungeons-page .dungeon-table th.left-align .dungeon-sort-button {
        justify-content: flex-start;
      }
      .dungeons-page .dungeon-sort-button:focus-visible {
        outline: none;
        color: #fff;
        text-shadow: 0 0 12px rgba(56,189,248,0.7);
      }
      .dungeons-page .dungeon-table table {
        width: max(100%, 1060px);
        min-width: 1060px;
      }
      .dungeons-page .dungeon-completed-input,
      .dungeons-page .dungeon-mobile-completed input {
        width: 6.5rem;
        min-width: 0;
        min-height: 44px;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: var(--bg-base);
        color: #fff;
        padding: 0.45rem 0.55rem;
        font-family: var(--font-mono);
        font-size: 0.82rem;
      }
      .dungeons-page .dungeon-planner-field .control-input:focus,
      .dungeons-page .dungeon-completed-input:focus,
      .dungeons-page .dungeon-mobile-completed input:focus {
        border-color: color-mix(in srgb, var(--text-accent), transparent 52%);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-accent), transparent 82%);
        outline: none;
      }
      .dungeons-page .dungeon-name-cell {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
      }
      .dungeons-page .dungeon-open-button {
        width: 100%;
        min-height: 44px;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
        padding: 0;
      }
      .dungeons-page .dungeon-open-button:focus-visible {
        outline: 2px solid var(--text-accent);
        outline-offset: 4px;
        border-radius: 8px;
      }
      .dungeons-page .dungeon-name-cell img {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        object-fit: cover;
        flex: 0 0 auto;
      }
      .dungeons-page .dungeon-name-cell div {
        min-width: 0;
      }
      .dungeons-page .dungeon-name-cell span,
      .dungeons-page .dungeon-name-cell strong {
        color: #fff;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-name-cell small {
        display: block;
        color: var(--text-muted);
        margin-top: 0.2rem;
        font-size: 0.7rem;
      }
      .dungeons-page .dungeon-readiness {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        max-width: 13rem;
        padding: 0.25rem 0.5rem;
        border-radius: 5px;
        border: 1px solid var(--border-subtle);
        font-size: 0.68rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0;
        white-space: normal;
      }
      .dungeons-page .dungeon-readiness.ready {
        color: #86efac;
        border-color: rgba(34,197,94,0.28);
        background: rgba(34,197,94,0.1);
      }
      .dungeons-page .dungeon-readiness.blocked {
        color: #fca5a5;
        border-color: rgba(239,68,68,0.26);
        background: rgba(239,68,68,0.09);
      }
      .dungeons-page .dungeon-readiness.neutral {
        color: var(--text-muted);
        background: rgba(255,255,255,0.03);
      }
      .dungeons-page .dungeon-mobile-grid {
        display: grid;
        gap: 0.85rem;
      }
      .dungeons-page .dungeon-card {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        width: 100%;
        padding: 0.9rem;
        text-align: left;
        color: inherit;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: rgba(8, 10, 13, 0.74);
        animation: dungeonRise 220ms ease both;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
      }
      .dungeons-page .dungeon-card:nth-child(2) { animation-delay: 30ms; }
      .dungeons-page .dungeon-card:nth-child(3) { animation-delay: 60ms; }
      .dungeons-page .dungeon-card:hover,
      .dungeons-page .dungeon-card:focus-visible {
        border-color: color-mix(in srgb, var(--text-accent), transparent 62%);
        box-shadow: 0 10px 24px rgba(0,0,0,0.16);
        transform: translateY(-1px);
        outline: none;
      }
      .dungeons-page .dungeon-card:active {
        transform: scale(0.99);
      }
      .dungeons-page .dungeon-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .dungeons-page .dungeon-card-stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.55rem;
      }
      .dungeons-page .dungeon-card-stats span {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 0.55rem;
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        background: rgba(255,255,255,0.02);
        min-width: 0;
      }
      .dungeons-page .dungeon-card-stats small {
        color: var(--text-muted);
        font-size: 0.68rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dungeons-page .dungeon-card-stats strong {
        color: #fff;
        font-family: var(--font-mono);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dungeons-page .dungeon-mobile-completed {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.6fr);
        align-items: center;
        gap: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
      }
      .dungeons-page .dungeon-modal {
        max-width: min(980px, calc(100vw - 2rem));
        max-height: min(90dvh, calc(100dvh - 2rem));
      }
      .dungeons-page .modal-overlay,
      .dungeons-page .dungeon-modal-overlay {
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: max(1rem, env(safe-area-inset-top)) clamp(0.75rem, 2vw, 1.5rem) max(1rem, env(safe-area-inset-bottom));
        z-index: 5000;
      }
      .dungeons-page .close-btn {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .dungeons-page .dungeon-modal-title {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 0;
      }
      .dungeons-page .dungeon-modal-title img {
        width: 52px;
        height: 52px;
        border-radius: 8px;
        object-fit: cover;
        flex: 0 0 auto;
      }
      .dungeons-page .dungeon-modal-title h2 {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-modal-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 0.5rem;
      }
      .dungeons-page .dungeon-modal-tags span {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        min-width: 0;
        max-width: 100%;
        border: 1px solid var(--border-subtle);
        border-radius: 5px;
        color: var(--text-muted);
        background: rgba(255,255,255,0.03);
        padding: 0.2rem 0.5rem;
        font-size: 0.75rem;
        overflow-wrap: anywhere;
        white-space: normal;
      }
      .dungeons-page .dungeon-modal-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .dungeons-page .dungeon-modal-panel {
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: rgba(255,255,255,0.025);
        padding: 1rem;
      }
      .dungeons-page .dungeon-modal-panel h3,
      .dungeons-page .dungeon-loot-heading {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin: 0 0 0.75rem;
        color: var(--text-accent);
        font-size: 0.86rem;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .dungeons-page .dungeon-model-note {
        color: var(--text-muted);
        font-size: 0.8rem;
        font-weight: 650;
        line-height: 1.45;
        margin: -0.25rem 0 0.55rem;
      }
      .dungeons-page .dungeon-model-note.risk {
        color: #f8d983;
        border: 1px solid color-mix(in srgb, #f6c85f, transparent 70%);
        border-radius: 6px;
        background: color-mix(in srgb, #f6c85f, transparent 93%);
        padding: 0.55rem 0.65rem;
      }
      .dungeons-page .dungeon-detail-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.45rem 0;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .dungeons-page .dungeon-detail-row span {
        color: var(--text-muted);
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-detail-row strong {
        color: #fff;
        min-width: 0;
        overflow-wrap: anywhere;
        text-align: right;
      }
      .dungeons-page .dungeon-loot-heading {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-subtle);
      }
      .dungeons-page .dungeon-loot-list {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .dungeons-page .dungeon-loot-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(10rem, auto);
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.8rem 1rem;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: rgba(255,255,255,0.02);
        color: inherit;
        text-align: left;
        cursor: pointer;
        min-height: 44px;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
      }
      .dungeons-page .dungeon-loot-row:hover,
      .dungeons-page .dungeon-loot-row:focus-visible {
        border-color: color-mix(in srgb, var(--text-accent), transparent 62%);
        outline: none;
      }
      .dungeons-page .dungeon-loot-main {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 0;
      }
      .dungeons-page .dungeon-loot-main img {
        width: 34px;
        height: 34px;
        border-radius: 6px;
        object-fit: cover;
        flex: 0 0 auto;
      }
      .dungeons-page .dungeon-loot-main strong {
        color: #fff;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-loot-main span,
      .dungeons-page .dungeon-loot-main small {
        color: var(--text-muted);
      }
      .dungeons-page .dungeon-loot-main small {
        display: block;
        margin-top: 0.2rem;
      }
      .dungeons-page .dungeon-loot-value {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.2rem;
        min-width: 9rem;
        text-align: right;
      }
      .dungeons-page .dungeon-loot-value strong {
        color: var(--text-success);
      }
      .dungeons-page .dungeon-loot-value span {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        color: var(--text-muted);
        font-size: 0.72rem;
      }
      .dungeons-page .dungeon-loot-value small {
        display: block;
        color: var(--text-muted);
        font-size: 0.66rem;
        line-height: 1.25;
      }
      .dungeons-page .dungeon-loot-value .dungeon-market-note {
        color: #fde68a;
      }
      .dungeons-page .dungeon-loot-value .dungeon-market-note.thin,
      .dungeons-page .dungeon-loot-value .dungeon-market-note.risk,
      .dungeons-page .dungeon-loot-value .dungeon-market-note.none {
        color: #fca5a5;
      }
      .dungeons-page .dungeon-loot-value .dungeon-market-note.steady,
      .dungeons-page .dungeon-loot-value .dungeon-market-note.active {
        color: #bfdbfe;
      }
      .dungeons-page .dungeon-chest-breakdown {
        grid-column: 1 / -1;
        display: grid;
        gap: 0.55rem;
        padding: 0.8rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        border-radius: 7px;
        background: rgba(56,189,248,0.045);
      }
      .dungeons-page .dungeon-chest-summary,
      .dungeons-page .dungeon-chest-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(9rem, auto);
        align-items: center;
        gap: 0.75rem;
      }
      .dungeons-page .dungeon-chest-summary {
        padding-bottom: 0.55rem;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .dungeons-page .dungeon-chest-summary strong {
        color: var(--text-accent);
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .dungeons-page .dungeon-chest-summary small,
      .dungeons-page .dungeon-chest-row small {
        display: block;
        margin-top: 0.15rem;
        color: var(--text-muted);
        font-size: 0.66rem;
        line-height: 1.25;
      }
      .dungeons-page .dungeon-chest-summary em {
        justify-self: end;
        color: #fff;
        font-style: normal;
        font-family: var(--font-mono);
        font-weight: 900;
      }
      .dungeons-page .dungeon-chest-row {
        padding: 0.55rem 0.65rem;
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 6px;
        background: rgba(0,0,0,0.14);
      }
      .dungeons-page .dungeon-chest-row strong {
        color: #fff;
        overflow-wrap: anywhere;
      }
      .dungeons-page .dungeon-chest-row em {
        justify-self: end;
        color: var(--text-success);
        font-style: normal;
        font-family: var(--font-mono);
        font-weight: 900;
        white-space: nowrap;
      }
      .dungeons-page .dungeon-chest-row span:last-child {
        text-align: right;
      }
      .dungeons-page .dungeon-table tr.clickable-row {
        transition: background 160ms ease, transform 160ms ease;
      }
      .dungeons-page .dungeon-table tr.clickable-row:hover td {
        background: color-mix(in srgb, var(--text-accent), transparent 96%);
      }
      .dungeons-page .dungeon-table tr.clickable-row:active {
        transform: scale(0.998);
      }

      @keyframes dungeonRise {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes dungeonPulse {
        0%, 100% {
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--text-accent), transparent 58%);
        }
        50% {
          box-shadow: 0 0 0 6px color-mix(in srgb, var(--text-accent), transparent 100%);
        }
      }

      @media (max-width: 1100px) {
        .dungeons-page .dungeon-planner {
          grid-template-columns: 1fr;
          grid-template-areas: none;
        }
        .dungeons-page .dungeon-command {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-command-stats,
        .dungeons-page .dungeon-insights {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .dungeons-page .dungeon-modifier-panel,
        .dungeons-page .dungeon-valuation-panel,
        .dungeons-page .dungeon-modifier-pickers,
        .dungeons-page .dungeon-valuation-controls {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-limits-panel,
        .dungeons-page .dungeon-tuning-panel {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .dungeons-page .dungeon-tuning-panel .dungeon-event-completion-field,
        .dungeons-page .dungeon-tuning-panel .dungeon-mf-toggle {
          grid-column: 1 / -1;
        }
        .dungeons-page .dungeon-advanced-row {
          grid-template-columns: 1fr;
        }
      }

      @media (min-width: 1101px) and (max-width: 1500px) {
        .dungeons-page .dungeon-planner {
          grid-template-areas: none;
          grid-template-columns: minmax(19rem, 0.78fr) minmax(17rem, 0.72fr) minmax(30rem, 1.35fr);
        }
        .dungeons-page .dungeon-advanced-row {
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr);
        }
        .dungeons-page .dungeon-modifier-panel {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-modifier-pickers {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-valuation-panel {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-valuation-controls {
          min-width: 0;
          width: 100%;
        }
        .dungeons-page .dungeon-valuation-segmented {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          width: 100%;
        }
      }

      @media (max-width: 720px) {
        .dungeons-page {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          padding-top: 1rem;
        }
        .dungeons-page .header {
          grid-template-columns: 1fr;
          padding: 1rem;
        }
        .dungeons-page .header-title {
          font-size: 1.22rem;
        }
        .dungeons-page .header-status {
          justify-self: start;
        }
        .dungeons-page .dungeon-command,
        .dungeons-page .dungeon-planner {
          padding: 0.85rem;
        }
        .dungeons-page .dungeon-command {
          gap: 0.85rem;
        }
        .dungeons-page .dungeon-command h2 {
          font-size: 1.45rem;
          line-height: 1.08;
        }
        .dungeons-page .dungeon-command p {
          font-size: 0.88rem;
        }
        .dungeons-page .dungeon-risk-note {
          font-size: 0.8rem;
        }
        .dungeons-page .dungeon-planner {
          gap: 0.6rem;
          grid-template-columns: 1fr;
          grid-template-areas: none;
        }
        .dungeons-page .dungeon-control-panel {
          gap: 0.65rem;
          padding: 0.72rem;
        }
        .dungeons-page .dungeon-find-panel,
        .dungeons-page .dungeon-limits-panel,
        .dungeons-page .dungeon-tuning-panel {
          grid-template-columns: 1fr;
          grid-template-rows: auto;
        }
        .dungeons-page .dungeon-control-panel .dungeon-readonly-field {
          min-height: 0;
        }
        .dungeons-page .dungeon-command-stats {
          display: flex;
          gap: 0.5rem;
          margin-left: -0.1rem;
          margin-right: -0.1rem;
          overflow-x: auto;
          padding: 0.05rem 0.1rem 0.35rem;
          scroll-snap-type: x proximity;
        }
        .dungeons-page .dungeon-command-stats div {
          flex: 0 0 7.6rem;
          min-height: 4.7rem;
          padding: 0.65rem;
          scroll-snap-align: start;
        }
        .dungeons-page .dungeon-command-stats span {
          font-size: 0.6rem;
          letter-spacing: 0.06em;
        }
        .dungeons-page .dungeon-command-stats strong {
          font-size: 0.86rem;
          line-height: 1.2;
        }
        .dungeons-page .dungeon-insights,
        .dungeons-page .dungeon-modal-grid {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-insights {
          display: flex;
          gap: 0.65rem;
          overflow-x: auto;
          padding-bottom: 0.3rem;
          scroll-snap-type: x proximity;
        }
        .dungeons-page .dungeon-insight {
          flex: 0 0 min(17rem, 82vw);
          scroll-snap-align: start;
        }
        .dungeons-page .dungeon-valuation-panel {
          padding: 0.8rem;
        }
        .dungeons-page .dungeon-modifier-panel {
          padding: 0.8rem;
        }
        .dungeons-page .dungeon-valuation-segmented {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .dungeons-page .dungeon-card-top,
        .dungeons-page .dungeon-loot-row {
          align-items: stretch;
        }
        .dungeons-page .dungeon-card-top {
          flex-direction: column;
        }
        .dungeons-page .dungeon-loot-row {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-card-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .dungeons-page .dungeon-mobile-completed {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-loot-value {
          align-items: flex-start;
          min-width: 0;
          text-align: left;
        }
        .dungeons-page .dungeon-chest-summary,
        .dungeons-page .dungeon-chest-row {
          grid-template-columns: 1fr;
        }
        .dungeons-page .dungeon-chest-summary em,
        .dungeons-page .dungeon-chest-row em,
        .dungeons-page .dungeon-chest-row span:last-child {
          justify-self: start;
          text-align: left;
        }
        .dungeons-page .dungeon-readiness {
          width: fit-content;
          max-width: 100%;
        }
        .dungeons-page .dungeon-detail-row {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.2rem;
        }
        .dungeons-page .dungeon-detail-row strong {
          text-align: left;
        }
      }
    `}</style>
  );
}

export default DungeonStyles;
