"use client";

export function BossStyles() {
    return (
        <style jsx global>{`
            .bosses-page {
                max-width: min(1500px, calc(100vw - 2rem));
                overflow-x: hidden;
            }
            .bosses-page .boss-modal-overlay {
                align-items: center;
                justify-content: center;
                overflow-y: auto;
                padding: max(1rem, env(safe-area-inset-top)) clamp(0.75rem, 2vw, 1.5rem) max(1rem, env(safe-area-inset-bottom));
                z-index: 5000;
            }
            .bosses-page .table-wrapper,
            .bosses-page .mobile-only,
            .bosses-page .mobile-card-grid,
            .bosses-page .boss-radar,
            .bosses-page .boss-view-switch,
            .bosses-page .boss-routine-planner,
            .bosses-page .boss-controls,
            .bosses-page .boss-item-modifier-panel {
                max-width: 100%;
                min-width: 0;
            }
            .bosses-page .boss-sort-button {
                align-items: center;
                background: transparent;
                border: 0;
                color: inherit;
                cursor: pointer;
                display: inline-flex;
                font: inherit;
                font-weight: 900;
                gap: 0.35rem;
                justify-content: center;
                letter-spacing: inherit;
                min-height: 44px;
                padding: 0;
                text-align: inherit;
                text-transform: inherit;
                width: 100%;
            }
            .bosses-page th.left-align .boss-sort-button {
                justify-content: flex-start;
            }
            .bosses-page .boss-sort-button svg {
                flex: 0 0 auto;
            }
            .bosses-page .boss-sort-button:focus-visible {
                border-radius: 6px;
                outline: 2px solid var(--text-accent);
                outline-offset: 3px;
            }
            .bosses-page .boss-radar {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 1.5rem;
                align-items: center;
                margin-bottom: 1.5rem;
                padding: 1.25rem;
                border: 1px solid rgba(56, 189, 248, 0.18);
                border-radius: 8px;
                background:
                    radial-gradient(circle at 10% 0%, rgba(56, 189, 248, 0.12), transparent 28rem),
                    linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(10, 10, 12, 0.88));
                animation: boss-rise 0.4s ease both;
            }
            .bosses-page .boss-radar-main { min-width: 0; }
            .bosses-page .boss-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
                color: var(--text-accent);
                font-size: 0.72rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                margin-bottom: 0.55rem;
            }
            .bosses-page .boss-radar h2 {
                font-size: clamp(1.4rem, 3vw, 2.2rem);
                margin: 0 0 0.35rem;
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-radar p {
                margin: 0;
                color: var(--text-muted);
                line-height: 1.5;
            }
            .bosses-page .boss-radar-stats {
                display: grid;
                grid-template-columns: repeat(3, minmax(7rem, 1fr));
                gap: 0.75rem;
            }
            .bosses-page .boss-radar-stats div {
                padding: 0.85rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.03);
                transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
            }
            @media (hover: hover) {
                .bosses-page .boss-radar-stats div:hover {
                    border-color: rgba(56, 189, 248, 0.28);
                    background: rgba(255, 255, 255, 0.045);
                    transform: translateY(-1px);
                }
            }
            .bosses-page .boss-radar-stats span {
                display: block;
                color: var(--text-muted);
                font-size: 0.68rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 0.35rem;
            }
            .bosses-page .boss-radar-stats strong {
                display: block;
                color: #fff;
                font-size: 1.05rem;
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-view-switch {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.45rem;
                margin: -0.5rem 0 1rem;
                padding: 0.35rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(255,255,255,0.025);
            }
            .bosses-page .boss-view-switch button {
                min-width: 0;
                min-height: 56px;
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto;
                align-items: center;
                gap: 0.55rem;
                border: 1px solid transparent;
                border-radius: 7px;
                background: transparent;
                color: var(--text-muted);
                padding: 0.6rem 0.75rem;
                text-align: left;
                cursor: pointer;
                transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
            }
            .bosses-page .boss-view-switch button:hover,
            .bosses-page .boss-view-switch button:focus-visible {
                color: #fff;
                border-color: rgba(56,189,248,0.26);
                outline: none;
            }
            .bosses-page .boss-view-switch button.active {
                color: #fff;
                border-color: rgba(56,189,248,0.45);
                background: rgba(56,189,248,0.12);
                box-shadow: inset 0 0 0 1px rgba(56,189,248,0.1);
            }
            .bosses-page .boss-view-switch svg {
                color: var(--text-accent);
                flex: 0 0 auto;
            }
            .bosses-page .boss-view-switch span {
                min-width: 0;
                font-weight: 900;
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-view-switch small {
                color: var(--text-muted);
                font-size: 0.68rem;
                font-weight: 800;
                white-space: nowrap;
            }
            .bosses-page .boss-phase-filters {
                display: flex;
                flex-wrap: wrap;
                gap: 0.45rem;
                margin: 0.65rem 0 1rem;
            }
            .bosses-page .boss-phase-pill {
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
                min-height: 44px;
                padding: 0.4rem 0.85rem;
                border: 1px solid var(--border-subtle);
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.03);
                color: var(--text-muted);
                font-size: 0.8rem;
                font-weight: 800;
                cursor: pointer;
                transition: all 160ms ease;
            }
            .bosses-page .boss-phase-pill:hover,
            .bosses-page .boss-phase-pill:focus-visible {
                color: #fff;
                border-color: rgba(56, 189, 248, 0.35);
                background: rgba(56, 189, 248, 0.08);
                outline: none;
            }
            .bosses-page .boss-phase-pill.active {
                color: #fff;
                border-color: rgba(56, 189, 248, 0.5);
                background: rgba(56, 189, 248, 0.16);
                box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.2);
            }
            .bosses-page .boss-phase-pill .pill-count {
                font-size: 0.72rem;
                opacity: 0.75;
                padding: 0.1rem 0.35rem;
                border-radius: 999px;
                background: rgba(0, 0, 0, 0.25);
            }
            .bosses-page .boss-routine-planner {
                margin-bottom: 1.5rem;
                padding: 1.25rem;
                border: 1px solid rgba(74, 222, 128, 0.18);
                border-radius: 8px;
                background:
                    radial-gradient(circle at 95% 0%, rgba(74, 222, 128, 0.1), transparent 24rem),
                    linear-gradient(135deg, rgba(12, 18, 18, 0.86), rgba(10, 10, 12, 0.92));
                animation: boss-rise 0.45s ease both;
            }
            .bosses-page .boss-routine-header {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(18rem, 32rem);
                gap: 1.25rem;
                align-items: start;
                margin-bottom: 1rem;
            }
            .bosses-page .boss-routine-header h2 {
                margin: 0 0 0.35rem;
                font-size: clamp(1.15rem, 2vw, 1.55rem);
            }
            .bosses-page .boss-routine-header p {
                margin: 0;
                color: var(--text-muted);
                line-height: 1.5;
            }
            .bosses-page .boss-routine-summary {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 0.65rem;
            }
            .bosses-page .boss-routine-summary div {
                min-width: 0;
                padding: 0.75rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(255,255,255,0.03);
                transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
            }
            .bosses-page .boss-routine-summary span {
                display: block;
                margin-bottom: 0.3rem;
                color: var(--text-muted);
                font-size: 0.65rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.07em;
            }
            .bosses-page .boss-routine-summary strong {
                display: block;
                color: #fff;
                font-size: 0.95rem;
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-scope-note {
                margin: -0.15rem 0 1rem;
                padding: 0.65rem 0.8rem;
                border: 1px solid rgba(56,189,248,0.2);
                border-radius: 8px;
                background: rgba(56,189,248,0.06);
                color: var(--text-muted);
                font-size: 0.78rem;
                line-height: 1.4;
            }
            .bosses-page .boss-routine-controls {
                display: grid;
                grid-template-columns: minmax(12rem, 1.25fr) repeat(4, minmax(9rem, 1fr));
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            .bosses-page .boss-routine-controls .control-input {
                width: 100%;
            }
            .bosses-page .routine-teleport-hint {
                color: var(--text-muted);
                font-size: 0.72rem;
                line-height: 1.3;
            }
            .bosses-page .routine-location-field {
                position: relative;
                z-index: 20;
            }
            .bosses-page .routine-location-trigger {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
                width: 100%;
                min-height: 44px;
                padding: 0 0.85rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(0,0,0,0.32);
                color: #fff;
                font: inherit;
                font-weight: 800;
                cursor: pointer;
                transition: border-color 0.2s ease, background 0.2s ease;
            }
            .bosses-page .routine-location-trigger.open,
            .bosses-page .routine-location-trigger:focus-visible {
                border-color: rgba(56,189,248,0.45);
                background: rgba(56,189,248,0.08);
                outline: none;
            }
            .bosses-page .routine-location-trigger svg {
                color: var(--text-muted);
                flex: 0 0 auto;
            }
            .bosses-page .routine-location-menu {
                position: absolute;
                top: calc(100% + 0.35rem);
                left: 0;
                right: 0;
                z-index: 50;
                display: grid;
                gap: 0.25rem;
                max-height: min(18rem, 50vh);
                overflow-y: auto;
                padding: 0.35rem;
                border: 1px solid rgba(56,189,248,0.3);
                border-radius: 8px;
                background: #07080d;
                box-shadow: 0 16px 40px rgba(0,0,0,0.45);
            }
            .bosses-page .routine-location-menu.drop-up {
                top: auto;
                bottom: calc(100% + 0.35rem);
            }
            .bosses-page .routine-location-menu button {
                min-height: 44px;
                display: flex;
                align-items: center;
                gap: 0.55rem;
                border: 1px solid transparent;
                border-radius: 6px;
                background: transparent;
                color: var(--text-muted);
                padding: 0.45rem 0.65rem;
                font: inherit;
                font-weight: 700;
                text-align: left;
                cursor: pointer;
            }
            .bosses-page .routine-location-menu button:hover,
            .bosses-page .routine-location-menu button.selected,
            .bosses-page .routine-location-menu button:focus-visible {
                border-color: rgba(56,189,248,0.3);
                background: rgba(56,189,248,0.12);
                color: #fff;
                outline: none;
            }
            .bosses-page .routine-location-menu button svg {
                color: var(--text-accent);
                flex: 0 0 auto;
            }
            .bosses-page .routine-segmented {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.35rem;
                padding: 0.25rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(0,0,0,0.28);
            }
            .bosses-page .routine-segmented button {
                min-height: 44px;
                border: 1px solid transparent;
                border-radius: 6px;
                background: transparent;
                color: var(--text-muted);
                font: inherit;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .bosses-page .routine-segmented button:hover,
            .bosses-page .routine-segmented button:focus-visible {
                color: #fff;
                outline: none;
            }
            .bosses-page .routine-segmented button.active {
                color: #fff;
                background: rgba(56,189,248,0.14);
                border-color: rgba(56,189,248,0.4);
            }
            .bosses-page .routine-toggle {
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(0,0,0,0.28);
                color: var(--text-muted);
                font: inherit;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .bosses-page .routine-toggle:hover,
            .bosses-page .routine-toggle:focus-visible {
                color: #fff;
                border-color: rgba(56,189,248,0.35);
                outline: none;
            }
            .bosses-page .routine-toggle.active {
                color: #facc15;
                border-color: rgba(250,204,21,0.35);
                background: rgba(250,204,21,0.1);
            }
            .bosses-page .routine-boss-picker {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
                gap: 0.55rem;
                margin-bottom: 1.25rem;
            }
            .bosses-page .routine-boss-picker button {
                min-height: 44px;
                display: grid;
                grid-template-columns: 28px minmax(0, 1fr) auto;
                align-items: center;
                gap: 0.55rem;
                padding: 0.55rem 0.65rem;
                border: 1px solid var(--border-subtle);
                border-radius: 7px;
                background: rgba(255,255,255,0.02);
                color: var(--text-muted);
                text-align: left;
                cursor: pointer;
                transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
            }
            .bosses-page .routine-boss-picker button:hover,
            .bosses-page .routine-boss-picker button:focus-visible {
                color: #fff;
                border-color: rgba(56,189,248,0.3);
                outline: none;
            }
            .bosses-page .routine-boss-picker button.selected {
                color: #fff;
                border-color: rgba(74,222,128,0.45);
                background: rgba(74,222,128,0.08);
            }
            .bosses-page .routine-boss-picker img {
                width: 28px;
                height: 28px;
                border-radius: 5px;
                object-fit: cover;
                flex: 0 0 auto;
            }
            .bosses-page .routine-boss-picker span {
                font-weight: 800;
                overflow-wrap: anywhere;
            }
            .bosses-page .routine-boss-picker small {
                grid-column: 2;
                font-size: 0.68rem;
                color: var(--text-muted);
            }
            .bosses-page .routine-boss-check {
                grid-column: 3;
                grid-row: 1 / span 2;
                color: #4ade80;
                display: flex;
                align-items: center;
            }
            .bosses-page .routine-timeline {
                display: flex;
                flex-direction: column;
                gap: 0.65rem;
            }
            .bosses-page .routine-leg {
                display: grid;
                grid-template-columns: 2rem minmax(0, 1fr);
                gap: 0.75rem;
                align-items: start;
                padding: 0.75rem 0.85rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(255,255,255,0.02);
            }
            .bosses-page .routine-leg-marker {
                display: flex;
                justify-content: center;
            }
            .bosses-page .routine-leg-marker span {
                width: 1.75rem;
                height: 1.75rem;
                border-radius: 50%;
                background: rgba(56,189,248,0.15);
                border: 1px solid rgba(56,189,248,0.35);
                color: #7dd3fc;
                font-size: 0.75rem;
                font-weight: 900;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .bosses-page .routine-leg-main {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
                min-width: 0;
            }
            .bosses-page .routine-leg-title {
                display: flex;
                align-items: baseline;
                gap: 0.65rem;
                flex-wrap: wrap;
            }
            .bosses-page .routine-leg-title strong {
                font-size: 0.95rem;
                color: #fff;
            }
            .bosses-page .routine-leg-title span {
                color: var(--text-muted);
                font-size: 0.74rem;
            }
            .bosses-page .routine-leg-route {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                color: var(--text-muted);
                font-size: 0.76rem;
            }
            .bosses-page .routine-leg-route span {
                color: #fff;
                font-weight: 700;
            }
            .bosses-page .routine-leg-route em {
                font-style: normal;
                color: var(--text-muted);
                font-size: 0.7rem;
            }
            .bosses-page .routine-leg-metrics {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                align-items: center;
                margin-top: 0.2rem;
            }
            .bosses-page .routine-leg-metrics span,
            .bosses-page .routine-leg-metrics strong {
                display: inline-flex;
                align-items: center;
                padding: 0.2rem 0.45rem;
                border-radius: 5px;
                border: 1px solid var(--border-subtle);
                background: rgba(255,255,255,0.03);
                font-size: 0.72rem;
            }
            .bosses-page .routine-timing-badge {
                border-radius: 5px;
                padding: 0.2rem 0.45rem;
                font-size: 0.7rem;
                font-weight: 800;
            }
            .bosses-page .timing-ok {
                color: #86efac;
                background: rgba(34,197,94,0.12);
                border: 1px solid rgba(34,197,94,0.28);
            }
            .bosses-page .timing-tight {
                color: #facc15;
                background: rgba(250,204,21,0.1);
                border: 1px solid rgba(250,204,21,0.24);
            }
            .bosses-page .timing-overlap {
                color: #fca5a5;
                background: rgba(239,68,68,0.1);
                border: 1px solid rgba(239,68,68,0.24);
            }
            .bosses-page .routine-warning {
                margin-top: 0.75rem;
            }
            .bosses-page .routine-class-note {
                margin-bottom: 1rem;
            }
            .bosses-page .boss-controls {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(14rem, 20rem);
                gap: 1rem;
                margin-bottom: 1rem;
            }
            .bosses-page .boss-search-control,
            .bosses-page .boss-mf-control {
                min-width: 0;
            }
            .bosses-page .boss-input-shell {
                display: flex;
                align-items: center;
                gap: 0.65rem;
                padding: 0 0.85rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(0,0,0,0.32);
                transition: border-color 0.2s ease;
            }
            .bosses-page .boss-input-shell:focus-within {
                border-color: rgba(56,189,248,0.45);
            }
            .bosses-page .boss-input-shell-accent:focus-within {
                border-color: rgba(250,204,21,0.45);
            }
            .bosses-page .boss-input-shell svg {
                color: var(--text-muted);
                flex: 0 0 auto;
            }
            .bosses-page .boss-input-shell input {
                border: 0;
                background: transparent;
                padding: 0.65rem 0;
                outline: none;
                width: 100%;
            }
            .bosses-page .boss-input-shell input:focus {
                border: 0;
                outline: none;
                box-shadow: none;
            }
            .bosses-page .boss-item-modifier-panel {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
                gap: 1rem;
                align-items: center;
                margin-bottom: 1rem;
                padding: 1rem 1.15rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(255,255,255,0.02);
            }
            .bosses-page .boss-item-modifier-copy {
                display: flex;
                flex-direction: column;
                gap: 0.2rem;
                min-width: 0;
            }
            .bosses-page .boss-item-modifier-copy strong {
                color: #fff;
                font-size: 0.95rem;
            }
            .bosses-page .boss-item-modifier-copy small {
                color: var(--text-muted);
                font-size: 0.72rem;
            }
            .bosses-page .boss-empty-menu-hint {
                color: #facc15 !important;
            }
            .bosses-page .boss-item-modifier-picker {
                min-width: 0;
            }
            .bosses-page .world-boss-effect-picker {
                position: relative;
                z-index: 25;
            }
            .bosses-page .world-boss-effect-trigger {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
                width: 100%;
                min-height: 44px;
                padding: 0.65rem 0.85rem;
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                background: rgba(0,0,0,0.32);
                color: #fff;
                font: inherit;
                text-align: left;
                cursor: pointer;
                transition: border-color 0.2s ease;
            }
            .bosses-page .world-boss-effect-trigger:hover,
            .bosses-page .world-boss-effect-picker.open .world-boss-effect-trigger,
            .bosses-page .world-boss-effect-trigger:focus-visible {
                border-color: rgba(56,189,248,0.45);
                outline: none;
            }
            .bosses-page .world-boss-effect-trigger span {
                display: flex;
                flex-direction: column;
                gap: 0.15rem;
                min-width: 0;
            }
            .bosses-page .world-boss-effect-trigger small {
                color: var(--text-muted);
                font-size: 0.65rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-weight: 800;
            }
            .bosses-page .world-boss-effect-trigger strong {
                font-size: 0.88rem;
                overflow-wrap: anywhere;
            }
            .bosses-page .world-boss-effect-trigger em {
                color: var(--text-muted);
                font-size: 0.7rem;
                font-style: normal;
            }
            .bosses-page .world-boss-effect-menu {
                position: absolute;
                top: calc(100% + 0.45rem);
                left: 0;
                right: 0;
                z-index: 60;
                display: grid;
                gap: 0.35rem;
                max-height: min(22rem, 60vh);
                overflow-y: auto;
                padding: 0.45rem;
                border: 1px solid rgba(56,189,248,0.34);
                border-radius: 8px;
                background: #07080d;
                box-shadow: 0 18px 50px rgba(0,0,0,0.48);
            }
            .bosses-page .world-boss-effect-picker.drop-up .world-boss-effect-menu {
                top: auto;
                bottom: calc(100% + 0.45rem);
            }
            .bosses-page .world-boss-effect-option {
                min-height: 44px;
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) minmax(5rem, auto) auto;
                align-items: center;
                gap: 0.6rem;
                border: 1px solid transparent;
                border-radius: 6px;
                background: transparent;
                color: var(--text-muted);
                padding: 0.5rem;
                text-align: left;
                cursor: pointer;
            }
            .bosses-page .world-boss-effect-option:hover,
            .bosses-page .world-boss-effect-option.active,
            .bosses-page .world-boss-effect-option:focus-visible {
                border-color: rgba(56,189,248,0.35);
                background: rgba(56,189,248,0.12);
                color: #fff;
                outline: none;
            }
            .bosses-page .world-boss-effect-option img,
            .bosses-page .world-boss-effect-icon-placeholder {
                width: 30px;
                height: 30px;
                border-radius: 6px;
                object-fit: cover;
                background: rgba(255,255,255,0.06);
            }
            .bosses-page .world-boss-effect-option span {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 0.16rem;
            }
            .bosses-page .world-boss-effect-option strong {
                color: inherit;
                overflow-wrap: anywhere;
            }
            .bosses-page .world-boss-effect-option small,
            .bosses-page .world-boss-effect-option em {
                color: var(--text-muted);
                font-size: 0.68rem;
                font-style: normal;
                line-height: 1.25;
            }
            .bosses-page .boss-name-cell {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                min-width: 0;
            }
            .bosses-page .boss-name-cell img,
            .bosses-page .boss-mobile-name img {
                width: 28px;
                height: 28px;
                border-radius: 6px;
                object-fit: cover;
                flex: 0 0 auto;
            }
            .bosses-page .boss-name-cell div {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .bosses-page .boss-name-cell span {
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-name-cell small {
                color: var(--text-muted);
                font-size: 0.7rem;
                margin-top: 0.2rem;
            }
            .bosses-page .boss-status-cell {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                align-items: flex-end;
                min-width: 9rem;
            }
            .bosses-page .boss-status-cell strong {
                color: #fff;
                font-size: 0.78rem;
            }
            .bosses-page .boss-status-cell small {
                color: var(--text-muted);
                font-size: 0.68rem;
            }
            .bosses-page .boss-results-status {
                margin: -0.25rem 0 0.75rem;
                color: var(--text-muted);
                font-size: 0.78rem;
                font-weight: 800;
            }
            .bosses-page .boss-ev-cell {
                display: inline-flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.2rem;
            }
            .bosses-page .boss-ev-cell em,
            .bosses-page .boss-mobile-review {
                width: fit-content;
                border-radius: 999px;
                padding: 0.12rem 0.42rem;
                color: #facc15;
                background: rgba(250,204,21,0.1);
                border: 1px solid rgba(250,204,21,0.22);
                font-size: 0.62rem;
                font-style: normal;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }
            .bosses-page .boss-phase,
            .bosses-page .boss-signal {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: fit-content;
                border-radius: 5px;
                padding: 0.25rem 0.45rem;
                font-size: 0.67rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                border: 1px solid var(--border-subtle);
                white-space: nowrap;
            }
            .bosses-page .phase-active {
                color: #86efac;
                background: rgba(34,197,94,0.12);
                border-color: rgba(34,197,94,0.28);
            }
            .bosses-page .phase-ready {
                color: #7dd3fc;
                background: rgba(56,189,248,0.12);
                border-color: rgba(56,189,248,0.28);
            }
            .bosses-page .phase-respawning,
            .bosses-page .phase-scheduled {
                color: #f8c56d;
                background: rgba(245,176,65,0.1);
                border-color: rgba(245,176,65,0.25);
            }
            .bosses-page .boss-signal-good {
                color: #86efac;
                background: rgba(34,197,94,0.12);
                border-color: rgba(34,197,94,0.28);
            }
            .bosses-page .boss-signal-neutral {
                color: #7dd3fc;
                background: rgba(56,189,248,0.1);
                border-color: rgba(56,189,248,0.22);
            }
            .bosses-page .boss-signal-warn {
                color: #facc15;
                background: rgba(250,204,21,0.1);
                border-color: rgba(250,204,21,0.24);
            }
            .bosses-page .boss-signal-bad {
                color: #fca5a5;
                background: rgba(239,68,68,0.1);
                border-color: rgba(239,68,68,0.24);
            }
            .bosses-page .boss-mobile-card {
                cursor: pointer;
                border-radius: 8px;
                box-shadow: none;
                transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
            }
            @media (hover: hover) and (pointer: fine) {
                .bosses-page .boss-mobile-card:hover {
                    transform: translateY(-1px);
                }
            }
            .bosses-page .boss-mobile-card .m-roi {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.25rem;
            }
            .bosses-page .boss-mobile-card:focus-visible,
            .bosses-page .boss-loot-row:focus-visible,
            .bosses-page tr.clickable-row:focus-visible {
                outline: 2px solid var(--text-accent);
                outline-offset: 2px;
            }
            .bosses-page .boss-mobile-name {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                min-width: 0;
            }
            .bosses-page .boss-modal {
                max-width: min(920px, calc(100vw - 2rem));
                max-height: min(90dvh, calc(100dvh - 2rem));
            }
            .bosses-page .boss-modal-title {
                display: flex;
                align-items: center;
                gap: 1rem;
                min-width: 0;
            }
            .bosses-page .boss-modal-title img {
                width: 48px;
                height: 48px;
                border-radius: 8px;
                object-fit: cover;
                flex: 0 0 auto;
            }
            .bosses-page .boss-modal-title h2 {
                margin: 0;
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-modal-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.45rem;
                margin-top: 0.5rem;
            }
            .bosses-page .boss-modal-tags span {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                background: rgba(255,255,255,0.03);
                padding: 3px 8px;
                border-radius: 5px;
                font-size: 0.75rem;
                color: var(--text-muted);
                border: 1px solid var(--border-subtle);
            }
            .bosses-page .boss-stat-grid {
                margin-bottom: 1rem;
            }
            .bosses-page .boss-stat-note {
                margin-top: 0.25rem;
                color: var(--text-muted);
                font-size: 0.72rem;
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-item-breakdown {
                display: flex;
                gap: 0.75rem;
                align-items: flex-start;
                margin-bottom: 1rem;
                padding: 0.85rem 1rem;
                border-radius: 8px;
                color: #7dd3fc;
                background: rgba(56,189,248,0.08);
                border: 1px solid rgba(56,189,248,0.18);
            }
            .bosses-page .boss-item-breakdown div {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 0.15rem;
            }
            .bosses-page .boss-item-breakdown strong {
                color: #fff;
                overflow-wrap: anywhere;
            }
            .bosses-page .boss-item-breakdown span {
                color: rgba(255,255,255,0.76);
                font-size: 0.82rem;
                line-height: 1.35;
            }
            .bosses-page .boss-warning-box {
                display: flex;
                gap: 0.75rem;
                align-items: flex-start;
                margin-bottom: 1rem;
                padding: 0.85rem 1rem;
                border-radius: 8px;
                color: #facc15;
                background: rgba(250, 204, 21, 0.08);
                border: 1px solid rgba(250, 204, 21, 0.18);
            }
            .bosses-page .boss-warning-box p {
                margin: 0 0 0.25rem;
                color: rgba(255,255,255,0.76);
                font-size: 0.82rem;
            }
            .bosses-page .upcoming-spawns-section {
                background: rgba(255,255,255,0.02);
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                padding: 1.25rem;
                margin-bottom: 1.5rem;
            }
            .bosses-page .section-title,
            .bosses-page .boss-loot-heading {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1rem;
                color: var(--text-accent);
                font-weight: 800;
                font-size: 0.95rem;
            }
            .bosses-page .boss-loot-heading {
                border-bottom: 1px solid var(--border-subtle);
                padding-bottom: 0.5rem;
                color: #fff;
            }
            .bosses-page .spawns-container {
                display: flex;
                gap: 0.75rem;
                overflow-x: auto;
                padding-bottom: 0.75rem;
            }
            .bosses-page .spawns-container::-webkit-scrollbar { height: 4px; }
            .bosses-page .spawns-container::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }
            .bosses-page .spawn-box {
                min-width: 118px;
                padding: 0.75rem;
                border-radius: 6px;
                border: 1px solid var(--border-subtle);
                background: rgba(255,255,255,0.01);
                text-align: center;
                flex-shrink: 0;
            }
            .bosses-page .spawn-box.active {
                background: rgba(56,189,248,0.05);
                border-color: rgba(56,189,248,0.2);
            }
            .bosses-page .spawn-day {
                font-size: 0.65rem;
                color: var(--text-muted);
                margin-bottom: 0.25rem;
                letter-spacing: 0.05em;
            }
            .bosses-page .spawn-time {
                font-size: 1.1rem;
                font-weight: 800;
                color: #fff;
                font-family: var(--font-sans);
            }
            .bosses-page .spawn-end {
                color: var(--text-muted);
                font-size: 0.7rem;
                margin-top: 0.2rem;
            }
            .bosses-page .spawn-box.active .spawn-time { color: var(--text-accent); }
            .bosses-page .boss-loot-list {
                display: flex;
                flex-direction: column;
                gap: 0.55rem;
            }
            .bosses-page .boss-loot-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.8rem 1rem;
                background: rgba(255,255,255,0.02);
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
            }
            .bosses-page .boss-loot-row:hover {
                transform: translateY(-1px);
                border-color: rgba(56,189,248,0.25);
                background: rgba(255,255,255,0.035);
            }
            .bosses-page .boss-loot-row:hover .loot-item-name { color: var(--text-accent); }
            .bosses-page .boss-loot-main {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                min-width: 0;
            }
            .bosses-page .boss-loot-main img {
                width: 34px;
                height: 34px;
                border-radius: 6px;
                object-fit: cover;
                flex: 0 0 auto;
            }
            .bosses-page .loot-item-name {
                font-weight: 800;
                color: #fff;
                font-size: 0.9rem;
                transition: color 0.2s ease;
                overflow-wrap: anywhere;
            }
            .bosses-page .loot-item-name span {
                color: var(--text-muted);
                font-size: 0.8rem;
                font-weight: 500;
            }
            .bosses-page .boss-drop-rate {
                display: flex;
                flex-wrap: wrap;
                gap: 0.45rem;
                margin-top: 0.25rem;
                font-size: 0.74rem;
                color: var(--text-accent);
            }
            .bosses-page .boss-drop-rate span {
                color: var(--text-muted);
            }
            .bosses-page .boss-loot-value {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.25rem;
                min-width: 9rem;
                text-align: right;
            }
            .bosses-page .boss-loot-value strong {
                color: var(--text-success);
                font-size: 0.9rem;
            }
            .bosses-page .boss-loot-value span {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                color: var(--text-muted);
                font-size: 0.7rem;
            }
            .bosses-page .close-btn {
                min-height: 44px;
                min-width: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes boss-rise {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @media (max-width: 900px) {
                .bosses-page .boss-radar {
                    grid-template-columns: 1fr;
                }
                .bosses-page .boss-routine-header {
                    grid-template-columns: 1fr;
                }
                .bosses-page .boss-routine-controls {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .bosses-page .routine-boss-picker {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .bosses-page .boss-radar-stats {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .bosses-page .boss-view-switch button {
                    grid-template-columns: auto minmax(0, 1fr);
                }
                .bosses-page .boss-view-switch small {
                    grid-column: 2 / -1;
                }
                .bosses-page .boss-controls {
                    grid-template-columns: 1fr;
                }
                .bosses-page .boss-item-modifier-panel {
                    grid-template-columns: 1fr;
                }
                .bosses-page .boss-mf-control,
                .bosses-page .boss-search-control {
                    min-width: 0;
                }
            }
            @media (max-width: 620px) {
                .bosses-page {
                    max-width: 100%;
                    width: 100%;
                }
                .bosses-page .boss-radar,
                .bosses-page .boss-routine-planner,
                .bosses-page .boss-item-modifier-panel {
                    padding: 1rem;
                }
                .bosses-page .boss-radar {
                    gap: 0.9rem;
                }
                .bosses-page .boss-view-switch {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 0.35rem;
                    margin-top: -0.25rem;
                }
                .bosses-page .boss-view-switch button {
                    min-height: 4.25rem;
                    padding: 0.62rem;
                }
                .bosses-page .boss-view-switch small {
                    font-size: 0.62rem;
                }
                .bosses-page .boss-routine-controls {
                    grid-template-columns: 1fr;
                }
                .bosses-page .boss-radar-stats,
                .bosses-page .boss-routine-summary {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.45rem;
                }
                .bosses-page .boss-radar-stats div,
                .bosses-page .boss-routine-summary div {
                    min-height: 4rem;
                    padding: 0.58rem 0.5rem;
                }
                .bosses-page .boss-radar-stats span,
                .bosses-page .boss-routine-summary span {
                    font-size: 0.56rem;
                    margin-bottom: 0.28rem;
                }
                .bosses-page .boss-radar-stats strong,
                .bosses-page .boss-routine-summary strong {
                    font-size: 0.86rem;
                }
                .bosses-page .boss-routine-summary {
                    padding: 0.35rem;
                    border: 1px solid rgba(74,222,128,0.14);
                    border-radius: 8px;
                    background: rgba(8, 13, 13, 0.94);
                }
                .bosses-page .boss-routine-summary div {
                    padding: 0.58rem 0.5rem;
                }
                .bosses-page .routine-boss-picker {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    max-height: 18rem;
                    overflow-y: auto;
                    padding: 0.1rem 0.15rem 0.3rem;
                }
                .bosses-page .routine-boss-picker button {
                    min-width: 0;
                    grid-template-columns: 24px minmax(0, 1fr);
                }
                .bosses-page .routine-leg {
                    grid-template-columns: 1.6rem minmax(0, 1fr);
                }
                .bosses-page .routine-leg-marker span {
                    width: 1.45rem;
                    height: 1.45rem;
                }
                .bosses-page .routine-leg-title {
                    align-items: flex-start;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .bosses-page .boss-modal {
                    max-width: calc(100vw - 1rem);
                }
                .bosses-page .boss-modal-title {
                    align-items: flex-start;
                }
                .bosses-page .boss-modal-tags {
                    gap: 0.35rem;
                }
                .bosses-page .boss-loot-row {
                    align-items: flex-start;
                    flex-direction: column;
                }
                .bosses-page .world-boss-effect-option {
                    grid-template-columns: auto minmax(0, 1fr) auto;
                }
                .bosses-page .world-boss-effect-menu {
                    max-height: min(18rem, 50vh);
                }
                .bosses-page .world-boss-effect-option em {
                    grid-column: 2 / -1;
                }
                .bosses-page .boss-mobile-card {
                    width: 100%;
                    max-width: 100%;
                    min-width: 0;
                }
                .bosses-page .boss-mobile-card .m-card-header {
                    gap: 0.75rem;
                    min-width: 0;
                }
                .bosses-page .boss-mobile-card .m-card-title,
                .bosses-page .boss-mobile-name {
                    min-width: 0;
                }
                .bosses-page .boss-mobile-card .m-name,
                .bosses-page .boss-mobile-card .m-lvl {
                    overflow-wrap: anywhere;
                }
                .bosses-page .mobile-card-grid {
                    padding-left: 0;
                    padding-right: 0;
                }
                .bosses-page .boss-loot-value {
                    width: 100%;
                    min-width: 0;
                    align-items: flex-start;
                    text-align: left;
                }
            }
            @media (max-width: 430px) {
                .bosses-page .routine-boss-picker {
                    grid-template-columns: 1fr;
                }
            }
            @media (prefers-reduced-motion: reduce) {
                .bosses-page .boss-radar,
                .bosses-page .boss-view-switch button,
                .bosses-page .boss-routine-planner,
                .bosses-page .routine-boss-picker button,
                .bosses-page .world-boss-effect-trigger,
                .bosses-page .world-boss-effect-option,
                .bosses-page .boss-sort-button,
                .bosses-page .boss-mobile-card,
                .bosses-page .boss-routine-summary div,
                .bosses-page .boss-loot-row {
                    animation: none;
                    transition: none;
                }
                .bosses-page .boss-mobile-card:hover,
                .bosses-page .boss-routine-summary div:hover,
                .bosses-page .routine-boss-picker button:hover,
                .bosses-page .boss-loot-row:hover {
                    transform: none;
                }
            }
        `}</style>
    );
}

export default BossStyles;
