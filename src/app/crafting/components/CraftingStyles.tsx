"use client";

export default function CraftingStyles() {
    return (
        <style jsx global>{`
            .crafting-page-shell {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                overflow-x: clip;
                padding-bottom: 5rem;
                -webkit-tap-highlight-color: transparent;
            }

            .crafting-page-shell :where(button, input, [role="button"]) {
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
            }

            .crafting-page-shell button {
                -webkit-appearance: none;
                appearance: none;
                font: inherit;
            }

            .crafting-page-shell .craft-hero {
                align-items: flex-start;
                border-bottom: 1px solid rgba(255,255,255,0.07);
                gap: 1rem;
                margin-bottom: 0;
                padding-bottom: 1.25rem;
            }

            .craft-hero-copy {
                min-width: 0;
            }

            .craft-eyebrow {
                color: var(--text-accent);
                font-size: 0.72rem;
                font-weight: 900;
                letter-spacing: 0.12em;
                margin-bottom: 0.45rem;
                text-transform: uppercase;
            }

            .crafting-page-shell .craft-title {
                font-size: clamp(2rem, 4vw, 2.75rem);
                font-weight: 950;
                letter-spacing: 0;
                line-height: 1.04;
                margin: 0;
                text-transform: none;
                text-wrap: balance;
            }

            .craft-subtitle {
                color: var(--text-muted);
                font-size: 0.94rem;
                line-height: 1.55;
                margin: 0.55rem 0 0;
                max-width: 680px;
            }

            .craft-context-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 0.45rem;
                margin-top: 0.85rem;
            }

            .craft-context-chips span,
            .craft-count-pill {
                background: rgba(255,255,255,0.035);
                border: 1px solid rgba(255,255,255,0.075);
                border-radius: 999px;
                color: rgba(255,255,255,0.78);
                font-size: 0.68rem;
                font-weight: 900;
                line-height: 1;
                max-width: min(100%, 24rem);
                min-width: 0;
                overflow: hidden;
                padding: 0.42rem 0.62rem;
                text-overflow: ellipsis;
                text-transform: uppercase;
                white-space: nowrap;
            }

            .crafting-page-shell .craft-count-pill {
                align-items: center;
                display: inline-flex;
                min-height: 36px;
            }

            .craft-summary-grid {
                display: grid;
                gap: 0.75rem;
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .craft-summary-card {
                background: var(--bg-card);
                border: 1px solid rgba(255,255,255,0.07);
                border-radius: 8px;
                min-height: 106px;
                overflow: hidden;
                padding: 1rem;
                position: relative;
            }

            .craft-summary-card::before,
            .craft-summary-card.warn::before,
            .craft-summary-card.negative::before {
                display: none;
            }

            .craft-summary-card span,
            .craft-panel-title,
            .craft-panel-title span {
                align-items: center;
                display: flex;
                gap: 0.45rem;
            }

            .craft-summary-card span,
            .craft-panel-title {
                color: var(--text-muted);
                font-size: 0.7rem;
                font-weight: 900;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .craft-summary-card strong {
                color: #fff;
                display: block;
                font-family: var(--font-mono);
                font-size: clamp(1.45rem, 2.4vw, 1.9rem);
                font-weight: 950;
                margin-top: 0.45rem;
                overflow-wrap: anywhere;
            }

            .craft-summary-card small {
                color: var(--text-muted);
                display: block;
                font-size: 0.74rem;
                line-height: 1.35;
                margin-top: 0.25rem;
            }

            .craft-summary-card.positive strong {
                color: var(--text-success);
            }

            .craft-summary-card.warn strong {
                color: #f8d586;
            }

            .craft-summary-card.negative strong {
                color: var(--text-danger);
            }

            .crafting-page-shell .main-craft-layout {
                align-items: start;
                display: grid;
                gap: 1rem;
                grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.85fr);
            }

            .craft-stack {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                min-width: 0;
            }

            .crafting-page-shell .craft-panel {
                background: var(--bg-panel);
                border: 1px solid rgba(255,255,255,0.075);
                border-radius: 8px;
                box-shadow: 0 10px 28px rgba(0,0,0,0.14);
                overflow: visible;
                padding: 1.1rem;
            }

            .craft-panel-title {
                justify-content: space-between;
                letter-spacing: 0;
                margin: 0 0 1rem;
                text-transform: none;
            }

            .craft-panel-title em {
                color: var(--text-muted);
                font-style: normal;
                font-weight: 800;
                letter-spacing: 0;
                text-transform: none;
                white-space: nowrap;
            }

            .crafting-page-shell .recipe-combobox-menu {
                animation: none;
                background: rgba(9,13,15,0.96);
                border-radius: 8px;
                box-shadow: 0 16px 40px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,255,255,0.025) inset;
            }

            .crafting-page-shell .recipe-combobox-shell {
                min-height: 48px;
            }

            .crafting-page-shell .recipe-option-row,
            .crafting-page-shell .craft-entry-row,
            .crafting-page-shell .source-row {
                transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
            }

            .crafting-page-shell .craft-add-button {
                background: var(--text-accent);
                box-shadow: 0 8px 20px rgba(245,176,65,0.12);
                color: #041015;
                min-height: 48px;
                transition: box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
            }

            .crafting-page-shell .craft-add-button:hover:not(:disabled) {
                box-shadow: 0 10px 26px rgba(245,176,65,0.18);
                transform: none;
            }

            .craft-selected-recipe {
                border-radius: 8px;
            }

            .craft-empty-state {
                align-items: center;
                background: rgba(255,255,255,0.018);
                border: 1px dashed color-mix(in srgb, var(--text-accent), transparent 72%);
                border-radius: 8px;
                color: var(--text-muted);
                display: flex;
                flex-direction: column;
                gap: 0.45rem;
                justify-content: center;
                min-height: 178px;
                padding: 1.6rem;
                text-align: center;
            }

            .craft-empty-state svg {
                color: var(--text-accent);
                opacity: 0.62;
            }

            .craft-empty-state strong {
                color: #fff;
                font-size: 1rem;
            }

            .craft-empty-state.compact {
                min-height: 120px;
            }

            .crafting-page-shell .craft-entry-row {
                background: rgba(255,255,255,0.022);
                border-radius: 8px;
            }

            .crafting-page-shell .craft-entry-row:hover,
            .crafting-page-shell .source-row:hover,
            .crafting-page-shell .source-row:focus-visible {
                transform: none;
            }

            .crafting-page-shell .craft-row-title {
                font-size: 0.95rem;
                font-weight: 850;
            }

            .crafting-page-shell .craft-row-controls {
                background: rgba(0,0,0,0.18);
                border: 1px solid rgba(255,255,255,0.055);
                border-radius: 8px;
                padding: 0.25rem;
            }

            .crafting-page-shell .queue-icon-button,
            .crafting-page-shell .queue-remove-button {
                border-radius: 8px;
                min-height: 44px;
                min-width: 44px;
                transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
            }

            .crafting-page-shell .queue-icon-button:hover,
            .crafting-page-shell .queue-remove-button:hover {
                border-color: color-mix(in srgb, var(--text-accent), transparent 66%);
                color: #fff;
            }

            .crafting-page-shell .queue-qty-input {
                border-radius: 8px;
                min-height: 44px;
                transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
                width: 58px;
            }

            .crafting-page-shell .queue-qty-input:focus {
                border-color: var(--text-accent);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 84%);
                outline: none;
            }

            .crafting-page-shell .craft-clear-button {
                border-radius: 8px;
                min-height: 44px;
                transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
            }

            .crafting-page-shell .recipe-combobox-clear {
                height: 44px;
                min-width: 44px;
                transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
                width: 44px;
            }

            .crafting-page-shell .craft-clear-button:hover {
                background: color-mix(in srgb, var(--text-danger), transparent 92%);
            }

            .crafting-page-shell .craft-finance-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .crafting-page-shell .stat-card {
                background: rgba(255,255,255,0.022);
                border-radius: 8px;
                min-width: 0;
            }

            .crafting-page-shell .stat-card:hover {
                border-color: color-mix(in srgb, var(--text-accent), transparent 74%);
            }

            .craft-warning-copy {
                align-items: flex-start;
                color: var(--text-muted);
                display: flex;
                gap: 0.75rem;
            }

            .craft-warning-copy > svg {
                flex: 0 0 auto;
                margin-top: 0.1rem;
            }

            .craft-warning-copy strong {
                color: var(--text-main);
            }

            .craft-need-list {
                display: flex;
                flex-direction: column;
                gap: 0.45rem;
            }

            .crafting-page-shell .source-row {
                border-radius: 8px;
                gap: 0.75rem;
                min-height: 52px;
            }

            .craft-need-name {
                color: #fff;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .craft-need-price {
                flex: 0 0 auto;
                text-align: right;
            }

            .craft-need-price .mono {
                font-size: 0.9rem;
                font-weight: 850;
            }

            .craft-need-subline {
                color: var(--text-muted);
                font-size: 0.7rem;
                line-height: 1.35;
            }

            .craft-need-footer {
                border-top: 1px solid var(--border-subtle);
                display: flex;
                font-weight: 700;
                justify-content: space-between;
                margin-top: 0.25rem;
                padding: 0.75rem;
            }

            .text-accent {
                color: var(--text-accent);
            }

            .text-danger {
                color: var(--text-danger);
            }

            .crafting-page-shell :where(.recipe-combobox-clear, .recipe-option-row, .craft-add-button, .craft-clear-button, .craft-undo-toast button, .craft-missing-chip-list button, .queue-icon-button, .queue-remove-button, .source-row, .craft-row-main, .queue-qty-input):focus-visible {
                border-color: var(--text-accent);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 82%);
                outline: none;
            }

            @media (max-width: 1200px) {
                .craft-summary-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .crafting-page-shell .main-craft-layout {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 760px) {
                .crafting-page-shell .craft-hero {
                    align-items: stretch;
                    flex-direction: column;
                }

                .crafting-page-shell .craft-count-pill {
                    justify-content: center;
                    width: 100%;
                }

                .crafting-page-shell .craft-picker {
                    align-items: stretch;
                    flex-direction: column;
                }

                .crafting-page-shell .craft-add-button {
                    width: 100%;
                }

                .crafting-page-shell .recipe-combobox-menu {
                    max-height: min(420px, 56vh);
                }

                .crafting-page-shell .craft-finance-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 520px) {
                .craft-summary-grid,
                .crafting-page-shell .craft-finance-grid {
                    grid-template-columns: 1fr;
                }

                .crafting-page-shell .craft-panel {
                    padding: 1rem;
                }

                .craft-panel-title {
                    align-items: flex-start;
                    flex-direction: column;
                    gap: 0.35rem;
                }

                .crafting-page-shell .craft-entry-row {
                    align-items: stretch;
                }

                .crafting-page-shell .craft-row-controls {
                    justify-content: space-between;
                }

                .crafting-page-shell .queue-qty-input {
                    flex: 1;
                    width: auto;
                }

                .crafting-page-shell .source-row {
                    align-items: flex-start;
                    flex-direction: column;
                }

                .craft-need-price {
                    text-align: left;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .crafting-page-shell *,
                .crafting-page-shell *::before,
                .crafting-page-shell *::after {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `}</style>
    );
}
