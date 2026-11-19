'use client';

import React from 'react';

export function ItemsStyles() {
  return (
    <style jsx global>{`
      .items-db-page {
        padding-bottom: 4rem;
        overflow-x: hidden;
      }
      .items-db-page .db-summary {
        animation: itemSurfaceIn 0.34s ease-out both;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin-bottom: 0.7rem;
      }
      .items-db-page .db-summary div {
        background: rgba(255, 255, 255, 0.018);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        min-height: 70px;
        padding: 0.68rem 0.8rem;
      }
      .items-db-page .db-summary:focus-visible {
        border-radius: 10px;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 82%);
        outline: none;
      }
      .items-db-page .summary-label {
        color: var(--text-muted);
        display: block;
        font-size: 0.68rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .items-db-page .db-summary strong {
        color: var(--text-main);
        display: block;
        font-family: var(--font-mono);
        font-size: 1.12rem;
        margin-top: 0.25rem;
      }
      .items-db-page .item-help {
        animation: itemSurfaceIn 0.34s 0.04s ease-out both;
        background: color-mix(in srgb, var(--text-accent), transparent 95%);
        border: 1px solid color-mix(in srgb, var(--text-accent), transparent 82%);
        border-radius: 8px;
        color: var(--text-muted);
        margin: 0 0 0.7rem;
      }
      .items-db-page .item-help summary {
        align-items: center;
        cursor: pointer;
        display: flex;
        gap: 0.5rem;
        font-size: 0.8rem;
        font-weight: 900;
        letter-spacing: 0.04em;
        list-style: none;
        min-height: 44px;
        padding: 0.58rem 0.75rem;
        text-transform: uppercase;
      }
      .items-db-page .item-help summary::-webkit-details-marker {
        display: none;
      }
      .items-db-page .item-help summary svg {
        color: var(--text-accent);
        flex: 0 0 auto;
      }
      .items-db-page .item-help-body {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        padding: 0 0.75rem 0.7rem;
      }
      .items-db-page .item-help-body span {
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid var(--border-subtle);
        border-radius: 999px;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 700;
        line-height: 1.25;
        padding: 0.38rem 0.58rem;
      }
      .items-db-page .item-help-body strong {
        color: var(--text-main);
        font-weight: 900;
      }
      .items-db-page .db-controls {
        align-items: end;
        animation: itemSurfaceIn 0.34s 0.08s ease-out both;
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        display: grid;
        gap: 0.65rem;
        grid-template-columns:
          minmax(190px, 1fr)
          minmax(190px, 1fr)
          minmax(150px, 0.85fr)
          minmax(96px, 0.45fr)
          minmax(126px, 0.55fr);
        grid-template-areas:
          "search search sort direction view"
          "filters filters filters filters market";
        max-width: 100%;
        min-width: 0;
        padding: 0.75rem;
        position: relative;
        z-index: 30;
      }
      .items-db-page .search-control { grid-area: search; }
      .items-db-page .sort-control { grid-area: sort; }
      .items-db-page .sort-direction-toggle { grid-area: direction; }
      .items-db-page .market-toggle { grid-area: market; }
      .items-db-page .advanced-filter-panel { grid-area: filters; }
      .items-db-page .view-toggle { grid-area: view; }
      .items-db-page .control-group {
        min-width: 0;
      }
      .items-db-page .advanced-filter-panel {
        min-width: 0;
        overflow: visible;
        position: relative;
        z-index: 1;
      }
      .items-db-page .advanced-filter-panel summary {
        display: none;
      }
      .items-db-page .advanced-filter-grid {
        display: grid;
        gap: 0.65rem;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        overflow: visible;
      }
      .items-db-page .advanced-filter-panel:not([open]) .advanced-filter-grid {
        display: grid;
      }
      .items-db-page .search-shell {
        position: relative;
      }
      .items-db-page .search-shell svg {
        color: var(--text-muted);
        left: 0.75rem;
        pointer-events: none;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 2;
      }
      .items-db-page .search-shell input {
        min-height: 44px;
        padding-left: 2.35rem;
        width: 100%;
      }
      .items-db-page .db-controls .control-input {
        min-height: 44px;
        min-width: 0;
        width: 100%;
      }
      .items-db-page .item-select {
        min-width: 0;
        position: relative;
        z-index: 8;
      }
      .items-db-page .item-select.open {
        z-index: 120;
      }
      .items-db-page .item-select-trigger {
        align-items: center;
        background: var(--bg-base);
        border: 1px solid var(--border-subtle);
        border-radius: 7px;
        color: var(--text-main);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-size: 0.84rem;
        font-weight: 800;
        gap: 0.55rem;
        justify-content: space-between;
        min-height: 44px;
        min-width: 0;
        padding: 0.45rem 0.62rem;
        text-align: left;
        transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        width: 100%;
      }
      .items-db-page .item-select-trigger:hover {
        background: var(--bg-card);
        border-color: rgba(255, 255, 255, 0.14);
      }
      .items-db-page .item-select-trigger:active {
        transform: translateY(1px);
      }
      .items-db-page .item-select-trigger span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .items-db-page .item-select-trigger svg {
        color: var(--text-muted);
        flex: 0 0 auto;
      }
      .items-db-page .item-select.open .item-select-trigger,
      .items-db-page .item-select-trigger:focus-visible {
        border-color: var(--border-focus);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 88%);
        outline: none;
      }
      .items-db-page .item-select-menu {
        background: color-mix(in srgb, var(--bg-base), black 18%);
        border: 1px solid var(--border-focus);
        border-radius: 8px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.42);
        display: grid;
        gap: 0.25rem;
        left: 0;
        margin-top: 0.35rem;
        max-height: min(var(--item-select-max-height, 320px), 58vh);
        min-width: min(250px, calc(100vw - 2rem));
        overflow-y: auto;
        padding: 0.35rem;
        position: absolute;
        right: auto;
        top: 100%;
        transform-origin: top center;
        animation: itemMenuReveal 0.16s ease-out both;
        z-index: 130;
      }
      .items-db-page .item-select.open-up .item-select-menu {
        bottom: 100%;
        margin-bottom: 0.35rem;
        margin-top: 0;
        top: auto;
        transform-origin: bottom center;
      }
      .items-db-page .item-select-option {
        align-items: center;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: var(--text-main);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 800;
        gap: 0.55rem;
        justify-content: space-between;
        min-height: 44px;
        padding: 0.45rem 0.55rem;
        text-align: left;
        transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        width: 100%;
      }
      .items-db-page .item-select-option:hover,
      .items-db-page .item-select-option.active {
        background: color-mix(in srgb, var(--text-accent), transparent 90%);
        border-color: color-mix(in srgb, var(--text-accent), transparent 76%);
      }
      .items-db-page .item-select-option:active {
        transform: scale(0.99);
      }
      .items-db-page .item-select-option svg {
        color: var(--text-accent);
        flex: 0 0 auto;
      }
      .items-db-page .icon-toggle {
        align-items: center;
        cursor: pointer;
        display: flex;
        flex: 0 1 132px;
        gap: 0.4rem;
        justify-content: center;
        min-height: 44px;
        min-width: 88px !important;
        transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        white-space: nowrap;
      }
      .items-db-page .icon-toggle:hover {
        border-color: rgba(255, 255, 255, 0.16);
        color: var(--text-main);
      }
      .items-db-page .icon-toggle:active {
        transform: translateY(1px);
      }
      .items-db-page .market-toggle {
        border-color: rgba(255, 255, 255, 0.08);
        color: var(--text-muted);
      }
      .items-db-page .market-toggle.active {
        border-color: color-mix(in srgb, var(--text-success), transparent 65%);
        background: color-mix(in srgb, var(--text-success), transparent 90%);
        color: var(--text-success);
      }
      .items-db-page .view-toggle {
        background: var(--bg-base);
        border: 1px solid var(--border-subtle);
        border-radius: 7px;
        align-self: end;
        display: flex;
        justify-self: end;
        min-height: 44px;
        overflow: hidden;
        width: max-content;
      }
      .items-db-page .view-toggle button {
        background: transparent;
        border: 0;
        color: var(--text-muted);
        cursor: pointer;
        font-weight: 800;
        min-height: 44px;
        min-width: 58px;
        padding: 0 0.8rem;
        transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
      }
      .items-db-page .view-toggle button:not(.active):hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-main);
      }
      .items-db-page .view-toggle button:active {
        transform: translateY(1px);
      }
      .items-db-page .view-toggle button.active {
        background: var(--text-accent);
        color: var(--bg-base);
      }
      .items-db-page .result-meta {
        animation: itemSurfaceIn 0.28s 0.12s ease-out both;
        color: var(--text-muted);
        display: flex;
        font-size: 0.8rem;
        justify-content: space-between;
        margin: 1rem 0 0.65rem;
        position: relative;
        z-index: 1;
      }
      .items-db-page .desktop-table-shell {
        animation: itemSurfaceIn 0.34s 0.14s ease-out both;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        contain: layout paint;
        min-height: 640px;
        overflow: auto;
        position: relative;
        z-index: 1;
      }
      .items-db-page .desktop-table-shell:focus-visible {
        border-color: var(--border-focus);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 88%);
        outline: none;
      }
      .items-db-page .desktop-table-shell.hidden {
        display: none;
      }
      .items-db-page .items-table {
        border-collapse: collapse;
        min-width: 1140px;
        table-layout: fixed;
        width: 100%;
      }
      .items-db-page .items-table th {
        background: var(--bg-base);
        color: var(--text-muted);
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        padding: 0.85rem;
        text-align: right;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .items-db-page .items-table th.left {
        text-align: left;
      }
      .items-db-page .items-table th.center {
        text-align: center;
      }
      .items-db-page .sort-header-button {
        align-items: center;
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-weight: 900;
        gap: 0.35rem;
        justify-content: flex-end;
        letter-spacing: inherit;
        min-height: 44px;
        padding: 0;
        text-align: inherit;
        text-transform: inherit;
        width: 100%;
      }
      .items-db-page .items-table th:not(.left) .sort-header-button {
        justify-content: center;
      }
      .items-db-page .sort-header-button.active {
        color: var(--text-accent);
      }
      .items-db-page .sort-header-button:focus-visible {
        border-radius: 4px;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 84%);
        outline: none;
      }
      .items-db-page .sort-indicator {
        align-items: center;
        color: currentColor;
        display: inline-flex;
        flex: 0 0 auto;
        height: 16px;
        justify-content: center;
        line-height: 1;
        opacity: 0.75;
        width: 16px;
      }
      .items-db-page .items-table td {
        background: rgba(255, 255, 255, 0.012);
        border-top: 1px solid rgba(255, 255, 255, 0.035);
        color: var(--text-main);
        font-size: 0.84rem;
        padding: 0.9rem 0.85rem;
        text-align: center;
        vertical-align: middle;
      }
      .items-db-page .items-table th:nth-child(1),
      .items-db-page .items-table td:nth-child(1) { width: 30%; }
      .items-db-page .items-table th:nth-child(2),
      .items-db-page .items-table td:nth-child(2) { width: 11%; }
      .items-db-page .items-table th:nth-child(3),
      .items-db-page .items-table td:nth-child(3) { width: 9%; }
      .items-db-page .items-table th:nth-child(4),
      .items-db-page .items-table td:nth-child(4) { width: 7%; }
      .items-db-page .items-table th:nth-child(5),
      .items-db-page .items-table td:nth-child(5),
      .items-db-page .items-table th:nth-child(6),
      .items-db-page .items-table td:nth-child(6),
      .items-db-page .items-table th:nth-child(7),
      .items-db-page .items-table td:nth-child(7),
      .items-db-page .items-table th:nth-child(8),
      .items-db-page .items-table td:nth-child(8) { width: 8%; }
      .items-db-page .items-table th:nth-child(9),
      .items-db-page .items-table td:nth-child(9) { width: 11%; }
      .items-db-page .items-table tr {
        cursor: pointer;
        transition: background 0.16s ease;
      }
      .items-db-page .items-table tr:hover td,
      .items-db-page .items-table tr:focus-visible td {
        background: color-mix(in srgb, var(--text-accent), transparent 96%);
      }
      .items-db-page .items-table tr:focus-visible td:first-child {
        box-shadow: inset 3px 0 0 var(--text-accent);
      }
      .items-db-page .item-cell {
        min-width: 0;
        text-align: left !important;
      }
      .items-db-page .item-cell-inner {
        align-items: center;
        display: flex;
        gap: 0.75rem;
        min-width: 0;
      }
      .items-db-page .item-cell-inner img {
        border-radius: 6px;
        flex: 0 0 auto;
        height: 34px;
        width: 34px;
      }
      .items-db-page .item-copy {
        min-width: 0;
      }
      .items-db-page .item-copy strong {
        color: var(--text-main);
        display: block;
        font-size: 0.9rem;
        line-height: 1.2;
      }
      .items-db-page .item-copy small {
        color: var(--text-muted);
        display: block;
        margin-top: 0.2rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .items-db-page .signals-cell {
        overflow: hidden;
        text-align: center !important;
      }
      .items-db-page .liquidity-volume.thin {
        color: var(--quality-legendary);
      }
      .items-db-page .liquidity-volume.none {
        color: var(--text-muted);
      }
      .items-db-page .liquidity-volume.steady {
        color: var(--text-accent);
      }
      .items-db-page .liquidity-volume.active {
        color: var(--text-success);
      }
      .items-db-page .liquidity-volume.risk {
        color: var(--text-danger);
      }
      .items-db-page .volume-warning-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        margin-left: 0.35rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--quality-legendary), transparent 86%);
        color: var(--quality-legendary);
        font-size: 0.68rem;
        font-weight: 900;
        line-height: 1;
        vertical-align: middle;
      }
      .items-db-page .item-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        justify-content: flex-start;
        min-width: 0;
      }
      .items-db-page .item-badges.compact {
        align-content: center;
        align-items: center;
        gap: 0.28rem;
        justify-content: center;
        overflow: visible;
      }
      .items-db-page .badge {
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        color: var(--text-muted);
        display: inline-flex;
        font-size: 0.64rem;
        font-weight: 800;
        gap: 0.28rem;
        line-height: 1;
        max-width: 100%;
        min-width: 0;
        padding: 0.25rem 0.5rem;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .items-db-page .badge span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .items-db-page .badge svg {
        flex: 0 0 auto;
        stroke-width: 2.2;
      }
      .items-db-page .badge.market { color: var(--text-success); background: color-mix(in srgb, var(--text-success), transparent 92%); }
      .items-db-page .badge.market.none { color: var(--text-muted); background: rgba(255, 255, 255, 0.04); }
      .items-db-page .badge.market.thin { color: var(--quality-legendary); background: color-mix(in srgb, var(--quality-legendary), transparent 92%); }
      .items-db-page .badge.market.steady { color: var(--text-accent); background: color-mix(in srgb, var(--text-accent), transparent 92%); }
      .items-db-page .badge.market.risk { color: var(--text-danger); background: color-mix(in srgb, var(--text-danger), transparent 92%); }
      .items-db-page .badge.confidence.good { color: var(--text-success); background: color-mix(in srgb, var(--text-success), transparent 90%); }
      .items-db-page .badge.confidence.warn { color: var(--quality-legendary); background: color-mix(in srgb, var(--quality-legendary), transparent 90%); }
      .items-db-page .badge.confidence.bad { color: var(--text-danger); background: color-mix(in srgb, var(--text-danger), transparent 90%); }
      .items-db-page .badge.confidence.muted { color: var(--text-muted); background: rgba(255, 255, 255, 0.045); }
      .items-db-page .badge.warning { color: var(--quality-legendary); background: color-mix(in srgb, var(--quality-legendary), transparent 92%); }
      .items-db-page .badge.vendor { color: var(--quality-legendary); background: color-mix(in srgb, var(--quality-legendary), transparent 92%); }
      .items-db-page .badge.untradable { color: var(--text-danger); background: color-mix(in srgb, var(--text-danger), transparent 92%); }
      .items-db-page .badge.produced { color: var(--refined); background: color-mix(in srgb, var(--refined), transparent 92%); }
      .items-db-page .badge.craft { color: var(--refined); background: color-mix(in srgb, var(--refined), transparent 92%); }
      .items-db-page .badge.source { color: color-mix(in srgb, var(--refined), white 20%); background: color-mix(in srgb, var(--refined), transparent 92%); }
      .items-db-page .badge.gear { color: var(--quality-unique); background: color-mix(in srgb, var(--quality-unique), transparent 92%); }
      .items-db-page .badge.effect { color: var(--epic); background: color-mix(in srgb, var(--epic), transparent 92%); }
      .items-db-page .badge.lore { color: var(--text-accent); background: color-mix(in srgb, var(--text-accent), transparent 90%); }
      .items-db-page .badge.legacy { color: var(--quality-unique); background: color-mix(in srgb, var(--quality-unique), transparent 92%); }
      .items-db-page .badge.muted { color: var(--text-muted); background: rgba(255, 255, 255, 0.045); }
      .items-db-page .item-grid {
        animation: itemSurfaceIn 0.34s 0.14s ease-out both;
        display: none;
        gap: 0.85rem;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 310px), 1fr));
        margin-top: 1rem;
        max-width: 100%;
        min-width: 0;
        position: relative;
        z-index: 1;
      }
      .items-db-page .item-grid.forced {
        display: grid;
      }
      .items-db-page .item-card {
        background: rgba(255, 255, 255, 0.018);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        color: inherit;
        cursor: pointer;
        display: flex;
        gap: 0.85rem;
        min-height: 44px;
        min-width: 0;
        overflow: hidden;
        padding: 0.95rem;
        position: relative;
        text-align: left;
        transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        width: 100%;
      }
      .items-db-page .item-card:hover,
      .items-db-page .item-card:focus-visible {
        background: color-mix(in srgb, var(--text-accent), transparent 96%);
        border-color: var(--border-focus);
        outline: none;
        transform: translateY(-1px);
      }
      .items-db-page .item-card:active {
        transform: translateY(0) scale(0.997);
      }
      .items-db-page .quality-strip {
        bottom: 0;
        left: 0;
        position: absolute;
        top: 0;
        width: 3px;
        background: var(--quality-color);
        box-shadow: 0 0 18px color-mix(in srgb, var(--quality-color), transparent 45%);
      }
      .items-db-page .item-card img {
        border-radius: 7px;
        flex: 0 0 auto;
        height: 44px;
        width: 44px;
      }
      .items-db-page .item-card-body {
        flex: 1;
        min-width: 0;
      }
      .items-db-page .card-topline {
        align-items: flex-start;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
      }
      .items-db-page .card-item-name {
        color: var(--text-main);
        font-size: 0.95rem;
        font-weight: 800;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }
      .items-db-page .card-meta {
        color: var(--text-muted);
        display: flex;
        flex-wrap: wrap;
        font-size: 0.7rem;
        font-weight: 800;
        gap: 0.5rem;
        letter-spacing: 0.04em;
        margin-top: 0.35rem;
        text-transform: uppercase;
      }
      .items-db-page .card-stats {
        display: grid;
        gap: 0.4rem;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin: 0.8rem 0;
      }
      .items-db-page .card-stats span {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        min-width: 0;
        padding: 0.45rem;
      }
      .items-db-page .card-stats small {
        color: var(--text-muted);
        display: block;
        font-size: 0.62rem;
        font-weight: 800;
        text-transform: uppercase;
      }
      .items-db-page .card-stats strong {
        color: var(--text-main);
        display: block;
        font-family: var(--font-mono);
        font-size: 0.78rem;
        margin-top: 0.2rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .items-db-page .source-preview {
        align-items: center;
        background: color-mix(in srgb, var(--refined), transparent 94%);
        border: 1px solid color-mix(in srgb, var(--refined), transparent 84%);
        border-radius: 7px;
        color: var(--text-muted);
        display: flex;
        font-size: 0.76rem;
        font-weight: 800;
        gap: 0.42rem;
        margin: 0 0 0.75rem;
        min-width: 0;
        padding: 0.48rem 0.55rem;
      }
      .items-db-page .source-preview svg {
        color: var(--refined);
        flex: 0 0 auto;
      }
      .items-db-page .source-preview span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .items-db-page .load-more,
      .items-db-page .reset-btn {
        background: var(--text-accent);
        border: 0;
        border-radius: 7px;
        color: var(--bg-base);
        cursor: pointer;
        display: block;
        font-weight: 900;
        margin: 1.25rem auto 0;
        min-height: 44px;
        padding: 0.75rem 1.2rem;
      }
      .items-db-page .state-panel {
        align-items: center;
        background: rgba(255, 255, 255, 0.014);
        border: 1px dashed var(--border-subtle);
        border-radius: 8px;
        color: var(--text-muted);
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        margin-top: 1rem;
        padding: 4rem 1rem;
        text-align: center;
      }
      .items-db-page .advanced-filter-panel summary:focus-visible,
      .items-db-page .icon-toggle:focus-visible,
      .items-db-page .view-toggle button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 84%);
      }
      @keyframes itemSurfaceIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes itemMenuReveal {
        from {
          opacity: 0;
          transform: translateY(-4px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .items-db-page .db-summary,
        .items-db-page .item-help,
        .items-db-page .db-controls,
        .items-db-page .result-meta,
        .items-db-page .desktop-table-shell,
        .items-db-page .item-grid,
        .items-db-page .item-select-menu,
        .items-db-page .advanced-filter-panel[open] .advanced-filter-grid {
          animation: none !important;
        }
        .items-db-page .icon-toggle,
        .items-db-page .view-toggle button,
        .items-db-page .item-select-trigger,
        .items-db-page .item-select-option,
        .items-db-page .item-card {
          transition: none !important;
        }
        .items-db-page .icon-toggle:active,
        .items-db-page .view-toggle button:active,
        .items-db-page .item-select-trigger:active,
        .items-db-page .item-select-option:active,
        .items-db-page .item-card:hover,
        .items-db-page .item-card:focus-visible {
          transform: none !important;
        }
      }
      @media (max-width: 1200px) {
        .items-db-page .db-summary {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .items-db-page .db-controls {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-areas: none;
        }
        .items-db-page .db-controls > * {
          grid-area: auto;
        }
        .items-db-page .db-controls > .search-control {
          grid-column: span 2;
        }
        .items-db-page .advanced-filter-panel {
          grid-column: 1 / -1 !important;
        }
        .items-db-page .advanced-filter-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .items-db-page .icon-toggle,
        .items-db-page .view-toggle {
          justify-self: stretch;
          width: 100%;
        }
        .items-db-page .view-toggle button {
          min-width: 0;
          flex: 1;
        }
      }
      @media (max-width: 980px) {
        .items-db-page .db-controls > .search-control {
          grid-area: auto / 1 / auto / -1 !important;
        }
      }
      @media (max-width: 820px) {
        .items-db-page .db-summary {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .items-db-page .db-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-areas: none;
        }
        .items-db-page .db-controls > * {
          grid-area: auto;
        }
        .items-db-page .search-control {
          grid-column: 1 / -1 !important;
        }
        .items-db-page .advanced-filter-panel {
          background: rgba(255, 255, 255, 0.018);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          grid-column: 1 / -1 !important;
        }
        .items-db-page .advanced-filter-panel summary {
          align-items: center;
          color: var(--text-main);
          cursor: pointer;
          display: grid;
          font-size: 0.82rem;
          font-weight: 900;
          gap: 0.55rem;
          grid-template-columns: minmax(0, 1fr) auto auto;
          min-height: 44px;
          padding: 0.55rem 0.65rem;
        }
        .items-db-page .advanced-filter-panel summary::-webkit-details-marker {
          display: none;
        }
        .items-db-page .advanced-filter-panel summary > span {
          align-items: center;
          display: inline-flex;
          gap: 0.45rem;
          min-width: 0;
        }
        .items-db-page .advanced-filter-panel summary small {
          color: var(--text-muted);
          font: inherit;
          font-size: 0.72rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .items-db-page .advanced-filter-panel summary svg {
          color: var(--text-accent);
        }
        .items-db-page .advanced-filter-panel summary > svg {
          color: var(--text-muted);
          transition: transform 0.18s ease;
        }
        .items-db-page .advanced-filter-panel[open] summary > svg {
          transform: rotate(180deg);
        }
        .items-db-page .advanced-filter-panel:not([open]) .advanced-filter-grid {
          display: none;
        }
        .items-db-page .advanced-filter-panel[open] .advanced-filter-grid {
          animation: itemMenuReveal 0.16s ease-out both;
          border-top: 1px solid var(--border-subtle);
          display: grid;
          gap: 0.55rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          padding: 0.62rem;
        }
        .items-db-page .control-group,
        .items-db-page .icon-toggle,
        .items-db-page .market-toggle {
          width: 100%;
        }
        .items-db-page .item-select-menu {
          min-width: 100%;
        }
        .items-db-page .result-meta {
          flex-direction: column;
          gap: 0.3rem;
        }
        .items-db-page .desktop-table-shell {
          display: none;
        }
        .items-db-page .item-grid {
          display: grid;
        }
        .items-db-page .view-toggle {
          display: none;
        }
      }
      @media (max-width: 480px) {
        .items-db-page .db-summary {
          display: flex;
          gap: 0.5rem;
          margin-left: -0.2rem;
          margin-right: -0.2rem;
          overflow-x: auto;
          padding: 0 0.2rem 0.1rem;
          scroll-snap-type: x proximity;
          scrollbar-width: none;
        }
        .items-db-page .db-summary::-webkit-scrollbar {
          display: none;
        }
        .items-db-page .db-summary div {
          flex: 0 0 116px;
          min-height: auto;
          padding: 0.58rem 0.65rem;
          scroll-snap-align: start;
        }
        .items-db-page .summary-label {
          font-size: 0.62rem;
        }
        .items-db-page .db-summary strong {
          font-size: 1rem;
        }
        .items-db-page .db-controls {
          gap: 0.55rem;
          padding: 0.62rem;
        }
        .items-db-page .advanced-filter-panel[open] .advanced-filter-grid {
          grid-template-columns: 1fr;
        }
        .items-db-page .item-help summary {
          padding: 0.55rem 0.65rem;
        }
        .items-db-page .item-card {
          padding: 0.85rem;
        }
        .items-db-page .card-stats {
          gap: 0.3rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .items-db-page .card-stats span {
          padding: 0.4rem 0.35rem;
        }
        .items-db-page .card-stats strong {
          font-size: 0.7rem;
        }
        .items-db-page .search-shell input {
          font-size: 0.85rem;
        }
      }
    `}</style>
  );
}
