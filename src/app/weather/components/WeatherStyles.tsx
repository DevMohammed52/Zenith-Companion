"use client";

import React from "react";

export function WeatherStyles() {
  return (
    <style jsx global>{`
      .weather-container {
        position: relative;
        min-height: calc(100vh - 40px);
        width: 100%;
        max-width: 100vw;
        padding: clamp(1rem, 2.5vw, 2.5rem);
        color: var(--text-main, #f8fafc);
        background: transparent;
        overflow-x: clip;
      }

      .weather-container::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.55);
      }

      .weather-container,
      .weather-container * {
        box-sizing: border-box;
      }

      .weather-container :where(button, a) {
        touch-action: manipulation;
      }

      .weather-content-wrapper {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 1440px;
        margin: 0 auto;
        min-width: 0;
        padding-bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 32px);
      }

      /* Alert Slot */
      .weather-storm-alert-slot {
        margin-bottom: 1.25rem;
      }

      .weather-storm-action-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #f8fafc;
        text-decoration: underline;
        font-weight: 700;
        font-size: 0.82rem;
      }

      /* Header */
      .page-header {
        display: grid;
        grid-template-columns: minmax(320px, 1fr) minmax(340px, 1.2fr);
        gap: clamp(1.25rem, 2vw, 2rem);
        align-items: center;
        margin-bottom: 1.5rem;
        border: 1px solid var(--border-subtle, #222d42);
        border-left: 4px solid var(--accent, #60a5fa);
        border-radius: 12px;
        background: var(--bg-card, #151b2b);
        padding: clamp(1.25rem, 2vw, 1.75rem);
      }

      .header-eyebrow-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 0.5rem;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--accent, #60a5fa);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .header-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .header-text h1 {
        color: var(--text-main, #f8fafc);
        font-size: clamp(2rem, 3.5vw, 2.75rem);
        font-weight: 800;
        line-height: 1.1;
        margin: 0 0 0.5rem 0;
      }

      .header-text p {
        color: var(--text-muted, #8b9bb4);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0 0 1rem 0;
      }

      .weather-snapshot-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
      }

      .weather-snapshot-card {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        min-height: 44px;
        border: 1px solid var(--border-subtle, #222d42);
        border-radius: 8px;
        background: var(--bg-base, #0a0d14);
        color: var(--text-muted, #8b9bb4);
        padding: 0.5rem 0.75rem;
      }

      .weather-snapshot-card strong {
        margin-left: auto;
        color: var(--text-main, #f8fafc);
        font-variant-numeric: tabular-nums;
        font-weight: 700;
      }

      .weather-snapshot-card.good strong {
        color: #4ade80;
      }

      .weather-snapshot-card.bad strong {
        color: #f87171;
      }

      .weather-selector-shell {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .weather-selector-heading {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-muted, #8b9bb4);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      /* Main Grid */
      .main-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: clamp(1.25rem, 2vw, 2rem);
        align-items: start;
      }

      .active-info-panel {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        min-width: 0;
      }

      /* Weather Hero */
      .weather-hero-card {
        padding: clamp(1.25rem, 2vw, 1.75rem);
        box-shadow: 0 8px 32px -4px rgba(var(--weather-glow-rgb, 0, 0, 0), 0.12), 0 2px 8px rgba(0, 0, 0, 0.35);
        transition: box-shadow 400ms ease, border-color 400ms ease;
      }

      .weather-hero {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .hero-icon-shell {
        position: relative;
        flex: 0 0 auto;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        border: 1px solid var(--border-subtle, #222d42);
        background: var(--bg-base, #0a0d14);
      }

      .hero-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .hero-text h2 {
        font-size: clamp(1.5rem, 2.5vw, 2rem);
        font-weight: 800;
        margin: 0;
        line-height: 1.2;
      }

      .hero-text .description {
        color: var(--text-muted, #8b9bb4);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
      }

      /* Impact Grid */
      .impact-grid {
        min-width: 0;
      }

      .impact-card,
      .mf-card {
        padding: 1.25rem;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 1rem;
      }

      .card-header.compact {
        margin-bottom: 0.75rem;
      }

      .card-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .card-header-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: 1;
        gap: 8px;
      }

      .card-header h3 {
        font-size: 1.05rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-main, #f8fafc);
      }

      .mf-stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .mf-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 0.85rem;
        background: var(--bg-base, #0a0d14);
        border: 1px solid var(--border-subtle, #222d42);
        border-radius: 8px;
        text-align: center;
      }

      .mf-stat .label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted, #8b9bb4);
        text-transform: uppercase;
      }

      .modifier-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .modifier-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.65rem 0.85rem;
        background: var(--bg-base, #0a0d14);
        border: 1px solid var(--border-subtle, #222d42);
        border-radius: 8px;
        gap: 12px;
      }

      .modifier-skill {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-main, #f8fafc);
      }

      .modifier-badges {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* Forecast Strip */
      .forecast-strip {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }

      .forecast-strip-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-main, #f8fafc);
      }

      .forecast-strip-hint {
        font-size: 0.75rem;
        color: var(--text-muted, #8b9bb4);
        margin: 0;
      }

      .forecast-strip-track {
        display: flex;
        gap: 0.75rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding: 8px 6px 12px 6px;
        margin: -8px -6px 0 -6px;
        min-width: 0;
      }

      .forecast-pill {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 170px;
        max-width: 220px;
        flex: 0 0 auto;
        padding: 0.75rem 0.85rem;
        border-radius: 10px;
        border: 1px solid var(--border-subtle, #222d42);
        background: var(--bg-card, #151b2b);
        color: var(--text-main, #f8fafc);
        text-decoration: none;
        transition: transform 140ms cubic-bezier(0.16, 1, 0.3, 1), border-color 140ms ease, box-shadow 140ms ease;
      }

      .forecast-pill:hover {
        transform: translateY(-2px);
        border-color: var(--border-focus, #3b82f6);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      }

      .forecast-pill-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
      }

      .forecast-countdown {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--text-muted, #8b9bb4);
        font-variant-numeric: tabular-nums;
      }

      .forecast-pill strong {
        font-size: 0.92rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .forecast-pill small {
        font-size: 0.75rem;
        color: var(--text-muted, #8b9bb4);
      }

      .forecast-pill.empty {
        min-width: 240px;
      }

      /* Live Grid */
      .weather-live-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: clamp(1rem, 1.5vw, 1.5rem);
        min-width: 0;
      }

      .forecast-context-card,
      .current-enemy-card {
        padding: 1.25rem;
        box-shadow: 0 6px 24px -4px rgba(var(--weather-glow-rgb, 0, 0, 0), 0.08), 0 2px 8px rgba(0, 0, 0, 0.35);
        transition: box-shadow 400ms ease;
      }

      .forecast-lanes,
      .current-enemy-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .forecast-lane-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-muted, #8b9bb4);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 0.5rem;
      }

      .forecast-location-list,
      .current-enemy-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .forecast-location-card {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0.65rem 0.85rem;
        background: var(--bg-base, #0a0d14);
        border: 1px solid var(--border-subtle, #222d42);
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-main, #f8fafc);
        transition: border-color 120ms ease;
      }

      .forecast-location-card:hover {
        border-color: var(--border-focus, #3b82f6);
      }

      .forecast-location-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .forecast-location-top strong {
        font-size: 0.88rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .forecast-countdown-pill {
        font-size: 0.72rem;
        font-weight: 700;
        color: #60a5fa;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .forecast-location-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .forecast-location-bottom small {
        font-size: 0.72rem;
        color: var(--text-muted, #8b9bb4);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .forecast-location-badges {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }

      /* Current Enemy Link */
      .current-enemy-link {
        display: flex;
        align-items: center;
        padding: 0.55rem 0.75rem;
        background: var(--bg-base, #0a0d14);
        border: 1px solid var(--border-subtle, #222d42);
        border-radius: 8px;
        text-decoration: none;
        color: var(--text-main, #f8fafc);
        gap: 10px;
        min-height: 48px;
        transition: border-color 120ms ease;
      }

      .current-enemy-link:hover {
        border-color: var(--border-focus, #3b82f6);
      }

      .enemy-avatar-shell {
        flex: 0 0 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: var(--bg-card, #151b2b);
        overflow: hidden;
      }

      .enemy-info-col {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
        flex: 1;
      }

      .enemy-info-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .enemy-info-top strong {
        font-size: 0.88rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .enemy-info-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .enemy-info-bottom small {
        font-size: 0.72rem;
        color: var(--text-muted, #8b9bb4);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Enemy Preferences Card */
      .enemy-weather-card {
        padding: 1.25rem;
      }

      .enemy-filter-bar {
        margin-bottom: 1rem;
      }

      .enemy-weather-groups {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      .enemy-pref-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0.85rem;
        background: var(--bg-base, #0a0d14);
        border: 1px solid var(--border-subtle, #222d42);
        border-radius: 10px;
      }

      .enemy-pref-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .enemy-pref-heading h4 {
        margin: 0;
        font-size: 0.92rem;
        font-weight: 700;
        color: var(--text-main, #f8fafc);
      }

      .enemy-pref-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .enemy-pref-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.45rem 0.65rem;
        background: var(--bg-card, #151b2b);
        border: 1px solid var(--border-subtle, #222d42);
        border-radius: 6px;
        text-decoration: none;
        color: var(--text-main, #f8fafc);
        min-height: 44px;
        transition: border-color 120ms ease;
      }

      .enemy-pref-link:hover {
        border-color: var(--border-focus, #3b82f6);
      }

      .enemy-pref-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
      }

      .enemy-pref-text strong {
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .enemy-pref-text small {
        font-size: 0.72rem;
        color: var(--text-muted, #8b9bb4);
      }

      .enemy-pref-more {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-muted, #8b9bb4);
        text-decoration: none;
        padding: 0.5rem;
        border-radius: 6px;
        background: var(--bg-card, #151b2b);
        min-height: 44px;
      }

      .enemy-pref-more:hover {
        color: var(--text-main, #f8fafc);
      }

      /* Mechanics Aside */
      .mechanics-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: sticky;
        top: 80px;
      }

      .mechanics-card,
      .weather-tip {
        padding: 1.25rem;
        box-shadow: 0 6px 24px -4px rgba(var(--weather-glow-rgb, 0, 0, 0), 0.08), 0 2px 8px rgba(0, 0, 0, 0.35);
        transition: box-shadow 400ms ease;
      }

      .mechanics-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .mech-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .mech-item h4 {
        margin: 0 0 2px 0;
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--text-main, #f8fafc);
      }

      .mech-item p {
        margin: 0;
        font-size: 0.82rem;
        line-height: 1.45;
        color: var(--text-muted, #8b9bb4);
      }

      .weather-tip-content {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .weather-tip-content p {
        margin: 0;
        font-size: 0.84rem;
        line-height: 1.45;
        color: var(--text-main, #f8fafc);
      }



      /* Responsive Layout */
      @media (max-width: 1024px) {
        .page-header {
          grid-template-columns: 1fr;
        }

        .main-grid {
          grid-template-columns: 1fr;
        }

        .mechanics-panel {
          position: static;
        }
      }

      @media (max-width: 768px) {
        .weather-container {
          padding: 1rem;
        }

        .weather-live-grid {
          grid-template-columns: 1fr;
        }

        .enemy-weather-groups {
          grid-template-columns: 1fr;
        }

        .mf-stats {
          grid-template-columns: 1fr;
        }

        .weather-snapshot-grid {
          grid-template-columns: 1fr;
        }

        .weather-hero {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .weather-container *,
        .weather-container *::before,
        .weather-container *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
