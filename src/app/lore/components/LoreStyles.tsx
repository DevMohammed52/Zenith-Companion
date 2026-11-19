"use client";

import React from "react";

export function LoreStyles() {
  return (
    <style jsx global>{`
        .lore-page {
          --panel: rgba(13, 13, 16, 0.78);
          --line: rgba(255,255,255,0.08);
          --soft: rgba(255,255,255,0.055);
          --lore-gold: rgba(245,176,65,0.74);
          --lore-cyan: rgba(56,189,248,0.62);
          box-sizing: border-box;
          max-width: 100%;
          min-height: calc(100vh - 40px);
          overflow-x: hidden;
          padding: 2rem;
          position: relative;
          background: var(--bg-base);
          color: #fff;
          -webkit-tap-highlight-color: transparent;
        }

        .lore-page button,
        .lore-page a,
        .lore-page summary {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .lore-shade {
          display: none;
        }

        .lore-page *,
        .lore-page *::before,
        .lore-page *::after {
          box-sizing: border-box;
        }

        .lore-hero,
        .lore-toolbar,
        .category-rail,
        .lore-section,
        .lore-view-viewport,
        .lore-empty {
          margin-inline: auto;
          max-width: 1240px;
          min-width: 0;
          position: relative;
          width: 100%;
          z-index: 5;
        }

        .lore-hero {
          padding: 3rem 0 2rem;
        }

        .lore-eyebrow {
          align-items: center;
          color: #f5b041;
          display: inline-flex;
          font-size: 0.78rem;
          font-weight: 900;
          gap: 0.5rem;
          letter-spacing: 0.16em;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .lore-hero h1 {
          font-size: clamp(3rem, 8vw, 7rem);
          letter-spacing: 0;
          line-height: 0.95;
          margin: 0;
          max-width: 920px;
        }

        .lore-hero p {
          color: rgba(255,255,255,0.66);
          font-size: clamp(1rem, 2vw, 1.35rem);
          line-height: 1.6;
          margin-top: 1rem;
          max-width: 740px;
        }

        .lore-hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .lore-hero-stats span {
          background: rgba(255,255,255,0.045);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: rgba(255,255,255,0.68);
          min-width: 0;
          overflow-wrap: anywhere;
          padding: 0.7rem 0.9rem;
          box-shadow: 0 16px 42px rgba(0,0,0,0.18);
        }

        .lore-hero-stats strong {
          color: #fff;
          font-family: var(--font-mono);
          margin-right: 0.35rem;
        }

        .lore-toolbar {
          align-items: center;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(240px, 1fr) auto;
          padding: 0.85rem;
          position: sticky;
          top: 0.75rem;
          z-index: 20;
          box-shadow: 0 10px 30px rgba(0,0,0,0.18);
        }

        .lore-search {
          align-items: center;
          background: rgba(0,0,0,0.32);
          border: 1px solid var(--line);
          border-radius: 7px;
          display: grid;
          gap: 0.65rem;
          grid-template-columns: auto minmax(0, 1fr) auto;
          min-width: 0;
          padding: 0 0.8rem;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .lore-search:focus-within {
          border-color: rgba(245,176,65,0.58);
          box-shadow: 0 0 0 3px rgba(245,176,65,0.16);
        }

        .lore-search input {
          background: transparent;
          border: 0;
          color: #fff;
          font: inherit;
          min-height: 44px;
          outline: 0;
          width: 100%;
        }

        .lore-search-clear {
          align-items: center;
          background: rgba(255,255,255,0.045);
          border: 0;
          border-radius: 7px;
          color: rgba(255,255,255,0.56);
          cursor: pointer;
          display: inline-flex;
          height: 2.75rem;
          justify-content: center;
          min-height: 2.75rem;
          min-width: 2.75rem;
          padding: 0;
          transition: color 0.16s ease, background 0.16s ease;
          width: 2.75rem;
        }

        .lore-search-clear:hover {
          background: rgba(255,255,255,0.09);
          color: #fff;
        }

        .lore-view-tabs,
        .category-rail,
        .confidence-tabs,
        .thread-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .lore-view-tabs button,
        .category-rail button,
        .confidence-tabs button,
        .thread-pills button,
        .board-center button,
        .lore-toolbar-status button {
          align-items: center;
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--line);
          border-radius: 7px;
          color: rgba(255,255,255,0.72);
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 800;
          gap: 0.45rem;
          min-height: 44px;
          min-width: 0;
          overflow: hidden;
          padding: 0.55rem 0.8rem;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }

        .lore-view-tabs button span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lore-view-tabs button:hover,
        .category-rail button:hover,
        .confidence-tabs button:hover,
        .thread-pills button:hover,
        .board-center button:hover,
        .lore-toolbar-status button:not(:disabled):hover {
          border-color: rgba(245,176,65,0.45);
          color: #fff;
        }

        .lore-view-tabs button:active,
        .category-rail button:active,
        .confidence-tabs button:active,
        .thread-pills button:active,
        .board-center button:active,
        .lore-toolbar-status button:not(:disabled):active {
          transform: none;
        }

        .lore-view-tabs button.active,
        .category-rail button.active,
        .confidence-tabs button.active {
          background: rgba(245,176,65,0.13);
          border-color: rgba(245,176,65,0.42);
          color: #fff;
        }

        .lore-toolbar-status {
          align-items: stretch;
          display: grid;
          gap: 0.65rem;
          grid-column: 1 / -1;
          grid-template-columns: repeat(3, minmax(120px, 1fr)) auto;
        }

        .lore-toolbar-status > div {
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 7px;
          display: grid;
          gap: 0.14rem;
          min-height: 2.55rem;
          min-width: 0;
          padding: 0.55rem 0.7rem;
        }

        .lore-toolbar-status span {
          align-items: center;
          color: rgba(255,255,255,0.48);
          display: inline-flex;
          font-size: 0.66rem;
          font-weight: 900;
          gap: 0.35rem;
          letter-spacing: 0.08em;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .lore-toolbar-status strong {
          color: #fff;
          font-size: 0.88rem;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lore-toolbar-status button {
          justify-content: center;
          min-height: 2.75rem;
        }

        .lore-toolbar-status button:disabled {
          color: rgba(255,255,255,0.34);
          cursor: not-allowed;
          background: rgba(255,255,255,0.018);
        }

        .category-rail {
          margin-top: 1rem;
        }

        .category-rail button {
          border-color: color-mix(in srgb, var(--tone, #f5b041), transparent 78%);
        }

        .category-rail button span {
          color: color-mix(in srgb, var(--tone, #f5b041), white 20%);
          font-family: var(--font-mono);
        }

        .lore-section {
          margin-top: 2rem;
          min-height: 380px;
        }

        .section-heading {
          align-items: end;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          gap: 1rem;
        }

        .section-heading h2 {
          font-size: clamp(1.4rem, 3vw, 2.1rem);
          margin: 0;
        }

        .section-heading p {
          color: rgba(255,255,255,0.55);
          margin: 0;
          max-width: 560px;
          text-align: right;
        }

        .atlas-grid,
        .compact-grid,
        .theory-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
        }

        .atlas-grid.tight {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .atlas-grid.npc-atlas {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }

        .lore-card,
        .compact-card,
        .theory-card,
        .timeline-item,
        .board-center,
        .thread-card,
        .empty-thread {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
        }

        .lore-card,
        .compact-card,
        .thread-card {
          appearance: none;
          border: 1px solid var(--line);
          cursor: pointer;
          font: inherit;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease;
          width: 100%;
        }

        .lore-card:hover,
        .compact-card:hover,
        .thread-card:hover {
          background: rgba(255,255,255,0.042);
          border-color: color-mix(in srgb, var(--tone, #f5b041), transparent 45%);
        }

        .lore-card:active,
        .compact-card:active,
        .thread-card:active {
          transform: none;
        }

        .lore-card {
          color: #fff;
          min-height: 260px;
          overflow: hidden;
          padding: 1.15rem;
          position: relative;
        }

        .lore-card::before {
          display: none;
        }

        .lore-card::after {
          content: "";
          display: none;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          position: absolute;
          transition: opacity 0.18s ease;
        }

        .lore-card:hover::after {
          opacity: 0;
        }

        .card-topline {
          align-items: center;
          color: color-mix(in srgb, var(--tone), white 10%);
          display: flex;
          font-size: 0.72rem;
          font-weight: 900;
          gap: 0.45rem;
          letter-spacing: 0.08em;
          margin-bottom: 0.85rem;
          text-transform: uppercase;
        }

        .lore-card h3,
        .compact-card h3,
        .theory-card h3,
        .timeline-item h3,
        .board-center h3 {
          font-size: 1.2rem;
          line-height: 1.2;
          margin: 0 0 0.6rem;
          overflow-wrap: anywhere;
        }

        .lore-card p,
        .compact-card p,
        .theory-card p,
        .timeline-item p,
        .board-center p {
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
          margin: 0;
        }

        .fact-list {
          display: grid;
          gap: 0.45rem;
          margin-top: 1rem;
        }

        .fact-list span {
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--line);
          border-radius: 6px;
          color: rgba(255,255,255,0.72);
          font-size: 0.76rem;
          line-height: 1.4;
          padding: 0.45rem 0.55rem;
        }

        .card-footer {
          align-items: center;
          color: rgba(255,255,255,0.42);
          display: flex;
          font-size: 0.78rem;
          justify-content: space-between;
          margin-top: 1rem;
        }

        .compact-card {
          color: #fff;
          padding: 0.95rem;
        }

        .compact-card .card-topline {
          margin-bottom: 0.6rem;
        }

        .npc-network-panel {
          background: rgba(255,255,255,0.018);
          border: 1px solid var(--line);
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow: hidden;
          padding: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.14);
        }

        .npc-network-header {
          align-items: flex-start;
          border-bottom: 1px solid var(--line);
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
        }

        .npc-network-header span {
          align-items: center;
          color: #fff;
          display: inline-flex;
          flex: 0 0 auto;
          font-weight: 900;
          gap: 0.45rem;
        }

        .npc-network-header p {
          color: rgba(255,255,255,0.58);
          line-height: 1.45;
          margin: 0;
          max-width: 640px;
          text-align: right;
        }

        .npc-network-grid {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .npc-region-card {
          background: rgba(0,0,0,0.2);
          border: 1px solid color-mix(in srgb, var(--tone), transparent 74%);
          border-radius: 8px;
          display: grid;
          gap: 0.85rem;
          min-width: 0;
          padding: 0.9rem;
        }

        .npc-region-head {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 0.7rem;
        }

        .npc-region-head span,
        .npc-region-head small {
          color: color-mix(in srgb, var(--tone), white 12%);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .npc-region-head h3 {
          color: #fff;
          font-size: 1rem;
          line-height: 1.2;
          margin: 0.25rem 0;
          overflow-wrap: anywhere;
        }

        .npc-chip-grid {
          display: grid;
          gap: 0.45rem;
          grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
        }

        .npc-chip-grid button {
          appearance: none;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          color: #fff;
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 0.1rem;
          min-width: 0;
          padding: 0.55rem 0.65rem;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease;
        }

        .npc-chip-grid button:hover {
          background: rgba(255,255,255,0.06);
          border-color: color-mix(in srgb, var(--tone), transparent 52%);
        }

        .npc-chip-grid strong {
          font-size: 0.82rem;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .npc-chip-grid em {
          color: rgba(255,255,255,0.46);
          font-size: 0.66rem;
          font-style: normal;
          font-weight: 800;
        }

        .timeline-list {
          display: grid;
          gap: 1rem;
        }

        .timeline-item {
          display: grid;
          gap: 1rem;
          grid-template-columns: 150px minmax(0, 1fr);
          padding: 1.2rem;
        }

        .timeline-era {
          color: #f5b041;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 900;
        }

        .thread-pills {
          margin-top: 1rem;
        }

        .board-controls {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .board-picker {
          max-width: min(100%, 520px);
          min-width: min(100%, 360px);
          position: relative;
          width: 100%;
          z-index: 20;
        }

        .board-picker-trigger {
          align-items: center;
          appearance: none;
          background: var(--bg-card);
          border: 1px solid rgba(245,176,65,0.22);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 0.75rem;
          grid-template-columns: auto minmax(0, 1fr) auto;
          min-height: 58px;
          padding: 0.7rem 0.85rem;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease;
          width: 100%;
        }

        .board-picker-trigger:hover {
          background: var(--bg-card);
          border-color: rgba(245,176,65,0.45);
        }

        .board-picker-trigger svg.open {
          transform: rotate(90deg);
        }

        .board-picker-mark {
          align-items: center;
          background: color-mix(in srgb, var(--tone), transparent 84%);
          border: 1px solid color-mix(in srgb, var(--tone), transparent 58%);
          border-radius: 8px;
          color: color-mix(in srgb, var(--tone), white 20%);
          display: inline-flex;
          height: 38px;
          justify-content: center;
          width: 38px;
        }

        .board-picker-copy {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }

        .board-picker-copy small {
          color: rgba(255,255,255,0.42);
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .board-picker-copy strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .board-picker-popover {
          background: rgba(9,9,11,0.98);
          border: 1px solid rgba(245,176,65,0.26);
          border-radius: 10px;
          box-shadow: 0 14px 42px rgba(0,0,0,0.34);
          display: grid;
          gap: 0.65rem;
          left: 0;
          margin-top: 0.5rem;
          overflow: hidden;
          padding: 0.65rem;
          position: absolute;
          right: 0;
          top: 100%;
          z-index: 35;
        }

        .board-search-note {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: rgba(255,255,255,0.62);
          line-height: 1.45;
          margin: 0 0 1rem;
          padding: 0.75rem 0.85rem;
        }

        .board-picker-search {
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.48);
          display: flex;
          gap: 0.5rem;
          padding: 0.6rem 0.75rem;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .board-picker-search:focus-within {
          border-color: rgba(245,176,65,0.42);
          box-shadow: 0 0 0 3px rgba(245,176,65,0.12);
        }

        .board-picker-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .board-picker-categories button {
          background: rgba(255,255,255,0.035);
          border: 1px solid color-mix(in srgb, var(--tone, #f5b041), transparent 82%);
          border-radius: 999px;
          color: rgba(255,255,255,0.66);
          cursor: pointer;
          font: inherit;
          font-size: 0.68rem;
          font-weight: 900;
          min-height: 2rem;
          padding: 0.25rem 0.6rem;
          transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
        }

        .board-picker-categories button:hover,
        .board-picker-categories button.active {
          background: color-mix(in srgb, var(--tone, #f5b041), transparent 88%);
          border-color: color-mix(in srgb, var(--tone, #f5b041), transparent 50%);
          color: #fff;
        }

        .board-picker-categories button:active,
        .board-option-list button:active,
        .board-node:active {
          transform: none;
        }

        .board-picker-search input {
          background: transparent;
          border: 0;
          color: #fff;
          font: inherit;
          min-width: 0;
          outline: 0;
          width: 100%;
        }

        .board-option-list {
          display: grid;
          gap: 0.35rem;
          max-height: 310px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .board-option-list button {
          align-items: center;
          appearance: none;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 0.2rem 0.55rem;
          grid-template-columns: auto minmax(0, 1fr);
          padding: 0.62rem 0.7rem;
          text-align: left;
          transition: border-color 0.16s ease, background 0.16s ease;
        }

        .board-option-list button:hover,
        .board-option-list button.active {
          background: color-mix(in srgb, var(--tone), transparent 92%);
          border-color: color-mix(in srgb, var(--tone), transparent 55%);
        }

        .board-option-list button.selected {
          box-shadow: inset 3px 0 0 color-mix(in srgb, var(--tone), white 8%);
        }

        .board-option-list button > span {
          color: color-mix(in srgb, var(--tone), white 18%);
          grid-row: span 2;
        }

        .board-option-list strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .board-option-list small {
          color: rgba(255,255,255,0.42);
          font-size: 0.66rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .board-picker-empty {
          color: rgba(255,255,255,0.5);
          font-size: 0.82rem;
          padding: 1rem;
          text-align: center;
        }

        @keyframes boardMenuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .mystery-board {
          align-items: start;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(250px, 0.75fr) minmax(270px, 0.9fr) minmax(0, 1.2fr);
        }

        .board-center {
          border-color: color-mix(in srgb, var(--tone), transparent 55%);
          padding: 1.2rem;
        }

        .board-center > span {
          color: color-mix(in srgb, var(--tone), white 10%);
          display: inline-flex;
          font-size: 0.72rem;
          font-weight: 900;
          gap: 0.45rem;
          letter-spacing: 0.08em;
          margin-bottom: 0.9rem;
          text-transform: uppercase;
        }

        .board-center button {
          margin-top: 1rem;
        }

        .board-stat-row {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 1rem;
        }

        .board-stat-row span {
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          color: rgba(255,255,255,0.6);
          font-size: 0.68rem;
          padding: 0.55rem;
          text-transform: uppercase;
        }

        .board-stat-row strong {
          color: #fff;
          display: block;
          font-size: 1rem;
          margin-bottom: 0.08rem;
        }

        .board-map {
          align-self: start;
          background: rgba(255,255,255,0.018);
          border: 1px solid var(--line);
          border-radius: 8px;
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          min-height: 0;
          overflow: hidden;
          padding: 1rem;
          position: relative;
        }

        .board-map::before,
        .board-map::after {
          border: 1px dashed rgba(245,176,65,0.22);
          border-radius: 999px;
          content: "";
          inset: 22%;
          pointer-events: none;
          display: none;
          position: absolute;
        }

        .board-map::after {
          inset: 8%;
          opacity: 0.45;
        }

        .board-map-core {
          align-items: center;
          background: rgba(5,5,6,0.84);
          border: 1px solid rgba(245,176,65,0.36);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          grid-column: 1 / -1;
          justify-self: center;
          max-width: min(100%, 280px);
          min-height: 0;
          padding: 1rem;
          position: relative;
          text-align: center;
          width: 100%;
          z-index: 2;
        }

        .board-map-core span,
        .board-node span {
          color: #f8d38d;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .board-map-core strong {
          color: #fff;
          font-size: 0.92rem;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .board-node {
          appearance: none;
          background: rgba(5,5,6,0.82);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 0.2rem;
          max-width: none;
          min-width: 0;
          padding: 0.55rem 0.65rem;
          position: relative;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease;
          width: 100%;
          z-index: 3;
        }

        .board-node:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(245,176,65,0.45);
        }

        .board-node strong {
          font-size: 0.72rem;
          line-height: 1.18;
          overflow-wrap: anywhere;
        }

        .board-node.canon span { color: #86efac; }
        .board-node.inferred span { color: #7dd3fc; }
        .board-node.theory span { color: #f8d38d; }

        .thread-list {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }

        .thread-card {
          color: #fff;
          display: grid;
          gap: 0.35rem;
          min-width: 0;
          padding: 0.9rem;
        }

        .thread-card small,
        .thread-card em {
          color: rgba(255,255,255,0.55);
          font-style: normal;
          line-height: 1.35;
        }

        .confidence,
        .spec-level {
          border-radius: 999px;
          display: inline-flex;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          padding: 0.2rem 0.55rem;
          text-transform: uppercase;
          width: max-content;
        }

        .confidence.canon,
        .level-low {
          background: rgba(74,222,128,0.11);
          color: #86efac;
        }

        .confidence.inferred,
        .level-medium {
          background: rgba(245,176,65,0.12);
          color: #facc15;
        }

        .confidence.theory,
        .level-high {
          background: rgba(248,113,113,0.13);
          color: #fca5a5;
        }

        .empty-thread,
        .lore-empty {
          align-items: center;
          color: rgba(255,255,255,0.55);
          display: flex;
          justify-content: center;
          min-height: 180px;
          padding: 1.5rem;
          text-align: center;
        }

        .theory-card {
          padding: 1.15rem;
        }

        .theory-evidence {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .theory-evidence strong {
          color: rgba(255,255,255,0.5);
          flex-basis: 100%;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .theory-evidence button {
          background: rgba(255,255,255,0.045);
          border: 1px solid var(--line);
          border-radius: 999px;
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 0.78rem;
          padding: 0.35rem 0.65rem;
          transition: border-color 0.18s ease, background 0.18s ease;
        }

        .theory-evidence button:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(245,176,65,0.38);
        }

        .theory-evidence button:active {
          transform: none;
        }

        .counterpoint {
          align-items: flex-start;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.16);
          border-radius: 7px;
          color: rgba(255,255,255,0.7);
          display: flex;
          gap: 0.5rem;
          line-height: 1.45;
          margin-top: 1rem;
          padding: 0.7rem;
        }

        .lore-empty {
          border: 1px solid var(--line);
          border-radius: 8px;
          flex-direction: column;
          margin-top: 2rem;
        }

        .lore-search-clear:focus-visible,
        .lore-view-tabs button:focus-visible,
        .category-rail button:focus-visible,
        .confidence-tabs button:focus-visible,
        .thread-pills button:focus-visible,
        .board-center button:focus-visible,
        .lore-toolbar-status button:focus-visible,
        .lore-card:focus-visible,
        .compact-card:focus-visible,
        .thread-card:focus-visible,
        .npc-chip-grid button:focus-visible,
        .board-picker-trigger:focus-visible,
        .board-picker-categories button:focus-visible,
        .board-option-list button:focus-visible,
        .board-node:focus-visible,
        .theory-evidence button:focus-visible {
          outline: 2px solid rgba(245,176,65,0.78);
          outline-offset: 2px;
        }

        @keyframes loreRise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 960px) {
          .lore-toolbar,
          .mystery-board,
          .timeline-item {
            grid-template-columns: 1fr;
          }

          .lore-toolbar {
            position: relative;
            top: auto;
          }

          .lore-toolbar-status {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lore-toolbar-status button {
            grid-column: 1 / -1;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .section-heading p {
            text-align: left;
          }

          .npc-network-header {
            flex-direction: column;
          }

          .npc-network-header p {
            text-align: left;
          }

          .board-controls {
            align-items: stretch;
            flex-direction: column;
          }

          .board-picker {
            max-width: 100%;
            min-width: 0;
          }
        }

        @media (max-width: 560px) {
          .lore-page {
            max-width: 100vw;
            padding: 1rem;
            width: 100vw;
          }

          .lore-hero,
          .lore-toolbar,
          .category-rail,
          .lore-section,
          .lore-empty {
            margin-inline: 0;
            max-width: 100%;
            width: 100%;
          }

          .lore-hero {
            padding-top: 1.5rem;
          }

          .lore-hero-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lore-view-tabs {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lore-toolbar-status {
            grid-template-columns: 1fr;
          }

          .lore-view-tabs button,
          .category-rail button {
            justify-content: center;
            width: 100%;
          }

          .lore-search {
            gap: 0.45rem;
            padding-inline: 0.65rem;
          }

          .board-picker-trigger {
            min-height: 54px;
          }

          .board-picker-copy strong,
          .board-option-list strong {
            white-space: normal;
          }

          .board-picker-popover {
            position: fixed;
            inset: auto 1rem 1rem 1rem;
            max-height: min(72dvh, 560px);
            overflow: auto;
          }

          .board-picker-categories {
            max-height: 5.6rem;
            overflow-y: auto;
            padding-right: 0.15rem;
          }

          .board-option-list {
            max-height: calc(min(72dvh, 560px) - 150px);
          }

          .board-map {
            grid-template-columns: 1fr;
          }

          .category-rail {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .atlas-grid,
          .atlas-grid.tight,
          .compact-grid,
          .theory-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lore-hero,
          .lore-toolbar,
          .category-rail,
          .lore-section,
          .board-picker-popover {
            animation: none;
          }

          .lore-search,
          .lore-search-clear,
          .lore-view-tabs button,
          .category-rail button,
          .confidence-tabs button,
          .thread-pills button,
          .board-center button,
          .lore-toolbar-status button,
          .lore-card,
          .compact-card,
          .thread-card,
          .lore-card::after,
          .npc-chip-grid button,
          .board-picker-trigger,
          .board-picker-search,
          .board-picker-categories button,
          .board-option-list button,
          .board-node,
          .theory-evidence button {
            transition: none;
          }

          .lore-view-tabs button:hover,
          .category-rail button:hover,
          .confidence-tabs button:hover,
          .thread-pills button:hover,
          .board-center button:hover,
          .lore-toolbar-status button:not(:disabled):hover,
          .lore-card:hover,
          .compact-card:hover,
          .thread-card:hover,
          .npc-chip-grid button:hover,
          .board-picker-trigger:hover,
          .board-option-list button:hover,
          .board-node:hover {
            transform: none;
          }
        }
    `}</style>
  );
}
