"use client";

import React from "react";

export function EnemiesStyles() {
  return (
    <style jsx global>{`
      /* =========================================================================
         ZENITH COMPANION — ENEMY BESTIARY STYLES (ASTRAL SLATE TOKENS)
         Strictly monochromatic neutral UI chrome per DESIGN.md & AGENTS.md.
         Colors reserved strictly for weather synergies and combat attributes.
         ========================================================================= */

      .enemy-db-page {
        min-height: calc(100vh - 40px);
        padding: clamp(0.85rem, 1.8vw, 1.6rem);
        padding-bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 32px);
        overflow-x: hidden;
        isolation: isolate;
        background: var(--bg-base);
        color: var(--text-main, #f8fafc);
      }

      .enemy-db-page,
      .enemy-db-page * {
        box-sizing: border-box;
      }

      .enemy-db-page :where(button, a, input, summary):focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .enemy-page-shell {
        max-width: 1480px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* -------------------------------------------------------------------------
         1. HERO HEADER (Clean, Purposeful, Zero Bloat)
         ------------------------------------------------------------------------- */

      .enemy-hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      }

      .enemy-hero-content {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .enemy-hero h1 {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        color: #fff;
        font-size: clamp(1.6rem, 2.8vw, 2.2rem);
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.15;
        margin: 0;
      }

      .enemy-hero h1 :global(svg) {
        color: var(--text-accent, #38bdf8);
        flex-shrink: 0;
      }

      .enemy-subtitle {
        color: var(--text-muted, #94a3b8);
        font-size: 0.92rem;
        margin: 0;
        line-height: 1.45;
      }

      /* -------------------------------------------------------------------------
         2. FILTERS & SEARCH CONTROLS (Monochromatic Neutral)
         ------------------------------------------------------------------------- */

      .enemy-controls {
        position: relative;
        z-index: 30;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.85rem;
        border-radius: 10px;
        background: var(--bg-card, rgba(15, 23, 42, 0.6));
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      }

      .search-control {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .search-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #94a3b8);
      }

      .search-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
        min-height: 44px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .search-input-wrap:focus-within {
        border-color: var(--border-focus, #38bdf8);
        box-shadow: 0 0 0 1px var(--border-focus, #38bdf8);
      }

      .search-icon-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 100%;
        color: var(--text-muted, #94a3b8);
        flex-shrink: 0;
        pointer-events: none;
      }

      .search-icon-box svg {
        width: 16px;
        height: 16px;
      }

      .search-input-wrap input {
        flex: 1;
        min-width: 0;
        min-height: 42px;
        background: transparent;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        color: #fff;
        font-size: 0.92rem;
        padding-right: 0.75rem;
      }

      /* Suppress global focus outline on inner input to eliminate double outline */
      .enemy-db-page .search-input-wrap input:focus,
      .enemy-db-page .search-input-wrap input:focus-visible {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
      }

      .search-clear-btn {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        margin-right: 4px;
        border-radius: 6px;
        background: transparent;
        border: none;
        color: var(--text-muted, #94a3b8);
        cursor: pointer;
        transition: color 0.15s ease;
      }

      .search-clear-btn:hover {
        color: #fff;
      }

      .enemy-filter-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(130px, 1fr)) minmax(100px, 0.5fr);
        gap: 0.65rem;
        align-items: end;
      }

      .sort-direction-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .sort-direction-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #94a3b8);
      }

      .sort-direction {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        width: 100%;
        min-height: 44px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        color: #fff;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .sort-direction:hover {
        background: var(--bg-card);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .sort-direction:active {
        transform: scale(0.98);
      }

      /* Active Filters Strip */
      .active-filters-strip {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      }

      .active-filters-heading {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #94a3b8);
        margin-right: 0.25rem;
      }

      .active-filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-height: 32px;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
        color: #fff;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .active-filter-chip:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
      }

      .active-filter-chip:active {
        transform: scale(0.98);
      }

      .active-filter-chip svg {
        color: var(--text-muted, #94a3b8);
        flex-shrink: 0;
      }

      .clear-all-filters-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-height: 32px;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-muted, #94a3b8);
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: color 0.15s ease, background 0.15s ease;
      }

      .clear-all-filters-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.06);
      }

      /* -------------------------------------------------------------------------
         3. CUSTOM SELECT PRIMITIVE (Dropdown Menus)
         ------------------------------------------------------------------------- */

      .mobile-native-select {
        display: none;
      }

      .custom-select {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
      }

      .custom-select label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #94a3b8);
      }

      .select-control-box {
        position: relative;
        width: 100%;
      }

      .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        width: 100%;
        min-height: 44px;
        padding: 0 0.75rem;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        color: #fff;
        font-size: 0.84rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .select-trigger:hover {
        background: var(--bg-card);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .custom-select.open .select-trigger {
        border-color: var(--border-focus, #38bdf8);
      }

      .select-trigger span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .select-trigger svg {
        color: var(--text-muted, #94a3b8);
        flex-shrink: 0;
        transition: transform 0.15s ease;
      }

      .custom-select.open .select-trigger svg {
        transform: rotate(180deg);
      }

      .select-menu {
        position: absolute;
        top: calc(100% + 0.35rem);
        left: 0;
        right: 0;
        z-index: 150;
        display: grid;
        max-height: min(var(--enemy-select-max-height, 300px), 55vh);
        overflow-y: auto;
        overscroll-behavior: contain;
        border-radius: 8px;
        background: var(--bg-panel, #0f172a);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.15));
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        padding: 0.3rem;
        animation: enemyMenuReveal 0.15s ease-out both;
      }

      .custom-select.open-up .select-menu {
        bottom: calc(100% + 0.35rem);
        top: auto;
        transform-origin: bottom center;
      }

      .select-menu button {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.65rem;
        min-height: 44px;
        padding: 0 0.65rem;
        border-radius: 6px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-muted, #94a3b8);
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        transition: background 0.12s ease, color 0.12s ease;
      }

      .select-menu button:hover,
      .select-menu button.active {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }

      .select-menu button.selected {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        font-weight: 700;
      }

      .select-menu button svg {
        color: #fff;
        flex-shrink: 0;
      }

      /* -------------------------------------------------------------------------
         4. ENEMY GRID & CARDS
         ------------------------------------------------------------------------- */

      .enemy-results-section {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .enemy-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 0.75rem;
        contain: layout;
      }

      .enemy-card {
        position: relative;
        display: grid;
        grid-template-columns: 56px minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.75rem;
        min-height: 84px;
        padding: 0.75rem;
        border-radius: 10px;
        background: var(--bg-card, rgba(15, 23, 42, 0.6));
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: border-color 0.16s ease, background 0.16s ease, transform 0.1s ease;
      }

      .enemy-card::before {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 3px;
        border-radius: 10px 0 0 10px;
        background: var(--text-muted, #94a3b8);
        opacity: 0.35;
      }

      .enemy-card.good::before {
        background: #2dd4bf;
        opacity: 0.9;
      }

      .enemy-card.bad::before {
        background: #f87171;
        opacity: 0.9;
      }

      .enemy-card.neutral::before {
        background: #94a3b8;
        opacity: 0.6;
      }

      .enemy-card:hover {
        border-color: rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.04);
      }

      .enemy-card:active {
        transform: scale(0.98);
      }

      .enemy-card-art {
        display: grid;
        place-items: center;
        width: 54px;
        height: 54px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        overflow: hidden;
        flex-shrink: 0;
      }

      .enemy-sprite {
        width: 46px;
        height: 46px;
        object-fit: contain;
      }

      .enemy-card-skull {
        color: var(--text-muted, #94a3b8);
        opacity: 0.6;
      }

      .enemy-card-main {
        display: flex;
        flex-direction: column;
        gap: 0.22rem;
        min-width: 0;
      }

      .enemy-card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
      }

      .enemy-name {
        color: #fff;
        font-size: 0.98rem;
        font-weight: 700;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .enemy-level-badge {
        flex-shrink: 0;
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        font-weight: 700;
        font-family: var(--font-mono);
      }

      .enemy-location {
        color: var(--text-muted, #94a3b8);
        font-size: 0.78rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .enemy-card-weather-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.15rem;
      }

      .match-chip {
        display: inline-flex;
        align-items: center;
        padding: 0.18rem 0.5rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        color: var(--text-muted, #94a3b8);
        font-size: 0.68rem;
        font-weight: 700;
      }

      .match-chip.good {
        border-color: rgba(45, 212, 191, 0.3);
        background: rgba(45, 212, 191, 0.1);
        color: #5eead4;
      }

      .match-chip.bad {
        border-color: rgba(248, 113, 113, 0.3);
        background: rgba(248, 113, 113, 0.1);
        color: #fca5a5;
      }

      .match-chip.neutral {
        color: #cbd5e1;
      }

      .enemy-card-window {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .enemy-card-window :global(svg) {
        color: var(--text-muted, #94a3b8);
        flex-shrink: 0;
      }

      .enemy-card-stats {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
        flex-shrink: 0;
      }

      .enemy-drop-count {
        color: var(--text-muted, #94a3b8);
        font-size: 0.74rem;
        font-weight: 600;
      }

      .enemy-loot-ev {
        color: var(--text-success, #4ade80);
        font-size: 0.88rem;
        font-family: var(--font-mono);
        font-weight: 700;
      }

      /* -------------------------------------------------------------------------
         5. FLOATING CONTROLS
         ------------------------------------------------------------------------- */

      /* -------------------------------------------------------------------------
         6. BACK TO TOP BUTTON (Neutral Floating Control)
         ------------------------------------------------------------------------- */

      .enemy-back-to-top {
        position: fixed;
        right: 1.5rem;
        bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 20px);
        z-index: 1000;
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: var(--bg-card, #1e293b);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.15));
        color: #f8fafc;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        opacity: 0;
        transform: translateY(12px) scale(0.92);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease, background 0.15s ease;
      }

      .enemy-back-to-top.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .enemy-back-to-top:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
      }

      .enemy-back-to-top:active {
        transform: scale(0.95);
      }

      /* -------------------------------------------------------------------------
         7. MODALSHEET ENEMY DETAIL CONTENT
         ------------------------------------------------------------------------- */

      .enemy-modal-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .enemy-modal-hero {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.85rem 1rem;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      }

      .enemy-modal-avatar {
        display: grid;
        place-items: center;
        width: 60px;
        height: 60px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
        flex-shrink: 0;
        overflow: hidden;
      }

      .enemy-modal-sprite {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }

      .modal-fallback-icon {
        color: var(--text-muted, #94a3b8);
      }

      .enemy-modal-identity {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
        flex: 1;
      }

      .enemy-modal-title-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .enemy-modal-title {
        color: #fff;
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
      }

      .enemy-modal-level-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
        color: #fff;
        font-size: 0.76rem;
        font-family: var(--font-mono);
        font-weight: 700;
      }

      .enemy-modal-tags {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .enemy-modal-location-tag,
      .enemy-modal-loot-chance-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--text-muted, #94a3b8);
        font-size: 0.78rem;
        font-weight: 500;
      }

      .enemy-modal-loot-chance-tag {
        color: #38bdf8;
      }

      .enemy-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.65rem;
      }

      .stat-card {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.75rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      }

      .stat-icon-label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .stat-icon.level { color: var(--text-muted, #94a3b8); }
      .stat-icon.health { color: #f87171; }
      .stat-icon.xp { color: #fbbf24; }
      .stat-icon.ev { color: var(--text-success, #4ade80); }

      .stat-card strong {
        color: #fff;
        font-size: 1.05rem;
        font-family: var(--font-mono);
        font-weight: 700;
      }

      .stat-ev-value {
        color: var(--text-success, #4ade80) !important;
      }

      .enemy-detail-card {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        padding: 0.85rem;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .card-title {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: #fff;
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .card-title :global(svg) {
        color: var(--text-muted, #94a3b8);
      }

      .drop-count-badge {
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        font-weight: 600;
      }

      .weather-summary-text {
        color: var(--text-muted, #94a3b8);
        font-size: 0.88rem;
        line-height: 1.5;
        margin: 0;
      }

      .weather-summary-text strong {
        color: #fff;
      }

      :global(.preference-pills) {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 0.35rem;
      }

      :global(.preference-pill) {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        color: var(--text-muted, #94a3b8);
        font-size: 0.75rem;
        font-weight: 600;
      }

      :global(.preference-pill strong) {
        color: #fff;
      }

      :global(.preference-pill.good) {
        border-color: rgba(45, 212, 191, 0.3);
        background: rgba(45, 212, 191, 0.08);
        color: #5eead4;
      }

      :global(.preference-pill.bad) {
        border-color: rgba(248, 113, 113, 0.3);
        background: rgba(248, 113, 113, 0.08);
        color: #fca5a5;
      }

      .loot-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.65rem;
      }

      .loot-item-btn {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        min-height: 54px;
        padding: 0.5rem 0.65rem;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .loot-item-btn:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .loot-item-btn:active {
        transform: scale(0.98);
      }

      .loot-item-art {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        overflow: hidden;
        flex-shrink: 0;
      }

      .loot-sprite {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }

      .loot-fallback-icon {
        color: var(--text-muted, #94a3b8);
      }

      .loot-item-info {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }

      .loot-item-name {
        color: #fff;
        font-size: 0.86rem;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .loot-item-meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.74rem;
      }

      .drop-rate {
        color: #fff;
        font-family: var(--font-mono);
        font-weight: 600;
      }

      .drop-qty {
        color: var(--text-muted, #94a3b8);
        font-family: var(--font-mono);
      }

      .drop-market-price {
        color: var(--text-gold, #f59e0b);
        font-family: var(--font-mono);
        font-weight: 600;
        margin-left: auto;
      }

      .loot-empty-text {
        color: var(--text-muted, #94a3b8);
        font-size: 0.85rem;
        margin: 0.5rem 0;
      }

      .enemy-modal-footer {
        display: flex;
        justify-content: flex-end;
        width: 100%;
      }

      .enemy-map-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        min-height: 44px;
        padding: 0 1rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
        color: #fff;
        font-size: 0.84rem;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .enemy-map-link:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.22);
      }

      .enemy-map-link:active {
        transform: scale(0.98);
      }

      /* -------------------------------------------------------------------------
         8. UTILITIES & ANIMATIONS
         ------------------------------------------------------------------------- */

      .reset-filters-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        min-height: 44px;
        padding: 0 1rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.15));
        color: #fff;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .reset-filters-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .reset-filters-btn:active {
        transform: scale(0.98);
      }

      .sr-only {
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

      @keyframes enemyMenuReveal {
        from {
          opacity: 0;
          transform: translateY(-4px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* -------------------------------------------------------------------------
         9. RESPONSIVE BREAKPOINTS
         ------------------------------------------------------------------------- */

      @media (max-width: 1024px) {
        .enemy-filter-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) minmax(100px, 0.5fr);
        }
        .stat-card {
          padding: 0.6rem;
        }
      }

      @media (max-width: 768px) {
        .mobile-native-select {
          display: block;
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          z-index: 10;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
        }
        .enemy-hero {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .enemy-controls {
          padding: 0.75rem;
        }
        .enemy-filter-grid {
          grid-template-columns: 1fr;
        }
        .enemy-stat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .enemy-card {
          grid-template-columns: 50px minmax(0, 1fr);
        }
        .enemy-card-stats {
          grid-column: 1 / -1;
          flex-direction: row;
          justify-content: space-between;
          padding-top: 0.4rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
      }

      @media (max-width: 480px) {
        .enemy-grid {
          grid-template-columns: 1fr;
        }
        .enemy-back-to-top {
          right: 1rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .enemy-card,
        .enemy-back-to-top,
        .controls-reset-btn,
        :global(.select-trigger),
        :global(.select-menu),
        .loot-item-btn {
          transition: none !important;
          animation: none !important;
        }
      }
    `}</style>
  );
}
