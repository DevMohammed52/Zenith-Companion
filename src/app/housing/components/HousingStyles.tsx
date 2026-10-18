"use client";

export function HousingStyles() {
  return (
    <style jsx global>{`
        .housing-page {
          padding-bottom: 4rem;
        }
        .housing-page .page-title-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 1.25rem;
          align-items: stretch;
          margin-bottom: 1.25rem;
        }
        .housing-page .page-title-row h1 {
          margin: 0.25rem 0 0.45rem;
          font-size: clamp(2rem, 4vw, 3.75rem);
          letter-spacing: 0;
        }
        .housing-page .eyebrow {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.78rem;
          font-weight: 800;
          margin: 0;
        }
        .housing-page .muted,
        .housing-page .housing-panel p,
        .housing-page .housing-status-card em,
        .housing-page .component-card p {
          color: var(--text-muted);
        }
        .housing-page .housing-status-card,
        .housing-page .housing-panel,
        .housing-page .component-card {
          border: 1px solid var(--border-subtle);
          background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018));
          border-radius: 8px;
          box-shadow: 0 16px 45px rgba(0,0,0,0.18);
        }
        .housing-page .housing-status-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.45rem;
          min-width: 0;
          padding: 1.25rem;
        }
        .housing-page .housing-status-card span,
        .housing-page .housing-status-card em {
          font-size: 0.82rem;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-page .housing-status-card strong {
          color: #fff;
          font-size: 1.4rem;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-page .housing-tabs {
          position: sticky;
          top: 0.75rem;
          z-index: 20;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.55rem;
          margin: 0 0 1rem;
          padding: 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          background: rgba(5, 10, 13, 0.9);
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 55px rgba(0,0,0,0.18);
        }
        .housing-page .housing-tabs:before,
        .housing-page .housing-tabs:after {
          content: "";
          display: none;
          position: sticky;
          top: 0;
          bottom: 0;
          width: 1.65rem;
          pointer-events: none;
          z-index: 1;
        }
        .housing-page .housing-tabs:before {
          left: 0;
          background: linear-gradient(90deg, rgba(5, 10, 13, 0.96), transparent);
        }
        .housing-page .housing-tabs:after {
          right: 0;
          background: linear-gradient(270deg, rgba(5, 10, 13, 0.96), transparent);
        }
        .housing-page .housing-tabs button {
          min-width: 0;
          border: 1px solid transparent;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.7rem 0.75rem;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }
        .housing-page .housing-tabs button:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--housing-sky), transparent 68%);
          color: #fff;
        }
        .housing-page .housing-tabs button.active {
          border-color: color-mix(in srgb, var(--housing-sky), transparent 36%);
          background: color-mix(in srgb, var(--housing-sky), transparent 88%);
          color: #fff;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--housing-sky), transparent 92%);
        }
        .housing-page .housing-tabs span,
        .housing-page .housing-tabs small {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .housing-page .housing-tabs span {
          font-weight: 900;
        }
        .housing-page .housing-tabs small {
          margin-top: 0.18rem;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .housing-page .tab-hidden {
          display: none !important;
        }
        .housing-page .housing-undo-toast {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid rgba(34, 211, 238, 0.24);
          border-radius: 8px;
          background: rgba(8, 13, 20, 0.86);
          color: var(--text-primary);
          margin: -0.25rem 0 1rem;
          padding: 0.75rem 0.85rem;
        }
        .housing-page .housing-undo-toast span {
          font-weight: 800;
        }
        .housing-page .housing-undo-toast button {
          border: 1px solid rgba(34, 211, 238, 0.38);
          border-radius: 8px;
          background: rgba(34, 211, 238, 0.1);
          color: var(--housing-sky);
          cursor: pointer;
          font-weight: 900;
          min-height: 44px;
          padding: 0 0.85rem;
        }
        .housing-page .housing-undo-toast button:hover {
          background: rgba(34, 211, 238, 0.18);
        }
        .housing-page .housing-overview-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 1rem;
          align-items: stretch;
        }
        .housing-page .overview-card {
          min-width: 0;
        }
        .housing-page .overview-primary-card {
          grid-row: span 2;
        }
        .housing-page .overview-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .housing-page .overview-card-head h2 {
          margin: 0.2rem 0 0;
          font-size: 1.32rem;
        }
        .housing-page .inline-link-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid color-mix(in srgb, var(--housing-sky), transparent 68%);
          background: color-mix(in srgb, var(--housing-sky), transparent 92%);
          color: #fff;
          border-radius: 999px;
          padding: 0.45rem 0.85rem;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }
        .housing-page .overview-hero-stat {
          min-width: 0;
          border: 1px solid rgba(74, 222, 128, 0.22);
          background: rgba(74, 222, 128, 0.055);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .housing-page .overview-hero-stat span,
        .housing-page .overview-stat-grid span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .housing-page .overview-hero-stat strong {
          display: block;
          margin-top: 0.25rem;
          color: #fff;
          font-size: clamp(1.35rem, 3vw, 2.1rem);
          overflow-wrap: anywhere;
        }
        .housing-page .overview-hero-stat small,
        .housing-page .overview-empty-copy {
          display: block;
          margin-top: 0.35rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .housing-page .overview-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.65rem;
        }
        .housing-page .overview-stat-grid div {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.75rem;
        }
        .housing-page .overview-stat-grid strong {
          display: block;
          margin-top: 0.22rem;
          color: #fff;
          font-size: 1.05rem;
          overflow-wrap: anywhere;
        }
        .housing-page .overview-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .housing-page .overview-chip-list span,
        .housing-page .overview-chip-list em {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          border-radius: 999px;
          padding: 0.45rem 0.65rem;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-style: normal;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .housing-page .overview-chip-list strong {
          color: #fff;
          margin-left: 0.35rem;
        }
        .housing-page .overview-check-list {
          display: grid;
          gap: 0.55rem;
        }
        .housing-page .overview-check-list span {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .housing-page .overview-check-list span.done {
          border-color: rgba(74, 222, 128, 0.32);
          color: var(--text-success);
          background: rgba(74, 222, 128, 0.06);
        }
        .housing-page .housing-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.7fr);
          gap: 1rem;
        }
        .housing-page .housing-panel {
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        .housing-page .empty-panel {
          min-height: 260px;
          display: grid;
          place-items: center;
          text-align: center;
          align-content: center;
          gap: 0.75rem;
        }
        .housing-page .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .housing-page .panel-heading h2 {
          margin: 0.2rem 0 0;
          font-size: 1.35rem;
        }
        .housing-page .ghost-button,
        .housing-page .add-button,
        .housing-page .selected-button {
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.04);
          color: #fff;
          border-radius: 7px;
          padding: 0.65rem 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-weight: 800;
          cursor: pointer;
        }
        .housing-page .ghost-button:disabled,
        .housing-page .add-button:disabled,
        .housing-page .selected-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .housing-page .mode-grid,
        .housing-page .stat-strip,
        .housing-page .flag-grid,
        .housing-page .guest-buff-grid,
        .housing-page .buff-grid {
          display: grid;
          gap: 0.75rem;
        }
        .housing-page .mode-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
        }
        .housing-page .mode-card {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.25);
          border-radius: 8px;
          padding: 0.9rem;
          color: var(--text-muted);
          text-align: left;
          cursor: pointer;
          min-width: 0;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .housing-page .mode-card:hover,
        .housing-page .component-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.45);
        }
        .housing-page .mode-card:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .housing-page .mode-card:disabled:hover {
          transform: none;
          border-color: var(--border-subtle);
        }
        .housing-page .mode-card strong,
        .housing-page .mode-card span {
          display: block;
        }
        .housing-page .mode-card strong {
          color: #fff;
          margin-bottom: 0.3rem;
        }
        .housing-page .mode-card.active,
        .housing-page .component-card.selected {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.08);
        }
        .housing-page .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .housing-page .housing-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .housing-page .housing-field span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .housing-page .housing-field input,
        .housing-page .housing-field textarea,
        .housing-page .search-box input {
          width: 100%;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.35);
          color: #fff;
          border-radius: 7px;
          padding: 0.75rem 0.85rem;
          font: inherit;
          font-weight: 700;
        }
        .housing-page .housing-field textarea {
          min-height: 110px;
          resize: vertical;
        }
        .housing-page .housing-field {
          margin-top: 1rem;
        }
        .housing-page .housing-field small {
          color: var(--text-muted);
          line-height: 1.35;
        }
        .housing-page .owner-setup-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
          gap: 0.8rem;
          align-items: end;
          margin-top: 1rem;
        }
        .housing-page .compact-field {
          margin-top: 0;
        }
        .housing-page :global(.choice-picker) {
          position: relative;
          min-width: 180px;
          color: #fff;
        }
        .housing-page :global(.choice-label) {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
          margin-bottom: 0.45rem;
        }
        .housing-page :global(.choice-trigger) {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.25));
          color: #fff;
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          min-width: 0;
        }
        .housing-page :global(.choice-trigger span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .housing-page :global(.choice-menu) {
          position: absolute;
          z-index: 40;
          top: calc(100% + 0.45rem);
          left: 0;
          right: 0;
          border: 1px solid color-mix(in srgb, var(--housing-sky), transparent 65%);
          background: rgba(5, 10, 13, 0.98);
          border-radius: 8px;
          padding: 0.4rem;
          box-shadow: 0 18px 50px rgba(0,0,0,0.42);
          max-height: min(320px, 52vh);
          overflow-y: auto;
        }
        .housing-page :global(.choice-backdrop) {
          display: none;
        }
        .housing-page :global(.choice-menu-head) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.45rem 0.5rem 0.55rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.68rem;
          font-weight: 900;
        }
        .housing-page :global(.choice-menu-head button) {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 7px;
          padding: 0;
        }
        .housing-page :global(.choice-menu button) {
          width: 100%;
          border: 0;
          background: transparent;
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.72rem 0.75rem;
          text-align: left;
          cursor: pointer;
          min-width: 0;
        }
        .housing-page :global(.choice-menu button.active),
        .housing-page :global(.choice-menu button:hover) {
          background: rgba(56, 189, 248, 0.12);
          color: #fff;
        }
        .housing-page :global(.choice-menu .choice-menu-head button) {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 7px;
          padding: 0;
          text-align: center;
        }
        .housing-page :global(.choice-menu .choice-menu-head button:hover) {
          border-color: rgba(56, 189, 248, 0.45);
          background: rgba(56, 189, 248, 0.12);
        }
        .housing-page :global(.choice-menu strong),
        .housing-page :global(.choice-menu small) {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-page :global(.choice-menu small) {
          margin-top: 0.25rem;
          color: var(--text-muted);
        }
        .housing-page .foundation-toggle {
          min-height: 48px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.25);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
          text-align: left;
          cursor: pointer;
        }
        .housing-page .foundation-toggle strong,
        .housing-page .foundation-toggle span {
          display: block;
        }
        .housing-page .foundation-toggle strong {
          color: #fff;
        }
        .housing-page .foundation-toggle span {
          margin-top: 0.2rem;
          font-size: 0.8rem;
        }
        .housing-page .foundation-toggle.active {
          border-color: rgba(74, 222, 128, 0.35);
          background: rgba(74, 222, 128, 0.08);
          color: var(--text-success);
        }
        .housing-page .slot-stepper {
          min-height: 48px;
          display: grid;
          grid-template-columns: 44px minmax(0, 1fr) 44px;
          align-items: center;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.24);
          border-radius: 8px;
          overflow: hidden;
        }
        .housing-page .slot-stepper.disabled {
          opacity: 0.62;
        }
        .housing-page .slot-stepper button {
          height: 100%;
          min-height: 48px;
          border: 0;
          background: rgba(255,255,255,0.04);
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .housing-page .slot-stepper button:disabled {
          cursor: not-allowed;
          color: rgba(255,255,255,0.32);
        }
        .housing-page .slot-stepper strong {
          text-align: center;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 900;
        }
        .housing-page .guest-note {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-top: 1rem;
          padding: 0.9rem;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 8px;
          color: #fff;
          background: rgba(56, 189, 248, 0.08);
        }
        .housing-page .access-pill {
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          padding: 0.45rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 800;
        }
        .housing-page .access-pill.good {
          color: var(--text-success);
          border-color: rgba(74, 222, 128, 0.35);
        }
        .housing-page .access-pill.limited {
          color: #fbbf24;
          border-color: rgba(251, 191, 36, 0.35);
        }
        .housing-page .stat-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 1rem;
        }
        .housing-page .stat-strip div,
        .housing-page .flag-grid span,
        .housing-page .buff-grid div {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .housing-page .stat-strip span,
        .housing-page .component-footer small {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }
        .housing-page .stat-strip strong {
          display: block;
          color: #fff;
          margin-top: 0.25rem;
          font-size: 1.15rem;
        }
        .housing-page .flag-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .housing-page .flag-grid span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 800;
        }
        .housing-page .flag-grid span.enabled {
          color: var(--text-success);
        }
        .housing-page .selected-setup-panel {
          border-color: rgba(56, 189, 248, 0.24);
        }
        .housing-page .slot-meter {
          min-width: 120px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
          padding: 0.7rem 0.85rem;
        }
        .housing-page .slot-meter span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
          font-weight: 800;
        }
        .housing-page .slot-meter strong {
          display: block;
          margin-top: 0.18rem;
          color: #fff;
          font-size: 1.05rem;
        }
        .housing-page .slot-meter.warning {
          border-color: rgba(248, 113, 113, 0.55);
          background: rgba(248, 113, 113, 0.08);
        }
        .housing-page .slot-warning {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border: 1px solid rgba(248, 113, 113, 0.45);
          background: rgba(248, 113, 113, 0.08);
          color: #fecaca;
          border-radius: 8px;
          padding: 0.85rem;
          margin-bottom: 0.85rem;
          font-weight: 750;
        }
        .housing-page .needs-data-text {
          color: #fbbf24 !important;
        }
        .housing-page .cost-model-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.85rem;
        }
        .housing-page .cost-model-strip > div {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
          padding: 0.8rem 0.9rem;
        }
        .housing-page .cost-model-strip span {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 850;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .housing-page .cost-model-strip strong {
          display: block;
          margin-top: 0.2rem;
          color: #fff;
          font-size: 1rem;
          overflow-wrap: anywhere;
        }
        .housing-page .cost-model-strip small {
          display: block;
          margin-top: 0.22rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .housing-page .repair-data-note {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          border: 1px solid rgba(56, 189, 248, 0.22);
          background: rgba(56, 189, 248, 0.07);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.75rem 0.85rem;
          margin-bottom: 0.85rem;
          line-height: 1.4;
          font-size: 0.86rem;
        }
        .housing-page .repair-data-note svg {
          flex: 0 0 auto;
          color: var(--text-accent);
          margin-top: 0.1rem;
        }
        .housing-page .setup-cost-panel {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.16);
          padding: 0.85rem;
          margin-bottom: 0.9rem;
        }
        .housing-page .setup-cost-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.75rem;
        }
        .housing-page .setup-cost-head span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 850;
        }
        .housing-page .setup-cost-head strong {
          display: block;
          margin-top: 0.15rem;
          color: #fff;
        }
        .housing-page .repair-cycle-pill {
          flex: 0 0 auto;
          min-height: 38px;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.65rem;
          font-size: 0.8rem;
          font-weight: 900;
        }
        .housing-page .setup-breakdown {
          padding-top: 0;
          border-top: 0;
        }
        .housing-page .setup-breakdown + .setup-breakdown {
          margin-top: 0.55rem;
          padding-top: 0.65rem;
          border-top: 1px solid var(--border-subtle);
        }
        .housing-page .repair-breakdown span:first-child {
          color: var(--text-accent);
        }
        .housing-page .selected-component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
          gap: 0.75rem;
        }
        .housing-page .selected-component-row,
        .housing-page .selected-empty {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .housing-page .selected-component-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.85rem;
          align-items: start;
        }
        .housing-page .selected-component-row strong,
        .housing-page .selected-component-row span {
          display: block;
        }
        .housing-page .selected-component-row strong {
          color: #fff;
        }
        .housing-page .selected-component-row span {
          margin-top: 0.22rem;
          color: var(--text-muted);
          font-size: 0.83rem;
        }
        .housing-page .selected-row-meta {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-shrink: 0;
        }
        .housing-page .selected-row-meta small {
          color: #fff;
          font-weight: 900;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .housing-page .selected-row-meta button {
          min-height: 44px;
          border: 1px solid rgba(248, 113, 113, 0.35);
          background: rgba(248, 113, 113, 0.08);
          color: #fecaca;
          border-radius: 7px;
          padding: 0.48rem 0.6rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          font-weight: 800;
          cursor: pointer;
        }
        .housing-page .selected-row-lock {
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          padding: 0.48rem 0.6rem;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .housing-page .component-condition-panel {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.35fr);
          gap: 0.6rem;
          align-items: center;
          border: 1px solid rgba(56, 189, 248, 0.24);
          background: rgba(56, 189, 248, 0.07);
          border-radius: 8px;
          padding: 0.7rem;
        }
        .housing-page .component-ledger-details {
          grid-column: 1 / -1;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          contain: content;
        }
        .housing-page .component-ledger-details summary {
          min-height: 44px;
          padding: 0.72rem 0.8rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.85rem;
          color: #fff;
          cursor: pointer;
          font-weight: 900;
          list-style-position: inside;
        }
        .housing-page .component-ledger-details summary span,
        .housing-page .component-ledger-details summary strong {
          min-width: 0;
        }
        .housing-page .component-ledger-details summary strong {
          color: var(--text-accent);
          font-size: 0.84rem;
          text-align: right;
          overflow-wrap: anywhere;
        }
        .housing-page .component-ledger-details[open] summary {
          border-bottom: 1px solid var(--border-subtle);
        }
        .housing-page .component-ledger-details .selected-material-breakdown {
          margin: 0.72rem;
        }
        .housing-page .component-ledger-details .selected-material-breakdown + .selected-material-breakdown {
          margin-top: 0;
        }
        @media (max-width: 980px) {
          .housing-page .component-condition-panel {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
            align-items: stretch;
          }
        }
        .housing-page .condition-readout span,
        .housing-page .condition-readout strong,
        .housing-page .condition-readout small {
          display: block;
        }
        .housing-page .condition-readout span {
          margin: 0;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.68rem;
          font-weight: 900;
        }
        .housing-page .condition-readout strong {
          margin-top: 0.12rem;
          color: #fff;
          font-size: 1.05rem;
        }
        .housing-page .condition-readout small {
          margin-top: 0.12rem;
          color: var(--text-muted);
          font-size: 0.74rem;
          line-height: 1.25;
        }
        .housing-page .condition-slider {
          min-height: 44px;
          min-width: 0;
          display: flex;
          align-items: center;
        }
        .housing-page .condition-slider input[type="range"] {
          min-height: 44px;
          width: 100%;
          accent-color: var(--housing-sky);
          cursor: pointer;
        }
        .housing-page .condition-number {
          min-height: 44px;
          display: flex;
          align-items: center;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(0,0,0,0.32);
          overflow: hidden;
        }
        .housing-page .condition-number input {
          min-height: 44px;
          min-width: 0;
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: #fff;
          padding: 0.55rem 0.35rem 0.55rem 0.55rem;
          font: inherit;
          font-weight: 900;
          text-align: right;
        }
        .housing-page .condition-number span {
          margin: 0;
          padding: 0.55rem 0.55rem 0.55rem 0;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 900;
        }
        .housing-page .repair-gold-calibration {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.25rem;
        }
        .housing-page .repair-gold-calibration span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.62rem;
          font-weight: 900;
        }
        .housing-page .repair-gold-calibration input {
          width: 100%;
          min-width: 0;
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(0,0,0,0.32);
          color: #fff;
          padding: 0.55rem 0.65rem;
          font: inherit;
          font-weight: 900;
          outline: none;
        }
        .housing-page .repair-gold-calibration input:focus-visible {
          border-color: rgba(56, 189, 248, 0.65);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        .housing-page .selected-material-breakdown {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          gap: 0.45rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-subtle);
        }
        .housing-page .selected-material-breakdown span,
        .housing-page .cost-breakdown-list span {
          min-width: 0;
        }
        .housing-page .selected-material-breakdown span {
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          border-radius: 7px;
          padding: 0.55rem 0.65rem;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .housing-page .selected-material-breakdown span:first-child {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: #fff;
        }
        .housing-page .selected-material-breakdown strong,
        .housing-page .cost-breakdown-list strong {
          display: block;
          margin-top: 0.14rem;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 900;
        }
        .housing-page .selected-material-breakdown .needs-data,
        .housing-page .cost-breakdown-list .needs-data {
          border-color: rgba(251, 191, 36, 0.34);
          color: #fbbf24;
        }
        .housing-page .repair-cost-placeholder strong {
          color: #fbbf24;
        }
        .housing-page .repair-cost-placeholder em {
          display: block;
          margin-top: 0.14rem;
          color: var(--text-muted);
          font-style: normal;
          font-size: 0.72rem;
        }
        .housing-page .repair-requirement-breakdown {
          margin-top: 0.45rem;
        }
        .housing-page .repair-requirement-breakdown span:first-child {
          color: var(--text-accent);
        }
        .housing-page .repair-cycle-breakdown {
          margin-top: 0.45rem;
        }
        .housing-page .repair-cycle-breakdown span:first-child {
          display: block;
          color: var(--text-muted);
        }
        .housing-page .repair-cycle-breakdown em {
          display: block;
          margin-top: 0.14rem;
          color: var(--text-muted);
          font-style: normal;
          font-size: 0.72rem;
          line-height: 1.35;
        }
        .housing-page .selected-empty {
          min-height: 78px;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          color: var(--text-muted);
        }
        .housing-page .guest-context-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
          gap: 0.75rem;
          align-items: stretch;
          margin: 1rem 0;
        }
        .housing-page .guest-host-field {
          margin-top: 0;
        }
        .housing-page .guest-rule-card {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          border-radius: 8px;
          padding: 0.8rem;
        }
        .housing-page .guest-rule-card.warning {
          border-color: rgba(251, 191, 36, 0.38);
          background: rgba(251, 191, 36, 0.08);
        }
        .housing-page .guest-rule-card strong,
        .housing-page .guest-rule-card span {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-page .guest-rule-card strong {
          color: #fff;
          font-size: 0.9rem;
        }
        .housing-page .guest-rule-card span {
          margin-top: 0.28rem;
          color: var(--text-muted);
          line-height: 1.38;
          font-size: 0.84rem;
        }
        .housing-page .guest-buff-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
        }
        .housing-page .guest-buff-groups {
          display: grid;
          gap: 1rem;
        }
        .housing-page .guest-buff-group {
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 0.85rem;
        }
        .housing-page .guest-buff-group-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .housing-page .guest-buff-group-head h3 {
          margin: 0;
          color: #fff;
          font-size: 0.95rem;
        }
        .housing-page .guest-buff-group-head span {
          flex: 0 0 auto;
          color: var(--text-accent);
          border: 1px solid rgba(56, 189, 248, 0.22);
          background: rgba(56, 189, 248, 0.08);
          border-radius: 999px;
          padding: 0.28rem 0.55rem;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .housing-page .guest-buff-card {
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.85rem;
        }
        .housing-page .guest-buff-card.active {
          border-color: rgba(74, 222, 128, 0.32);
          background: rgba(74, 222, 128, 0.06);
        }
        .housing-page .guest-buff-card > div:first-child {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: baseline;
          margin-bottom: 0.7rem;
        }
        .housing-page .guest-buff-card span {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .housing-page .guest-buff-card strong {
          color: #fff;
          white-space: nowrap;
        }
        .housing-page .guest-tier-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 4.5rem), 1fr));
          gap: 0.35rem;
        }
        .housing-page .guest-tier-row button {
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          border-radius: 7px;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
          cursor: pointer;
        }
        .housing-page .guest-tier-row button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .housing-page .guest-specials {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .housing-page .guest-specials button {
          min-height: 74px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.22);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          text-align: left;
          cursor: pointer;
        }
        .housing-page .guest-specials button.active {
          border-color: rgba(74, 222, 128, 0.35);
          background: rgba(74, 222, 128, 0.08);
          color: #fff;
        }
        .housing-page .guest-specials strong,
        .housing-page .guest-specials small {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-page .guest-specials small {
          margin-top: 0.2rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .housing-page .planner-controls {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .housing-page .room-profit-panel {
          position: relative;
          z-index: 2;
        }
        .housing-page .room-profit-summary {
          min-width: 190px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.75rem 0.85rem;
          background: rgba(0,0,0,0.22);
        }
        .housing-page .room-profit-summary span,
        .housing-page .room-profit-summary small,
        .housing-page .route-value-card span,
        .housing-page .room-profit-card span,
        .housing-page .horizon-list span {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 800;
        }
        .housing-page .room-profit-summary strong {
          display: block;
          margin-top: 0.2rem;
          color: #fff;
          font-size: 1.08rem;
        }
        .housing-page .room-profit-summary small {
          margin-top: 0.2rem;
          text-transform: none;
          letter-spacing: 0;
          font-size: 0.78rem;
        }
        .housing-page .room-profit-controls {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem;
          margin: 1rem 0 0.85rem;
          align-items: end;
        }
        .housing-page .room-profit-context,
        .housing-page .route-value-card,
        .housing-page .room-profit-grid,
        .housing-page .room-profit-metrics,
        .housing-page .horizon-list {
          display: grid;
          gap: 0.75rem;
        }
        .housing-page .room-profit-context {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          margin-bottom: 0.9rem;
        }
        .housing-page .room-profit-context span {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.2);
          color: var(--text-muted);
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          font-size: 0.84rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .housing-page .cost-share-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(56, 189, 248, 0.24);
          border-radius: 8px;
          padding: 0.85rem;
          background: rgba(56, 189, 248, 0.06);
          margin-bottom: 0.9rem;
        }
        .housing-page .cost-share-card > div:first-child {
          min-width: 0;
        }
        .housing-page .cost-share-card span {
          display: block;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .housing-page .cost-share-card strong {
          display: block;
          color: #fff;
          overflow-wrap: anywhere;
        }
        .housing-page .cost-share-card small {
          display: block;
          margin-top: 0.18rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .housing-page .cost-share-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.4rem;
          min-width: min(100%, 260px);
        }
        .housing-page .cost-share-row button {
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.28);
          color: var(--text-muted);
          border-radius: 7px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        .housing-page .cost-share-row button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .housing-page .room-profit-capacity-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          border: 1px solid rgba(251, 191, 36, 0.34);
          background: rgba(251, 191, 36, 0.08);
          color: #fde68a;
          border-radius: 8px;
          padding: 0.72rem 0.8rem;
          margin: -0.35rem 0 0.9rem;
          font-size: 0.84rem;
          font-weight: 750;
          line-height: 1.4;
        }
        .housing-page .room-profit-capacity-warning svg {
          flex: 0 0 auto;
          margin-top: 0.1rem;
        }
        .housing-page .room-profit-capacity-warning span {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .housing-page .room-profit-explainer {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          border: 1px solid rgba(245, 158, 11, 0.32);
          background: rgba(245, 158, 11, 0.08);
          border-radius: 8px;
          padding: 0.85rem;
          margin-bottom: 0.9rem;
          color: #fde68a;
        }
        .housing-page .room-profit-explainer strong {
          color: #fff;
          white-space: nowrap;
        }
        .housing-page .room-profit-explainer span {
          color: var(--text-muted);
          line-height: 1.4;
        }
        .housing-page .route-value-card {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          border: 1px solid rgba(56, 189, 248, 0.24);
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.07);
          padding: 0.85rem;
          margin-bottom: 0.9rem;
        }
        .housing-page .route-value-card > div {
          min-width: 0;
        }
        .housing-page .route-value-card strong,
        .housing-page .room-profit-card strong,
        .housing-page .horizon-list strong,
        .housing-page .horizon-list em {
          display: block;
          color: #fff;
          overflow-wrap: anywhere;
        }
        .housing-page .gold-value {
          white-space: normal;
          overflow-wrap: anywhere;
          font-variant-numeric: tabular-nums;
        }
        .housing-page .route-value-card strong {
          margin-top: 0.2rem;
        }
        .housing-page .route-value-card small,
        .housing-page .room-profit-metrics small {
          display: block;
          margin-top: 0.22rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .housing-page .room-profit-grid {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
        }
        .housing-page .room-profit-card {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0,0,0,0.22);
          padding: 0.9rem;
        }
        .housing-page .room-profit-card.baseline {
          background: rgba(255,255,255,0.035);
        }
        .housing-page .room-profit-card-head {
          display: flex;
          justify-content: space-between;
          gap: 0.8rem;
          align-items: flex-start;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .housing-page .room-profit-card-head strong {
          margin-top: 0.18rem;
          font-size: 1.22rem;
        }
        .housing-page .room-profit-card-head small {
          color: var(--text-accent);
          font-weight: 900;
          white-space: nowrap;
        }
        .housing-page .room-profit-metrics {
          grid-template-columns: 1fr;
          margin-top: 0.75rem;
        }
        .housing-page .room-profit-metrics > div {
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.7rem;
          background: rgba(255,255,255,0.035);
        }
        .housing-page .room-profit-metrics strong {
          margin-top: 0.15rem;
        }
        .housing-page .room-profit-metrics .needs-data,
        .housing-page .room-profit-warning {
          color: #fbbf24;
        }
        .housing-page .room-profit-warning {
          margin-top: 0.75rem;
          border: 1px solid rgba(251, 191, 36, 0.35);
          background: rgba(251, 191, 36, 0.08);
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          font-size: 0.82rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        .housing-page .room-profit-note {
          margin-top: 0.75rem;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.18);
          border-radius: 8px;
          padding: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .housing-page .horizon-list {
          margin-top: 0.75rem;
          gap: 0.45rem;
        }
        .housing-page .horizon-row {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(5.2rem, 0.55fr) minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          gap: 0.6rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.62rem 0.7rem;
          background: rgba(0,0,0,0.18);
        }
        .housing-page .horizon-row strong,
        .housing-page .horizon-row em {
          margin: 0;
          font-size: 0.88rem;
          font-style: normal;
        }
        .housing-page .horizon-row .positive {
          color: var(--text-success);
        }
        .housing-page .horizon-row .negative {
          color: #fecaca;
        }
        .housing-page .compact-empty-state {
          min-height: 150px;
        }
        .housing-page .planner-mode-note {
          max-width: 620px;
          margin: 0.35rem 0 0;
          font-size: 0.9rem;
        }
        .housing-page .planner-empty-state {
          min-height: 180px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 0.55rem;
          text-align: center;
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          color: var(--text-muted);
          background: rgba(0,0,0,0.18);
        }
        .housing-page .planner-empty-state strong {
          color: #fff;
          font-size: 1.05rem;
        }
        .housing-page .planner-empty-state span {
          max-width: 420px;
        }
        .housing-page .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: min(420px, 100%);
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.35);
          border-radius: 8px;
          padding: 0 0.75rem;
        }
        .housing-page .search-box input {
          border: 0;
          background: transparent;
          padding-left: 0;
        }
        .housing-page .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 1rem;
        }
        .housing-page .component-card {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .housing-page .component-head {
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr);
          gap: 0.75rem;
          align-items: start;
        }
        .housing-page .component-icon {
          width: 46px;
          height: 46px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,0.25);
          color: var(--text-accent);
        }
        .housing-page .component-card h3 {
          margin: 0;
          color: #fff;
          font-size: 1rem;
        }
        .housing-page .component-card p {
          margin: 0.25rem 0 0;
          font-size: 0.86rem;
        }
        .housing-page .component-meta,
        .housing-page .material-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .housing-page .tier-selector {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.4rem;
        }
        .housing-page .tier-selector button {
          min-height: 44px;
          min-width: 44px;
          border: 1px solid var(--border-subtle);
          background: rgba(0,0,0,0.24);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.45rem 0.35rem;
          font-weight: 900;
          cursor: pointer;
        }
        .housing-page .tier-selector button.active {
          border-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.14);
          color: #fff;
        }
        .housing-page .component-meta span,
        .housing-page .material-list span {
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.045);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 0.35rem 0.55rem;
          font-size: 0.76rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
          white-space: normal;
        }
        .housing-page .cost-breakdown-list span {
          flex: 1 1 11rem;
        }
        .housing-page .component-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: auto;
          padding-top: 0.8rem;
          border-top: 1px solid var(--border-subtle);
        }
        .housing-page .component-footer > div {
          min-width: 0;
        }
        .housing-page .component-footer span {
          color: #fff;
          font-weight: 900;
          overflow-wrap: anywhere;
        }
        .housing-page .component-footer .needs-data {
          color: #fbbf24;
        }
        .housing-page .add-button {
          background: rgba(56, 189, 248, 0.13);
          border-color: rgba(56, 189, 248, 0.35);
        }
        .housing-page .add-button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
          background: rgba(255,255,255,0.035);
          border-color: var(--border-subtle);
        }
        .housing-page .selected-button {
          background: rgba(74, 222, 128, 0.13);
          border-color: rgba(74, 222, 128, 0.35);
        }
        .housing-page .buff-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        .housing-page .buff-grid div {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          color: var(--text-muted);
        }
        .housing-page .buff-grid div.active {
          border-color: rgba(74, 222, 128, 0.35);
          color: #fff;
        }
        .housing-page .buff-grid strong {
          color: inherit;
        }
        @media (max-width: 920px) {
          .housing-page .page-title-row,
          .housing-page .housing-grid,
          .housing-page .housing-overview-grid {
            grid-template-columns: 1fr;
          }
          .housing-page .housing-tabs {
            position: static;
            display: flex;
            overflow-x: auto;
            scrollbar-width: thin;
            scroll-padding-inline: 1.7rem;
          }
          .housing-page .housing-tabs:before,
          .housing-page .housing-tabs:after {
            display: block;
            flex: 0 0 1.65rem;
          }
          .housing-page .housing-tabs button {
            flex: 0 0 min(42vw, 10.5rem);
          }
          .housing-page .overview-primary-card {
            grid-row: auto;
          }
          .housing-page .mode-grid,
          .housing-page .stat-strip,
          .housing-page .flag-grid,
          .housing-page .owner-setup-grid,
          .housing-page .guest-specials {
            grid-template-columns: 1fr;
          }
          .housing-page .panel-heading {
            flex-direction: column;
            align-items: stretch;
          }
          .housing-page .planner-controls {
            justify-content: stretch;
          }
          .housing-page .room-profit-controls,
          .housing-page .route-value-card,
          .housing-page .cost-model-strip {
            grid-template-columns: 1fr;
          }
          .housing-page .cost-share-card {
            align-items: stretch;
            flex-direction: column;
          }
          .housing-page .cost-share-row {
            width: 100%;
          }
          .housing-page .room-profit-summary {
            width: 100%;
          }
          .housing-page .planner-controls,
          .housing-page .search-box,
          .housing-page :global(.choice-picker) {
            width: 100%;
          }
          .housing-page .selected-component-row {
            align-items: stretch;
            grid-template-columns: 1fr;
          }
          .housing-page .selected-row-meta {
            justify-content: space-between;
          }
        }
        @media (max-width: 640px) {
          .housing-page .housing-tabs {
            margin-left: -0.25rem;
            margin-right: -0.25rem;
          }
          .housing-page .housing-tabs button {
            flex-basis: 8.75rem;
            padding: 0.62rem 0.68rem;
          }
          .housing-page .overview-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .housing-page .overview-card-head {
            align-items: stretch;
            flex-direction: column;
          }
          .housing-page .inline-link-button {
            width: fit-content;
          }
          .housing-page .component-footer {
            align-items: stretch;
            flex-direction: column;
          }
          .housing-page .room-profit-card-head {
            flex-direction: column;
          }
          .housing-page .room-profit-card-head small {
            white-space: normal;
          }
          .housing-page .room-profit-explainer {
            flex-direction: column;
          }
          .housing-page .room-profit-explainer strong {
            white-space: normal;
          }
          .housing-page .setup-cost-head {
            align-items: stretch;
            flex-direction: column;
          }
          .housing-page .repair-cycle-pill {
            width: 100%;
            justify-content: center;
          }
          .housing-page .housing-undo-toast {
            align-items: stretch;
            flex-direction: column;
          }
          .housing-page .component-condition-panel {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
          .housing-page .component-ledger-details summary {
            align-items: stretch;
            flex-direction: column;
          }
          .housing-page .component-ledger-details summary strong {
            text-align: left;
          }
          .housing-page .horizon-row {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
        }
        @media (max-width: 520px) {
          .housing-page .housing-panel {
            padding: 1rem;
          }
          .housing-page .component-grid {
            grid-template-columns: 1fr;
          }
          .housing-page .guest-buff-grid {
            grid-template-columns: 1fr;
          }
          .housing-page .component-footer {
            align-items: stretch;
            flex-direction: column;
          }
          .housing-page .add-button,
          .housing-page .selected-button {
            justify-content: center;
          }
          .housing-page .room-profit-grid {
            grid-template-columns: 1fr;
          }
          .housing-page .room-profit-context {
            grid-template-columns: 1fr;
          }
          .housing-page .cost-share-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .housing-page :global(.choice-menu) {
            position: fixed;
            z-index: 6010;
            left: 0.75rem;
            right: 0.75rem;
            top: auto;
            bottom: 0.75rem;
            max-height: min(420px, 70dvh);
          }
          .housing-page :global(.choice-backdrop) {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 6000;
            border: 0;
            background: rgba(0,0,0,0.52);
          }
        }
        .housing-page {
          --housing-gold: var(--text-accent);
          --housing-mint: var(--text-success);
          --housing-sky: color-mix(in srgb, var(--text-accent), #38bdf8 35%);
          --housing-panel: rgba(9, 14, 17, 0.82);
          -webkit-tap-highlight-color: transparent;
          padding-bottom: clamp(5rem, 8vh, 7.5rem);
        }
        .housing-page :where(button, input, textarea, summary, [role="button"], [role="option"]) {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .housing-page .page-title-row {
          position: relative;
          overflow: hidden;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
          gap: clamp(1rem, 2vw, 1.5rem);
          align-items: stretch;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 78%);
          border-radius: 8px;
          background:
            linear-gradient(145deg, color-mix(in srgb, var(--text-accent), transparent 94%), rgba(10, 16, 20, 0.78)),
            rgba(5, 10, 13, 0.36);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.2);
          margin-bottom: 1rem;
          padding: clamp(1rem, 2.2vw, 1.45rem);
        }
        .housing-page .page-title-row::before {
          display: none;
        }
        .housing-page .page-title-row > * {
          position: relative;
          z-index: 1;
        }
        .housing-page .housing-hero-copy {
          min-width: 0;
          display: grid;
          gap: 0.8rem;
          align-content: start;
        }
        .housing-page .housing-hero-copy h1 {
          margin: 0;
          color: #fffdf8;
          font-size: clamp(2rem, 3.3vw, 3.1rem);
        }
        .housing-page .housing-hero-copy .muted {
          max-width: 68ch;
          margin: 0;
          line-height: 1.65;
        }
        .housing-page .housing-hero-chips,
        .housing-page .housing-quick-actions,
        .housing-page .housing-status-details {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-width: 0;
        }
        .housing-page .housing-hero-chips span,
        .housing-page .housing-status-details span {
          min-height: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          max-width: 100%;
          border: 1px solid rgba(245, 176, 65, 0.2);
          border-radius: 999px;
          background: rgba(245, 176, 65, 0.08);
          color: #fde68a;
          font-size: 0.74rem;
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1.15;
          padding: 0.45rem 0.72rem;
        }
        .housing-page .housing-hero-chips span.good,
        .housing-page .housing-status-details span:not(.needs-data):first-child {
          border-color: rgba(52, 211, 153, 0.24);
          background: rgba(52, 211, 153, 0.09);
          color: #bbf7d0;
        }
        .housing-page .housing-hero-chips svg,
        .housing-page .housing-status-details svg {
          flex: 0 0 auto;
          color: var(--housing-sky);
        }
        .housing-page .housing-quick-actions {
          margin-top: 0.1rem;
        }
        .housing-page .housing-quick-actions button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: 1px solid color-mix(in srgb, var(--housing-sky), transparent 78%);
          border-radius: 8px;
          background: color-mix(in srgb, var(--housing-sky), transparent 93%);
          color: color-mix(in srgb, var(--housing-sky), white 55%);
          cursor: pointer;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
          padding: 0.62rem 0.86rem;
          transition: transform 170ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 170ms ease, background-color 170ms ease, box-shadow 170ms ease;
        }
        .housing-page .housing-quick-actions button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--text-accent), transparent 64%);
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
        }
        .housing-page .housing-quick-actions button[aria-pressed="true"] {
          border-color: color-mix(in srgb, var(--text-accent), transparent 54%);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: #fff;
        }
        .housing-page .housing-quick-actions button:active:not(:disabled) {
          transform: scale(0.985);
        }
        .housing-page .housing-quick-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.48;
        }
        .housing-page .housing-status-card {
          border-color: color-mix(in srgb, var(--housing-sky), transparent 80%);
          background:
            linear-gradient(145deg, color-mix(in srgb, var(--housing-sky), transparent 92%), rgba(0, 0, 0, 0.24)),
            rgba(5, 10, 13, 0.5);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 56px rgba(0, 0, 0, 0.22);
        }
        .housing-page .housing-status-details {
          margin-top: 0.25rem;
        }
        .housing-page .housing-status-details span {
          width: 100%;
          justify-content: flex-start;
          overflow: visible;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.045);
          color: #e5e7eb;
          overflow-wrap: anywhere;
          text-overflow: clip;
          white-space: normal;
        }
        .housing-page .housing-status-details .needs-data {
          border-color: rgba(245, 158, 11, 0.32);
          color: #fcd34d;
        }
        .housing-page .housing-panel,
        .housing-page .housing-status-card,
        .housing-page .component-card,
        .housing-page .overview-card,
        .housing-page .mode-card,
        .housing-page .housing-tabs button,
        .housing-page :global(.choice-trigger),
        .housing-page :global(.choice-menu),
        .housing-page .housing-undo-toast {
          transition:
            transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            color 180ms ease;
        }
        .housing-page .housing-panel,
        .housing-page .component-card {
          background: var(--housing-panel);
        }
        .housing-page .housing-tabs {
          top: 0.65rem;
          border-color: color-mix(in srgb, var(--housing-sky), transparent 84%);
          background: rgba(5, 10, 13, 0.92);
          backdrop-filter: none;
        }
        .housing-page .housing-tabs button:active,
        .housing-page .mode-card:active,
        .housing-page .foundation-toggle:active,
        .housing-page .inline-link-button:active,
        .housing-page .add-button:active:not(:disabled),
        .housing-page .selected-button:active:not(:disabled),
        .housing-page .ghost-button:active {
          transform: scale(0.985);
        }
        .housing-page .housing-tabs button:focus-visible,
        .housing-page .housing-quick-actions button:focus-visible,
        .housing-page .housing-undo-toast button:focus-visible,
        .housing-page .mode-card:focus-visible,
        .housing-page .foundation-toggle:focus-visible,
        .housing-page .slot-stepper button:focus-visible,
        .housing-page .inline-link-button:focus-visible,
        .housing-page .ghost-button:focus-visible,
        .housing-page .search-box input:focus-visible,
        .housing-page .housing-field input:focus-visible,
        .housing-page .housing-field textarea:focus-visible,
        .housing-page .add-button:focus-visible,
        .housing-page .selected-button:focus-visible,
        .housing-page .tier-selector button:focus-visible,
        .housing-page .guest-tier-row button:focus-visible,
        .housing-page .component-ledger-details summary:focus-visible,
        .housing-page :global(.choice-trigger:focus-visible),
        .housing-page :global(.choice-menu button:focus-visible) {
          outline: 2px solid color-mix(in srgb, var(--housing-sky), white 12%);
          outline-offset: 3px;
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--housing-sky), transparent 89%);
        }
        @media (hover: hover) and (pointer: fine) {
          .housing-page .component-card:hover {
            transform: translateY(-1px);
            border-color: color-mix(in srgb, var(--text-accent), transparent 78%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .housing-page *,
          .housing-page *::before,
          .housing-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
        @media (max-width: 920px) {
          .housing-page .page-title-row {
            grid-template-columns: minmax(0, 1fr);
          }
          .housing-page .housing-status-card {
            gap: 0.6rem;
          }
          .housing-page .housing-status-details {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .housing-page :global(.choice-menu) {
            position: fixed;
            z-index: 6010;
            left: 1rem;
            right: 1rem;
            top: auto;
            bottom: 1rem;
            max-height: min(420px, 70dvh);
          }
          .housing-page :global(.choice-backdrop) {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 6000;
            border: 0;
            background: rgba(0, 0, 0, 0.52);
          }
        }
        @media (max-width: 640px) {
          .housing-page {
            padding-bottom: 9rem;
          }
          .housing-page .page-title-row {
            margin-left: -0.15rem;
            margin-right: -0.15rem;
            padding: 1rem;
          }
          .housing-page .housing-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .housing-page .housing-quick-actions button {
            min-width: 0;
            padding-inline: 0.55rem;
          }
          .housing-page .housing-status-details {
            grid-template-columns: minmax(0, 1fr);
          }
          .housing-page .housing-hero-chips span,
          .housing-page .housing-status-details span {
            width: 100%;
          }
        }
    `}</style>
  );
}
