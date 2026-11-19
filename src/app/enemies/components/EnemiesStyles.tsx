"use client";

import React from "react";

export function EnemiesStyles() {
  return (
    <style jsx global>{`
        .enemy-db-page {
          min-height: calc(100vh - 40px);
          padding: clamp(0.85rem, 1.6vw, 1.5rem);
          overflow-x: hidden;
          isolation: isolate;
          background: var(--bg-base);
        }
        .enemy-db-page,
        .enemy-db-page * {
          box-sizing: border-box;
        }
        .enemy-db-page :where(button, a, input, summary):focus-visible {
          outline: 2px solid var(--border-focus);
          outline-offset: 2px;
        }
        .enemy-hero {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
          max-width: 1480px;
          margin: 0 auto 0.8rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .enemy-hero h1 {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: #fff;
          font-size: clamp(1.9rem, 3vw, 2.8rem);
          line-height: 1;
        }
        .enemy-hero h1 :global(svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .enemy-hero p {
          margin-top: 0.45rem;
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .hero-meta {
          display: grid;
          justify-items: end;
          gap: 0.1rem;
          flex: 0 0 auto;
          border: 1px solid rgba(45, 212, 191, 0.22);
          border-radius: 999px;
          background: rgba(45, 212, 191, 0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          padding: 0.55rem 0.85rem;
          transition: border-color 0.16s ease, background 0.16s ease;
        }
        .hero-meta:hover {
          border-color: rgba(45, 212, 191, 0.38);
          background: rgba(45, 212, 191, 0.12);
        }
        .hero-meta span {
          color: var(--text-accent);
          display: block;
          font-family: var(--font-mono);
          font-weight: 900;
        }
        .hero-meta small {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 850;
        }
        .enemy-controls {
          display: grid;
          grid-template-columns: minmax(240px, 1.35fr) repeat(4, minmax(126px, 0.8fr)) minmax(92px, 0.45fr);
          gap: 0.65rem;
          align-items: end;
          max-width: 1480px;
          margin: 0 auto 0.85rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(10, 10, 13, 0.76);
          box-shadow: 0 12px 30px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.04);
          padding: 0.75rem;
          position: relative;
          z-index: 20;
        }
        .controls-heading {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          padding-bottom: 0.25rem;
        }
        .controls-heading > span {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .controls-heading > span :global(svg) {
          color: var(--text-accent);
        }
        .controls-heading small {
          min-width: 0;
          color: var(--text-muted);
          font-size: 0.76rem;
          font-weight: 850;
        }
        .controls-heading button {
          display: inline-flex;
          align-items: center;
          gap: 0.38rem;
          min-height: 44px;
          margin-left: auto;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 900;
          padding: 0 0.6rem;
          transition: background 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
        }
        .controls-heading button:disabled {
          cursor: default;
          opacity: 0.45;
        }
        .controls-heading button:not(:disabled):hover {
          border-color: rgba(56,189,248,0.35);
          background: rgba(56,189,248,0.1);
        }
        .enemy-filter-panel {
          grid-column: span 5;
          min-width: 0;
        }
        .enemy-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(126px, 1fr)) minmax(92px, 0.45fr);
          gap: 0.65rem;
          align-items: end;
          min-width: 0;
        }
        .enemy-filter-panel summary {
          display: none;
        }
        .search-control,
        :global(.custom-select) {
          position: relative;
          display: grid;
          gap: 0.35rem;
          min-width: 0;
        }
        :global(.custom-select.open) {
          z-index: 120;
        }
        .search-control > span,
        :global(.custom-select label) {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .search-control div {
          display: flex;
          align-items: center;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(0,0,0,0.42);
          overflow: hidden;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }
        .search-icon {
          display: grid;
          place-items: center;
          align-self: stretch;
          flex: 0 0 auto;
          width: 2.25rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-icon :global(svg) {
          display: block;
        }
        :global(.select-trigger),
        .sort-direction {
          width: 100%;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(0,0,0,0.42);
          color: #fff;
          font: inherit;
          font-weight: 850;
          transition: border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
        }
        .search-control input {
          min-width: 0;
          width: 100%;
          min-height: 42px;
          border: 0;
          background: transparent;
          color: #fff;
          font: inherit;
          font-weight: 850;
          padding: 0 0.75rem 0 0;
          outline: none;
        }
        .search-control div:focus-within {
          border-color: rgba(176, 130, 255, 0.56);
          box-shadow: 0 0 0 3px rgba(176, 130, 255, 0.12);
        }
        :global(.select-trigger),
        .sort-direction {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0 0.65rem;
        }
        :global(.select-trigger:hover),
        .sort-direction:hover {
          border-color: rgba(255,255,255,0.14);
          background: var(--bg-card);
        }
        :global(.custom-select.open .select-trigger),
        :global(.select-trigger:focus-visible),
        .sort-direction:focus-visible {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
          outline: none;
        }
        :global(.select-trigger span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.select-trigger svg) {
          color: var(--text-muted);
          flex: 0 0 auto;
          transition: transform 0.16s ease, color 0.16s ease;
        }
        :global(.custom-select.open .select-trigger svg) {
          color: var(--text-accent);
          transform: rotate(180deg);
        }
        :global(.select-menu) {
          position: absolute;
          top: calc(100% + 0.35rem);
          left: 0;
          right: 0;
          z-index: 130;
          display: grid;
          max-height: min(var(--enemy-select-max-height, 300px), 58vh);
          overflow: auto;
          overscroll-behavior: contain;
          border: 1px solid var(--border-focus);
          border-radius: 8px;
          background: color-mix(in srgb, var(--bg-base), black 18%);
          box-shadow: 0 14px 34px rgba(0,0,0,0.38), 0 0 0 1px rgba(56,189,248,0.08);
          padding: 0.3rem;
          transform-origin: top center;
          animation: enemyMenuReveal 0.16s ease-out both;
        }
        :global(.custom-select.open-up .select-menu) {
          bottom: calc(100% + 0.35rem);
          top: auto;
          transform-origin: bottom center;
        }
        :global(.select-menu button) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.65rem;
          min-height: 44px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font: inherit;
          font-weight: 850;
          text-align: left;
          padding: 0 0.6rem;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }
        :global(.select-menu button span) {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.select-menu button svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        :global(.select-menu button:hover),
        :global(.select-menu button.selected),
        :global(.select-menu button.active) {
          background: color-mix(in srgb, var(--text-accent), transparent 84%);
          border-color: rgba(56,189,248,0.24);
          color: #fff;
        }
        .enemy-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.55rem;
          max-width: 1480px;
          margin: 0 auto 0.75rem;
          position: relative;
          z-index: 1;
        }
        .enemy-summary div {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 0.55rem;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          background: rgba(255,255,255,0.035);
          padding: 0.62rem 0.7rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
          transition: none;
        }
        .enemy-summary span {
          color: var(--text-muted);
          font-weight: 850;
        }
        .enemy-summary strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .enemy-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 0.75rem;
          max-width: 1480px;
          margin: 0 auto;
          position: relative;
          z-index: 0;
        }
        .enemy-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) auto;
          gap: 0.65rem;
          align-items: center;
          min-width: 0;
          min-height: 82px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: var(--bg-card);
          color: inherit;
          cursor: pointer;
          padding: 0.66rem;
          text-align: left;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          transition: border-color 0.18s ease, background 0.18s ease;
        }
        .enemy-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: var(--text-muted);
          opacity: 0.48;
          z-index: -1;
        }
        .enemy-card.good::before {
          background: #5eead4;
        }
        .enemy-card.bad::before {
          background: #f87171;
        }
        .enemy-card.neutral::before {
          background: #d1d5db;
        }
        .enemy-card.muted::before {
          opacity: 0.28;
        }
        .enemy-card:hover,
        .enemy-card:focus-visible {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
          box-shadow: inset 3px 0 0 var(--border-focus), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .enemy-card-art {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px;
          background: rgba(0,0,0,0.25);
        }
        .enemy-card-art img {
          width: 42px;
          height: 42px;
          object-fit: contain;
        }
        .enemy-card-main {
          display: grid;
          gap: 0.28rem;
          min-width: 0;
        }
        .enemy-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }
        .enemy-title-row strong {
          min-width: 0;
          color: #fff;
          display: -webkit-box;
          font-size: 1rem;
          line-height: 1.18;
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .enemy-title-row em {
          flex: 0 0 auto;
          color: var(--text-accent);
          font-family: var(--font-mono);
          font-style: normal;
          font-weight: 900;
        }
        .enemy-card-main small {
          color: var(--text-muted);
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .match-chip {
          justify-self: start;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          padding: 0.26rem 0.52rem;
        }
        .match-chip.good {
          border-color: rgba(45, 212, 191, 0.3);
          background: rgba(45, 212, 191, 0.09);
          color: #5eead4;
        }
        .match-chip.bad {
          border-color: rgba(248, 113, 113, 0.28);
          background: rgba(248, 113, 113, 0.09);
          color: #fca5a5;
        }
        .match-chip.neutral {
          color: #d1d5db;
        }
        .enemy-card-stats {
          display: grid;
          justify-items: end;
          gap: 0.35rem;
          white-space: nowrap;
        }
        .enemy-card-stats span {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 850;
        }
        .enemy-card-stats strong {
          color: var(--text-success);
          font-family: var(--font-mono);
        }
        .enemy-card-window {
          display: inline-flex;
          align-items: center;
          gap: 0.34rem;
          min-width: 0;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 850;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .enemy-card-window :global(svg) {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .enemy-empty {
          display: grid;
          justify-items: center;
          gap: 0.85rem;
          grid-column: 1 / -1;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          font-weight: 850;
          padding: 1.5rem;
          text-align: center;
        }
        .enemy-empty button {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          min-height: 44px;
          border: 1px solid rgba(56,189,248,0.26);
          border-radius: 7px;
          background: rgba(56,189,248,0.1);
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 900;
          padding: 0 0.75rem;
          transition: background 0.16s ease, border-color 0.16s ease;
        }
        .enemy-empty button:hover {
          border-color: rgba(56,189,248,0.42);
          background: rgba(56,189,248,0.16);
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
        :global(.enemy-modal-overlay) {
          position: fixed;
          inset: 0;
          z-index: 7000;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,0.84);
          padding: 1rem;
          animation: enemyBackdropIn 0.18s ease-out both;
        }
        :global(.enemy-modal) {
          width: min(100%, 940px);
          max-height: min(90vh, 820px);
          overflow: auto;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          background: var(--bg-panel);
          box-shadow: 0 24px 64px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.05);
          animation: enemyModalIn 0.2s cubic-bezier(0.2, 0.72, 0.22, 1) both;
        }
        :global(.enemy-modal-header) {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 1rem;
        }
        :global(.modal-title-row) {
          display: flex;
          gap: 0.85rem;
          align-items: center;
          flex: 1 1 auto;
          min-width: 0;
        }
        :global(.modal-title-row > div) {
          min-width: 0;
        }
        :global(.modal-title-row img) {
          width: 56px;
          height: 56px;
          object-fit: contain;
        }
        :global(.modal-title-row span) {
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        :global(.modal-title-row h2) {
          color: #fff;
          font-size: 1.55rem;
          line-height: 1.1;
          overflow-wrap: anywhere;
        }
        :global(.modal-title-row p) {
          margin-top: 0.15rem;
          color: var(--text-muted);
        }
        :global(.modal-close) {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          color: #fff;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease;
        }
        :global(.modal-close:hover) {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
        }
        :global(.enemy-modal-body) {
          display: grid;
          gap: 0.8rem;
          padding: 1rem;
        }
        :global(.modal-stat-grid) {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.6rem;
        }
        :global(.modal-stat-grid div) {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.4rem 0.55rem;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.035);
          padding: 0.75rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        }
        :global(.modal-stat-grid strong) {
          grid-column: 1 / -1;
          color: #fff;
          font-family: var(--font-mono);
        }
        :global(.modal-stat-grid span) {
          color: var(--text-muted);
          font-weight: 850;
        }
        :global(.detail-card) {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          padding: 0.85rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        }
        :global(.detail-card header) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.65rem;
        }
        :global(.detail-card header span) {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        :global(.detail-card p) {
          color: var(--text-muted);
          line-height: 1.5;
        }
        :global(.detail-card p strong) {
          color: #fff;
        }
        :global(.preference-pills) {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.75rem;
        }
        :global(.preference-pill) {
          display: inline-flex;
          gap: 0.4rem;
          max-width: 100%;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
          font-size: 0.76rem;
          font-weight: 850;
          line-height: 1.35;
          overflow-wrap: anywhere;
          padding: 0.34rem 0.58rem;
        }
        :global(.preference-pill strong) {
          color: #fff;
        }
        :global(.preference-pill.good) {
          border-color: rgba(45, 212, 191, 0.24);
          background: rgba(45, 212, 191, 0.08);
        }
        :global(.preference-pill.bad) {
          border-color: rgba(248, 113, 113, 0.24);
          background: rgba(248, 113, 113, 0.08);
        }
        :global(.loot-list) {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.5rem;
        }
        :global(.loot-button) {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 0.55rem;
          align-items: center;
          min-height: 56px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          color: inherit;
          cursor: pointer;
          padding: 0.5rem;
          text-align: left;
          transition: border-color 0.16s ease, background 0.16s ease;
        }
        :global(.loot-button:hover),
        :global(.loot-button:focus-visible) {
          border-color: var(--border-focus);
          background: rgba(56,189,248,0.08);
        }
        :global(.loot-button img) {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }
        :global(.loot-button span) {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }
        :global(.loot-button strong) {
          min-width: 0;
          overflow: hidden;
          color: #fff;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.loot-button small) {
          color: var(--text-muted);
          font-weight: 800;
        }
        :global(.detail-links) {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.5rem;
        }
        :global(.detail-links a) {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.035);
          color: #fff;
          font-weight: 850;
          text-decoration: none;
          transition: border-color 0.16s ease, background 0.16s ease;
        }
        :global(.detail-links a:hover),
        :global(.detail-links a:focus-visible) {
          border-color: var(--border-focus);
          background: rgba(56,189,248,0.08);
        }
        .empty-inline {
          color: var(--text-muted);
          font-weight: 850;
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
        @keyframes enemyBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes enemyModalIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .enemy-hero,
          .enemy-summary,
          .enemy-controls,
          .enemy-grid,
          :global(.select-menu),
          :global(.enemy-modal-overlay),
          :global(.enemy-modal) {
            animation: none !important;
          }
          .hero-meta,
          .controls-heading button,
          .search-control div,
          :global(.select-trigger),
          .sort-direction,
          :global(.select-trigger svg),
          :global(.select-menu button),
          .enemy-summary div,
          .enemy-card,
          .enemy-empty button,
          :global(.modal-close),
          :global(.loot-button),
          :global(.detail-links a) {
            transition: none !important;
          }
          .hero-meta:hover,
          .enemy-card:hover,
          .enemy-card:focus-visible,
          .enemy-summary div:hover {
            transform: none !important;
          }
        }
        @media (max-width: 1360px) {
          .enemy-controls {
            grid-template-columns: minmax(240px, 1.35fr) repeat(4, minmax(120px, 0.8fr)) minmax(88px, 0.45fr);
          }
          .enemy-filter-grid {
            grid-template-columns: repeat(4, minmax(120px, 1fr)) minmax(88px, 0.45fr);
          }
        }
        @media (max-width: 900px) {
          .enemy-controls {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .enemy-filter-panel {
            grid-column: 1 / -1;
          }
          .enemy-filter-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .search-control,
          .sort-direction {
            grid-column: span 3;
          }
          .controls-heading {
            grid-column: 1 / -1;
          }
          .enemy-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .enemy-db-page {
            padding: 0.8rem;
          }
          .enemy-hero,
          :global(.modal-stat-grid),
          :global(.detail-links) {
            grid-template-columns: 1fr;
          }
          .enemy-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .enemy-summary div {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 0.3rem 0.45rem;
            padding: 0.55rem 0.6rem;
          }
          .enemy-summary strong {
            grid-column: 1 / -1;
          }
          .enemy-hero {
            align-items: flex-start;
            flex-direction: column;
          }
          .enemy-hero h1 {
            font-size: clamp(1.55rem, 8vw, 2rem);
          }
          .hero-meta {
            justify-items: start;
          }
          .controls-heading {
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .controls-heading small {
            flex: 1 1 auto;
          }
          .enemy-controls {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .search-control {
            grid-column: 1 / -1;
          }
          .enemy-filter-panel {
            display: block;
            grid-column: 1 / -1;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(255,255,255,0.025);
            overflow: visible;
          }
          .enemy-filter-panel summary {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto auto;
            align-items: center;
            gap: 0.55rem;
            min-height: 44px;
            color: #fff;
            cursor: pointer;
            font-size: 0.82rem;
            font-weight: 900;
            list-style: none;
            padding: 0.55rem 0.65rem;
          }
          .enemy-filter-panel summary::-webkit-details-marker {
            display: none;
          }
          .enemy-filter-panel summary span {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            min-width: 0;
          }
          .enemy-filter-panel summary span :global(svg) {
            color: var(--text-accent);
            flex: 0 0 auto;
          }
          .enemy-filter-panel summary small {
            color: var(--text-muted);
            font-size: 0.72rem;
            font-weight: 850;
          }
          .enemy-filter-panel summary > :global(svg) {
            color: var(--text-muted);
            transition: transform 0.16s ease, color 0.16s ease;
          }
          .enemy-filter-panel[open] summary > :global(svg) {
            color: var(--text-accent);
            transform: rotate(180deg);
          }
          .enemy-filter-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem;
            border-top: 1px solid rgba(255,255,255,0.07);
            padding: 0.65rem;
          }
          .sort-direction {
            grid-column: auto;
          }
          .enemy-controls {
            padding: 0.7rem;
          }
          .enemy-grid {
            grid-template-columns: 1fr;
          }
          .enemy-card {
            grid-template-columns: 48px minmax(0, 1fr);
            min-height: 76px;
          }
          .enemy-card-art {
            width: 48px;
            height: 48px;
          }
          .enemy-card-art img {
            width: 38px;
            height: 38px;
          }
          .enemy-card-stats {
            grid-column: 1 / -1;
            display: flex;
            justify-content: space-between;
          }
          :global(.enemy-modal-overlay) {
            align-items: stretch;
            padding: 0.6rem;
          }
          :global(.enemy-modal) {
            max-height: calc(100vh - 1.2rem);
          }
          :global(.enemy-modal-header) {
            position: sticky;
            top: 0;
            z-index: 2;
            background: #10131a;
          }
          :global(.loot-list) {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 520px) {
          .enemy-controls {
            grid-template-columns: 1fr;
          }
          .sort-direction {
            grid-column: 1 / -1;
          }
          .enemy-filter-grid {
            grid-template-columns: 1fr;
          }
          .controls-heading {
            align-items: center;
            flex-wrap: nowrap;
          }
          .controls-heading small {
            display: none;
          }
          .controls-heading button {
            width: auto;
            justify-content: center;
            margin-left: auto;
          }
          .enemy-summary {
            gap: 0.45rem;
          }
          .enemy-card {
            gap: 0.55rem;
            padding: 0.62rem;
          }
          .enemy-title-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.18rem;
          }
          :global(.select-menu) {
            max-height: min(var(--enemy-select-max-height, 300px), 44vh);
          }
        }
    `}</style>
  );
}
