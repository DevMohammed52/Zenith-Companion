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
          padding: 2rem;
          color: #fff;
          overflow-x: clip;
          background: #020617;
        }
        .weather-container, .weather-container * { box-sizing: border-box; }
        .weather-container {
          -webkit-tap-highlight-color: transparent;
        }
        .weather-container :where(button, a) {
          touch-action: manipulation;
        }
        .weather-container::before,
        .weather-container::after {
          display: none;
        }

        .weather-glow {
          display: none;
        }
        .weather-atmosphere {
          display: none;
        }

        .content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
          min-width: 0;
        }

        .page-header {
          display: grid;
          grid-template-columns: minmax(320px, 0.82fr) minmax(420px, 1.18fr);
          gap: clamp(1rem, 2vw, 1.6rem);
          align-items: stretch;
          margin-bottom: 1.2rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-left: 3px solid color-mix(in srgb, var(--accent), transparent 36%);
          border-radius: 8px;
          background: rgba(8, 10, 18, 0.74);
          padding: clamp(1rem, 1.6vw, 1.35rem);
          text-align: left;
          animation: rise-in 0.55s ease both;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--accent);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .header-text {
          display: grid;
          align-content: center;
          min-width: 0;
        }
        .header-text h1 {
          color: #fff;
          font-size: clamp(2.45rem, 4vw, 4rem);
          font-weight: 850;
          letter-spacing: 0;
          line-height: 0.96;
          margin-bottom: 0.65rem;
        }
        .header-text p {
          color: rgba(255,255,255,0.64);
          font-size: 1.02rem;
          font-weight: 700;
          line-height: 1.45;
          max-width: 42rem;
          margin: 0;
        }
        .weather-snapshot-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
          margin-top: 1rem;
        }
        .weather-snapshot-card {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          min-height: 2.35rem;
          border: 1px solid rgba(255,255,255,0.075);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.72);
          padding: 0.32rem 0.62rem;
        }
        .weather-snapshot-card svg {
          color: var(--accent);
          flex: 0 0 auto;
        }
        .weather-snapshot-card span {
          min-width: 0;
          overflow: hidden;
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.03em;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .weather-snapshot-card strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.86rem;
          font-weight: 950;
        }
        .weather-snapshot-card.good strong {
          color: #9af5c9;
        }
        .weather-snapshot-card.bad strong {
          color: #fecdd3;
        }

        .weather-selector-shell {
          position: relative;
          display: grid;
          align-content: center;
          margin-top: 0;
          min-width: 0;
        }
        .weather-selector-shell::before,
        .weather-selector-shell::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          z-index: 2;
          width: 2.4rem;
          pointer-events: none;
          display: none;
        }
        .weather-selector-shell::before,
        .weather-selector-shell::after {
          display: none;
        }
        .weather-selector {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
          padding: 0;
          overflow: visible;
        }

        .weather-btn {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 0.72rem 0.82rem;
          border-radius: 8px;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
          white-space: nowrap;
          font-weight: 700;
          font-size: 0.8rem;
          min-width: 0;
        }
        .weather-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
        }
        .weather-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
          transform: translateY(-1px);
        }
        .weather-btn.active {
          background: color-mix(in srgb, var(--accent), transparent 85%);
          border-color: color-mix(in srgb, var(--accent), transparent 30%);
          color: #fff;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(330px, 390px);
          gap: clamp(1rem, 2vw, 1.6rem);
          align-items: start;
        }

        .active-info-panel {
          position: relative;
          background: var(--bg-panel);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: clamp(1.35rem, 2.2vw, 2.45rem);
          animation: rise-in 0.65s 0.05s ease both;
          min-width: 0;
          overflow: hidden;
        }
        .active-info-panel::before {
          display: none;
        }
        .active-info-panel > * {
          position: relative;
          z-index: 1;
        }

        .weather-hero { display: flex; align-items: center; gap: clamp(1.4rem, 2.4vw, 2.4rem); margin-bottom: clamp(1.7rem, 2.4vw, 2.6rem); }
        .hero-icon-shell {
          position: relative;
          display: grid;
          place-items: center;
          width: 9.25rem;
          min-width: 9.25rem;
          height: 9.25rem;
        }
        .weather-seal {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--accent), transparent 72%);
          opacity: 0.82;
          animation: seal-drift 16s linear infinite;
        }
        .hero-icon {
          position: relative;
          display: grid;
          place-items: center;
          width: 6.3rem;
          height: 6.3rem;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.2);
          animation: float-icon 4.5s ease-in-out infinite;
        }
        .hero-text h2 { font-size: clamp(2.4rem, 4.2vw, 3.6rem); font-weight: 850; margin-bottom: 0.75rem; letter-spacing: 0; }
        .hero-text .description { font-size: 1rem; color: rgba(255,255,255,0.66); line-height: 1.55; max-width: 650px; }

        .impact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 2rem; }
        .impact-card, .mf-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          padding: clamp(1.2rem, 1.8vw, 2rem);
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
          min-width: 0;
        }

        .enemy-weather-card {
          margin-top: 2rem;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          padding: 2rem;
        }
        :global(.forecast-strip) {
          position: relative;
          margin-top: 2rem;
          border: 1px solid color-mix(in srgb, var(--accent), transparent 76%);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          padding: 1rem;
          overflow: hidden;
        }
        :global(.forecast-strip.scrollable::before),
        :global(.forecast-strip.scrollable::after) {
          content: "";
          position: absolute;
          z-index: 1;
          top: 3.85rem;
          bottom: 1.35rem;
          width: 1.25rem;
          pointer-events: none;
        }
        :global(.forecast-strip.scrollable::before),
        :global(.forecast-strip.scrollable::after) {
          display: none;
        }
        :global(.forecast-strip-label) {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: rgba(255,255,255,0.72);
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }
        :global(.forecast-strip-label svg) {
          color: var(--accent);
        }
        :global(.forecast-strip-hint) {
          display: none;
          margin: -0.25rem 0 0.65rem;
          color: rgba(255,255,255,0.48);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        :global(.forecast-strip-track) {
          position: relative;
          display: flex;
          gap: 0.7rem;
          overflow-x: auto;
          scroll-snap-type: x proximity;
          padding-bottom: 0.15rem;
          scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--accent), transparent 50%) transparent;
        }
        :global(.forecast-pill) {
          position: relative;
          flex: 0 0 13.5rem;
          display: grid;
          gap: 0.35rem;
          min-height: 6.2rem;
          padding: 0.85rem;
          border-radius: 8px;
          color: inherit;
          text-decoration: none;
          scroll-snap-align: start;
          border: 1px solid rgba(255,255,255,0.065);
          background: rgba(0,0,0,0.2);
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }
        :global(.forecast-pill::before) {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          border-radius: 8px 0 0 8px;
          background: color-mix(in srgb, var(--accent), white 8%);
          opacity: 0.85;
        }
        :global(.forecast-pill.next::before) {
          background: color-mix(in srgb, var(--accent-2), white 8%);
          opacity: 0.62;
        }
        :global(.forecast-pill.empty) {
          flex-basis: 100%;
          min-height: 4.8rem;
          cursor: default;
        }
        :global(.forecast-pill.empty::before) {
          background: rgba(255,255,255,0.18);
        }
        :global(.forecast-pill:hover),
        :global(.forecast-pill:focus-visible) {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--accent), transparent 45%);
          background: color-mix(in srgb, var(--accent), transparent 92%);
        }
        :global(.forecast-pill.empty:hover) {
          transform: none;
          border-color: rgba(255,255,255,0.065);
          background: rgba(0,0,0,0.2);
        }
        :global(.forecast-pill-mode) {
          width: fit-content;
          border-radius: 999px;
          padding: 0.23rem 0.5rem;
          color: #fff;
          background: color-mix(in srgb, var(--accent), transparent 72%);
          border: 1px solid color-mix(in srgb, var(--accent), transparent 50%);
          font-size: 0.67rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        :global(.forecast-pill.next .forecast-pill-mode) {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.08);
        }
        :global(.forecast-pill strong),
        :global(.forecast-pill small) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.forecast-pill strong) {
          color: #fff;
          font-size: 0.92rem;
          font-weight: 900;
        }
        :global(.forecast-pill small) {
          color: rgba(255,255,255,0.52);
          font-size: 0.73rem;
          font-weight: 780;
        }
        .weather-live-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }
        :global(.forecast-context-card),
        :global(.current-enemy-card) {
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 8px;
          background: color-mix(in srgb, var(--accent), transparent 96%);
          padding: 1.25rem;
        }
        :global(.card-header.compact) {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        :global(.forecast-lanes),
        :global(.current-enemy-grid) {
          display: grid;
          gap: 1rem;
        }
        :global(.forecast-lane-title) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.6rem;
          color: rgba(255,255,255,0.55);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        :global(.forecast-lane-title strong) {
          color: #fff;
          min-width: 1.8rem;
          text-align: right;
        }
        :global(.forecast-lane-title.good strong) { color: #34d399; }
        :global(.forecast-lane-title.bad strong) { color: #fb7185; }
        :global(.forecast-location-list),
        :global(.current-enemy-list) {
          display: grid;
          gap: 0.55rem;
        }
        :global(.forecast-location-card),
        :global(.current-enemy-link) {
          display: grid;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          color: inherit;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }
        :global(.forecast-location-card) {
          grid-template-columns: minmax(0, 1fr) auto auto;
          padding: 0.75rem;
        }
        :global(.forecast-location-card:hover),
        :global(.forecast-location-card:focus-visible),
        :global(.current-enemy-link:hover),
        :global(.current-enemy-link:focus-visible) {
          border-color: color-mix(in srgb, var(--accent), transparent 35%);
          background: color-mix(in srgb, var(--accent), transparent 93%);
          transform: translateY(-1px);
        }
        :global(.forecast-location-card div),
        :global(.current-enemy-link span) {
          display: grid;
          min-width: 0;
        }
        :global(.forecast-location-card strong),
        :global(.current-enemy-link strong),
        :global(.forecast-location-card small),
        :global(.current-enemy-link small) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.forecast-location-card strong),
        :global(.current-enemy-link strong) {
          color: #fff;
          font-size: 0.86rem;
        }
        :global(.forecast-location-card small),
        :global(.current-enemy-link small) {
          color: rgba(255,255,255,0.48);
          font-size: 0.74rem;
          font-weight: 760;
        }
        :global(.forecast-location-card > span) {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: #34d399;
          font-size: 0.72rem;
          font-weight: 850;
          white-space: nowrap;
        }
        :global(.forecast-location-card > span.penalty) {
          color: #fb7185;
        }
        :global(.current-enemy-link) {
          position: relative;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          min-height: 48px;
          padding: 0.45rem;
          overflow: hidden;
        }
        :global(.current-enemy-link::before) {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: rgba(255,255,255,0.12);
        }
        :global(.current-enemy-link.favored::before) {
          background: #34d399;
        }
        :global(.current-enemy-link.penalized::before) {
          background: #fb7185;
        }
        :global(.current-enemy-link img) {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }
        :global(.current-enemy-link em) {
          align-self: center;
          border-radius: 999px;
          padding: 0.26rem 0.46rem;
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 0.65rem;
          font-style: normal;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        :global(.current-enemy-link.favored em) {
          color: #9af5c9;
          border-color: rgba(52, 211, 153, 0.22);
          background: rgba(52, 211, 153, 0.08);
        }
        :global(.current-enemy-link.penalized em) {
          color: #fecdd3;
          border-color: rgba(251, 113, 133, 0.22);
          background: rgba(251, 113, 133, 0.08);
        }
        :global(.forecast-empty) {
          color: rgba(255,255,255,0.46);
          font-size: 0.82rem;
          font-weight: 760;
          line-height: 1.45;
          padding: 0.7rem 0;
        }
        .enemy-weather-groups {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }
        :global(.enemy-pref-group) {
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.045);
          border-radius: 8px;
          background: rgba(0,0,0,0.16);
          padding: 0.85rem;
        }
        :global(.enemy-pref-group.good) {
          border-color: rgba(74, 222, 128, 0.14);
          background: rgba(74, 222, 128, 0.035);
        }
        :global(.enemy-pref-group.bad) {
          border-color: rgba(248, 113, 113, 0.14);
          background: rgba(248, 113, 113, 0.035);
        }
        :global(.enemy-pref-group h4) {
          color: #fff;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        :global(.enemy-pref-heading) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }
        :global(.enemy-pref-heading span) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.8rem;
          height: 1.55rem;
          padding-inline: 0.45rem;
          border-radius: 999px;
          color: #fff;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 0.72rem;
          font-weight: 900;
        }
        :global(.enemy-pref-list) {
          display: grid;
          gap: 0.45rem;
        }
        :global(.enemy-pref-link) {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) auto;
          gap: 0.5rem;
          align-items: center;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          color: inherit;
          padding: 0.4rem;
          text-decoration: none;
        }
        :global(.enemy-pref-link:hover),
        :global(.enemy-pref-link:focus-visible) {
          border-color: color-mix(in srgb, var(--accent), white 10%);
        }
        :global(.enemy-pref-link img) {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }
        :global(.enemy-pref-link span) {
          display: grid;
          min-width: 0;
        }
        :global(.enemy-pref-link strong),
        :global(.enemy-pref-link small) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        :global(.enemy-pref-link strong) {
          color: #fff;
          font-size: 0.82rem;
        }
        :global(.enemy-pref-link small) {
          color: rgba(255,255,255,0.46);
          font-size: 0.72rem;
          font-weight: 800;
        }
        :global(.enemy-pref-link svg) {
          color: rgba(255,255,255,0.42);
        }
        :global(.enemy-pref-empty) {
          color: rgba(255,255,255,0.42);
          font-size: 0.82rem;
          font-weight: 750;
        }
        :global(.enemy-pref-more) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          min-height: 44px;
          border-radius: 8px;
          color: #fff;
          background: color-mix(in srgb, var(--accent), transparent 86%);
          border: 1px solid color-mix(in srgb, var(--accent), transparent 65%);
          font-size: 0.78rem;
          font-weight: 900;
          text-decoration: none;
        }
        .impact-card:hover, .mf-card:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--accent), transparent 70%);
          background: rgba(255,255,255,0.035);
        }

        .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .card-header h3 { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.9); }

        .stat-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .stat-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .stat-row span:first-child { color: rgba(255,255,255,0.4); }
        .stat-row span:last-child { min-width: 4rem; text-align: right; }
        .stat-row .pos { color: #4ade80; }
        .stat-row .neg { color: #f87171; }

        .impact-card.modifiers {
          grid-column: 1 / -1;
        }
        .modifier-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr));
          gap: 0.85rem;
        }
        .modifier-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 0.7rem;
          min-width: 0;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
        }
        .modifier-skill {
          color: rgba(255,255,255,0.62);
          font-weight: 800;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .modifier-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 4.7rem;
          justify-content: space-between;
          padding: 0.42rem 0.55rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.56);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .modifier-chip span {
          color: rgba(255,255,255,0.38);
          font-size: 0.68rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .modifier-chip.pos {
          color: #4ade80;
          background: rgba(74, 222, 128, 0.08);
          border-color: rgba(74, 222, 128, 0.16);
        }
        .modifier-chip.neg {
          color: #f87171;
          background: rgba(248, 113, 113, 0.08);
          border-color: rgba(248, 113, 113, 0.16);
        }

        .mf-stats { display: flex; flex-direction: column; gap: 0.85rem; }
        .mf-stat {
          background: rgba(255,255,255,0.02);
          padding: 1rem 1.25rem;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.02);
        }
        .mf-stat .label { font-size: 0.85rem; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .mf-stat .value { font-size: 1.1rem; font-weight: 800; color: #a78bfa; text-shadow: 0 0 15px rgba(167, 139, 250, 0.4); }

        .mechanics-panel {
          position: sticky;
          top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          animation: rise-in 0.65s 0.12s ease both;
          min-width: 0;
        }
        .mech-item { display: flex; gap: 1.25rem; }
        .mech-item h4 { color: #fff; font-size: 0.95rem; font-weight: 800; margin-bottom: 0.35rem; }
        .mech-item p { color: rgba(255,255,255,0.5); font-size: 0.85rem; line-height: 1.6; }
        .mech-item strong { color: var(--text-accent); }

        .mechanics-card {
          background: rgba(9, 11, 20, 0.66);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 2rem;
        }
        .mechanics-content { display: flex; flex-direction: column; gap: 2rem; }

        .weather-tip {
          background: rgba(245, 176, 65, 0.04);
          border: 1px solid rgba(245, 176, 65, 0.15);
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }
        .weather-tip p { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.5; }
        .confidence-card {
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 1rem;
          display: grid;
          gap: 0.65rem;
        }
        .confidence-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-height: 34px;
          color: rgba(255,255,255,0.62);
          font-size: 0.82rem;
          font-weight: 800;
        }
        .confidence-row svg {
          color: var(--accent);
          flex: 0 0 auto;
        }

        @keyframes rise-in {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float-icon {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes seal-drift {
          from { transform: rotate(0deg) scale(0.98); }
          to { transform: rotate(360deg) scale(0.98); }
        }

        @keyframes breathe {
          from { opacity: 0.75; }
          to { opacity: 1; }
        }
        @keyframes orbit-glow {
          from { transform: translate3d(0, 0, 0) scale(0.96); opacity: 0.48; }
          to { transform: translate3d(8%, -4%, 0) scale(1.08); opacity: 0.78; }
        }
        @keyframes atmosphere-drift {
          from { transform: translateX(-3%) skewX(-6deg); opacity: 0.28; }
          to { transform: translateX(4%) skewX(-2deg); opacity: 0.5; }
        }

        @media (max-width: 1320px) {
          .main-grid { grid-template-columns: 1fr; }
          .weather-live-grid { grid-template-columns: 1fr; }
          .mechanics-panel { position: static; }
        }

        @media (max-width: 1100px) {
          .page-header {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .header-text p {
            margin-inline: auto;
          }
          .weather-snapshot-grid {
            max-width: 44rem;
            margin-inline: auto;
          }
          .weather-hero { flex-direction: column; text-align: center; gap: 2rem; }
          .hero-text h2 { font-size: 3.5rem; }
          .active-info-panel { padding: 2.5rem; border-radius: 8px; }
          .impact-grid { grid-template-columns: 1fr; }
          .enemy-weather-groups { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .weather-container {
            width: 100vw;
            max-width: 100vw;
            padding: 1.25rem;
          }
          .page-header {
            border-radius: 8px;
            padding: 1rem;
          }
          .content-wrapper,
          .main-grid,
          .active-info-panel,
          .mechanics-panel,
          .mechanics-card,
          .weather-tip {
            width: calc(100vw - 2.5rem);
            max-width: calc(100vw - 2.5rem);
          }
          .impact-card,
          .mf-card {
            width: 100%;
          }
          .header-text h1 {
            font-size: 1.9rem;
            line-height: 1.08;
            max-width: 18rem;
            margin-inline: auto;
            overflow-wrap: anywhere;
          }
          .header-text p { font-size: 0.95rem; padding: 0 0.25rem; max-width: 18.5rem; }
          .weather-selector {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            overflow: visible;
            scroll-snap-type: none;
            margin-inline: 0;
            padding: 0;
            gap: 0.55rem;
          }
          .weather-selector-shell {
            margin-top: 2rem;
            overflow: visible;
          }
          .weather-selector-shell::before,
          .weather-selector-shell::after {
            display: none;
          }
          .weather-selector::-webkit-scrollbar {
            display: none;
          }
          .weather-btn {
            min-width: 0;
            scroll-snap-align: none;
            justify-content: center;
            padding: 0.68rem 0.62rem;
            gap: 0.5rem;
            font-size: 0.78rem;
          }
          .weather-btn:last-child:nth-child(3n + 1) {
            grid-column: 1 / -1;
          }
          .weather-btn svg {
            width: 16px;
            height: 16px;
            flex: 0 0 auto;
          }
          .hero-text h2 { font-size: 2.5rem; }
          .hero-icon-shell {
            width: 7.25rem;
            min-width: 7.25rem;
            height: 7.25rem;
          }
          .hero-icon {
            width: 5.1rem;
            height: 5.1rem;
          }
          .hero-icon svg {
            width: 58px;
            height: 58px;
          }
          .hero-text .description {
            font-size: 1.1rem;
            max-width: 100%;
            overflow-wrap: anywhere;
          }
          .active-info-panel { padding: 1.5rem; overflow: hidden; }
          .weather-hero { gap: 1rem; }
          .impact-card, .mf-card { padding: 1.5rem; border-radius: 8px; }
          .weather-snapshot-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
          }
          .weather-snapshot-card {
            padding: 0.6rem 0.68rem;
            gap: 0.42rem;
          }
          .weather-snapshot-card span {
            font-size: 0;
            letter-spacing: 0;
          }
          .weather-snapshot-card span::after {
            content: attr(data-short);
            font-size: 0.64rem;
            letter-spacing: 0.04em;
          }
          .weather-snapshot-card strong {
            margin-left: auto;
          }
          :global(.forecast-strip) {
            margin-inline: -0.35rem;
            padding: 0.85rem;
          }
          :global(.forecast-strip.scrollable::before) {
            left: 0.85rem;
            width: 0.8rem;
          }
          :global(.forecast-strip.scrollable::after) {
            right: 0.85rem;
            width: 1.15rem;
          }
          :global(.forecast-strip-hint) {
            display: block;
          }
          :global(.forecast-pill) {
            flex-basis: 12rem;
          }
          :global(.forecast-context-card),
          :global(.current-enemy-card) {
            padding: 1rem;
            border-radius: 8px;
          }
          :global(.forecast-location-card) {
            grid-template-columns: minmax(0, 1fr);
            align-items: start;
          }
          :global(.forecast-location-card > span) {
            width: fit-content;
          }
          :global(.current-enemy-link) {
            grid-template-columns: 34px minmax(0, 1fr);
          }
          :global(.current-enemy-link em) {
            width: fit-content;
            margin-left: 34px;
          }
          .enemy-weather-card { padding: 1.25rem; border-radius: 8px; }
          .mechanics-card { padding: 1.5rem; border-radius: 8px; }
          .stat-row { gap: 1rem; padding-right: 1rem; }
          .modifier-list { grid-template-columns: 1fr; }
          .modifier-row {
            grid-template-columns: minmax(0, 1fr) auto auto;
            padding: 0.8rem;
            gap: 0.45rem;
          }
          .modifier-chip {
            min-width: 4.1rem;
            padding-inline: 0.45rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .weather-glow,
          .weather-atmosphere,
          .page-header,
          .active-info-panel,
          .mechanics-panel,
          .hero-icon {
            animation: none;
          }
          .weather-btn,
          .impact-card,
          .mf-card {
            transition: none;
          }
        }
    `}</style>
  );
}
