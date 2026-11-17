"use client";

export function ForgeStyles() {
  return (
    <style jsx global>{`

        .forge-page {
          max-width: 1350px;
          margin: 0 auto;
          padding: 1.5rem 2rem 4rem;
          display: grid;
          gap: 1.25rem;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .forge-page {
            padding: 1rem 0.75rem 4rem;
          }
        }
        .forge-page .forge-hero,
        .forge-page .forge-builder,
        .forge-page .plan-shell,
        .forge-page .warning-panel,
        .forge-page .shopping-layout > section {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          box-shadow: 0 4px 18px rgba(0,0,0,0.32);
        }
        .forge-page .forge-hero {
          padding: 1.4rem;
          position: relative;
          min-height: 140px;
          contain: layout;
        }
        .forge-page .forge-hero.no-metrics {
          display: block;
        }
        .forge-page .forge-hero.has-metrics {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.7fr);
          gap: 1.25rem;
          align-items: end;
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
          font-size: clamp(2rem, 5vw, 4.2rem);
          line-height: 0.95;
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
          grid-template-columns: minmax(360px, 1fr) minmax(520px, 0.75fr) minmax(420px, 0.55fr) auto;
          gap: 0.95rem;
          align-items: start;
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
          z-index: 30;
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
        .forge-page .builder-grid.picker-open .combo-menu {
          position: static;
          margin-top: 0.4rem;
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
        @media (max-width: 1720px) {
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
          .forge-page .entry-stats,
          .forge-page .need-row {
            grid-template-columns: 1fr;
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
          gap: 1.25rem;
          min-height: 520px;
          contain: layout;
        }

        /* 1. Header Controls */
        .forge-page .lesson-header-controls {
          display: grid;
          gap: 1rem;
        }
        .forge-page .controls-panel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1rem;
          min-height: 190px;
        }
        .forge-page .control-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .forge-page .control-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .forge-page .card-hint {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .stepper-input-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .forge-page .stepper-btn {
          min-width: 44px;
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .forge-page .stepper-btn:hover:not(:disabled) {
          border-color: var(--text-accent);
          color: var(--text-accent);
        }
        .forge-page .stepper-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .forge-page .stepper-btn.small {
          min-width: 32px;
          min-height: 32px;
          font-size: 0.85rem;
          border-radius: 6px;
        }
        .forge-page .number-display-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0 0.75rem;
          height: 44px;
        }
        .forge-page .level-prefix {
          font-weight: 800;
          color: var(--text-accent);
          font-size: 0.95rem;
          margin-right: 0.25rem;
        }
        .forge-page .direct-number-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-weight: 900;
          font-size: 1.25rem;
          outline: none;
          width: 100%;
        }
        .forge-page .direct-number-input.small {
          font-size: 1rem;
          width: 50px;
          text-align: center;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          height: 32px;
          padding: 0 0.35rem;
        }
        .forge-page .milestone-pill-row,
        .forge-page .preset-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .forge-page .milestone-pill,
        .forge-page .preset-pill {
          min-height: 44px;
          padding: 0.35rem 0.6rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .forge-page .milestone-pill.mini {
          min-height: 44px;
          padding: 0.35rem 0.55rem;
          font-size: 0.75rem;
        }
        .forge-page .milestone-pill:hover,
        .forge-page .preset-pill:hover {
          border-color: var(--text-accent);
          color: var(--text-primary);
        }
        .forge-page .milestone-pill.active,
        .forge-page .preset-pill.active {
          border-color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          color: var(--text-accent);
        }
        .forge-page .buff-toggles-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .forge-page .buff-toggle-btn {
          min-height: 44px;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .forge-page .buff-toggle-btn.active {
          border-color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 85%);
          color: var(--text-accent);
        }
        .forge-page .custom-buff-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding-top: 0.25rem;
        }
        .forge-page .custom-buff-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .custom-buff-input {
          width: 80px;
          height: 34px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-primary);
          padding: 0 0.5rem;
          font-weight: 800;
          text-align: right;
          outline: none;
        }
        .forge-page .duration-input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .forge-page .duration-unit-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .forge-page .duration-unit-group label {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .forge-page .unit-stepper-wrap {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
          height: 44px;
        }
        .forge-page .unit-step-btn {
          min-width: 44px;
          width: 44px;
          height: 100%;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
        }
        .forge-page .unit-step-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .forge-page .duration-number-input {
          flex: 1;
          height: 100%;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 1.15rem;
          font-weight: 900;
          text-align: center;
          outline: none;
          width: 100%;
        }

        .forge-page .rate-context-strip {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 0.85rem 1.25rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          align-items: center;
          margin-top: 0.75rem;
        }
        .forge-page .context-stat {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .forge-page .context-stat .stat-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
        }
        .forge-page .context-stat strong {
          color: var(--text-primary);
          font-size: 1.05rem;
          font-weight: 900;
          font-family: var(--font-mono);
        }
        .forge-page .context-stat .good-val {
          color: var(--text-success);
        }
        .forge-page .context-stat span {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* 2. Target Goal Estimator Card */
        .forge-page .lesson-target-goal-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          padding: 1.25rem;
          display: grid;
          gap: 1rem;
          min-height: 275px;
          contain: layout;
        }
        .forge-page .goal-card-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .forge-page .target-stepper-wrap {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .forge-page .target-label {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-muted);
        }
        .forge-page .target-milestones {
          display: flex;
          gap: 0.25rem;
          margin-left: 0.35rem;
        }
        .forge-page .goal-exp-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
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
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          min-height: 170px;
        }
        .forge-page .route-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .forge-page .route-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
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
        .forge-page .route-tag.fast {
          color: var(--text-accent);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
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
        .forge-page .queue-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
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
        }
        .forge-page .queue-item-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .forge-page .queue-item-card.has-penalty {
          border-color: color-mix(in srgb, var(--text-accent), transparent 65%);
        }
        .forge-page .item-card-left {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          flex: 1;
        }
        .forge-page .item-name-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
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
        .forge-page .quality-badge.mythic { color: var(--quality-mythic); }

        .forge-page .item-stepper-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .forge-page .stepper-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .qty-btn {
          width: 44px;
          height: 44px;
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
        }
        .forge-page .qty-input {
          width: 68px;
          height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-primary);
          font-weight: 800;
          text-align: center;
          outline: none;
        }
        .forge-page .step-quick-pill {
          min-height: 44px;
          min-width: 44px;
          padding: 0.35rem 0.6rem;
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
        }
        .forge-page .item-metric-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.2rem;
        }
        .forge-page .metric-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          padding: 0.25rem 0.55rem;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
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

        /* Advanced Details Drawer */
        .forge-page .advanced-drawer-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
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
        }
        .forge-page .advanced-drawer-body {
          padding: 1rem;
          border-top: 1px solid var(--border-subtle);
          display: grid;
          gap: 1rem;
        }
        .forge-page .summary-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .forge-page .summary-stat-box {
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
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
        }
        .forge-page .level-progression-labels {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .forge-page .panel-sub-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
        }
        .forge-page .level-jump-text {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 900;
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
          gap: 1rem;
        }
        .forge-page .show-exp-toggle-wrap {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.82rem;
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
        .forge-page .category-chips-row,
        .forge-page .quality-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .forge-page .filter-chip {
          min-height: 44px;
          padding: 0.45rem 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
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
        .forge-page .chip-count {
          font-size: 0.7rem;
          opacity: 0.75;
        }
        .forge-page .quality-chip {
          min-height: 28px;
          padding: 0.15rem 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
        }
        .forge-page .quality-chip.active {
          border-color: currentColor;
          background: rgba(255, 255, 255, 0.08);
        }
        .forge-page .quality-chip.standard.active { color: var(--quality-standard); }
        .forge-page .quality-chip.refined.active { color: var(--quality-refined); }
        .forge-page .quality-chip.premium.active { color: var(--quality-premium); }
        .forge-page .quality-chip.epic.active { color: var(--quality-epic); }
        .forge-page .quality-chip.legendary.active { color: var(--quality-legendary); }
        .forge-page .quality-chip.mythic.active { color: var(--quality-mythic); }

        .forge-page .search-sort-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .forge-page .catalog-search-wrap {
          flex: 1;
          min-width: 240px;
          display: flex;
          align-items: center;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          padding: 0 0.75rem;
          height: 38px;
          gap: 0.5rem;
        }
        .forge-page .search-icon {
          color: var(--text-muted);
        }
        .forge-page .catalog-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
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
        .forge-page .sort-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .forge-page .custom-sort-dropdown {
          position: relative;
          min-width: 170px;
        }
        .forge-page .sort-trigger-btn {
          min-height: 38px;
          width: 100%;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 0 0.75rem;
          font-size: 0.8rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          cursor: pointer;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .forge-page .sort-trigger-btn:hover,
        .forge-page .sort-trigger-btn.open {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 94%);
        }
        .forge-page .sort-trigger-btn .chevron-icon {
          color: var(--text-muted);
          transition: transform 150ms ease;
        }
        .forge-page .sort-trigger-btn .chevron-icon.flipped {
          transform: rotate(180deg);
        }
        .forge-page .sort-popover-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 200px;
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
          min-height: 34px;
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
        .forge-page .catalog-sort-select {
          min-height: 38px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 0 0.75rem;
          font-size: 0.8rem;
          font-weight: 800;
          outline: none;
          cursor: pointer;
        }
        .forge-page .materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.85rem;
        }
        .forge-page .mat-card {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 0.95rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
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
        .forge-page .quality-tag.mythic { color: var(--quality-mythic); }
        .forge-page .level-tag {
          color: var(--text-muted);
          font-weight: 700;
        }
        .forge-page .mob-tag {
          color: var(--text-muted);
          opacity: 0.8;
          font-style: italic;
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
        .forge-page .eff-pill.full {
          color: var(--text-success);
          background: color-mix(in srgb, var(--text-success), transparent 88%);
        }
        .forge-page .eff-pill.warn {
          color: var(--text-danger);
          background: color-mix(in srgb, var(--text-danger), transparent 88%);
          border: 1px solid color-mix(in srgb, var(--text-danger), transparent 70%);
        }
        .forge-page .mat-exp-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.82rem;
          padding: 0.35rem 0.5rem;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.3);
        }
        .forge-page .exp-label {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .forge-page .exp-val {
          color: var(--text-primary);
          font-size: 0.95rem;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }
        .forge-page .exp-val.penalized {
          color: var(--text-accent);
        }
        .forge-page .penalty-chevron {
          color: var(--text-accent);
        }
        .forge-page .burn-time-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-left: auto;
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
        .forge-page .mat-owned-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding-top: 0.4rem;
          border-top: 1px dashed var(--border-subtle);
        }
        .forge-page .mat-owned-label-group {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
        }
        .forge-page .mat-owned-controls {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .forge-page .card-owned-input {
          width: 90px;
          height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-primary);
          font-weight: 800;
          font-size: 0.9rem;
          padding: 0 0.55rem;
          text-align: right;
          outline: none;
        }
        .forge-page .card-owned-input:focus {
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
        }
        .forge-page .mat-actions-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: auto;
          padding-top: 0.35rem;
        }
        .forge-page .queue-owned-btn {
          flex: 1;
          min-height: 44px;
          padding: 0 0.55rem;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 6px;
          background: rgba(56, 189, 248, 0.1);
          color: var(--text-main);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          cursor: pointer;
          transition: background-color 150ms ease, border-color 150ms ease;
        }
        .forge-page .queue-owned-btn:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: rgba(56, 189, 248, 0.55);
        }
        .forge-page .max-session-btn {
          flex: 1;
          min-height: 44px;
          padding: 0 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-main);
          font-size: 0.78rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          cursor: pointer;
          transition: background-color 150ms ease, border-color 150ms ease;
        }
        .forge-page .max-session-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
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
          display: grid;
          grid-template-columns: minmax(200px, 1.2fr) minmax(260px, 1fr) auto;
          align-items: end;
          gap: 0.85rem;
          padding: 0.95rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
        }
        .forge-page .select-material-group {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          min-width: 0;
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
        .forge-page .combobox-quality-badge.mythic { color: var(--quality-mythic); background: color-mix(in srgb, var(--quality-mythic), transparent 90%); }
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
          max-height: 280px;
          overflow-y: auto;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          z-index: 50;
          padding: 0.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
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
          transition: background-color 120ms ease, border-color 120ms ease;
        }
        .forge-page .combobox-item-row:hover,
        .forge-page .combobox-item-row.highlighted {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--border-subtle);
        }
        .forge-page .combobox-item-row.selected {
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          border-color: color-mix(in srgb, var(--text-accent), transparent 60%);
        }
        .forge-page .combobox-item-row .item-title-col {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .forge-page .combobox-item-row .item-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .forge-page .combobox-item-row .item-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
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
        .forge-page .item-quality-pill.mythic { color: var(--quality-mythic); background: color-mix(in srgb, var(--quality-mythic), transparent 90%); }
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
          width: 30px;
          height: 30px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .forge-page .remove-owned-btn:hover {
          color: var(--text-danger);
        }
        .forge-page .inventory-empty-hint {
          padding: 1.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.82rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .forge-page .add-inventory-form {
            grid-template-columns: 1fr;
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
            align-items: flex-start;
          }
          .forge-page .owned-item-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }

    `}</style>
  );
}
