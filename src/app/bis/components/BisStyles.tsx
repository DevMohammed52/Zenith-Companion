"use client";

import React from "react";

export function BisStyles() {
  return (
    <style jsx global>{`
        .bis-page {
          max-width: 1680px;
        }
        .eyebrow,
        .panel-title,
        .slot-line {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }
        .eyebrow {
          color: var(--text-accent);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
        }
        .hero-copy {
          color: var(--text-muted);
          margin-top: -0.25rem;
          max-width: 760px;
        }
        .hero-stat {
          min-width: 210px;
          padding: 1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
        }
        .hero-stat span,
        .hero-stat strong {
          display: block;
        }
        .hero-stat span {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .hero-stat strong {
          color: var(--text-primary);
          font-size: 1.35rem;
          margin-top: 0.35rem;
        }
        .bis-toolbar,
        .level-strip,
        .recommendation-panel,
        .gear-list-panel,
        .compare-panel {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(15, 15, 18, 0.78);
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.14);
        }
        .bis-toolbar {
          display: grid;
          grid-template-columns: minmax(260px, 1.15fr) minmax(250px, 1fr) minmax(250px, 1fr);
          gap: 0.85rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .search-field,
        .tier-control,
        .level-strip label,
        .tier-stepper {
          display: grid;
          gap: 0.45rem;
          min-width: 0;
        }
        .search-field > span,
        .tier-control > span,
        .tier-stepper > span,
        .level-strip span,
        .control-group > span {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .search-wrap {
          position: relative;
        }
        .search-wrap svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-wrap input,
        .level-strip input,
        .tier-control input,
        .tier-stepper input {
          width: 100%;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.42);
          color: var(--text-primary);
          font: inherit;
          font-weight: 700;
          min-height: 46px;
        }
        .search-wrap input {
          padding: 0.75rem 0.9rem 0.75rem 2.45rem;
        }
        .level-strip input {
          padding: 0.7rem 0.8rem;
        }
        .control-group {
          min-width: 0;
          display: grid;
          gap: 0.45rem;
        }
        .control-group > div {
          min-width: 0;
        }
        .control-group div,
        .tier-control div,
        .tier-stepper div,
        .chip-scroll,
        .sort-row,
        .action-row {
          display: flex;
          gap: 0.45rem;
        }
        .bis-page button {
          min-height: 44px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
          color: var(--text-muted);
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
        }
        .bis-page button:hover:not(:disabled) {
          border-color: rgba(168, 139, 250, 0.55);
          color: var(--text-primary);
        }
        .bis-page button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .control-group button,
        .sort-row button,
        .chip-scroll button,
        .toggle,
        .direction {
          padding: 0.55rem 0.75rem;
          white-space: nowrap;
        }
        .control-group button {
          flex: 1 0 max-content;
          min-width: max-content;
        }
        .bis-page button.is-active,
        .toggle.is-active {
          color: #fff;
          border-color: rgba(168, 139, 250, 0.75);
          background: rgba(139, 92, 246, 0.34);
        }
        .tier-control div {
          align-items: center;
        }
        .tier-stepper div {
          align-items: center;
        }
        .tier-control button {
          width: 44px;
          flex: 0 0 auto;
        }
        .tier-stepper button {
          width: 44px;
          flex: 0 0 auto;
        }
        .tier-control input {
          text-align: center;
          padding: 0.65rem 0.2rem;
        }
        .tier-stepper input {
          text-align: center;
          padding: 0.65rem 0.2rem;
        }
        .tier-stepper small {
          color: var(--text-muted);
          font-size: 0.72rem;
        }
        .level-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.85rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .recommendation-panel {
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .panel-title {
          width: 100%;
          justify-content: space-between;
          color: var(--text-primary);
          font-weight: 900;
          margin-bottom: 0.85rem;
        }
        .panel-title span {
          color: var(--text-accent);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
        }
        .ranking-note {
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 700;
          line-height: 1.45;
          margin: -0.25rem 0 0.85rem;
        }
        .list-note {
          margin: 0 0 0.75rem;
        }
        .recommendation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 0.65rem;
        }
        .pick-card {
          text-align: left;
          padding: 0.85rem;
        }
        .pick-card strong,
        .pick-card small {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pick-card strong {
          color: var(--text-primary);
          margin: 0.45rem 0 0.15rem;
        }
        .pick-card small,
        .slot-line {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .bis-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.75fr);
          gap: 1rem;
          align-items: start;
        }
        .gear-list-panel,
        .compare-panel {
          padding: 1rem;
          min-width: 0;
        }
        .filter-row,
        .sort-row {
          display: flex;
          gap: 0.55rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .chip-scroll-shell {
          flex: 1;
          min-width: 0;
          position: relative;
        }
        .chip-scroll-shell:before,
        .chip-scroll-shell:after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0.15rem;
          width: 1.6rem;
          pointer-events: none;
          z-index: 1;
        }
        .chip-scroll-shell:before,
        .chip-scroll-shell:after {
          display: none;
        }
        .chip-scroll {
          align-items: center;
          overflow-x: auto;
          scrollbar-width: thin;
          padding: 0 1.9rem 0.15rem 0.15rem;
          min-width: 0;
          scroll-padding-inline: 1.8rem;
        }
        .chip-scroll button {
          flex: 0 0 auto;
          min-width: max-content;
        }
        .toggle,
        .direction {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          flex: 0 0 auto;
        }
        .selection-hint {
          display: none;
          margin-bottom: 0.75rem;
          padding: 0.75rem 0.85rem;
          border: 1px solid rgba(34, 211, 238, 0.35);
          border-radius: 8px;
          background: rgba(8, 145, 178, 0.14);
          color: var(--text-primary);
          font-weight: 800;
        }
        .sort-row {
          flex-wrap: wrap;
        }
        .gear-list {
          display: grid;
          gap: 0.55rem;
          max-height: 860px;
          overflow: auto;
          padding-right: 0.2rem;
        }
        .gear-list-more {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.8rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.72rem 0.85rem;
          background: rgba(255, 255, 255, 0.035);
          color: var(--text-muted);
          font-size: 0.86rem;
          font-weight: 800;
        }
        .gear-list-more span {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .gear-list-more button {
          flex: 0 0 auto;
        }
        .gear-row {
          display: grid;
          grid-template-columns: 54px minmax(0, 1fr) minmax(88px, 0.25fr) 82px;
          gap: 0.8rem;
          align-items: center;
          width: 100%;
          padding: 0.7rem;
          text-align: left;
        }
        .gear-row.is-selected {
          border-color: rgba(34, 211, 238, 0.75);
          background: rgba(8, 145, 178, 0.14);
        }
        .gear-row img,
        .compare-head img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
        }
        .gear-main,
        .gear-meta {
          display: grid;
          gap: 0.18rem;
          min-width: 0;
        }
        .gear-main strong,
        .gear-main small,
        .gear-meta strong,
        .gear-meta small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .gear-main strong {
          color: var(--text-primary);
        }
        .gear-main small,
        .gear-meta small {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .gear-meta {
          text-align: right;
        }
        .gear-meta strong {
          color: var(--text-accent);
        }
        .status {
          justify-self: end;
          padding: 0.28rem 0.48rem;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 900;
        }
        .status.ok {
          color: #34d399;
          background: rgba(16, 185, 129, 0.13);
          border: 1px solid rgba(16, 185, 129, 0.28);
        }
        .status.locked {
          color: #fb7185;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.28);
        }
        .compare-panel {
          position: sticky;
          top: 1rem;
          scroll-margin-top: 6rem;
        }
        .compare-head {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .compare-head h2 {
          color: var(--text-primary);
          margin: 0.1rem 0;
          font-size: 1.35rem;
        }
        .compare-head span,
        .compare-head p,
        .current-box span,
        .current-box small {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 800;
        }
        .compare-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.65rem;
          margin: 1rem 0;
        }
        .compare-stats.compact {
          grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        }
        .tier-compare-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .compare-empty-chip {
          display: grid;
          gap: 0.3rem;
          min-width: 0;
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          padding: 0.75rem;
        }
        .compare-empty-chip span {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .compare-empty-chip strong {
          color: var(--text-primary);
        }
        .compare-empty-chip small {
          color: var(--text-muted);
          font-size: 0.75rem;
          line-height: 1.35;
        }
        .metric,
        .current-box,
        .notice,
        .delta-list div,
        .stat-pills span {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
        }
        .metric {
          padding: 0.75rem;
          display: grid;
          gap: 0.35rem;
          min-width: 0;
          align-content: start;
        }
        .metric span {
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .metric span svg {
          flex: 0 0 auto;
        }
        .metric strong,
        .current-box strong {
          color: var(--text-primary);
          min-width: 0;
          overflow-wrap: anywhere;
          line-height: 1.2;
        }
        .notice {
          padding: 0.8rem;
          margin-bottom: 1rem;
        }
        .notice.danger {
          color: #fecdd3;
          border-color: rgba(244, 63, 94, 0.35);
          background: rgba(244, 63, 94, 0.1);
        }
        .current-box {
          display: grid;
          gap: 0.25rem;
          padding: 0.85rem;
          margin-bottom: 0.85rem;
        }
        .delta-list {
          display: grid;
          gap: 0.45rem;
          margin-bottom: 0.85rem;
        }
        .delta-list div {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.6rem 0.75rem;
        }
        .delta-list span {
          color: var(--text-muted);
        }
        .stat-compare-table {
          display: grid;
          gap: 0.35rem;
          margin-bottom: 1rem;
          min-width: 0;
        }
        .stat-compare-table > div {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(56px, 74px) minmax(56px, 74px) minmax(56px, 74px);
          gap: 0.55rem;
          align-items: center;
          padding: 0.58rem 0.65rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
          min-width: 0;
        }
        .stat-compare-table .stat-compare-head {
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .stat-compare-table strong {
          text-align: right;
          color: var(--text-primary);
        }
        .stat-compare-table span {
          color: var(--text-muted);
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .stat-compare-table strong {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .positive {
          color: #34d399;
        }
        .negative {
          color: #fb7185;
        }
        .stat-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-bottom: 1rem;
        }
        .stat-pills span {
          color: var(--text-muted);
          padding: 0.45rem 0.6rem;
          font-size: 0.8rem;
        }
        .stat-pills strong {
          color: var(--text-primary);
        }
        .action-row {
          flex-wrap: wrap;
        }
        .action-row button {
          flex: 1 1 150px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 0.75rem;
          color: var(--text-primary);
        }
        .empty-state {
          padding: 1rem;
          color: var(--text-muted);
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          text-align: center;
        }
        .empty-state strong,
        .empty-state span {
          display: block;
        }
        .empty-state strong {
          color: var(--text-primary);
          margin-bottom: 0.3rem;
        }
        .empty-state span {
          line-height: 1.45;
        }
        @media (max-width: 1500px) {
          .bis-toolbar {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 1180px) {
          .bis-toolbar {
            grid-template-columns: 1fr;
          }
          .bis-layout {
            grid-template-columns: 1fr;
          }
          .compare-panel {
            position: static;
          }
        }
        @media (max-width: 1180px) {
          .selection-hint {
            display: block;
          }
        }
        @media (max-width: 760px) {
          .header {
            align-items: stretch;
          }
          .hero-stat {
            width: 100%;
          }
          .bis-toolbar,
          .level-strip {
            grid-template-columns: 1fr;
          }
          .control-group div {
            overflow-x: auto;
            padding-bottom: 0.1rem;
          }
          .recommendation-grid {
            grid-template-columns: 1fr;
          }
          .filter-row {
            align-items: stretch;
            flex-direction: column;
          }
          .chip-scroll-shell {
            width: 100%;
          }
          .gear-row {
            grid-template-columns: 46px minmax(0, 1fr) auto;
          }
          .gear-list-more {
            align-items: stretch;
            flex-direction: column;
          }
          .gear-list-more button {
            width: 100%;
          }
          .gear-row img {
            width: 42px;
            height: 42px;
          }
          .gear-meta {
            grid-column: 2 / 3;
            text-align: left;
          }
          .status {
            grid-column: 3 / 4;
            grid-row: 1 / 3;
            align-self: center;
          }
          .compare-stats {
            grid-template-columns: 1fr;
          }
          .compare-stats.compact,
          .tier-compare-grid {
            grid-template-columns: 1fr;
          }
          .stat-compare-table > div {
            grid-template-columns: minmax(0, 1fr) minmax(48px, 58px) minmax(48px, 58px) minmax(48px, 58px);
            gap: 0.4rem;
            font-size: 0.8rem;
          }
        }
        .bis-page {
          --bis-gold: #f5b041;
          --bis-mint: #34d399;
          --bis-sky: #38bdf8;
          --bis-rose: #fb7185;
          --bis-panel: rgba(9, 13, 18, 0.78);
          -webkit-tap-highlight-color: transparent;
          padding-bottom: clamp(5rem, 7vh, 7rem);
        }
        .bis-page :where(button, input, [role="button"]) {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .bis-page .bis-hero {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 370px);
          gap: clamp(1rem, 2vw, 1.5rem);
          align-items: stretch;
          border: 1px solid rgba(56, 189, 248, 0.18);
          border-radius: 8px;
          background: var(--bg-panel);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.2);
          margin-bottom: 1rem;
          padding: clamp(1rem, 2.2vw, 1.45rem);
        }
        .bis-page .bis-hero > * {
          position: relative;
          z-index: 1;
        }
        .bis-page .bis-hero-copy {
          min-width: 0;
          display: grid;
          gap: 0.78rem;
          align-content: start;
        }
        .bis-page .bis-hero-copy .eyebrow,
        .bis-page .bis-hero-copy .hero-copy {
          margin: 0;
        }
        .bis-page .bis-hero-copy .hero-copy {
          max-width: 72ch;
          line-height: 1.62;
        }
        .bis-page .bis-hero-chips,
        .bis-page .bis-quick-actions,
        .bis-page .recommendation-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-width: 0;
        }
        .bis-page .bis-hero-chips span,
        .bis-page .recommendation-summary span {
          min-height: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          max-width: 100%;
          border: 1px solid rgba(56, 189, 248, 0.22);
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.08);
          color: #bae6fd;
          font-size: 0.74rem;
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1.15;
          padding: 0.45rem 0.72rem;
        }
        .bis-page .bis-hero-chips span:first-child,
        .bis-page .recommendation-summary span:first-child {
          border-color: rgba(52, 211, 153, 0.24);
          background: rgba(52, 211, 153, 0.09);
          color: #bbf7d0;
        }
        .bis-page .bis-hero-chips svg,
        .bis-page .recommendation-summary svg {
          flex: 0 0 auto;
          color: var(--bis-gold);
        }
        .bis-page .bis-quick-actions {
          margin-top: 0.08rem;
        }
        .bis-page .bis-quick-actions button {
          min-height: 2.45rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-color: rgba(245, 176, 65, 0.22);
          background: rgba(245, 176, 65, 0.08);
          color: #fde68a;
          padding: 0.62rem 0.86rem;
        }
        .bis-page .hero-stat {
          display: grid;
          gap: 0.78rem;
          border-color: rgba(56, 189, 248, 0.22);
          background: var(--bg-card);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 12px 30px rgba(0, 0, 0, 0.16);
        }
        .bis-page .hero-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.5rem;
        }
        .bis-page .hero-stat-grid span {
          min-width: 0;
          display: grid;
          gap: 0.18rem;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.045);
          padding: 0.55rem;
        }
        .bis-page .hero-stat-grid small,
        .bis-page .hero-stat-grid b {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bis-page .hero-stat-grid small {
          color: var(--text-muted);
          font-size: 0.66rem;
          font-weight: 850;
          letter-spacing: 0;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .bis-page .hero-stat-grid b {
          color: var(--text-primary);
          font-size: 0.84rem;
          line-height: 1.15;
          overflow-wrap: anywhere;
          white-space: normal;
        }
        .bis-page .bis-toolbar,
        .bis-page .level-strip,
        .bis-page .recommendation-panel,
        .bis-page .gear-list-panel,
        .bis-page .compare-panel {
          background: var(--bis-panel);
        }
        .bis-page .recommendation-summary {
          margin: -0.2rem 0 0.85rem;
        }
        .bis-page .list-command-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
          border: 1px solid rgba(56, 189, 248, 0.16);
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.055);
          padding: 0.72rem 0.8rem;
        }
        .bis-page .list-command-strip div {
          min-width: 0;
          display: grid;
          gap: 0.18rem;
        }
        .bis-page .list-command-strip span {
          color: var(--text-muted);
          font-size: 0.74rem;
          font-weight: 850;
          line-height: 1.25;
        }
        .bis-page .list-command-strip strong {
          color: var(--text-primary);
          line-height: 1.2;
        }
        .bis-page .list-command-strip > span {
          flex: 0 1 auto;
          text-align: right;
        }
        .bis-page .compare-result-strip {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.25rem 0.7rem;
          align-items: center;
          margin: -0.1rem 0 0.9rem;
          border: 1px solid rgba(56, 189, 248, 0.18);
          border-radius: 8px;
          background: rgba(56, 189, 248, 0.07);
          padding: 0.82rem;
        }
        .bis-page .compare-result-strip span,
        .bis-page .compare-result-strip small {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 850;
          line-height: 1.3;
        }
        .bis-page .compare-result-strip strong {
          color: var(--text-primary);
          font-size: 1.05rem;
          line-height: 1.15;
        }
        .bis-page .compare-result-strip small {
          grid-column: 1 / -1;
        }
        .bis-page .compare-result-strip.positive {
          border-color: rgba(52, 211, 153, 0.26);
          background: rgba(52, 211, 153, 0.08);
        }
        .bis-page .compare-result-strip.positive strong {
          color: var(--bis-mint);
        }
        .bis-page .compare-result-strip.negative {
          border-color: rgba(251, 113, 133, 0.28);
          background: rgba(251, 113, 133, 0.08);
        }
        .bis-page .compare-result-strip.negative strong {
          color: var(--bis-rose);
        }
        .bis-page .compare-result-strip.neutral strong {
          color: var(--bis-gold);
        }
        .bis-page .bis-toolbar,
        .bis-page .level-strip,
        .bis-page .recommendation-panel,
        .bis-page .gear-list-panel,
        .bis-page .compare-panel,
        .bis-page .pick-card,
        .bis-page .gear-row,
        .bis-page button {
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            color 180ms ease;
        }
        .bis-page .bis-quick-actions button:hover:not(:disabled) {
          border-color: rgba(56, 189, 248, 0.38);
          background: rgba(56, 189, 248, 0.1);
          color: #e0f2fe;
        }
        .bis-page .gear-row.is-selected {
          box-shadow: inset 3px 0 0 var(--bis-sky);
        }
        .bis-page .gear-row img,
        .bis-page .compare-head img {
          image-rendering: auto;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .bis-page .bis-quick-actions button:focus-visible,
        .bis-page button:focus-visible,
        .bis-page input:focus-visible,
        .bis-page .gear-row:focus-visible,
        .bis-page .pick-card:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--bis-sky), white 12%);
          outline-offset: 3px;
          box-shadow: 0 0 0 5px rgba(56, 189, 248, 0.11);
        }
        @media (hover: hover) and (pointer: fine) {
          .bis-page .pick-card:hover:not(:disabled),
          .bis-page .gear-row:hover {
            border-color: rgba(245, 176, 65, 0.22);
            background-color: rgba(245, 176, 65, 0.055);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bis-page *,
          .bis-page *::before,
          .bis-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
        @media (max-width: 1180px) {
          .bis-page .bis-hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .bis-page .hero-stat-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .bis-page {
            padding-bottom: 9rem;
          }
          .bis-page .bis-hero {
            margin-left: -0.15rem;
            margin-right: -0.15rem;
            padding: 1rem;
          }
          .bis-page .bis-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .bis-page .bis-quick-actions button {
            min-width: 0;
            padding-inline: 0.55rem;
          }
          .bis-page .hero-stat-grid,
          .bis-page .list-command-strip {
            grid-template-columns: minmax(0, 1fr);
          }
          .bis-page .list-command-strip {
            display: grid;
          }
          .bis-page .list-command-strip > span {
            text-align: left;
          }
          .bis-page .bis-hero-chips span,
          .bis-page .recommendation-summary span {
            width: 100%;
          }
        }
      `}</style>
  );
}
