"use client";

import React from "react";

export function LoreStyles() {
  return (
    <style jsx global>{`
      .lore-page {
        --panel: rgba(14, 17, 23, 0.82);
        --line: var(--border-subtle, rgba(255, 255, 255, 0.08));
        --soft: rgba(255, 255, 255, 0.05);
        --lore-gold: #f5b041;
        --lore-cyan: #38bdf8;
        box-sizing: border-box;
        max-width: 100%;
        min-height: calc(100vh - 40px);
        overflow-x: hidden;
        padding: 1.5rem 2rem calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 32px);
        position: relative;
        z-index: 1;
        background: var(--bg-base, #0a0a0c);
        color: var(--text-main, #f8fafc);
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
      .category-rail-container,
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

      /* Hero Section */
      .lore-hero {
        padding: 2rem 0 1.5rem;
      }

      .lore-eyebrow {
        align-items: center;
        color: var(--lore-gold);
        display: inline-flex;
        font-size: 0.78rem;
        font-weight: 700;
        gap: 0.5rem;
        letter-spacing: 0.12em;
        margin-bottom: 0.75rem;
        text-transform: uppercase;
      }

      .lore-hero h1 {
        font-size: clamp(2.2rem, 5vw, 3.8rem);
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.05;
        margin: 0;
        max-width: 920px;
        color: var(--text-main, #f8fafc);
      }

      .lore-hero-lead {
        color: var(--text-muted, #94a3b8);
        font-size: clamp(0.95rem, 1.8vw, 1.15rem);
        line-height: 1.6;
        margin: 0.75rem 0 1.25rem;
        max-width: 720px;
      }

      .lore-hero-stats {
        align-items: center;
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        background: rgba(18, 20, 26, 0.75);
        border: 1px solid var(--line);
        border-radius: 9999px;
        padding: 0.4rem 1rem;
        backdrop-filter: blur(8px);
      }

      .lore-stat-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.84rem;
        color: var(--text-muted, #94a3b8);
      }

      .lore-stat-pill strong {
        color: var(--text-main, #f8fafc);
        font-family: var(--font-mono, monospace);
        font-weight: 700;
      }

      .lore-stat-divider {
        color: rgba(255, 255, 255, 0.2);
        font-size: 0.9rem;
      }

      /* Toolbar Section */
      .lore-toolbar {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.85rem;
        position: sticky;
        top: 0.75rem;
        z-index: 30;
        backdrop-filter: blur(14px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      }

      .lore-toolbar-top {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) auto;
        gap: 0.75rem;
        align-items: center;
      }

      .lore-search {
        align-items: center;
        background: var(--bg-input, #0d121d);
        border: 1px solid var(--line);
        border-radius: 8px;
        display: flex;
        gap: 0.6rem;
        min-height: 44px;
        padding: 0 0.85rem;
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }

      .lore-search:focus-within {
        border-color: var(--border-focus, #38bdf8);
        box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
      }

      .lore-search-icon {
        color: var(--text-muted, #94a3b8);
        flex-shrink: 0;
      }

      .lore-search input {
        background: transparent;
        border: 0;
        color: var(--text-main, #fff);
        font: inherit;
        font-size: 0.92rem;
        height: 100%;
        min-width: 0;
        outline: none;
        width: 100%;
      }

      .lore-search input::placeholder {
        color: rgba(148, 163, 184, 0.65);
      }

      .lore-search-clear {
        align-items: center;
        background: rgba(255, 255, 255, 0.08);
        border: 0;
        border-radius: 9999px;
        color: var(--text-muted, #94a3b8);
        cursor: pointer;
        display: inline-flex;
        height: 26px;
        justify-content: center;
        width: 26px;
        flex-shrink: 0;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .lore-search-clear:hover {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
      }

      .lore-view-switcher {
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .lore-toolbar-status-row {
        align-items: center;
        display: flex;
        justify-content: space-between;
        padding: 0 0.25rem;
        font-size: 0.84rem;
        color: var(--text-muted, #94a3b8);
      }

      .lore-status-info {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .lore-status-count strong {
        color: var(--text-main, #fff);
        font-weight: 600;
      }

      .lore-status-category-tag {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 0.15rem 0.45rem;
        font-size: 0.78rem;
      }

      .lore-status-category-tag strong {
        color: var(--lore-gold);
      }

      .lore-reset-btn {
        align-items: center;
        justify-content: center;
        color: var(--text-muted, #94a3b8);
        display: inline-flex;
        gap: 0.45rem;
        min-height: 34px;
        padding: 0 0.75rem;
        font-size: 0.82rem;
        line-height: 1;
      }

      .lore-reset-btn:hover {
        color: var(--text-main, #fff);
      }

      /* Category Rail */
      .category-rail-container {
        margin-top: 0.75rem;
        position: relative;
        z-index: 10;
      }

      .category-rail {
        display: flex;
        gap: 0.45rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding-bottom: 0.25rem;
      }

      .category-rail::-webkit-scrollbar {
        display: none;
      }

      .category-pill {
        align-items: center;
        background: rgba(18, 20, 26, 0.75);
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text-muted, #94a3b8);
        cursor: pointer;
        display: inline-flex;
        flex: 0 0 auto;
        font: inherit;
        font-size: 0.84rem;
        font-weight: 500;
        gap: 0.45rem;
        min-height: 44px;
        padding: 0 0.85rem;
        touch-action: manipulation;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
      }

      .category-pill:hover {
        background: rgba(28, 32, 42, 0.85);
        border-color: rgba(255, 255, 255, 0.16);
        color: var(--text-main, #fff);
      }

      .category-pill:active {
        transform: scale(0.98);
      }

      .category-pill.active {
        background: color-mix(in srgb, var(--tone, var(--lore-gold)) 18%, #10141d);
        border-color: color-mix(in srgb, var(--tone, var(--lore-gold)) 50%, transparent);
        color: #fff;
        box-shadow: 0 0 16px color-mix(in srgb, var(--tone, var(--lore-gold)) 20%, transparent);
      }

      .category-pill-count {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 9999px;
        font-size: 0.74rem;
        font-family: var(--font-mono, monospace);
        font-weight: 600;
        padding: 0.1rem 0.4rem;
      }

      .category-pill.active .category-pill-count {
        background: color-mix(in srgb, var(--tone, var(--lore-gold)) 35%, transparent);
        color: #fff;
      }

      .category-pill-glyph {
        display: inline-flex;
        align-items: center;
      }

      /* Section Heading */
      .lore-section {
        margin-top: 1.75rem;
      }

      .section-heading {
        align-items: baseline;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .section-heading h2 {
        font-size: 1.45rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin: 0;
        color: var(--text-main, #fff);
      }

      .section-heading p {
        color: var(--text-muted, #94a3b8);
        font-size: 0.88rem;
        margin: 0;
      }

      /* Card Grids */
      .atlas-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      }

      .atlas-grid.tight {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }

      .atlas-grid.npc-atlas,
      .compact-grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      }

      /* Lore Card */
      .lore-card {
        background: rgba(18, 20, 26, 0.78);
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--lore-gold));
        border-radius: 10px;
        color: inherit;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        min-height: 44px;
        padding: 1.15rem;
        text-align: left;
        backdrop-filter: blur(8px);
        transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
      }

      .lore-card:hover {
        background: rgba(24, 28, 38, 0.9);
        border-color: color-mix(in srgb, var(--tone, var(--lore-gold)) 40%, transparent);
        border-left-color: var(--tone, var(--lore-gold));
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
        transform: translateY(-2px);
      }

      .lore-card:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .card-topline {
        align-items: center;
        color: color-mix(in srgb, var(--tone, var(--lore-gold)) 85%, white);
        display: inline-flex;
        font-size: 0.76rem;
        font-weight: 700;
        gap: 0.4rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .card-title {
        font-size: 1.15rem;
        font-weight: 700;
        line-height: 1.2;
        margin: 0;
        color: var(--text-main, #fff);
      }

      .card-summary {
        color: var(--text-muted, #94a3b8);
        font-size: 0.88rem;
        line-height: 1.55;
        margin: 0;
        flex-grow: 1;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .fact-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.25rem;
      }

      .fact-chip {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 4px;
        color: rgba(248, 250, 252, 0.82);
        font-size: 0.76rem;
        padding: 0.2rem 0.5rem;
      }

      .card-footer {
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        color: var(--text-muted, #94a3b8);
        display: flex;
        font-size: 0.78rem;
        justify-content: space-between;
        margin-top: 0.25rem;
        padding-top: 0.65rem;
      }

      .card-action-cue {
        align-items: center;
        color: color-mix(in srgb, var(--tone, var(--lore-gold)) 80%, white);
        display: inline-flex;
        gap: 0.25rem;
        font-weight: 600;
      }

      /* Compact Card */
      .compact-card {
        background: rgba(18, 20, 26, 0.78);
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--lore-gold));
        border-radius: 8px;
        color: inherit;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        min-height: 44px;
        padding: 0.9rem;
        text-align: left;
        backdrop-filter: blur(8px);
        transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
      }

      .compact-card:hover {
        background: rgba(24, 28, 38, 0.9);
        border-color: color-mix(in srgb, var(--tone, var(--lore-gold)) 40%, transparent);
        border-left-color: var(--tone, var(--lore-gold));
        transform: translateY(-2px);
      }

      .compact-card:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .compact-card-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      .compact-card-meta {
        color: var(--text-muted, #94a3b8);
        font-size: 0.74rem;
      }

      .compact-card-title {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-main, #fff);
      }

      .compact-card-detail {
        color: var(--text-muted, #94a3b8);
        font-size: 0.82rem;
        line-height: 1.45;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .compact-card-footer {
        align-items: center;
        color: color-mix(in srgb, var(--tone, var(--lore-gold)) 80%, white);
        display: inline-flex;
        font-size: 0.76rem;
        font-weight: 600;
        gap: 0.25rem;
        margin-top: 0.25rem;
      }

      /* NPC Network Panel */
      .npc-network-panel {
        background: rgba(14, 17, 23, 0.78);
        border: 1px solid var(--line);
        border-radius: 10px;
        margin-bottom: 1.25rem;
        padding: 1.25rem;
        backdrop-filter: blur(10px);
      }

      .npc-network-header {
        margin-bottom: 1rem;
      }

      .npc-network-title {
        align-items: center;
        color: var(--lore-cyan);
        display: inline-flex;
        font-size: 0.86rem;
        font-weight: 700;
        gap: 0.45rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .npc-network-header p {
        color: var(--text-muted, #94a3b8);
        font-size: 0.88rem;
        margin: 0.35rem 0 0;
      }

      .npc-network-grid {
        display: grid;
        gap: 0.85rem;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      }

      .npc-region-card {
        background: rgba(22, 26, 36, 0.65);
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--lore-gold));
        border-radius: 8px;
        padding: 1rem;
      }

      .npc-region-head {
        margin-bottom: 0.65rem;
      }

      .npc-region-category {
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .npc-region-title {
        font-size: 1.05rem;
        font-weight: 700;
        margin: 0.15rem 0 0.1rem;
        color: var(--text-main, #fff);
      }

      .npc-region-count {
        color: var(--text-muted, #94a3b8);
        font-size: 0.76rem;
      }

      .npc-chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .npc-chip-btn {
        align-items: baseline;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: var(--text-main, #fff);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        gap: 0.45rem;
        min-height: 44px;
        padding: 0.5rem 0.75rem;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
      }

      .npc-chip-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .npc-chip-btn:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .npc-chip-btn strong {
        font-size: 0.86rem;
      }

      .npc-chip-btn small {
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
      }

      /* Timeline */
      .timeline-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
      }

      .timeline-epoch-pills {
        display: flex;
        gap: 0.35rem;
        overflow-x: auto;
        padding-bottom: 0.25rem;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        -webkit-overflow-scrolling: touch;
      }

      .timeline-epoch-btn {
        align-items: center;
        background: rgba(18, 20, 26, 0.75);
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text-muted, #94a3b8);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 500;
        gap: 0.45rem;
        min-height: 40px;
        padding: 0 0.85rem;
        white-space: nowrap;
        flex: 0 0 auto;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
      }

      .timeline-epoch-btn:hover {
        background: rgba(26, 30, 42, 0.85);
        color: var(--text-main, #fff);
      }

      .timeline-epoch-btn.active {
        background: rgba(245, 176, 65, 0.15);
        border-color: var(--lore-gold);
        color: #fff;
        box-shadow: 0 0 16px rgba(245, 176, 65, 0.18);
      }

      .timeline-epoch-count {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 9999px;
        font-family: var(--font-mono, monospace);
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.1rem 0.45rem;
      }

      .timeline-epoch-btn.active .timeline-epoch-count {
        background: rgba(245, 176, 65, 0.35);
        color: #fff;
      }

      .timeline-sort-btn {
        flex: 0 0 auto;
        color: var(--text-muted, #94a3b8);
      }

      .timeline-sort-btn:hover {
        color: var(--text-main, #fff);
      }

      /* Timeline Architecture (Linear / Stripe Inspired Milestone Stream) */
      .timeline-track {
        display: flex;
        flex-direction: column;
        position: relative;
        padding-top: 0.5rem;
      }

      .timeline-spine-rail {
        background: linear-gradient(
          to bottom,
          rgba(245, 176, 65, 0.85) 0%,
          rgba(56, 189, 248, 0.85) 50%,
          rgba(248, 113, 113, 0.85) 85%,
          rgba(56, 189, 248, 0.7) 100%
        );
        content: "";
        left: 23px;
        position: absolute;
        width: 2px;
        z-index: 1;
        box-shadow: 0 0 10px rgba(245, 176, 65, 0.25);
      }

      .timeline-segment {
        position: relative;
      }

      /* Epoch Milestone Gates */
      .timeline-epoch-gate {
        display: flex;
        align-items: center;
        margin: 1.75rem 0 1.25rem 0;
        position: relative;
        z-index: 3;
      }

      .timeline-segment:first-child .timeline-epoch-gate {
        margin-top: 0.5rem;
      }

      .timeline-epoch-gate-badge {
        align-items: center;
        background: #0f121a;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 9999px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        display: inline-flex;
        gap: 0.55rem;
        padding: 0.35rem 0.95rem;
        position: relative;
        z-index: 2;
      }

      .timeline-epoch-gate.tone-gold .timeline-epoch-gate-badge {
        border-color: rgba(245, 176, 65, 0.45);
        box-shadow: 0 0 20px rgba(245, 176, 65, 0.15);
      }

      .timeline-epoch-gate.tone-cyan .timeline-epoch-gate-badge {
        border-color: rgba(56, 189, 248, 0.45);
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
      }

      .timeline-epoch-gate.tone-ruby .timeline-epoch-gate-badge {
        border-color: rgba(248, 113, 113, 0.45);
        box-shadow: 0 0 20px rgba(248, 113, 113, 0.15);
      }

      .timeline-epoch-gate-icon {
        color: var(--lore-gold);
        font-size: 0.9rem;
      }

      .timeline-epoch-gate.tone-cyan .timeline-epoch-gate-icon {
        color: var(--lore-cyan);
      }

      .timeline-epoch-gate.tone-ruby .timeline-epoch-gate-icon {
        color: #f87171;
      }

      .timeline-epoch-gate-title {
        color: var(--text-main, #fff);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      /* Timeline Row & Milestone Node */
      .timeline-row {
        display: grid;
        grid-template-columns: 48px 1fr;
        gap: 1.25rem;
        align-items: start;
        margin-bottom: 1.5rem;
        position: relative;
      }

      .timeline-node-col {
        align-items: center;
        display: flex;
        min-height: 44px;
        position: relative;
        z-index: 2;
      }

      .timeline-node-capsule {
        align-items: center;
        background: #0d1017;
        border: 2px solid rgba(255, 255, 255, 0.18);
        border-radius: 50%;
        display: flex;
        flex-shrink: 0;
        height: 38px;
        justify-content: center;
        margin-left: 5px;
        position: relative;
        width: 38px;
        z-index: 3;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      }

      .timeline-row.tone-gold .timeline-node-capsule {
        border-color: rgba(245, 176, 65, 0.75);
        color: var(--lore-gold);
        box-shadow: 0 0 14px rgba(245, 176, 65, 0.2);
      }

      .timeline-row.tone-cyan .timeline-node-capsule {
        border-color: rgba(56, 189, 248, 0.75);
        color: var(--lore-cyan);
        box-shadow: 0 0 14px rgba(56, 189, 248, 0.2);
      }

      .timeline-row.tone-ruby .timeline-node-capsule {
        border-color: rgba(248, 113, 113, 0.75);
        color: #f87171;
        box-shadow: 0 0 14px rgba(248, 113, 113, 0.2);
      }

      /* Horizontal Connector Leyline Beam */
      .timeline-connector-beam {
        background: rgba(255, 255, 255, 0.1);
        height: 2px;
        left: 43px;
        position: absolute;
        top: 19px;
        width: 25px;
        z-index: 1;
        transition: background 0.2s ease, box-shadow 0.2s ease;
      }

      .timeline-row:hover .timeline-node-capsule {
        transform: scale(1.15);
      }

      .timeline-row.tone-gold:hover .timeline-node-capsule {
        background: #1b160e;
        border-color: var(--lore-gold);
        box-shadow: 0 0 24px rgba(245, 176, 65, 0.55);
        color: #fff;
      }

      .timeline-row.tone-cyan:hover .timeline-node-capsule {
        background: #0d1a24;
        border-color: var(--lore-cyan);
        box-shadow: 0 0 24px rgba(56, 189, 248, 0.55);
        color: #fff;
      }

      .timeline-row.tone-ruby:hover .timeline-node-capsule {
        background: #220e10;
        border-color: #f87171;
        box-shadow: 0 0 24px rgba(248, 113, 113, 0.55);
        color: #fff;
      }

      .timeline-row.tone-gold:hover .timeline-connector-beam {
        background: linear-gradient(90deg, var(--lore-gold), rgba(245, 176, 65, 0.3));
        box-shadow: 0 0 10px rgba(245, 176, 65, 0.5);
      }

      .timeline-row.tone-cyan:hover .timeline-connector-beam {
        background: linear-gradient(90deg, var(--lore-cyan), rgba(56, 189, 248, 0.3));
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
      }

      .timeline-row.tone-ruby:hover .timeline-connector-beam {
        background: linear-gradient(90deg, #f87171, rgba(248, 113, 113, 0.3));
        box-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
      }

      /* Event Card */
      .timeline-card {
        background: rgba(18, 22, 30, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        padding: 1.25rem 1.4rem;
        position: relative;
        backdrop-filter: blur(8px);
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
      }

      .timeline-row:hover .timeline-card {
        background: rgba(24, 29, 40, 0.95);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
        transform: translateY(-2px);
      }

      .timeline-row.tone-gold:hover .timeline-card {
        border-color: rgba(245, 176, 65, 0.4);
      }

      .timeline-row.tone-cyan:hover .timeline-card {
        border-color: rgba(56, 189, 248, 0.4);
      }

      .timeline-row.tone-ruby:hover .timeline-card {
        border-color: rgba(248, 113, 113, 0.4);
      }

      .timeline-card-header {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .timeline-card-badges {
        align-items: center;
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .timeline-era-badge {
        border-radius: 6px;
        font-family: var(--font-mono, monospace);
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 0.3rem 0.65rem;
        text-transform: uppercase;
      }

      .timeline-row.tone-gold .timeline-era-badge {
        background: rgba(245, 176, 65, 0.12);
        border: 1px solid rgba(245, 176, 65, 0.35);
        color: var(--lore-gold);
      }

      .timeline-row.tone-cyan .timeline-era-badge {
        background: rgba(56, 189, 248, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.35);
        color: var(--lore-cyan);
      }

      .timeline-row.tone-ruby .timeline-era-badge {
        background: rgba(248, 113, 113, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.35);
        color: #f87171;
      }

      .timeline-tag-badge {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 5px;
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        padding: 0.25rem 0.55rem;
        text-transform: uppercase;
      }

      .timeline-excerpt-toggle {
        align-items: center;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: var(--text-muted, #94a3b8);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-size: 0.76rem;
        font-weight: 600;
        min-height: 32px;
        padding: 0.25rem 0.65rem;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }

      .timeline-excerpt-toggle:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.2);
        color: var(--text-main, #fff);
      }

      .timeline-title {
        color: var(--text-main, #fff);
        font-size: 1.22rem;
        font-weight: 700;
        line-height: 1.25;
        margin: 0;
      }

      .timeline-summary {
        color: var(--text-muted, #94a3b8);
        font-size: 0.92rem;
        line-height: 1.62;
        margin: 0;
      }

      .timeline-quick-read {
        background: rgba(0, 0, 0, 0.3);
        border-left: 3px solid var(--lore-gold);
        border-radius: 6px;
        margin-top: 0.25rem;
        padding: 0.75rem 1rem;
      }

      .timeline-row.tone-cyan .timeline-quick-read {
        border-left-color: var(--lore-cyan);
      }

      .timeline-row.tone-ruby .timeline-quick-read {
        border-left-color: #f87171;
      }

      .timeline-quick-read-label {
        color: var(--text-main, #fff);
        display: block;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        margin-bottom: 0.35rem;
        text-transform: uppercase;
      }

      .timeline-quick-read p {
        color: rgba(255, 255, 255, 0.78);
        font-size: 0.85rem;
        font-style: italic;
        line-height: 1.5;
        margin: 0;
      }

      .timeline-records {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-top: 0.4rem;
        padding-top: 0.65rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .timeline-records-heading {
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .timeline-record-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      .timeline-record-pill {
        align-items: center;
        background: rgba(255, 255, 255, 0.045);
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--lore-gold));
        border-radius: 6px;
        color: var(--text-main, #fff);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        gap: 0.45rem;
        min-height: 44px;
        padding: 0.35rem 0.75rem;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
      }

      .timeline-record-pill:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.2);
        border-left-color: var(--tone, var(--lore-gold));
        transform: translateY(-1px);
      }

      .timeline-record-pill:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .timeline-pill-glyph {
        color: var(--tone, var(--lore-gold));
        display: inline-flex;
        align-items: center;
      }

      .timeline-pill-title {
        font-size: 0.84rem;
        font-weight: 600;
      }

      .timeline-pill-cat {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 4px;
        color: var(--text-muted, #94a3b8);
        font-size: 0.7rem;
        padding: 0.1rem 0.35rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      /* Mystery Board */
      .board-controls {
        align-items: center;
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .board-picker {
        position: relative;
        max-width: 420px;
        width: 100%;
      }

      .board-picker-trigger {
        align-items: center;
        background: var(--bg-card, rgba(18, 20, 26, 0.85));
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text-main, #fff);
        cursor: pointer;
        display: flex;
        gap: 0.65rem;
        min-height: 44px;
        padding: 0.5rem 0.85rem;
        text-align: left;
        width: 100%;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .board-picker-trigger:hover {
        background: rgba(24, 28, 38, 0.95);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .board-picker-trigger:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .board-picker-mark {
        color: var(--tone, var(--lore-gold));
        display: inline-flex;
        align-items: center;
      }

      .board-picker-copy {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-width: 0;
      }

      .board-picker-copy small {
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .board-picker-copy strong {
        font-size: 0.92rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .board-picker-popover {
        background: #0f131b;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        left: 0;
        margin-top: 0.35rem;
        padding: 0.65rem;
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 50;
      }

      .board-picker-search {
        align-items: center;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid var(--line);
        border-radius: 6px;
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        min-height: 40px;
        padding: 0 0.65rem;
      }

      .board-picker-search input {
        background: transparent;
        border: 0;
        color: #fff;
        font: inherit;
        font-size: 0.88rem;
        outline: none;
        width: 100%;
      }

      .board-picker-categories {
        display: flex;
        gap: 0.35rem;
        overflow-x: auto;
        padding-bottom: 0.45rem;
        margin-bottom: 0.5rem;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        -webkit-overflow-scrolling: touch;
      }

      .board-picker-categories button {
        flex: 0 0 auto;
        white-space: nowrap;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--line);
        border-radius: 6px;
        color: var(--text-muted, #94a3b8);
        cursor: pointer;
        font: inherit;
        font-size: 0.76rem;
        font-weight: 500;
        min-height: 32px;
        padding: 0.3rem 0.65rem;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }

      .board-picker-categories button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-main, #fff);
      }

      .board-picker-categories button.active {
        background: color-mix(in srgb, var(--tone, var(--lore-gold)) 25%, transparent);
        border-color: var(--tone, var(--lore-gold));
        color: #fff;
      }

      .board-option-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-height: 240px;
        overflow-y: auto;
      }

      .board-option-list button {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 6px;
        color: var(--text-main, #fff);
        cursor: pointer;
        display: flex;
        font: inherit;
        gap: 0.5rem;
        min-height: 40px;
        padding: 0.45rem 0.65rem;
        text-align: left;
        width: 100%;
      }

      .board-option-list button:hover,
      .board-option-list button.active {
        background: rgba(255, 255, 255, 0.08);
      }

      .board-option-list button.selected {
        background: rgba(245, 176, 65, 0.15);
      }

      .board-option-list button strong {
        flex-grow: 1;
        font-size: 0.86rem;
      }

      .board-option-list button small {
        color: var(--text-muted, #94a3b8);
        font-size: 0.74rem;
      }

      .board-picker-empty {
        color: var(--text-muted, #94a3b8);
        font-size: 0.84rem;
        padding: 0.75rem;
        text-align: center;
      }

      .board-search-note {
        color: var(--lore-cyan);
        font-size: 0.82rem;
        margin: 0 0 0.75rem;
      }

      .mystery-board {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 340px 1fr;
      }

      .board-center {
        background: rgba(18, 20, 26, 0.82);
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--lore-gold));
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.25rem;
        backdrop-filter: blur(10px);
      }

      .board-center-badge {
        color: color-mix(in srgb, var(--tone, var(--lore-gold)) 85%, white);
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .board-center-title {
        font-size: 1.35rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-main, #fff);
      }

      .board-center-summary {
        color: var(--text-muted, #94a3b8);
        font-size: 0.88rem;
        line-height: 1.6;
        margin: 0;
      }

      .board-stat-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.4rem;
        margin: 0.25rem 0;
      }

      .board-stat-row span {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 6px;
        color: var(--text-muted, #94a3b8);
        font-size: 0.78rem;
        padding: 0.35rem 0.5rem;
      }

      .board-stat-row strong {
        color: var(--text-main, #fff);
        font-family: var(--font-mono, monospace);
        margin-right: 0.25rem;
      }

      .board-map {
        background: rgba(14, 17, 23, 0.75);
        border: 1px solid var(--line);
        border-radius: 10px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
        padding: 1.25rem;
        backdrop-filter: blur(10px);
      }

      .board-map-core {
        grid-column: 1 / -1;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .board-map-core span {
        color: var(--text-muted, #94a3b8);
        font-size: 0.76rem;
        text-transform: uppercase;
      }

      .board-map-core strong {
        font-size: 1.05rem;
        color: var(--text-main, #fff);
      }

      .board-node {
        background: rgba(22, 26, 36, 0.7);
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text-main, #fff);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-height: 44px;
        padding: 0.85rem;
        text-align: left;
        transition: transform 0.15s ease, border-color 0.15s ease;
      }

      .board-node:hover {
        background: rgba(28, 34, 46, 0.85);
        transform: translateY(-2px);
      }

      .board-node:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .board-node.canon {
        border-left: 3px solid #f5b041;
      }

      .board-node.inferred {
        border-left: 3px solid #38bdf8;
      }

      .board-node.theory {
        border-left: 3px dashed #f97316;
      }

      .board-node span {
        color: var(--text-muted, #94a3b8);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .board-node strong {
        font-size: 0.92rem;
      }

      .thread-list {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 0.75rem;
        margin-top: 0.5rem;
      }

      .thread-card {
        background: rgba(18, 20, 26, 0.65);
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text-main, #fff);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-height: 44px;
        padding: 0.85rem;
        text-align: left;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .thread-card:hover {
        background: rgba(26, 30, 40, 0.85);
        border-color: rgba(255, 255, 255, 0.18);
      }

      .thread-card:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .thread-card .confidence {
        font-size: 0.72rem;
        text-transform: uppercase;
        font-weight: 700;
      }

      .thread-card .confidence.canon {
        color: #f5b041;
      }

      .thread-card .confidence.inferred {
        color: #38bdf8;
      }

      .thread-card .confidence.theory {
        color: #f97316;
      }

      .thread-card strong {
        font-size: 0.95rem;
      }

      .thread-card small {
        color: var(--text-muted, #94a3b8);
        font-size: 0.78rem;
      }

      .thread-card em {
        color: rgba(248, 250, 252, 0.75);
        font-size: 0.82rem;
        font-style: normal;
        line-height: 1.45;
      }

      /* Theories */
      .theory-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 1rem;
      }

      .theory-card {
        background: rgba(18, 20, 26, 0.78);
        border: 1px solid var(--line);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        padding: 1.25rem;
        backdrop-filter: blur(8px);
      }

      .theory-card-header {
        margin-bottom: 0.25rem;
      }

      .theory-title {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-main, #fff);
      }

      .theory-premise {
        color: var(--text-muted, #94a3b8);
        font-size: 0.88rem;
        line-height: 1.55;
        margin: 0;
        flex-grow: 1;
      }

      .theory-evidence {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 0.65rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .theory-evidence-label {
        color: var(--text-muted, #94a3b8);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
      }

      .theory-evidence-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .theory-evidence-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: var(--text-main, #fff);
        cursor: pointer;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 500;
        min-height: 44px;
        padding: 0.35rem 0.65rem;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .theory-evidence-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }

      .theory-evidence-btn:focus-visible {
        outline: 2px solid var(--border-focus, #38bdf8);
        outline-offset: 2px;
      }

      .counterpoint {
        align-items: flex-start;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 6px;
        color: rgba(252, 165, 165, 0.9);
        display: flex;
        gap: 0.5rem;
        font-size: 0.8rem;
        line-height: 1.45;
        padding: 0.65rem;
      }

      .counterpoint svg {
        flex-shrink: 0;
        margin-top: 0.15rem;
      }

      .empty-thread {
        background: rgba(18, 20, 26, 0.6);
        border: 1px solid var(--line);
        border-radius: 8px;
        color: var(--text-muted, #94a3b8);
        font-size: 0.9rem;
        padding: 2rem;
        text-align: center;
      }

      /* Responsive Breakpoints */
      @media (max-width: 960px) {
        .lore-toolbar-top {
          grid-template-columns: 1fr;
        }

        .mystery-board {
          grid-template-columns: 1fr;
        }

        .board-controls {
          flex-direction: column;
          align-items: stretch;
        }

        .board-picker {
          max-width: 100%;
        }
      }

      @media (max-width: 640px) {
        .lore-page {
          padding: 1rem 1rem calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 24px);
        }

        .lore-hero h1 {
          font-size: 2.1rem;
        }

        .section-heading {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .atlas-grid,
        .atlas-grid.tight,
        .compact-grid,
        .theory-grid {
          grid-template-columns: 1fr;
        }

        .timeline-row {
          grid-template-columns: 36px 1fr;
          gap: 0.75rem;
        }

        .timeline-spine-rail {
          left: 17px;
        }

        .timeline-node-capsule {
          width: 32px;
          height: 32px;
          margin-left: 2px;
        }

        .timeline-connector-beam {
          left: 34px;
          width: 14px;
          top: 16px;
        }

        .timeline-card {
          padding: 1rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .lore-card,
        .compact-card,
        .npc-chip-btn,
        .timeline-record-pill,
        .timeline-node-capsule,
        .timeline-card,
        .timeline-connector-beam,
        .theory-evidence-btn,
        .board-node,
        .thread-card,
        .category-pill {
          transition: none !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}
