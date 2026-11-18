"use client";

export function ForgeStyles() {
  return (
    <style jsx global>{`

        .forge-page,
        main.forge-page,
        .container.forge-page {
          max-width: 1350px;
          margin: 0 auto;
          padding: 1.5rem 2rem 7rem;
          display: grid;
          gap: 1.25rem;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .forge-page,
          main.forge-page,
          .container.forge-page {
            padding: 0.85rem clamp(0.5rem, 2.5vw, 0.85rem) 7rem !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow-x: clip !important;
            box-sizing: border-box !important;
          }
        }
        .forge-page > *,
        .forge-page .forge-tab-viewport,
        .forge-page .forge-lessons-tab,
        .forge-page .lesson-subview-panel {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .forge-page .forge-header-bar,
        .forge-page .forge-hero,
        .forge-page .forge-builder,
        .forge-page .plan-shell,
        .forge-page .warning-panel,
        .forge-page .shopping-layout > section {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          box-shadow: 0 4px 18px rgba(0,0,0,0.32);
          box-sizing: border-box;
          max-width: 100%;
        }
        .forge-page .forge-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.65rem 1rem;
          position: relative;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .forge-page .forge-title-stack {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .forge-page .forge-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0;
          line-height: 1.2;
        }
        .forge-page .forge-context-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 75%);
          border-radius: 6px;
          padding: 0.2rem 0.55rem;
        }
        .forge-page .craft-inline-metrics {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .forge-page .craft-metric-pill {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          padding: 0.2rem 0.55rem;
        }
        .forge-page .craft-metric-pill strong {
          color: var(--text-primary);
        }
        .forge-page .forge-hero:before {
          display: none;
        }
        .forge-page .forge-hero > * {
          position: relative;
        }
        .forge-page .eyebrow,
        .forge-page .panel-kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
          margin: 0 0 0.55rem;
        }
        .forge-page h1,
        .forge-page h2,
        .forge-page h3,
        .forge-page p {
          margin: 0;
        }
        .forge-page h1 {
          color: var(--text-primary);
          font-size: 1.15rem;
          line-height: 1.2;
        }
        .forge-page h2 {
          color: var(--text-primary);
          font-size: 1.25rem;
        }
        .forge-page h3 {
          color: var(--text-primary);
          font-size: 1rem;
        }
        .forge-page .hero-copy {
          color: var(--text-muted);
          max-width: 820px;
          margin-top: 0.85rem;
          line-height: 1.55;
        }
        .forge-page .hero-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .forge-page .metric,
        .forge-page .stat,
        .forge-page .detail-card,
        .forge-page .empty-panel,
        .forge-page .plan-entry {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
        }
        .forge-page .metric {
          padding: 0.9rem;
          display: grid;
          gap: 0.3rem;
          min-width: 0;
        }
        .forge-page .metric span,
        .forge-page .stat span,
        .forge-page .side-stat span,
        .forge-page .muted {
          color: var(--text-muted);
        }
        .forge-page .metric span,
        .forge-page .stat span {
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }
        .forge-page .metric strong {
          color: var(--text-primary);
          font-size: 1.35rem;
          overflow-wrap: anywhere;
        }
        .forge-page .metric.good strong {
          color: var(--text-success, var(--text-success));
        }
        .forge-page .metric.warn strong {
          color: var(--text-accent, var(--text-accent));
        }
        .forge-page .forge-builder {
          padding: 1rem;
        }
        .forge-page .builder-topline,
        .forge-page .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .forge-page .section-heading > span {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 800;
        }
        .forge-page .builder-grid {
          display: grid;
          grid-template-columns: minmax(220px, 2fr) minmax(130px, 0.8fr) minmax(130px, 0.8fr) auto;
          gap: 0.75rem;
          align-items: end;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .recipe-combobox {
          position: relative;
          min-width: 0;
          z-index: 6;
        }
        .forge-page .recipe-combobox label,
        .forge-page .segmented-label,
        .forge-page .number-field label {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
          margin-bottom: 0.4rem;
        }
        .forge-page .combo-shell,
        .forge-page .number-field input {
          width: 100%;
          min-width: 0;
          min-height: 46px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.38);
          color: var(--text-primary);
        }
        .forge-page .combo-shell {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.65rem;
          padding: 0 0.75rem;
        }
        .forge-page .combo-shell.open,
        .forge-page .combo-shell:focus-within,
        .forge-page .number-field input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 88%);
          outline: none;
        }
        .forge-page .combo-shell svg,
        .forge-page .combo-chevron {
          color: var(--text-muted);
          flex: 0 0 auto;
        }
        .forge-page .combo-shell input,
        .forge-page .number-field input {
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          min-width: 0;
        }
        .forge-page .number-field input {
          padding: 0 0.8rem;
          background: rgba(0,0,0,0.38);
          border: 1px solid var(--border-subtle);
        }
        .forge-page .icon-clear {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
        }
        .forge-page .combo-menu {
          position: absolute;
          z-index: 50;
          left: 0;
          right: 0;
          top: calc(100% + 0.4rem);
          max-height: min(420px, 62vh);
          overflow: auto;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 60%);
          border-radius: 8px;
          background: rgba(12,12,16,0.98);
          box-shadow: 0 24px 70px rgba(0,0,0,0.55);
          padding: 0.35rem;
        }
        .forge-page .combo-option {
          width: 100%;
          min-height: 58px;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 0.65rem;
          align-items: center;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-primary);
          text-align: left;
          padding: 0.45rem;
        }
        .forge-page .combo-option.active,
        .forge-page .combo-option:hover {
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border-color: color-mix(in srgb, var(--text-accent), transparent 65%);
        }
        .forge-page .combo-option.selected {
          background: color-mix(in srgb, var(--text-accent), transparent 78%);
          border-color: var(--text-accent);
        }
        .forge-page .combo-option img,
        .forge-page .entry-title img,
        .forge-page .hero-detail img,
        .forge-page .need-name img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-subtle);
        }
        .forge-page .combo-option span,
        .forge-page .entry-title span,
        .forge-page .need-name span {
          min-width: 0;
        }
        .forge-page .combo-option strong,
        .forge-page .entry-title strong,
        .forge-page .need-name strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .combo-option small,
        .forge-page .entry-title small,
        .forge-page .need-name small,
        .forge-page .option-side {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .forge-page .combo-empty {
          color: var(--text-muted);
          padding: 1rem;
          text-align: center;
        }
        .forge-page .segmented-control {
          min-width: 0;
        }
        .forge-page .segmented-options {
          display: flex;
          gap: 0.35rem;
          min-height: 46px;
          padding: 0.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.3);
          overflow-x: auto;
        }
        .forge-page .segmented-options button,
        .forge-page .primary-button,
        .forge-page .ghost-button,
        .forge-page .entry-actions button {
          min-height: 40px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.55rem 0.75rem;
          white-space: nowrap;
        }
        .forge-page .segmented-options button.active {
          background: var(--text-accent);
          color: var(--bg-base);
          border-color: color-mix(in srgb, var(--text-accent), black 18%);
          font-weight: 800;
        }
        .forge-page .primary-button {
          background: rgba(56, 189, 248, 0.18);
          color: var(--text-main);
          border: 1px solid rgba(56, 189, 248, 0.45);
          font-weight: 800;
        }
        .forge-page .primary-button:hover:not(:disabled) {
          background: rgba(56, 189, 248, 0.28);
          border-color: rgba(56, 189, 248, 0.7);
          box-shadow: 0 4px 16px rgba(56, 189, 248, 0.25);
          transform: translateY(-1px);
        }
        .forge-page .primary-button:active:not(:disabled) {
          transform: translateY(0);
        }
        .forge-page .primary-button:disabled {
          background: var(--bg-card);
          border-color: var(--border-subtle);
          color: var(--text-muted);
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .forge-page .primary-button {
          align-self: end;
        }
        .forge-page .ghost-button.danger,
        .forge-page .entry-actions .danger {
          color: var(--text-danger);
          border-color: rgba(244,63,94,0.35);
        }
        .forge-page .plan-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 0.36fr);
          gap: 1rem;
          padding: 1rem;
        }
        .forge-page .entry-list {
          display: grid;
          gap: 0.75rem;
        }
        .forge-page .plan-entry {
          display: grid;
          gap: 0.85rem;
          padding: 0.85rem;
        }
        .forge-page .plan-entry.focused {
          border-color: rgba(34,211,238,0.65);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.1);
        }
        .forge-page .entry-title {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr);
          gap: 0.75rem;
          align-items: center;
          border: 0;
          background: transparent;
          color: var(--text-primary);
          padding: 0;
          text-align: left;
        }
        .forge-page .entry-controls,
        .forge-page .entry-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.65rem;
        }
        .forge-page .entry-controls {
          grid-template-columns: repeat(2, minmax(120px, 180px));
        }
        .forge-page .stat {
          padding: 0.65rem;
          display: grid;
          gap: 0.2rem;
          min-width: 0;
        }
        .forge-page .stat strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        .forge-page .entry-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .forge-page .warning-row,
        .forge-page .warning-panel {
          display: flex;
          gap: 0.65rem;
          align-items: flex-start;
          color: var(--text-accent);
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 8px;
          background: rgba(245,158,11,0.08);
          padding: 0.75rem;
        }
        .forge-page .plan-side {
          display: grid;
          gap: 0.75rem;
          align-content: start;
          position: sticky;
          top: 1rem;
        }
        .forge-page .detail-card {
          padding: 0.85rem;
          display: grid;
          gap: 0.65rem;
          min-width: 0;
        }
        .forge-page .hero-detail {
          grid-template-columns: 56px minmax(0, 1fr);
          align-items: center;
        }
        .forge-page .hero-detail img {
          width: 56px;
          height: 56px;
        }
        .forge-page .hero-detail p {
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .forge-page .hero-detail span,
        .forge-page .detail-card p {
          color: var(--text-muted);
          line-height: 1.45;
        }
        .forge-page .side-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border-top: 1px solid var(--border-subtle);
          padding-top: 0.55rem;
        }
        .forge-page .side-stat strong {
          color: var(--text-primary);
          text-align: right;
        }
        .forge-page .empty-panel {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.45rem;
          padding: 2rem;
          color: var(--text-muted);
        }
        .forge-page .empty-panel strong {
          color: var(--text-primary);
          font-size: 1.1rem;
        }
        .forge-page .shopping-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .forge-page .shopping-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
        }
        .forge-page .shopping-title-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .forge-page .shopping-subtext {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .forge-page .copy-shopping-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.85rem;
          border-radius: 6px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          min-height: 44px;
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .forge-page .copy-shopping-btn:hover {
          border-color: var(--text-accent);
          color: var(--text-accent);
        }
        .forge-page .cost-with-coin {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .forge-page .shopping-layout > section {
          padding: 1rem;
          min-width: 0;
        }
        .forge-page .need-list {
          display: grid;
          gap: 0.55rem;
        }
        .forge-page .need-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 92px 92px 92px 118px;
          gap: 0.6rem;
          align-items: center;
          padding: 0.6rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
        }
        .forge-page .need-name {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 0.6rem;
          align-items: center;
          border: 0;
          background: transparent;
          color: var(--text-primary);
          text-align: left;
          padding: 0;
          min-width: 0;
        }
        .forge-page .need-name img {
          width: 40px;
          height: 40px;
        }
        .forge-page .need-row .number-field input {
          min-height: 40px;
        }
        .forge-page .need-stat {
          display: grid;
          gap: 0.1rem;
          min-width: 0;
        }
        .forge-page .need-stat span {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .forge-page .need-stat strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        @media (max-width: 1080px) {
          .forge-page .builder-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            align-items: start;
          }
          .forge-page .recipe-combobox {
            grid-column: 1 / -1;
          }
          .forge-page .primary-button {
            align-self: end;
            grid-column: 2;
            justify-self: end;
            min-width: 180px;
          }
          .forge-page .shopping-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 1280px) {
          .forge-page .forge-hero,
          .forge-page .forge-hero.has-metrics,
          .forge-page .plan-shell,
          .forge-page .shopping-layout {
            grid-template-columns: 1fr;
          }
          .forge-page .plan-side {
            position: static;
          }
        }
        @media (max-width: 980px) {
          .forge-page .builder-grid {
            grid-template-columns: 1fr;
          }
          .forge-page .primary-button {
            grid-column: auto;
            justify-self: stretch;
          }
          .forge-page .entry-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .forge-page .need-row {
            grid-template-columns: 1fr 1fr 1fr;
          }
          .forge-page .need-name {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 620px) {
          .forge-page,
          .forge-page .craft-item-tab {
            gap: 0.75rem;
          }
          .forge-page .forge-hero,
          .forge-page .forge-builder,
          .forge-page .plan-shell,
          .forge-page .shopping-layout > section {
            padding: 0.85rem;
          }
          .forge-page .hero-metrics,
          .forge-page .entry-controls,
          .forge-page .entry-stats {
            grid-template-columns: 1fr;
          }
          .forge-page .need-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
          }
          .forge-page .need-name {
            grid-column: 1 / -1;
          }
          .forge-page .builder-topline,
          .forge-page .section-heading {
            align-items: stretch;
            flex-direction: column;
          }
          .forge-page .combo-option {
            grid-template-columns: 38px minmax(0, 1fr);
          }
          .forge-page .entry-actions button {
            flex: 1 1 100%;
          }
        }

        .forge-page .hero-copy-stack {
          min-width: 0;
          display: grid;
          gap: 0.85rem;
          align-content: start;
        }
        .forge-page .forge-context-chips,
        .forge-page .plan-summary-pills,
        .forge-page .selected-recipe-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-width: 0;
        }
        .forge-page .forge-context-chips span,
        .forge-page .plan-summary-pills span,
        .forge-page .forge-builder-badge,
        .forge-page .selected-recipe-meta span {
          min-height: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          max-width: 100%;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 80%);
          border-radius: 999px;
          background: color-mix(in srgb, var(--text-accent), transparent 93%);
          color: var(--text-accent);
          font-size: 0.74rem;
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1.15;
          padding: 0.45rem 0.7rem;
        }
        .forge-page .forge-context-chips svg {
          flex: 0 0 auto;
          color: var(--quality-refined);
        }
        .forge-page .plan-summary-pills {
          justify-content: flex-end;
        }
        .forge-page .plan-summary-pills span,
        .forge-page .selected-recipe-meta span {
          border-color: var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-main);
        }
        .forge-page .plan-summary-pills .warn,
        .forge-page .forge-builder-badge.warn {
          border-color: color-mix(in srgb, var(--text-accent), transparent 64%);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: var(--text-accent);
        }
        .forge-page .builder-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.65rem;
          min-width: 0;
        }
        .forge-page .forge-builder-badge {
          white-space: nowrap;
        }

        .forge-page .filter-picker {
          position: relative;
          min-width: 0;
          z-index: 4;
        }
        .forge-page .filter-picker-button {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-primary);
          font: inherit;
          font-weight: 900;
          cursor: pointer;
          padding: 0.7rem 0.85rem;
          transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
        }
        .forge-page .filter-picker-button span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .filter-picker-button svg {
          flex: 0 0 auto;
          color: var(--text-muted);
          transition: transform 150ms ease;
        }
        .forge-page .filter-picker-button.open svg {
          transform: rotate(180deg);
        }
        .forge-page .filter-picker-button:hover,
        .forge-page .filter-picker-button.open,
        .forge-page .filter-picker-button:focus-visible {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 88%);
          outline: none;
        }
        .forge-page .filter-picker-menu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 0.4rem);
          z-index: 20;
          display: grid;
          gap: 0.25rem;
          max-height: 260px;
          overflow-y: auto;
          padding: 0.35rem;
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          background: var(--bg-panel);
          box-shadow: 0 18px 44px rgba(0,0,0,0.48);
        }
        .forge-page .filter-picker-menu button {
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-weight: 850;
          cursor: pointer;
          padding: 0.6rem 0.7rem;
          text-align: left;
          transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
        }
        .forge-page .filter-picker-menu button.active,
        .forge-page .filter-picker-menu button:hover {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
        }
        .forge-page .filter-picker-menu button.selected {
          color: var(--text-accent);
        }

        .forge-page .selected-recipe-card {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
          gap: 0.85rem;
          align-items: center;
          margin-top: 0.95rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
          padding: 0.8rem;
        }
        .forge-page .selected-recipe-title {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.25rem;
          text-align: left;
        }
        .forge-page .selected-recipe-title img {
          width: 3rem;
          height: 3rem;
          flex: 0 0 auto;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.28);
          object-fit: contain;
        }
        .forge-page .selected-recipe-title span {
          min-width: 0;
          display: grid;
          gap: 0.12rem;
        }
        .forge-page .selected-recipe-title small,
        .forge-page .selected-recipe-title em {
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.74rem;
          font-style: normal;
          font-weight: 800;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .forge-page .selected-recipe-title strong {
          overflow: hidden;
          color: var(--text-main);
          font-size: 1rem;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .selected-recipe-title:hover {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 94%);
        }
        .forge-page .selected-recipe-meta {
          justify-content: flex-end;
        }
        .forge-page .selected-recipe-meta span {
          overflow: hidden;
          max-width: 100%;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .forge-page .forge-undo-toast {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          color: var(--text-main);
          padding: 0.75rem 0.85rem;
        }
        .forge-page .forge-undo-toast button {
          border: 1px solid var(--border-focus);
          border-radius: 8px;
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
          color: var(--text-accent);
          cursor: pointer;
          font-weight: 800;
          min-height: 2.35rem;
          padding: 0 0.85rem;
        }
        .forge-page .forge-undo-toast button:hover,
        .forge-page .forge-undo-toast button:focus-visible {
          background: color-mix(in srgb, var(--text-accent), transparent 82%);
          outline: none;
        }

        .forge-page .plan-shell.no-side {
          grid-template-columns: minmax(0, 1fr);
        }
        .forge-page .plan-main {
          min-width: 0;
        }

        .forge-page .combo-shell:focus-within,
        .forge-page .number-field input:focus-visible,
        .forge-page .filter-picker-button:focus-visible,
        .forge-page .filter-picker-menu button:focus-visible,
        .forge-page .combo-option:focus-visible,
        .forge-page .primary-button:focus-visible,
        .forge-page .ghost-button:focus-visible,
        .forge-page .entry-actions button:focus-visible,
        .forge-page .entry-title:focus-visible,
        .forge-page .need-name:focus-visible,
        .forge-page .icon-clear:focus-visible,
        .forge-page .selected-recipe-title:focus-visible,
        .forge-page .forge-undo-toast button:focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 3px;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 88%);
        }
        .forge-page .primary-button:active:not(:disabled),
        .forge-page .ghost-button:active,
        .forge-page .entry-actions button:active,
        .forge-page .need-name:active,
        .forge-page .selected-recipe-title:active,
        .forge-page .filter-picker-button:active {
          transform: scale(0.985);
        }

        @media (hover: hover) and (pointer: fine) {
          .forge-page .metric:hover,
          .forge-page .selected-recipe-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
          }
          .forge-page .plan-entry:hover,
          .forge-page .need-row:hover {
            transform: translateY(-1px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .forge-page *,
          .forge-page *::before,
          .forge-page *::after {
            scroll-behavior: auto !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
        }
        @media (max-width: 1380px) {
          .forge-page .forge-hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .plan-shell {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .plan-side {
            position: static;
          }
        }
        @media (max-width: 1320px) {
          .forge-page .builder-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          }
          .forge-page .recipe-combobox {
            grid-column: 1 / -1;
          }
          .forge-page .primary-button {
            grid-column: 1 / -1;
            width: 100%;
          }
          .forge-page .filter-picker {
            width: min(100%, 220px);
          }
        }
        @media (max-width: 620px) {
          .forge-page .forge-context-chips,
          .forge-page .plan-summary-pills,
          .forge-page .builder-actions,
          .forge-page .selected-recipe-meta {
            justify-content: flex-start;
          }
          .forge-page .builder-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .recipe-combobox,
          .forge-page .primary-button {
            grid-column: 1 / -1;
            width: 100%;
          }
          .forge-page .filter-picker {
            width: 100%;
            z-index: 30;
          }
          .forge-page .filter-picker-menu {
            max-height: min(18rem, calc(100vh - 8rem));
          }
          .forge-page .builder-actions {
            width: 100%;
            align-items: stretch;
            flex-direction: column;
          }
          .forge-page .forge-builder-badge,
          .forge-page .ghost-button {
            width: 100%;
            justify-content: center;
          }
          .forge-page .selected-recipe-card {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .selected-recipe-title {
            width: 100%;
          }
          .forge-page .need-list,
          .forge-page .need-row,
          .forge-page .need-name,
          .forge-page .need-name span {
            min-width: 0;
            max-width: 100%;
          }
          .forge-page .need-row {
            grid-template-columns: minmax(0, 1fr);
          }
          .forge-page .need-name {
            width: 100%;
          }
          .forge-page .forge-undo-toast {
            align-items: stretch;
            flex-direction: column;
          }
        }
      

        .forge-page .forge-tabs {
          position: sticky;
          top: 0.75rem;
          z-index: 20;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
          margin: 0 0 1rem;
          padding: 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          background: var(--bg-panel);
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 55px rgba(0,0,0,0.18);
        }
        .forge-page .forge-tabs button {
          min-width: 0;
          min-height: 44px;
          border: 1px solid transparent;
          background: var(--bg-card);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.7rem 0.85rem;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .forge-page .forge-tabs button:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--text-accent), transparent 68%);
          color: var(--text-main);
        }
        .forge-page .forge-tabs button.active {
          border-color: color-mix(in srgb, var(--text-accent), transparent 36%);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: var(--text-main);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-accent), transparent 92%);
        }
        .forge-page .forge-tabs button:focus-visible {
          outline: 2px solid var(--text-accent);
          outline-offset: 3px;
        }
        .forge-page .forge-tabs span,
        .forge-page .forge-tabs small {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .forge-tabs span {
          font-weight: 900;
          font-size: 0.95rem;
        }
        .forge-page .forge-tabs small {
          margin-top: 0.18rem;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .forge-page .craft-item-tab {
          display: grid;
          gap: 1rem;
        }

        .forge-page .forge-lessons-tab {
          display: grid;
          gap: 1rem;
          min-height: 520px;
        }

        /* 4-View Segmented Navigation */
        .forge-page .lesson-segmented-nav {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.4rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 0.35rem;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .forge-page .lesson-segment-btn {
          min-height: 44px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0 0.5rem;
          min-width: 0;
          box-sizing: border-box;
          transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
        }
        .forge-page .lesson-segment-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }
        .forge-page .lesson-segment-btn.active {
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border-color: color-mix(in srgb, var(--text-accent), transparent 60%);
        }
        .forge-page .segment-badge {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-muted);
        }
        .forge-page .lesson-segment-btn.active .segment-badge {
          background: color-mix(in srgb, var(--text-accent), transparent 75%);
          color: var(--text-primary);
        }
        .forge-page .lesson-subview-panel {
          display: grid;
          gap: 1rem;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .forge-page .lesson-subview-panel.hidden {
          display: none !important;
        }
        @media (max-width: 540px) {
          .forge-page .lesson-segmented-nav {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* 1. Header Controls */
        .forge-page .lesson-header-controls {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
          overflow: visible;
          position: relative;
          z-index: 25;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .forge-page .controls-unified-bar {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          gap: 1rem;
          padding: 0.75rem;
          box-sizing: border-box;
          min-width: 0;
        }
        @media (min-width: 860px) {
          .forge-page .controls-unified-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 1.25rem;
            padding: 0.85rem 1.15rem;
            align-items: start;
          }
        }
        .forge-page .toolbar-section {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .toolbar-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .forge-page .toolbar-section-header .panel-kicker {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--text-accent);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .forge-page .toolbar-subtext {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .stepper-wrap.compact {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          width: auto;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .forge-page .stepper-btn.mini {
          width: 44px;
          min-width: 44px;
          height: 44px;
          min-height: 44px;
          padding: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-weight: 800;
          font-size: 1.15rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
          flex-shrink: 0;
          user-select: none;
          box-sizing: border-box;
        }
        .forge-page .stepper-btn.mini:hover:not(:disabled) {
          border-color: var(--text-accent);
          color: var(--text-accent);
        }
        .forge-page .stepper-btn.mini:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .forge-page .number-display-wrap.compact {
          flex: 0 1 auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.15rem;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          padding: 0 0.35rem;
          height: 44px;
          min-width: 48px;
          max-width: 72px;
          box-sizing: border-box;
        }
        .forge-page .level-prefix {
          font-weight: 800;
          color: var(--text-accent);
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .forge-page .direct-number-input.compact {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-weight: 900;
          font-size: 1rem;
          outline: none;
          width: 32px;
          min-width: 0;
          max-width: 100%;
          flex: 0 1 auto;
          text-align: center;
          padding: 0;
          box-sizing: border-box;
        }

        /* Unified Duration Control */
        .forge-page .unified-duration-control {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .duration-select-wrapper {
          flex: 1;
          min-width: 0;
          max-width: 100%;
          position: relative;
        }
        .forge-page .duration-select-wrapper.open {
          z-index: 80;
        }
        .forge-page .duration-trigger-btn {
          width: 100%;
          height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 0 0.65rem;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.35rem;
          transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }
        .forge-page .duration-trigger-btn:hover,
        .forge-page .duration-trigger-btn.open {
          border-color: var(--border-focus);
          background: rgba(255, 255, 255, 0.05);
        }
        .forge-page .duration-trigger-btn:focus-visible {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-accent), transparent 75%);
          outline: none;
        }
        .forge-page .duration-trigger-btn .duration-val {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .forge-page .duration-trigger-btn .chevron-icon {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: transform 150ms ease;
        }
        .forge-page .duration-trigger-btn .chevron-icon.flipped {
          transform: rotate(180deg);
        }
        .forge-page .duration-popover-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          min-width: 140px;
          max-height: 240px;
          overflow-y: auto;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
          z-index: 100;
          padding: 0.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          scrollbar-width: thin;
          scrollbar-color: var(--border-subtle) transparent;
        }
        .forge-page .duration-popover-menu::-webkit-scrollbar {
          width: 5px;
        }
        .forge-page .duration-popover-menu::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 3px;
        }
        .forge-page .duration-option-btn {
          width: 100%;
          padding: 0.45rem 0.65rem;
          border: 1px solid transparent;
          border-radius: 5px;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
          transition: all 120ms ease;
          box-sizing: border-box;
        }
        .forge-page .duration-option-btn:hover,
        .forge-page .duration-option-btn.highlighted {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          border-color: var(--border-subtle);
        }
        .forge-page .duration-option-btn.active {
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          color: var(--text-accent);
          border-color: color-mix(in srgb, var(--text-accent), transparent 60%);
        }
        .forge-page .duration-option-btn.active.highlighted,
        .forge-page .duration-option-btn.active:hover {
          background: color-mix(in srgb, var(--text-accent), transparent 75%);
          color: var(--text-accent);
          border-color: var(--text-accent);
        }
        .forge-page .duration-option-btn .active-dot {
          font-size: 1.1rem;
          line-height: 1;
          color: var(--text-accent);
        }
        .forge-page .duration-select-input {
          width: 100%;
          max-width: 100%;
          height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 0 0.5rem;
          font-weight: 800;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .duration-select-input:focus-visible {
          border-color: var(--text-accent);
        }

        /* Buffs Grid & Inputs */
        .forge-page .buff-active-badge {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid transparent;
        }
        .forge-page .buff-active-badge.active {
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border-color: color-mix(in srgb, var(--text-accent), transparent 60%);
        }
        .forge-page .buff-inputs-grid {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .forge-page .membership-pill-btn {
          min-height: 44px;
          height: 44px;
          padding: 0 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          cursor: pointer;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.12s ease, background-color 0.12s ease, color 0.12s ease;
        }
        .forge-page .membership-pill-btn.active {
          border-color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: var(--text-accent);
        }
        .forge-page .buff-extra-inputs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.45rem;
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .forge-page .buff-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .buff-field-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .forge-page .buff-number-field {
          height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-primary);
          padding: 0 0.5rem;
          font-weight: 900;
          font-size: 0.95rem;
          outline: none;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .buff-number-field:focus-visible {
          border-color: var(--text-accent);
        }

        /* Streamlined Rate Context Strip */
        .forge-page .rate-context-strip {
          border-top: 1px solid var(--border-subtle);
          background: rgba(0, 0, 0, 0.22);
          padding: 0.65rem 1.15rem;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          align-items: center;
          border-radius: 0 0 8px 8px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
        }
        .forge-page .context-stat {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .forge-page .context-stat .stat-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .forge-page .context-stat strong {
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 900;
          font-family: var(--font-mono);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .forge-page .context-stat .good-val {
          color: var(--text-success);
        }
        .forge-page .context-stat .accent-val {
          color: var(--text-accent);
        }
        .forge-page .context-stat span {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        @media (max-width: 640px) {
          .forge-page .rate-context-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 0.6rem 0.65rem;
            gap: 0.6rem 0.5rem;
          }
          .forge-page .context-stat .stat-label {
            font-size: 0.62rem;
            white-space: normal;
            line-height: 1.2;
          }
          .forge-page .context-stat strong {
            font-size: 0.8rem;
            white-space: normal;
            word-break: break-word;
            line-height: 1.25;
          }
          .forge-page .unit-stepper-compact {
            height: 44px;
          }
          .forge-page .unit-stepper-compact .unit-step-btn {
            width: 44px;
            min-width: 44px;
          }
        }

        /* 2. Target Goal Estimator Card */
        .forge-page .lesson-target-goal-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 275px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .goal-card-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem 1rem;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .goal-title-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
          max-width: 100%;
        }
        .forge-page .goal-title-group h2 {
          margin: 0;
          font-size: clamp(1.15rem, 3.5vw, 1.45rem);
          font-weight: 900;
          color: var(--text-primary);
          word-break: break-word;
        }
        .forge-page .target-stepper-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .forge-page .target-direct-group {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .forge-page .target-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-muted);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .forge-page .target-milestones {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }
        .forge-page .goal-exp-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .exp-metric-block {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .forge-page .exp-metric-block strong {
          color: var(--text-accent);
          font-size: 1.35rem;
        }
        .forge-page .level-jump-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 1.1rem;
          font-weight: 900;
          color: var(--text-primary);
        }
        .forge-page .goal-routes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
          gap: 1rem;
          min-height: 170px;
        }
        @media (min-width: 1040px) {
          .forge-page .goal-routes-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .forge-page .route-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .route-card.best-route {
          border-color: color-mix(in srgb, var(--quality-unique), var(--border-subtle) 65%);
        }
        .forge-page .route-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .route-tag-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
          flex: 1 1 auto;
        }
        .forge-page .route-subtitle {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .forge-page .route-cost-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
          flex-shrink: 0;
        }
        .forge-page .route-cost-val {
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
        }
        .forge-page .gold-coin-inline,
        .gold-coin-inline {
          display: inline-block;
          vertical-align: -2px;
          width: 14px;
          height: 14px;
          object-fit: contain;
          margin-left: 2px;
          flex-shrink: 0;
        }
        .forge-page .route-time-val {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
          white-space: nowrap;
        }
        .forge-page .route-body {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .route-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .forge-page .route-tag.cheap {
          color: var(--text-success);
          background: color-mix(in srgb, var(--text-success), transparent 88%);
        }
        .forge-page .route-tag.best {
          color: var(--quality-unique);
          background: color-mix(in srgb, var(--quality-unique), transparent 86%);
        }
        .forge-page .route-tag.fast {
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
        }
        .forge-page .route-actions-row {
          margin-top: auto;
          display: flex;
          flex-direction: column;
        }
        .forge-page .route-ratio {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
        }
        .forge-page .route-mat-name {
          font-size: 1.05rem;
          color: var(--text-primary);
          margin: 0;
        }
        .forge-page .route-details {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0.15rem 0 0;
        }
        .forge-page .bracket-steps-container {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          width: 100%;
          box-sizing: border-box;
        }
        .forge-page .bracket-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-accent);
          text-transform: uppercase;
        }
        .forge-page .bracket-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          width: 100%;
        }
        .forge-page .bracket-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.35rem 0.5rem;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          font-size: 0.78rem;
          box-sizing: border-box;
          min-width: 0;
        }
        .forge-page .bracket-level-range {
          font-weight: 800;
          color: var(--text-accent);
          font-size: 0.72rem;
          white-space: nowrap;
        }
        .forge-page .bracket-material-name {
          flex: 1;
          min-width: 0;
          color: var(--text-primary);
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forge-page .bracket-qty {
          color: var(--text-primary);
          white-space: nowrap;
        }
        .forge-page .bracket-cost {
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 0.15rem;
        }
        .forge-page .route-subtext {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }
        .forge-page .route-action-btn {
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          font-size: 0.8rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          cursor: pointer;
          margin-top: auto;
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .forge-page .route-action-btn:hover {
          border-color: var(--text-accent);
          color: var(--text-accent);
        }

        /* 3. Lesson Queue & Review Screen */
        .forge-page .lesson-queue-shell {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 1.25rem;
          display: grid;
          gap: 1rem;
        }
        .forge-page .empty-queue-content {
          text-align: center;
          padding: 2.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
        }
        .forge-page .empty-icon {
          color: var(--text-muted);
          opacity: 0.45;
        }
        .forge-page .empty-queue-content p {
          max-width: 600px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .forge-page .empty-actions-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
          margin-top: 0.5rem;
        }
        .forge-page .primary-action-btn {
          min-height: 44px;
          padding: 0 1.25rem;
          border: 1px solid color-mix(in srgb, var(--text-accent), black 18%);
          border-radius: 8px;
          background: var(--text-accent);
          color: var(--bg-base);
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
        }
        .forge-page .ghost-action-btn {
          min-height: 44px;
          padding: 0 1.15rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-weight: 800;
          cursor: pointer;
        }
        .forge-page .ghost-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .forge-page .secondary-action-btn {
          min-height: 44px;
          padding: 0 1.15rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-accent);
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: border-color 0.12s ease, background-color 0.12s ease;
        }
        .forge-page .secondary-action-btn:hover {
          border-color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
        }
        .forge-page .max-level-reached-banner {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
        }
        .forge-page .max-level-reached-banner strong {
          color: var(--text-success);
          font-size: 1.05rem;
          display: block;
        }
        .forge-page .max-level-reached-banner p {
          color: var(--text-muted);
          font-size: 0.82rem;
          margin: 0.2rem 0 0;
        }
        .forge-page .queue-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.65rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .clear-queue-btn {
          min-height: 32px;
          padding: 0.2rem 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: transparent;
          color: var(--text-danger);
          font-size: 0.75rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
        }
        .forge-page .queue-items-list {
          display: grid;
          gap: 0.65rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .queue-item-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .queue-item-card.has-penalty {
          border-color: color-mix(in srgb, var(--text-accent), transparent 65%);
        }
        .forge-page .item-card-left {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          flex: 1;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .forge-page .item-card-right {
          flex-shrink: 0;
        }
        .forge-page .item-name-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-width: 0;
        }
        .forge-page .item-title {
          font-size: 1rem;
          color: var(--text-primary);
        }
        .forge-page .overlevel-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border-radius: 4px;
          padding: 0.15rem 0.4rem;
        }
        .forge-page .quality-badge {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.12rem 0.4rem;
          border-radius: 4px;
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
        }
        .forge-page .quality-badge.standard { color: var(--quality-standard); }
        .forge-page .quality-badge.refined { color: color-mix(in srgb, var(--quality-refined), white 20%); }
        .forge-page .quality-badge.premium { color: var(--quality-premium); }
        .forge-page .quality-badge.epic { color: color-mix(in srgb, var(--quality-epic), white 25%); }
        .forge-page .quality-badge.legendary { color: var(--quality-legendary); }
        .forge-page .quality-badge.mythic {
          background: linear-gradient(0deg, rgb(244, 138, 0), rgb(218, 91, 0));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          border-color: color-mix(in srgb, rgb(244, 138, 0), transparent 60%);
        }
        .forge-page .quality-badge.unique {
          background: linear-gradient(0deg, rgb(180, 23, 244), rgb(128, 6, 181));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          border-color: color-mix(in srgb, rgb(180, 23, 244), transparent 60%);
        }

        .forge-page .item-stepper-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .stepper-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .qty-btn {
          width: 44px;
          min-width: 44px;
          height: 44px;
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .forge-page .qty-input {
          width: 56px;
          min-width: 44px;
          height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-primary);
          font-weight: 800;
          text-align: center;
          outline: none;
          box-sizing: border-box;
        }
        .forge-page .step-quick-pill {
          min-height: 44px;
          min-width: 44px;
          padding: 0 0.5rem;
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .forge-page .item-metric-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.2rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .metric-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          max-width: 100%;
          box-sizing: border-box;
        }
        .forge-page .metric-badge strong {
          color: var(--text-primary);
        }
        .forge-page .metric-badge.warn strong {
          color: var(--text-accent);
        }
        .forge-page .remove-item-btn {
          width: 44px;
          height: 44px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .forge-page .remove-item-btn:hover {
          color: var(--text-danger);
          border-color: rgba(244, 63, 94, 0.3);
        }
        @media (max-width: 640px) {
          .forge-page .queue-item-card {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 0.75rem 0.65rem;
            position: relative;
            gap: 0.65rem;
          }
          .forge-page .item-card-right {
            position: absolute;
            top: 0.55rem;
            right: 0.55rem;
          }
          .forge-page .item-name-row {
            padding-right: 2.75rem;
          }
          .forge-page .lesson-queue-shell {
            padding: 0.75rem 0.65rem;
            gap: 0.75rem;
          }
        }

        /* Advanced Details Drawer */
        .forge-page .advanced-drawer-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .advanced-toggle-bar {
          width: 100%;
          min-height: 44px;
          padding: 0.75rem 1rem;
          border: none;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-primary);
          font-weight: 800;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          max-width: 100%;
          box-sizing: border-box;
        }
        .forge-page .advanced-drawer-body {
          padding: 0.75rem;
          border-top: 1px solid var(--border-subtle);
          display: grid;
          gap: 0.75rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .summary-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(130px, 100%), 1fr));
          gap: 0.5rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .summary-stat-box {
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.65rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .summary-stat-box.danger-stat {
          border-color: rgba(244, 63, 94, 0.5);
        }
        .forge-page .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 800;
          text-transform: uppercase;
        }
        .forge-page .stat-value {
          font-size: 1.15rem;
          color: var(--text-primary);
        }
        .forge-page .stat-value.highlight {
          color: var(--text-accent);
        }
        .forge-page .stat-value.good {
          color: var(--text-success);
        }
        .forge-page .level-progression-panel {
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.75rem;
          display: grid;
          gap: 0.4rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .level-progression-labels {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.35rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .forge-page .panel-sub-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
        }
        .forge-page .level-jump-text {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 900;
          flex-wrap: wrap;
          min-width: 0;
        }
        .forge-page .progress-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .level-progress-track {
          width: 100%;
          height: 10px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 5px;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
        }
        .forge-page .level-progress-fill {
          height: 100%;
          background: var(--text-accent);
          border-radius: 5px;
          transition: width 0.25s ease;
        }
        .forge-page .in-game-warning-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          padding: 0.75rem 1rem;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 60%);
          border-radius: 6px;
          background: color-mix(in srgb, var(--text-accent), transparent 93%);
          color: var(--text-accent);
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .forge-page .in-game-warning-banner.cap-exceeded {
          border-color: rgba(244, 63, 94, 0.6);
          background: rgba(244, 63, 94, 0.1);
          color: var(--text-danger);
        }
        .forge-page .warn-icon {
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        /* 4. Material Catalog Section */
        .forge-page .material-catalog-section {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 1.25rem;
          display: grid;
          gap: 1rem;
        }
        .forge-page .catalog-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .forge-page .catalog-title-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .forge-page .catalog-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .forge-page .view-mode-toggle {
          display: inline-flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
        }
        .forge-page .view-mode-btn {
          min-height: 34px;
          padding: 0 0.65rem;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 120ms ease, color 120ms ease;
        }
        .forge-page .view-mode-btn:hover {
          color: var(--text-primary);
        }
        .forge-page .view-mode-btn.active {
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          color: var(--text-accent);
        }
        .forge-page .show-exp-toggle-wrap {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-primary);
          user-select: none;
        }
        .forge-page .toggle-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--text-accent);
          cursor: pointer;
        }
        .forge-page .catalog-filters-bar {
          display: grid;
          gap: 0.65rem;
        }
        .forge-page .filter-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.65rem;
        }
        .forge-page .catalog-search-wrap {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          padding: 0 0.75rem;
          height: 40px;
          gap: 0.5rem;
        }
        .forge-page .search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .forge-page .catalog-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
        }
        .forge-page .search-clear-btn {
          min-width: 32px;
          min-height: 32px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          padding: 0;
          transition: color 120ms ease;
        }
        .forge-page .search-clear-btn:hover {
          color: var(--text-primary);
        }
        .forge-page .catalog-dropdowns-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .forge-page .catalog-sort-wrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .custom-sort-dropdown {
          position: relative;
          min-width: 160px;
        }
        .forge-page .custom-sort-dropdown.quality-dropdown {
          min-width: 120px;
        }
        .forge-page .sort-trigger-btn {
          min-height: 40px;
          width: 100%;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 0 0.75rem;
          font-size: 0.78rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.45rem;
          cursor: pointer;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .forge-page .sort-trigger-btn:hover,
        .forge-page .sort-trigger-btn.open {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 94%);
        }
        .forge-page .sort-trigger-btn.filtered {
          border-color: var(--text-accent);
          color: var(--text-accent);
        }
        .forge-page .dropdown-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .forge-page .dropdown-val {
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .forge-page .sort-trigger-btn .chevron-icon {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: transform 150ms ease;
        }
        .forge-page .sort-trigger-btn .chevron-icon.flipped {
          transform: rotate(180deg);
        }
        .forge-page .sort-popover-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 190px;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          z-index: 40;
          padding: 0.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .forge-page .sort-option-btn {
          min-height: 36px;
          padding: 0 0.65rem;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-primary);
          font-size: 0.78rem;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease;
        }
        .forge-page .sort-option-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--border-subtle);
        }
        .forge-page .sort-option-btn.active {
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border-color: color-mix(in srgb, var(--text-accent), transparent 60%);
        }
        .forge-page .filter-chips-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.65rem;
        }
        .forge-page .category-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .forge-page .filter-chip {
          min-height: 38px;
          padding: 0.35rem 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
        }
        .forge-page .filter-chip:hover {
          border-color: var(--text-accent);
          color: var(--text-primary);
        }
        .forge-page .filter-chip.active {
          border-color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          color: var(--text-accent);
        }
        .forge-page .secondary-filters-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .forge-page .usable-filter-btn {
          min-height: 38px;
          padding: 0.35rem 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
        }
        .forge-page .usable-filter-btn:hover {
          border-color: var(--text-accent);
          color: var(--text-primary);
        }
        .forge-page .usable-filter-btn.active {
          border-color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          color: var(--text-accent);
        }
        .forge-page .usable-count-pill {
          font-size: 0.7rem;
          padding: 0.1rem 0.35rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
        }
        .forge-page .reset-filters-btn {
          min-height: 38px;
          padding: 0.35rem 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          cursor: pointer;
          transition: color 120ms ease;
        }
        .forge-page .reset-filters-btn:hover {
          color: var(--text-primary);
        }

        /* Compact List View */
        .forge-page .materials-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .forge-page .mat-list-row {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          position: relative;
          contain: content;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .forge-page .mat-list-row:hover {
          border-color: var(--border-focus);
        }
        .forge-page .mat-list-row.has-penalty {
          border-color: color-mix(in srgb, var(--text-accent), transparent 75%);
        }
        .forge-page .mat-list-row.in-queue {
          border-color: color-mix(in srgb, var(--text-success), transparent 60%);
        }
        .forge-page .list-col-identity {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        @media (min-width: 769px) {
          .forge-page .list-col-identity {
            flex: 1 1 300px;
            min-width: 220px;
          }
          .forge-page .list-col-throughput {
            flex: 1 1 240px;
          }
        }
        .forge-page .list-identity-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
          flex: 1;
        }
        .forge-page .list-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .forge-page .list-source-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.45rem;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .forge-page .list-col-throughput {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          justify-content: center;
          padding: 0.25rem 0.85rem;
          border-left: 1px solid rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        .forge-page .throughput-metric {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.15rem;
        }
        .forge-page .throughput-metric .metric-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .forge-page .throughput-metric .metric-value {
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .forge-page .throughput-metric .metric-value.rate {
          color: var(--text-accent);
        }
        .forge-page .throughput-metric .metric-value.sub {
          color: var(--text-muted);
        }
        .forge-page .list-col-economics {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 0 0 auto;
        }
        .forge-page .list-metrics-group,
        .forge-page .list-col-metrics {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-shrink: 0;
        }
        .forge-page .list-actions-group,
        .forge-page .list-col-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
        }
        .forge-page .list-metric {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          font-size: 0.72rem;
          min-width: 65px;
        }
        .forge-page .list-metric .metric-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .forge-page .list-metric .metric-value {
          font-weight: 800;
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }
        .forge-page .list-metric .metric-value.good {
          color: var(--text-success);
        }
        .forge-page .list-metric .metric-value.penalized {
          color: var(--text-accent);
        }
        .forge-page .list-metric .burn-dur {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .forge-page .list-badges-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .forge-page .quick-add-btn {
          min-height: 44px;
          min-width: 44px;
          padding: 0 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease;
        }
        .forge-page .quick-add-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-focus);
        }
        .forge-page .fill-session-btn {
          min-height: 44px;
          padding: 0 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          cursor: pointer;
          transition: background-color 120ms ease, border-color 120ms ease;
        }
        .forge-page .fill-session-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--text-accent);
        }
        .forge-page .queue-owned-btn.mini {
          min-height: 44px;
          padding: 0 0.65rem;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 65%);
          border-radius: 6px;
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: var(--text-accent);
          font-size: 0.75rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          cursor: pointer;
        }

        /* Streamlined Cards Grid */
        .forge-page .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
          gap: 0.75rem;
        }
        .forge-page .mat-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: relative;
          contain: content;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .forge-page .mat-card.has-penalty {
          border-color: color-mix(in srgb, var(--text-accent), transparent 75%);
        }
        .forge-page .mat-card.in-queue {
          border-color: color-mix(in srgb, var(--text-success), transparent 60%);
        }
        .forge-page .mat-card:hover {
          transform: translateY(-1px);
          border-color: var(--border-focus);
        }
        .forge-page .mat-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .forge-page .mat-title-stack {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }
        .forge-page .mat-name-btn {
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-weight: 800;
          font-size: 0.92rem;
          text-align: left;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0;
        }
        .forge-page .mat-name-btn:hover {
          color: var(--text-accent);
        }
        .forge-page .external-icon {
          opacity: 0.6;
        }
        .forge-page .mat-meta-tags {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.3rem;
          font-size: 0.68rem;
        }
        .forge-page .quality-tag {
          font-weight: 800;
          text-transform: uppercase;
        }
        .forge-page .quality-tag.standard { color: var(--quality-standard); }
        .forge-page .quality-tag.refined { color: color-mix(in srgb, var(--quality-refined), white 20%); }
        .forge-page .quality-tag.premium { color: var(--quality-premium); }
        .forge-page .quality-tag.epic { color: color-mix(in srgb, var(--quality-epic), white 25%); }
        .forge-page .quality-tag.legendary { color: var(--quality-legendary); }
        .forge-page .quality-tag.mythic {
          background: linear-gradient(0deg, rgb(244, 138, 0), rgb(218, 91, 0));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .forge-page .quality-tag.unique {
          background: linear-gradient(0deg, rgb(180, 23, 244), rgb(128, 6, 181));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .forge-page .level-tag {
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .mob-tag {
          color: var(--text-muted);
          opacity: 0.8;
          font-style: italic;
        }
        .forge-page .card-status-badges {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .forge-page .eff-pill {
          font-size: 0.7rem;
          font-weight: 900;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          white-space: nowrap;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .forge-page .eff-pill.mini {
          font-size: 0.65rem;
          padding: 0.1rem 0.35rem;
        }
        .forge-page .eff-pill.full {
          color: var(--text-success);
          background: color-mix(in srgb, var(--text-success), transparent 88%);
        }
        .forge-page .eff-pill.warn {
          color: var(--text-danger);
          background: color-mix(in srgb, var(--text-danger), transparent 88%);
          border: 1px solid color-mix(in srgb, var(--text-danger), transparent 70%);
        }
        .forge-page .mat-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.35rem;
          margin-top: 0.15rem;
        }
        .forge-page .mini-metric {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          font-size: 0.72rem;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.3rem 0.4rem;
        }
        .forge-page .mini-metric .label {
          color: var(--text-muted);
          font-size: 0.65rem;
          text-transform: uppercase;
        }
        .forge-page .mini-metric strong.good {
          color: var(--text-success);
        }
        .forge-page .owned-inventory-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: var(--text-accent);
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 70%);
        }
        .forge-page .mat-actions-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: auto;
          padding-top: 0.35rem;
        }
        .forge-page .queue-owned-btn {
          flex: 1;
          min-height: 44px;
          padding: 0 0.55rem;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 65%);
          border-radius: 6px;
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: var(--text-accent);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          cursor: pointer;
        }
        .forge-page .queued-count-strip {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-success);
          background: color-mix(in srgb, var(--text-success), transparent 90%);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .forge-page .queued-count-strip.mini {
          font-size: 0.65rem;
          padding: 0.1rem 0.35rem;
        }

        /* Catalog Progressive Pagination */
        .forge-page .catalog-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          margin-top: 1rem;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
        }
        .forge-page .pagination-status {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .forge-page .pagination-status strong {
          color: var(--text-primary);
        }
        .forge-page .pagination-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .forge-page .load-more-btn {
          min-height: 44px;
          padding: 0 1rem;
          border-radius: 6px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .forge-page .load-more-btn:hover {
          border-color: var(--text-accent);
          color: var(--text-accent);
          background: rgba(255, 255, 255, 0.05);
        }
        .forge-page .show-all-btn {
          min-height: 44px;
          padding: 0 0.85rem;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }
        .forge-page .show-all-btn:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        /* 5. Inventory Optimizer Section */
        .forge-page .inventory-optimizer-section {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 1.25rem;
          display: grid;
          gap: 1rem;
        }
        .forge-page .inventory-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .forge-page .inventory-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .forge-page .queue-all-owned-btn {
          min-height: 34px;
          padding: 0 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-accent);
          font-size: 0.75rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
        }
        .forge-page .queue-all-owned-btn:hover {
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
        }
        .forge-page .clear-inventory-btn {
          min-height: 34px;
          padding: 0 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: transparent;
          color: var(--text-danger);
          font-size: 0.75rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
        }
        .forge-page .add-inventory-form {
          position: relative;
          display: grid;
          grid-template-columns: minmax(200px, 1.2fr) minmax(260px, 1fr) auto;
          align-items: end;
          gap: 0.85rem;
          padding: 0.95rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
        }
        .forge-page .add-inventory-form:has(.combobox-container.open) {
          z-index: 50;
        }
        .forge-page .select-material-group {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          min-width: 0;
        }
        .forge-page .select-material-group.menu-open,
        .forge-page .select-material-group:has(.combobox-container.open) {
          z-index: 100;
        }
        .forge-page .select-material-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .forge-page .select-material-group label,
        .forge-page .quantity-input-group label {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .forge-page .current-owned-pill {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }
        .forge-page .combobox-container {
          position: relative;
          width: 100%;
        }
        .forge-page .combobox-container.open {
          z-index: 100;
        }
        .forge-page .combobox-trigger-shell {
          min-height: 40px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          cursor: text;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .forge-page .combobox-container.open .combobox-trigger-shell,
        .forge-page .combobox-trigger-shell:focus-within {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-accent), transparent 85%);
        }
        .forge-page .combobox-search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .forge-page .combobox-search-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 700;
        }
        .forge-page .combobox-quality-badge {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
        }
        .forge-page .combobox-quality-badge.standard { color: var(--quality-standard); background: color-mix(in srgb, var(--quality-standard), transparent 90%); }
        .forge-page .combobox-quality-badge.refined { color: var(--quality-refined); background: color-mix(in srgb, var(--quality-refined), transparent 90%); }
        .forge-page .combobox-quality-badge.premium { color: var(--quality-premium); background: color-mix(in srgb, var(--quality-premium), transparent 90%); }
        .forge-page .combobox-quality-badge.epic { color: var(--quality-epic); background: color-mix(in srgb, var(--quality-epic), transparent 90%); }
        .forge-page .combobox-quality-badge.legendary { color: var(--quality-legendary); background: color-mix(in srgb, var(--quality-legendary), transparent 90%); }
        .forge-page .combobox-quality-badge.mythic {
          background: linear-gradient(0deg, rgb(244, 138, 0), rgb(218, 91, 0));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .forge-page .combobox-quality-badge.unique {
          background: linear-gradient(0deg, rgb(180, 23, 244), rgb(128, 6, 181));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .forge-page .combobox-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          margin-right: -0.25rem;
        }
        .forge-page .combobox-chevron {
          transition: transform 180ms ease;
        }
        .forge-page .combobox-chevron.flipped {
          transform: rotate(180deg);
        }
        .forge-page .combobox-popover-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 340px;
          background: var(--bg-panel) !important;
          border: 1px solid var(--border-focus);
          border-radius: 8px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85);
          z-index: 1000;
          padding: 0.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          isolation: isolate;
        }
        .forge-page .combobox-cat-bar {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.25rem 0.4rem;
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
        }
        .forge-page .combobox-cat-bar::-webkit-scrollbar {
          display: none;
        }
        .forge-page .combobox-cat-bar .cat-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.2rem 0.45rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 120ms ease;
        }
        .forge-page .combobox-cat-bar .cat-pill:hover {
          color: var(--text-primary);
          border-color: var(--border-focus);
        }
        .forge-page .combobox-cat-bar .cat-pill.active {
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          border-color: var(--text-accent);
          color: var(--text-accent);
        }
        .forge-page .combobox-items-scroll {
          max-height: 250px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: var(--bg-panel);
        }
        .forge-page .combobox-empty-message {
          padding: 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .forge-page .combobox-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.5rem 0.65rem;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid transparent;
          min-height: 50px;
          box-sizing: border-box;
          flex-shrink: 0;
          background: color-mix(in srgb, var(--bg-card), transparent 30%);
          transition: background-color 120ms ease, border-color 120ms ease;
        }
        .forge-page .combobox-item-row:hover,
        .forge-page .combobox-item-row.highlighted {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-subtle);
        }
        .forge-page .combobox-item-row.selected {
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border-color: color-mix(in srgb, var(--text-accent), transparent 60%);
        }
        .forge-page .combobox-item-row .item-title-col {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          flex: 1;
        }
        .forge-page .combobox-item-row .item-name-stack {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
          flex: 1;
        }
        .forge-page .combobox-item-row .item-name {
          font-size: 0.84rem;
          font-weight: 700;
          line-height: 1.25;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .forge-page .combobox-item-row .item-sub {
          font-size: 0.71rem;
          line-height: 1.25;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .forge-page .combobox-item-row .item-badge-col {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .forge-page .item-quality-pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .forge-page .item-quality-pill.standard { color: var(--quality-standard); background: color-mix(in srgb, var(--quality-standard), transparent 90%); }
        .forge-page .item-quality-pill.refined { color: color-mix(in srgb, var(--quality-refined), white 18%); background: color-mix(in srgb, var(--quality-refined), transparent 90%); }
        .forge-page .item-quality-pill.premium { color: var(--quality-premium); background: color-mix(in srgb, var(--quality-premium), transparent 90%); }
        .forge-page .item-quality-pill.epic { color: color-mix(in srgb, var(--quality-epic), white 22%); background: color-mix(in srgb, var(--quality-epic), transparent 90%); }
        .forge-page .item-quality-pill.legendary { color: var(--quality-legendary); background: color-mix(in srgb, var(--quality-legendary), transparent 90%); }
        .forge-page .item-quality-pill.mythic {
          background: linear-gradient(0deg, rgb(244, 138, 0), rgb(218, 91, 0));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .forge-page .item-quality-pill.unique {
          background: linear-gradient(0deg, rgb(180, 23, 244), rgb(128, 6, 181));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .forge-page .item-market-price {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .forge-page .quantity-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .forge-page .stepper-wrap {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .forge-page .inventory-qty-field {
          width: 90px;
          height: 40px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-primary);
          font-weight: 800;
          padding: 0 0.65rem;
          outline: none;
        }
        .forge-page .quick-qty-pills {
          display: flex;
          gap: 0.25rem;
        }
        .forge-page .quick-qty-pills button {
          min-height: 40px;
          padding: 0 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
        }
        .forge-page .quick-qty-pills button:hover {
          color: var(--text-primary);
          border-color: var(--text-accent);
        }
        .forge-page .add-material-submit-btn {
          min-height: 40px;
          padding: 0 1rem;
          border: 1px solid rgba(56, 189, 248, 0.45);
          border-radius: 6px;
          background: rgba(56, 189, 248, 0.18);
          color: var(--text-main);
          font-weight: 800;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
        }
        .forge-page .add-material-submit-btn:hover {
          background: rgba(56, 189, 248, 0.28);
          border-color: rgba(56, 189, 248, 0.7);
        }
        .forge-page .inventory-summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        .forge-page .inv-summary-card {
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .forge-page .inv-summary-card.highlight strong {
          color: var(--text-accent);
        }
        .forge-page .owned-items-list {
          display: grid;
          gap: 0.5rem;
        }
        .forge-page .owned-item-row {
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .forge-page .owned-item-main {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }
        .forge-page .name-and-recommendation {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .forge-page .mat-name {
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .forge-page .count-pill {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          background: rgba(0, 0, 0, 0.3);
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }
        .forge-page .count-stepper-wrap {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          background: rgba(0, 0, 0, 0.25);
          padding: 2px 4px;
          border-radius: 4px;
          border: 1px solid var(--border-subtle);
        }
        .forge-page .count-step-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.65rem;
          font-weight: 800;
          cursor: pointer;
          padding: 2px 5px;
          border-radius: 3px;
          transition: all 0.15s ease;
          min-height: 24px;
          min-width: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .forge-page .count-step-btn:hover {
          color: var(--text-accent);
          background: rgba(255, 255, 255, 0.08);
        }
        .forge-page .rec-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
        }
        .forge-page .rec-badge.burn {
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
        }
        .forge-page .rec-badge.sell {
          color: var(--text-success);
          background: color-mix(in srgb, var(--text-success), transparent 88%);
        }
        .forge-page .owned-item-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .forge-page .owned-item-metrics strong {
          color: var(--text-primary);
        }
        .forge-page .owned-item-actions {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .forge-page .add-to-queue-pill-btn {
          min-height: 30px;
          padding: 0 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-accent);
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
        }
        .forge-page .add-to-queue-pill-btn:hover {
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
        }
        .forge-page .remove-owned-btn {
          min-width: 44px;
          min-height: 44px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 120ms ease;
        }
        .forge-page .remove-owned-btn:hover {
          color: var(--text-danger);
        }
        .forge-page .inventory-empty-hint {
          padding: 1.25rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.82rem;
          line-height: 1.5;
        }
        .forge-page .quick-suggestions-block {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 1rem;
          text-align: left;
        }
        .forge-page .quick-suggestions-subgroup {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .forge-page .subgroup-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .forge-page .quick-suggestions-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .forge-page .quick-suggestion-chip {
          min-height: 38px;
          padding: 0.35rem 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .forge-page .quick-suggestion-chip:hover {
          border-color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
        }
        .forge-page .quick-suggestion-chip .sugg-name {
          color: var(--text-primary);
        }
        .forge-page .quick-suggestion-chip .sugg-lvl {
          font-size: 0.68rem;
          color: var(--text-accent);
          font-weight: 800;
        }
        .forge-page .quick-suggestion-chip .quality-mini {
          font-size: 0.6rem;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        .forge-page .quick-suggestion-chip .quality-mini.standard { color: var(--quality-standard); background: color-mix(in srgb, var(--quality-standard), transparent 90%); }
        .forge-page .quick-suggestion-chip .quality-mini.refined { color: color-mix(in srgb, var(--quality-refined), white 18%); background: color-mix(in srgb, var(--quality-refined), transparent 90%); }
        .forge-page .quick-suggestion-chip .quality-mini.premium { color: var(--quality-premium); background: color-mix(in srgb, var(--quality-premium), transparent 90%); }
        .forge-page .quick-suggestion-chip .quality-mini.epic { color: color-mix(in srgb, var(--quality-epic), white 22%); background: color-mix(in srgb, var(--quality-epic), transparent 90%); }
        .forge-page .quick-suggestion-chip .quality-mini.legendary { color: var(--quality-legendary); background: color-mix(in srgb, var(--quality-legendary), transparent 90%); }

        /* Material and Queue Item Icons */
        .forge-page .mat-item-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .forge-page .mat-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .forge-page .combobox-selected-icon {
          width: 20px;
          height: 20px;
          border-radius: 3px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .forge-page .combobox-item-icon {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .forge-page .combobox-item-row .item-name-stack {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .forge-page .sugg-icon {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .forge-page .owned-mat-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .forge-page .queue-item-icon {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          object-fit: contain;
          flex-shrink: 0;
        }

        /* Buff Active Badge Pills in Section Header */
        .forge-page .buff-active-badge-group {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          font-size: 0.7rem;
          font-weight: 700;
        }
        .forge-page .buff-active-badge-group.active {
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
          border-color: color-mix(in srgb, var(--text-accent), transparent 75%);
        }
        .forge-page .buff-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .forge-page .buff-badge-pill.exp {
          color: var(--text-accent);
        }
        .forge-page .buff-badge-pill.penalty {
          color: var(--text-danger);
        }
        .forge-page .buff-badge-pill.penalty-tag {
          font-size: 0.64rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          background: color-mix(in srgb, var(--text-danger), transparent 85%);
          color: var(--text-danger);
        }
        .forge-page .buff-badge-pill.speed {
          color: var(--text-success);
        }
        .forge-page .buff-badge-dot {
          color: var(--text-muted);
          opacity: 0.5;
        }

        /* Material Avatar & Identity Containers */
        .forge-page .mat-icon-wrapper {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          flex-shrink: 0;
        }
        .forge-page .mat-icon-wrapper.mini {
          width: 32px;
          height: 32px;
          border-radius: 5px;
        }
        .forge-page .mat-card-header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex: 1;
          min-width: 0;
        }
        .forge-page .owned-item-identity-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex: 1;
          min-width: 0;
        }

        /* Progression Roadmap Strip */
        .forge-page .queue-roadmap-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          margin-bottom: 0.65rem;
          font-size: 0.76rem;
          color: var(--text-muted);
        }
        .forge-page .queue-roadmap-strip strong {
          color: var(--text-primary);
        }
        .forge-page .step-badge {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.12rem 0.4rem;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .forge-page .metric-badge.session-badge {
          border-color: color-mix(in srgb, var(--text-accent), transparent 75%);
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
        }
        .forge-page .metric-badge.session-badge strong {
          color: var(--text-accent);
        }
        .forge-page .summary-stat-box .sessions-sub {
          font-size: 0.72rem;
          font-weight: normal;
          color: var(--text-muted);
        }

        /* Inventory List Header, Sort Bar, and Actions */
        .forge-page .inventory-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin: 1rem 0 0.5rem;
        }
        .forge-page .inventory-list-header .list-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .forge-page .inventory-sort-bar {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }
        .forge-page .inventory-sort-bar .sort-label {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-right: 0.25rem;
        }
        .forge-page .inv-sort-btn {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 120ms ease;
        }
        .forge-page .inv-sort-btn:hover {
          color: var(--text-primary);
          border-color: color-mix(in srgb, var(--text-accent), transparent 70%);
        }
        .forge-page .inv-sort-btn.active {
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          border-color: var(--text-accent);
          color: var(--text-accent);
        }
        .forge-page .inv-fill-session-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 70%);
          color: var(--text-accent);
          cursor: pointer;
          transition: background-color 140ms ease;
        }
        .forge-page .inv-fill-session-btn:hover {
          background: color-mix(in srgb, var(--text-accent), transparent 75%);
        }

        @media (max-width: 768px) {
          .forge-page .lesson-target-goal-card {
            padding: clamp(0.75rem, 3vw, 1rem);
          }
          .forge-page .goal-routes-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 0.75rem;
          }
          .forge-page .route-card {
            padding: clamp(0.75rem, 2.5vw, 1rem);
          }
          .forge-page .route-header {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .forge-page .route-tag-group {
            min-width: 0;
            flex: 1 1 auto;
          }
          .forge-page .route-cost-wrap {
            flex-shrink: 0;
            text-align: right;
          }
          .forge-page .goal-exp-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.75rem clamp(0.65rem, 2.5vw, 1rem);
          }
          .forge-page .goal-card-topbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .forge-page .target-stepper-wrap {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .forge-page .target-direct-group {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            flex-wrap: wrap;
            min-width: 0;
            box-sizing: border-box;
          }
          .forge-page .target-direct-group .target-label {
            flex-shrink: 0;
            white-space: nowrap;
          }
          .forge-page .target-direct-group .stepper-wrap.compact {
            flex: 0 1 auto;
            width: auto;
            min-width: 0;
            max-width: 100%;
          }
          .forge-page .bracket-item {
            max-width: 100%;
            min-width: 0;
            padding: 0.35rem clamp(0.35rem, 1.5vw, 0.5rem);
            gap: clamp(0.2rem, 1vw, 0.5rem);
          }
          .forge-page .bracket-material-name {
            min-width: 0;
            flex: 1 1 auto;
          }
          .forge-page .bracket-level-range,
          .forge-page .bracket-qty,
          .forge-page .bracket-cost {
            flex-shrink: 0;
          }
          .forge-page .target-milestones {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
          }
          .forge-page .add-inventory-form {
            grid-template-columns: 1fr;
            padding: 0.75rem;
          }
          .forge-page .quick-qty-pills {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.25rem;
          }
          .forge-page .quick-qty-pills button {
            min-width: 0 !important;
            padding: 0.25rem;
            font-size: 0.75rem;
          }
          .forge-page .add-material-submit-btn {
            width: 100%;
            justify-content: center;
          }
          .forge-page .catalog-search-wrap {
            min-width: 100%;
          }
          .forge-page .view-mode-toggle {
            display: none !important;
          }
          .forge-page .catalog-dropdowns-group {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          .forge-page .catalog-sort-wrap {
            width: 100%;
          }
          .forge-page .custom-sort-dropdown,
          .forge-page .custom-sort-dropdown.quality-dropdown {
            width: 100%;
            min-width: 0;
          }
          .forge-page .filter-chips-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
          .forge-page .category-chips-row {
            display: flex;
            gap: 0.35rem;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 2px;
            -webkit-overflow-scrolling: touch;
          }
          .forge-page .category-chips-row::-webkit-scrollbar {
            display: none;
          }
          .forge-page .category-chips-row .filter-chip {
            white-space: nowrap;
            flex-shrink: 0;
          }
          .forge-page .secondary-filters-row {
            width: 100%;
            justify-content: space-between;
          }
          .forge-page .mat-list-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.55rem;
            padding: 0.65rem 0.75rem;
            height: auto;
            min-height: 0;
          }
          .forge-page .list-col-identity {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.65rem;
            flex: 0 0 auto !important;
            height: auto;
            min-height: 0;
          }
          .forge-page .list-col-throughput {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0, 0, 0, 0.28);
            padding: 0.4rem 0.6rem;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-left: none;
            border-right: none;
            gap: 0.4rem;
            flex: 0 0 auto !important;
            height: auto;
            min-height: 0;
          }
          .forge-page .list-col-throughput .throughput-metric {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
          }
          .forge-page .list-col-throughput .throughput-metric .metric-label {
            font-size: 0.58rem;
          }
          .forge-page .list-col-throughput .throughput-metric .metric-value {
            font-size: 0.72rem;
          }
          .forge-page .list-col-economics {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
            flex: 0 0 auto !important;
            height: auto;
            min-height: 0;
          }
          .forge-page .list-metrics-group,
          .forge-page .list-col-metrics {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px dashed var(--border-subtle);
            padding-top: 0.4rem;
            flex: 0 0 auto;
          }
          .forge-page .list-actions-group,
          .forge-page .list-col-actions {
            width: 100%;
            display: flex;
            gap: 0.4rem;
            flex: 0 0 auto;
          }
          .forge-page .list-actions-group .fill-session-btn,
          .forge-page .list-col-actions .fill-session-btn {
            width: 100%;
            min-height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            font-size: 0.82rem;
            flex: 1;
          }
          .forge-page .list-actions-group .queue-owned-btn.mini,
          .forge-page .list-col-actions .queue-owned-btn.mini {
            width: 100%;
            min-height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            font-size: 0.78rem;
            flex: 1;
          }
          .forge-page .materials-grid {
            grid-template-columns: 1fr;
          }
          .forge-page .quick-suggestions-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            width: 100%;
          }
          .forge-page .quick-suggestion-chip {
            flex: 1 1 calc(50% - 0.4rem);
            min-width: 140px;
          }
          .forge-page .inventory-topbar {
            flex-direction: column;
            align-items: flex-start;
          }
          .forge-page .inventory-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .forge-page .owned-item-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }
          .forge-page .owned-item-identity-wrap {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.65rem;
          }
          .forge-page .owned-item-actions {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.4rem;
            border-top: 1px dashed var(--border-subtle);
            padding-top: 0.45rem;
          }
        }

    `}</style>
  );
}
