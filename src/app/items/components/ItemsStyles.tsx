'use client';

import React from 'react';

export function ItemsStyles() {
  return (
    <style jsx global>{`
      .items-db-page {
        padding-bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 3rem);
        overflow-x: hidden;
      }

      /* Clean Header Bar */
      .items-db-page .header {
        margin-bottom: 1rem;
      }

      .items-db-page .header-brand-row {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-bottom: 0.35rem;
      }

      .items-db-page .header-title {
        align-items: center;
        color: var(--text-main);
        display: flex;
        font-size: 1.5rem;
        font-weight: 800;
        gap: 0.65rem;
        letter-spacing: -0.02em;
        margin: 0;
      }

      .items-db-page .items-count-badge {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-subtle);
        border-radius: 9999px;
        color: var(--text-muted);
        font-family: var(--font-mono);
        font-feature-settings: 'tnum' 1;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.65rem;
        white-space: nowrap;
      }

      .items-db-page .header-description {
        color: var(--text-muted);
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 0;
        max-width: 720px;
      }

      /* Tag Guide Banner */
      .items-db-page .item-tag-guide-banner {
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        margin-bottom: 0.75rem;
        padding: 0.85rem 1rem;
      }

      .items-db-page .tag-guide-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.65rem;
      }

      .items-db-page .tag-guide-title {
        align-items: center;
        color: var(--text-main);
        display: flex;
        font-size: 0.8125rem;
        font-weight: 700;
        gap: 0.5rem;
      }

      .items-db-page .tag-guide-close {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 4px;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        height: 28px;
        justify-content: center;
        padding: 0;
        transition: color 0.15s ease, background 0.15s ease;
        width: 28px;
      }

      .items-db-page .tag-guide-close:hover {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-main);
      }

      .items-db-page .tag-guide-grid {
        display: grid;
        gap: 0.65rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .items-db-page .tag-guide-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.75rem;
      }

      .items-db-page .tag-guide-item p {
        color: var(--text-muted);
        line-height: 1.4;
        margin: 0;
      }

      .items-db-page .guide-pill {
        border-radius: 4px;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 0.15rem 0.45rem;
        text-transform: uppercase;
        width: fit-content;
      }

      .items-db-page .guide-pill.good {
        background: rgba(74, 222, 128, 0.15);
        color: #4ade80;
      }

      .items-db-page .guide-pill.warning {
        background: rgba(245, 176, 65, 0.15);
        color: #f5b041;
      }

      .items-db-page .guide-pill.muted {
        background: rgba(148, 163, 184, 0.15);
        color: #94a3b8;
      }

      .items-db-page .guide-pill.unranked {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      .items-db-page .guide-pill.info {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
      }

      /* Filter Controls Bar */
      .items-db-page .db-controls {
        align-items: end;
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        display: grid;
        gap: 0.65rem;
        grid-template-columns:
          minmax(220px, 1.6fr)
          minmax(210px, 1.3fr)
          auto
          auto;
        grid-template-areas:
          "search sort market view"
          "filters filters filters filters";
        margin-bottom: 0.75rem;
        padding: 0.75rem 1rem;
        position: relative;
        z-index: 5;
      }

      .items-db-page .search-control {
        grid-area: search;
      }

      .items-db-page .sort-control {
        grid-area: sort;
      }

      .items-db-page .sort-input-cluster {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        min-width: 0;
        width: 100%;
      }

      .items-db-page .sort-input-cluster .item-select {
        flex: 1 1 auto;
        min-width: 0;
        width: auto;
      }

      .items-db-page .sort-direction-toggle {
        align-items: center;
        background: var(--bg-base);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        color: var(--text-main);
        cursor: pointer;
        display: inline-flex;
        flex-shrink: 0;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        gap: 0.35rem;
        justify-content: center;
        min-height: 44px;
        padding: 0 0.75rem;
        transition: border-color 0.15s ease, background 0.15s ease;
        white-space: nowrap;
        width: auto;
      }

      .items-db-page .sort-direction-toggle:hover,
      .items-db-page .sort-direction-toggle:focus-visible {
        background: rgba(255, 255, 255, 0.04);
        border-color: var(--border-focus);
        outline: none;
      }

      .items-db-page .sort-direction-label {
        font-size: 0.75rem;
      }

      .items-db-page .market-toggle {
        align-items: center;
        background: var(--bg-base);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        color: var(--text-muted);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        gap: 0.45rem;
        grid-area: market;
        justify-content: center;
        min-height: 44px;
        padding: 0 0.85rem;
        transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        white-space: nowrap;
      }

      .items-db-page .market-toggle:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: var(--border-focus);
        color: var(--text-main);
      }

      .items-db-page .market-toggle.active {
        background: rgba(245, 176, 65, 0.12);
        border-color: rgba(245, 176, 65, 0.4);
        color: #f5b041;
      }

      .items-db-page .view-toggle {
        align-items: center;
        background: var(--bg-base);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        display: inline-flex;
        gap: 2px;
        grid-area: view;
        min-height: 44px;
        padding: 2px;
      }

      .items-db-page .advanced-filter-panel {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        grid-area: filters;
        margin-top: 4px;
        padding: 0.35rem 0.65rem;
      }

      .items-db-page .advanced-filter-panel summary {
        align-items: center;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        font-size: 0.8125rem;
        font-weight: 700;
        justify-content: space-between;
        letter-spacing: 0.04em;
        list-style: none;
        min-height: 44px;
        padding: 0 0.5rem;
        text-transform: uppercase;
        user-select: none;
      }

      .items-db-page .advanced-filter-panel summary::-webkit-details-marker {
        display: none;
      }

      .items-db-page .summary-left {
        align-items: center;
        display: flex;
        gap: 0.5rem;
      }

      .items-db-page .active-filter-pill {
        background: var(--text-accent);
        border-radius: 9999px;
        color: #0b101b;
        font-size: 0.6875rem;
        font-weight: 800;
        letter-spacing: normal;
        padding: 0.1rem 0.5rem;
        text-transform: none;
      }

      .items-db-page .summary-right {
        align-items: center;
        display: flex;
        gap: 0.75rem;
      }

      .items-db-page .tag-guide-trigger-btn {
        align-items: center;
        background: transparent;
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        color: var(--text-muted);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 600;
        gap: 0.35rem;
        letter-spacing: normal;
        padding: 0.25rem 0.55rem;
        text-transform: none;
        transition: color 0.15s ease, border-color 0.15s ease;
      }

      .items-db-page .tag-guide-trigger-btn:hover {
        border-color: var(--border-focus);
        color: var(--text-main);
      }

      .items-db-page .filter-panel-chevron {
        color: var(--text-muted);
        transition: transform 0.2s ease;
      }

      .items-db-page .advanced-filter-panel[open] .filter-panel-chevron {
        transform: rotate(180deg);
      }

      .items-db-page .advanced-filter-grid {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        display: grid;
        gap: 0.65rem;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-top: 0.35rem;
        padding-top: 0.65rem;
      }

      .items-db-page .control-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .items-db-page .control-label {
        color: var(--text-muted);
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .items-db-page .item-select {
        min-width: 0;
        position: relative;
        width: 100%;
      }

      .items-db-page .item-select-trigger {
        align-items: center;
        background: var(--bg-base);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        color: var(--text-main);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-size: 0.8125rem;
        gap: 0.5rem;
        justify-content: space-between;
        min-height: 44px;
        min-width: 0;
        overflow: hidden;
        padding: 0 0.75rem;
        transition: border-color 0.15s ease;
        white-space: nowrap;
        width: 100%;
      }

      .items-db-page .item-select-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .items-db-page .item-select-trigger:hover,
      .items-db-page .item-select-trigger:focus-visible {
        border-color: var(--border-focus);
        outline: none;
      }

      .items-db-page .item-select-menu {
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        left: 0;
        max-height: 280px;
        overflow-y: auto;
        padding: 4px;
        position: absolute;
        right: 0;
        top: calc(100% + 4px);
        z-index: 50;
      }

      .items-db-page .item-select.open-up .item-select-menu {
        bottom: calc(100% + 4px);
        top: auto;
      }

      .items-db-page .item-select-option {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 4px;
        color: var(--text-main);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-size: 0.8125rem;
        justify-content: space-between;
        min-height: 44px;
        padding: 0 0.75rem;
        text-align: left;
        transition: background 0.12s ease;
        width: 100%;
      }

      .items-db-page .item-select-option:hover,
      .items-db-page .item-select-option.active {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-accent);
      }

      .items-db-page .icon-toggle {
        align-items: center;
        background: var(--bg-base);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        color: var(--text-muted);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        gap: 0.4rem;
        justify-content: center;
        min-height: 44px;
        padding: 0 0.75rem;
        transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
      }

      .items-db-page .view-toggle button {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 4px;
        color: var(--text-muted);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        gap: 0.35rem;
        justify-content: center;
        min-height: 44px;
        padding: 0 0.75rem;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .items-db-page .view-toggle button.active {
        background: #f8fafc;
        color: #0f172a;
        font-weight: 700;
      }

      .items-db-page .result-meta {
        align-items: center;
        color: var(--text-muted);
        display: flex;
        font-size: 0.8125rem;
        justify-content: space-between;
        margin: 0.75rem 0;
      }

      /* Desktop Data Table Container */
      .items-db-page .desktop-table-shell {
        background-color: var(--bg-card);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        contain: layout paint;
        overflow-x: auto;
        position: relative;
        z-index: 1;
      }

      .items-db-page .desktop-table-shell:focus-visible {
        border-color: var(--border-focus);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 88%);
        outline: none;
      }

      .items-db-page .items-table {
        border-collapse: separate;
        border-spacing: 0;
        min-width: 1080px;
        table-layout: fixed;
        width: 100%;
      }

      /* Sticky Table Header */
      .items-db-page .items-table thead th {
        background-color: #0b101b;
        border-bottom: 1px solid var(--border-subtle);
        color: var(--text-muted);
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        padding: 0.65rem 0.85rem;
        position: sticky;
        text-transform: uppercase;
        top: 0;
        white-space: nowrap;
        z-index: 10;
      }

      /* Sticky Pinned Item Column */
      .items-db-page .items-table th.pinned-item {
        background-color: #0b101b;
        border-right: 1px solid var(--border-subtle);
        left: 0;
        max-width: 280px;
        min-width: 280px;
        position: sticky;
        text-align: left;
        width: 280px;
        z-index: 15;
      }

      .items-db-page .items-table td.pinned-item {
        background-color: var(--bg-card);
        border-right: 1px solid var(--border-subtle);
        left: 0;
        max-width: 280px;
        min-width: 280px;
        position: sticky;
        text-align: left;
        width: 280px;
        z-index: 5;
      }

      .items-db-page .items-table th.left {
        text-align: left;
      }

      .items-db-page .items-table th.right {
        text-align: right;
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
        font-weight: 700;
        gap: 0.35rem;
        letter-spacing: inherit;
        min-height: 44px;
        padding: 0;
        text-transform: inherit;
        width: 100%;
      }

      .items-db-page .sort-header-button.left {
        justify-content: flex-start;
      }

      .items-db-page .sort-header-button.right {
        justify-content: flex-end;
      }

      .items-db-page .sort-header-button.center {
        justify-content: center;
      }

      .items-db-page .sort-header-button.active {
        color: var(--text-accent);
      }

      .items-db-page .items-table td {
        border-top: 1px solid transparent;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        border-left: 0;
        border-right: 0;
        color: var(--text-main);
        font-size: 0.8125rem;
        padding: 0.65rem 0.85rem;
        vertical-align: middle;
      }

      .items-db-page .items-table td:first-child {
        border-left: 1px solid transparent;
      }

      .items-db-page .items-table td:last-child {
        border-right: 1px solid transparent;
      }

      .items-db-page .items-table td.left {
        text-align: left;
      }

      .items-db-page .items-table td.right {
        text-align: right;
      }

      .items-db-page .items-table td.center {
        text-align: center;
      }

      .items-db-page .items-table tr {
        cursor: pointer;
        position: relative;
        transition: background 0.12s ease;
      }

      .items-db-page .items-table tr:hover,
      .items-db-page .items-table tr:focus-visible {
        position: relative;
        z-index: 6;
      }

      .items-db-page .items-table tr:hover td,
      .items-db-page .items-table tr:focus-visible td {
        background-color: rgba(255, 255, 255, 0.04);
        border-top-color: var(--border-focus);
        border-bottom-color: var(--border-focus);
      }

      .items-db-page .items-table tr:hover td:first-child,
      .items-db-page .items-table tr:focus-visible td:first-child {
        border-left: 1px solid var(--border-focus);
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
      }

      .items-db-page .items-table tr:hover td:last-child,
      .items-db-page .items-table tr:focus-visible td:last-child {
        border-right: 1px solid var(--border-focus);
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
      }

      .items-db-page .items-table tr:hover td.pinned-item,
      .items-db-page .items-table tr:focus-visible td.pinned-item {
        background-color: #131b2e;
        border-right-color: transparent;
        z-index: 7;
      }

      /* Item Cell and Left Alignment */
      .items-db-page .item-cell-inner {
        align-items: center;
        display: flex;
        gap: 0.75rem;
        justify-content: flex-start;
        text-align: left;
        width: 100%;
      }

      .items-db-page .item-thumb-wrapper {
        align-items: center;
        background: var(--bg-base);
        border: 1.5px solid var(--border-subtle);
        border-radius: 6px;
        display: flex;
        flex-shrink: 0;
        height: 36px;
        justify-content: center;
        overflow: hidden;
        width: 36px;
      }

      .items-db-page .item-copy {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        gap: 2px;
        justify-content: center;
        min-width: 0;
        text-align: left;
        width: 100%;
      }

      .items-db-page .item-copy strong {
        display: block;
        font-size: 0.875rem;
        font-weight: 700;
        overflow: hidden;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .items-db-page .item-copy small {
        color: var(--text-muted);
        display: block;
        font-size: 0.75rem;
        overflow: hidden;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
      }

      .items-db-page .quality-tag {
        border-radius: 4px;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 0.2rem 0.45rem;
        text-transform: uppercase;
      }

      .items-db-page .mono {
        font-family: var(--font-mono);
        font-feature-settings: 'tnum' 1;
        font-variant-numeric: tabular-nums;
      }

      .items-db-page .gold-cell {
        color: #f5b041;
        font-weight: 600;
      }

      .items-db-page .liquidity-volume {
        display: table-cell;
      }

      .items-db-page .volume-number {
        font-family: var(--font-mono);
        font-feature-settings: 'tnum' 1;
        font-variant-numeric: tabular-nums;
      }

      .items-db-page .volume-warning-icon {
        color: #f5b041;
        display: inline-flex;
        margin-left: 0.35rem;
        vertical-align: -1px;
      }

      .items-db-page .signals-cell {
        vertical-align: middle;
      }

      /* Compact Signal Badges */
      .items-db-page .signal-badges-compact,
      .items-db-page .item-badges.compact {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        justify-content: flex-start;
        align-items: center;
      }

      .items-db-page .signal-badge,
      .items-db-page .item-badges.compact .badge {
        align-items: center;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        color: var(--text-muted);
        display: inline-flex;
        font-size: 0.6875rem;
        font-weight: 600;
        gap: 0.25rem;
        padding: 0.15rem 0.45rem;
        white-space: nowrap;
      }

      .items-db-page .signal-badge.good,
      .items-db-page .item-badges.compact .badge.good,
      .items-db-page .item-badges.compact .badge.confidence.good {
        border-color: rgba(74, 222, 128, 0.3);
        color: #4ade80;
      }

      .items-db-page .signal-badge.warning,
      .items-db-page .item-badges.compact .badge.warning,
      .items-db-page .item-badges.compact .badge.confidence.warning {
        border-color: rgba(245, 176, 65, 0.3);
        color: #f5b041;
      }

      .items-db-page .item-badges.compact .badge.source {
        border-color: rgba(56, 189, 248, 0.3);
        color: #38bdf8;
      }

      .items-db-page .item-badges.compact .badge.craft {
        border-color: rgba(168, 85, 247, 0.3);
        color: #c084fc;
      }

      .items-db-page .item-badges.compact .badge.lore {
        border-color: rgba(236, 72, 153, 0.3);
        color: #f472b6;
      }

      .items-db-page .item-badges.compact .badge.untradable {
        border-color: rgba(148, 163, 184, 0.2);
        color: var(--text-muted);
      }

      .items-db-page .item-badges.compact .badge.vendor {
        border-color: rgba(245, 176, 65, 0.25);
        color: #f5b041;
      }

      .items-db-page .signal-badge.muted,
      .items-db-page .item-badges.compact .badge.muted {
        color: var(--text-muted);
      }

      /* Mobile Card Grid View */
      .items-db-page .cards-grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 1fr;
      }

      .items-db-page .item-mobile-card {
        appearance: none;
        -webkit-appearance: none;
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        border-left: 4px solid var(--quality-color, var(--border-subtle));
        border-radius: 8px;
        color: var(--text-main);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        font: inherit;
        gap: 0.65rem;
        padding: 0.85rem 1rem;
        position: relative;
        text-align: left;
        transition: border-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
        width: 100%;
      }

      .items-db-page .item-mobile-card:hover {
        border-color: var(--border-focus);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        transform: translateY(-1px);
      }

      .items-db-page .item-mobile-card:active {
        transform: scale(0.99);
      }

      .items-db-page .card-main-row {
        align-items: center;
        display: flex;
        gap: 0.75rem;
      }

      .items-db-page .card-thumb-wrap {
        align-items: center;
        background: var(--bg-base);
        border: 1.5px solid var(--border-subtle);
        border-radius: 8px;
        display: flex;
        flex-shrink: 0;
        height: 44px;
        justify-content: center;
        overflow: hidden;
        width: 44px;
      }

      .items-db-page .card-identity-col {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }

      .items-db-page .card-title {
        font-size: 0.9375rem;
        font-weight: 700;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .items-db-page .card-pills-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .items-db-page .card-type-pill {
        color: var(--text-muted);
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .items-db-page .card-stats-grid {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 6px;
        display: grid;
        gap: 0.5rem;
        grid-template-columns: repeat(4, 1fr);
        padding: 0.5rem 0.65rem;
      }

      .items-db-page .card-stat-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .items-db-page .card-stat-label {
        color: var(--text-muted);
        font-size: 0.625rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .items-db-page .card-stat-val {
        color: var(--text-main);
        font-family: var(--font-mono);
        font-feature-settings: 'tnum' 1;
        font-size: 0.8125rem;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .items-db-page .card-stat-val.gold {
        color: #f5b041;
      }

      .items-db-page .card-source-row {
        align-items: center;
        color: var(--text-muted);
        display: flex;
        font-size: 0.75rem;
        gap: 0.35rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .items-db-page .card-tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      /* Load More & Pagination */
      .items-db-page .load-more-row {
        align-items: center;
        display: flex;
        justify-content: center;
        margin-top: 1.5rem;
      }

      .items-db-page .load-more,
      .items-db-page .reset-btn {
        align-items: center;
        background: #f8fafc;
        border: 0;
        border-radius: 6px;
        color: #0f172a;
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 700;
        gap: 0.5rem;
        justify-content: center;
        min-height: 44px;
        padding: 0 1.5rem;
        transition: opacity 0.15s ease, transform 0.1s ease;
      }

      .items-db-page .load-more:hover,
      .items-db-page .reset-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .items-db-page .load-more:active,
      .items-db-page .reset-btn:active {
        transform: scale(0.98);
      }

      /* Responsive Media Queries */
      @media (min-width: 768px) {
        .items-db-page .cards-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (min-width: 1200px) {
        .items-db-page .cards-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .items-db-page .items-back-to-top:focus-visible {
        outline: none;
        border-color: var(--border-focus);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-accent), transparent 75%);
      }

      /* Floating Back To Top Button */
      .items-db-page .items-back-to-top {
        position: fixed;
        bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px);
        right: 16px;
        z-index: 45;
        width: 44px;
        height: 44px;
        min-width: 44px;
        min-height: 44px;
        border-radius: 50%;
        background-color: var(--bg-card);
        border: 1px solid var(--border-strong);
        color: var(--text-base);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3);
        opacity: 0;
        pointer-events: none;
        transform: translateY(12px) scale(0.9);
        transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1),
                    transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
                    background-color 150ms ease,
                    border-color 150ms ease;
      }

      .items-db-page .items-back-to-top.visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }

      .items-db-page .items-back-to-top:hover {
        background-color: var(--bg-card-hover, #1a2236);
        border-color: var(--border-focus);
        transform: translateY(-2px) scale(1.04);
      }

      .items-db-page .items-back-to-top:active {
        transform: translateY(0) scale(0.96);
      }

      @media (min-width: 768px) {
        .items-db-page .items-back-to-top {
          bottom: 24px;
          right: 24px;
        }
      }

      @media (max-width: 767px) {
        .items-db-page .db-controls {
          grid-template-columns: 1fr;
          grid-template-areas:
            "search"
            "sort"
            "market"
            "filters";
          padding: 0.75rem;
        }

        .items-db-page .sort-direction-toggle {
          min-width: 44px;
          width: 44px;
          padding: 0;
          justify-content: center;
        }

        .items-db-page .sort-direction-label {
          display: none;
        }

        .items-db-page .advanced-filter-grid {
          grid-template-columns: 1fr 1fr;
        }

        .items-db-page .desktop-table-shell {
          display: none;
        }

        .items-db-page .view-toggle {
          display: none;
        }
      }
    `}</style>
  );
}
