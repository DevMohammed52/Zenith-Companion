"use client";

import React from "react";

export function MapStyles() {
  return (
    <style jsx global>{`
        .map-page {
          position: relative;
          min-height: calc(100vh - 40px);
          padding: clamp(1rem, 2vw, 2rem);
          overflow-x: hidden;
          background: var(--bg-base);
        }
        .map-page,
        .map-page * {
          box-sizing: border-box;
        }
        .map-page {
          -webkit-tap-highlight-color: transparent;
        }
        .map-page :where(button, a, input) {
          touch-action: manipulation;
        }
        .map-loading {
          display: grid;
          min-height: 60vh;
          place-items: center;
          color: var(--text-muted);
          font-weight: 800;
        }
        .map-page :where(button, a, input):focus-visible {
          outline: 2px solid var(--border-focus) !important;
          outline-offset: 2px;
        }
        .atlas-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1rem;
          max-width: 1680px;
          margin: 0 auto;
          align-items: start;
        }
        .atlas-panel,
        .location-dossier,
        .intel-section {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(7, 9, 12, 0.88);
          box-shadow: 0 14px 36px rgba(0,0,0,0.26);
          backdrop-filter: none;
        }
        .atlas-panel {
          position: relative;
          isolation: isolate;
          min-width: 0;
          align-self: start;
          border-radius: 12px;
          padding: clamp(0.85rem, 1.5vw, 1.2rem);
          overflow: hidden;
        }
        .atlas-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background: none;
          pointer-events: none;
        }
        .atlas-topbar {
          display: grid;
          grid-template-columns: minmax(420px, 1fr) minmax(420px, 0.95fr);
          gap: clamp(1rem, 2vw, 1.6rem);
          align-items: start;
          margin-bottom: 0.7rem;
        }
        .atlas-title span,
        .location-heading span,
        .intel-section header span,
        .poi-card header span,
        .weather-card-head span {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .atlas-title h1 {
          margin-top: 0.15rem;
          color: #fff;
          font-size: clamp(1.85rem, 2.45vw, 2.65rem);
          line-height: 1;
          letter-spacing: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .atlas-title {
          min-width: 0;
        }
        .atlas-context-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.38rem;
          margin-top: 0.7rem;
        }
        .atlas-context-row span {
          display: inline-flex;
          align-items: center;
          gap: 0.32rem;
          max-width: min(100%, 24rem);
          min-height: 1.85rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: rgba(255,255,255,0.78);
          font-size: 0.72rem;
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1;
          overflow: hidden;
          padding: 0 0.62rem;
          text-overflow: ellipsis;
          text-transform: none;
          white-space: nowrap;
        }
        .atlas-context-row span:first-child {
          border-color: color-mix(in srgb, var(--text-accent), transparent 68%);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
          color: #d9f5ff;
        }
        .atlas-context-row svg {
          color: var(--text-accent);
          flex: 0 0 auto;
        }
        .atlas-search {
          position: relative;
          min-width: 0;
        }
        .atlas-controls {
          display: grid;
          align-self: end;
          gap: 0.62rem;
          justify-self: end;
          width: min(100%, 560px);
          min-width: 0;
        }
        .atlas-control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.7rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .atlas-search svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .atlas-search input {
          width: 100%;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          background: rgba(0,0,0,0.34);
          color: #fff;
          font: inherit;
          font-weight: 750;
          outline: none;
          padding: 0 0.85rem 0 2.45rem;
        }
        .atlas-search input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 82%);
        }
        .quick-links a,
        .drop-chip,
        .resource-chip,
        .poi-chip,
        .source-card,
        .map-pin {
          color: inherit;
          font: inherit;
        }
        .map-result-count {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-height: 2.35rem;
          margin: 0;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 850;
          flex: 0 0 auto;
          min-width: max-content;
          text-align: right;
          white-space: nowrap;
        }
        .atlas-actions {
          display: flex;
          flex: 0 1 auto;
          flex-wrap: wrap;
          justify-content: flex-start;
          gap: 0.45rem;
          min-width: 0;
          margin: 0;
        }
        .atlas-actions button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.36rem;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: rgba(255,255,255,0.82);
          cursor: pointer;
          font: inherit;
          font-size: 0.76rem;
          font-weight: 850;
          padding: 0 0.82rem;
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
        }
        .atlas-actions button:hover,
        .atlas-actions button:focus-visible {
          border-color: color-mix(in srgb, var(--text-accent), white 8%);
          background: color-mix(in srgb, var(--text-accent), transparent 84%);
          color: #fff;
          transform: translateY(-1px);
        }
        .atlas-actions button:active {
          transform: translateY(0);
        }
        .atlas-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.42;
          transform: none;
        }
        .map-stage,
        .location-dossier,
        .intel-grid {
          scroll-margin-top: 1rem;
        }
        .map-stage {
          position: relative;
          width: min(100%, 1040px);
          aspect-ratio: 1 / 1;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          background: #063d65;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.035), 0 20px 55px rgba(0,0,0,0.38);
        }
        .world-map-art {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.05) contrast(1.02);
          user-select: none;
        }
        .map-stage::after {
          display: none;
        }
        .map-empty-state {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 5;
          display: grid;
          justify-items: center;
          gap: 0.35rem;
          width: min(82%, 280px);
          transform: translate(-50%, -50%);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          background: rgba(6, 10, 16, 0.82);
          box-shadow: 0 18px 48px rgba(0,0,0,0.42);
          color: #fff;
          padding: 1rem;
          text-align: center;
        }
        .map-empty-state svg {
          color: var(--text-accent);
        }
        .map-empty-state span {
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 750;
        }
        .map-pin {
          position: absolute;
          z-index: 3;
          display: inline-grid;
          gap: 0.32rem;
          min-width: 124px;
          width: clamp(124px, 13vw, 178px);
          max-width: 178px;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--pin-accent), rgba(255,255,255,0.14) 22%);
          border-radius: 8px;
          background: rgba(14, 22, 34, 0.78);
          box-shadow: 0 12px 34px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.035);
          backdrop-filter: none;
          cursor: pointer;
          transform: translate(-50%, -50%);
          padding: 0.55rem 0.62rem 0.6rem;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
        }
        .pin-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.28rem;
          min-width: 0;
          color: #fff;
          font-size: 0.86rem;
          font-weight: 900;
          line-height: 1.12;
          text-align: center;
        }
        .pin-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pin-weather {
          display: inline-grid;
          place-items: center;
          flex: 0 0 auto;
          color: var(--pin-accent);
          opacity: 0.92;
        }
        .pin-level {
          justify-self: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.72);
          font-size: 0.75rem;
          font-weight: 850;
          line-height: 1;
          padding: 0.36rem 0.6rem;
        }
        .map-pin:hover,
        .map-pin:focus-visible,
        .map-pin.active {
          border-color: color-mix(in srgb, var(--pin-accent), white 15%);
          background: rgba(13, 22, 35, 0.9);
          box-shadow: 0 18px 40px rgba(0,0,0,0.42), 0 0 0 3px color-mix(in srgb, var(--pin-accent), transparent 78%);
        }
        .map-pin.active::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pin-accent), white 28%);
          opacity: 0.72;
          pointer-events: none;
          animation: mapPinGlow 2.6s ease-in-out infinite;
        }
        .map-pin:focus-visible {
          outline: none;
        }
        .map-pin.edge-left {
          transform: translate(-18%, -50%);
        }
        .map-pin.edge-right {
          transform: translate(-82%, -50%);
        }
        .map-pin.edge-top {
          transform: translate(-50%, -18%);
        }
        .map-pin.edge-bottom {
          transform: translate(-50%, -82%);
        }
        .map-pin.edge-left.edge-top {
          transform: translate(-18%, -18%);
        }
        .map-pin.edge-left.edge-bottom {
          transform: translate(-18%, -82%);
        }
        .map-pin.edge-right.edge-top {
          transform: translate(-82%, -18%);
        }
        .map-pin.edge-right.edge-bottom {
          transform: translate(-82%, -82%);
        }
        .map-compass {
          position: absolute;
          right: 1rem;
          bottom: 1rem;
          z-index: 4;
          display: grid;
          place-items: center;
          width: 72px;
          height: 72px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 50%;
          background: rgba(0,0,0,0.36);
          color: var(--text-accent);
        }
        .map-compass span {
          position: absolute;
          top: 7px;
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 900;
        }
        .map-legend {
          position: absolute;
          left: 1rem;
          bottom: 1rem;
          z-index: 4;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          max-width: calc(100% - 6.8rem);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          background: rgba(0,0,0,0.38);
          box-shadow: 0 14px 34px rgba(0,0,0,0.28);
          color: rgba(255,255,255,0.76);
          padding: 0.42rem 0.52rem;
          backdrop-filter: none;
        }
        .map-legend span {
          display: inline-flex;
          align-items: center;
          gap: 0.32rem;
          font-size: 0.68rem;
          font-weight: 850;
          line-height: 1;
          white-space: nowrap;
        }
        .legend-dot {
          display: inline-block;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: var(--text-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 82%);
        }
        .legend-dot.active {
          background: #fff;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 70%);
        }
        @keyframes mapPinGlow {
          0%,
          100% {
            opacity: 0.38;
          }
          50% {
            opacity: 0.86;
          }
        }
        .atlas-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.55rem;
          width: min(100%, 1040px);
          margin: 0.8rem auto 0;
        }
        .mobile-location-rail {
          display: none;
        }
        .atlas-metrics div,
        .source-strip div {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 0.45rem;
          align-items: center;
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 0.65rem;
        }
        .atlas-metrics span,
        .source-strip span {
          min-width: 0;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .atlas-metrics strong,
        .source-strip strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .location-dossier {
          position: relative;
          min-width: 0;
          border-radius: 12px;
          overflow: hidden;
        }
        .location-dossier::before {
          display: none;
        }
        .location-image {
          display: grid;
          width: 100%;
          aspect-ratio: 16 / 9;
          height: auto;
          min-height: 0;
          place-items: center;
          background: rgba(255,255,255,0.035);
          overflow: hidden;
        }
        .location-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }
        .location-heading,
        .weather-card,
        .weather-match-card,
        .poi-card,
        .source-strip,
        .quick-links {
          margin: 0.85rem;
        }
        .location-heading h2 {
          margin-top: 0.25rem;
          color: #fff;
          font-size: 1.85rem;
          line-height: 1.05;
          overflow-wrap: anywhere;
        }
        .location-heading p {
          margin-top: 0.55rem;
          color: var(--text-muted);
          line-height: 1.45;
        }
        .weather-card {
          border: 1px solid color-mix(in srgb, var(--weather-accent), transparent 62%);
          border-radius: 10px;
          background: var(--bg-card);
          padding: 0.85rem;
        }
        .weather-card-head {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          color: var(--weather-accent);
        }
        .weather-card-head strong {
          display: block;
          color: #fff;
          font-size: 1.25rem;
          line-height: 1.1;
        }
        .weather-card p {
          margin-top: 0.55rem;
          color: var(--text-muted);
          font-size: 0.82rem;
        }
        .buff-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.7rem;
        }
        .buff-list span {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(0,0,0,0.24);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
        }
        .weather-match-card {
          display: grid;
          gap: 0.7rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          padding: 0.78rem;
        }
        .weather-match-card header {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: center;
        }
        .weather-match-card header span {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--text-accent);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .weather-match-card header strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }
        .weather-enemy-strip h3 {
          margin-bottom: 0.4rem;
          color: var(--text-muted);
          font-size: 0.74rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .weather-enemy-list {
          display: grid;
          gap: 0.4rem;
        }
        .weather-enemy-chip {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          gap: 0.5rem;
          align-items: center;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(0,0,0,0.18);
          color: inherit;
          padding: 0.4rem;
          text-decoration: none;
        }
        .weather-enemy-chip.good {
          border-color: rgba(45, 212, 191, 0.24);
          background: rgba(45, 212, 191, 0.07);
        }
        .weather-enemy-chip.bad {
          border-color: rgba(248, 113, 113, 0.24);
          background: rgba(248, 113, 113, 0.07);
        }
        .weather-enemy-chip img {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }
        .weather-enemy-chip span {
          display: grid;
          gap: 0.08rem;
          min-width: 0;
        }
        .weather-enemy-chip strong,
        .weather-enemy-chip small {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .weather-enemy-chip strong {
          color: #fff;
          font-size: 0.8rem;
        }
        .weather-enemy-chip small {
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 850;
        }
        .source-strip {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.5rem;
        }
        .poi-card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          padding: 0.78rem;
        }
        .poi-card header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }
        .poi-card header strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .poi-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.45rem;
        }
        .poi-chip {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 0.5rem;
          align-items: center;
          min-height: 50px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
          color: var(--text-main);
          padding: 0.55rem;
          text-align: left;
        }
        .poi-chip > svg {
          color: var(--text-accent);
        }
        .poi-chip > span {
          display: grid;
          gap: 0.08rem;
          min-width: 0;
        }
        .poi-chip strong,
        .poi-chip small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .poi-chip strong {
          color: #fff;
          font-size: 0.78rem;
          font-weight: 900;
        }
        .poi-chip small {
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 800;
        }
        .quick-links {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.45rem;
        }
        .quick-links a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          min-height: 44px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          color: #fff;
          font-weight: 850;
          padding: 0 0.7rem;
          text-decoration: none;
        }
        .quick-links a:hover,
        .quick-links a:focus-visible {
          border-color: var(--border-focus);
        }
        .intel-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
          gap: 1rem;
          max-width: 1680px;
          margin: 1rem auto 0;
        }
        .intel-section {
          min-width: 0;
          border-radius: 12px;
          padding: 0.9rem;
        }
        .intel-section header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .intel-section header strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          text-align: right;
        }
        .source-list {
          grid-column: span 2;
        }
        .source-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.65rem;
        }
        .source-column {
          min-width: 0;
        }
        .source-column h3 {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.45rem;
          color: #fff;
          font-size: 0.84rem;
        }
        .source-stack {
          display: grid;
          gap: 0.45rem;
        }
        .source-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 18px;
          gap: 0.8rem;
          align-items: center;
          min-height: 54px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          color: var(--text-main);
          text-align: left;
          text-decoration: none;
          padding: 0.6rem;
        }
        .source-card > span {
          display: grid;
          grid-template-columns: minmax(0, 1fr) max-content;
          gap: 0.75rem;
          align-items: center;
          min-width: 0;
        }
        .source-card strong,
        .drop-name {
          min-width: 0;
          overflow: hidden;
          color: #fff;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .source-card small {
          justify-self: end;
          max-width: 100%;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 850;
          line-height: 1;
          padding: 0.28rem 0.46rem;
          text-align: right;
          white-space: nowrap;
        }
        .source-card > svg {
          justify-self: end;
          color: var(--text-muted);
        }
        .source-card:hover,
        .source-card:focus-visible,
        .drop-chip:hover,
        .drop-chip:focus-visible,
        .resource-chip:hover,
        .resource-chip:focus-visible {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 92%);
        }
        .drop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 0.5rem;
        }
        .board-note {
          margin: 0.65rem 0 0;
          color: var(--text-muted);
          font-size: 0.76rem;
          font-weight: 750;
        }
        .drop-chip {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr) minmax(58px, auto);
          gap: 0.55rem;
          align-items: center;
          min-height: 48px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          padding: 0.45rem;
          text-align: left;
        }
        .drop-chip img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
        .drop-copy {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }
        .drop-copy small {
          min-width: 0;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .drop-chip strong {
          color: var(--text-success);
          font-family: var(--font-mono);
          font-size: 0.76rem;
          text-align: right;
          white-space: nowrap;
        }
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
          gap: 0.5rem;
        }
        .resource-chip {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) auto;
          gap: 0.55rem;
          align-items: center;
          min-height: 58px;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          padding: 0.5rem;
          text-align: left;
        }
        .resource-chip:focus-visible {
          outline: none;
        }
        .resource-chip img {
          width: 38px;
          height: 38px;
          object-fit: contain;
        }
        .resource-copy {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }
        .resource-name {
          min-width: 0;
          overflow: hidden;
          color: #fff;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .resource-copy small {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 850;
        }
        .resource-chip strong {
          align-self: start;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          background: rgba(255,255,255,0.08);
          color: var(--text-accent);
          font-family: var(--font-mono);
          font-size: 0.74rem;
          font-weight: 950;
          line-height: 1;
          padding: 0.28rem 0.38rem;
          white-space: nowrap;
        }
        .forecast-list {
          display: grid;
          gap: 0.45rem;
        }
        .forecast-hint {
          margin: -0.2rem 0 0.7rem;
          color: var(--text-muted);
          font-size: 0.78rem;
          line-height: 1.45;
        }
        .forecast-item {
          display: grid;
          border: 1px solid color-mix(in srgb, var(--weather-accent), transparent 78%);
          border-radius: 8px;
          background: color-mix(in srgb, var(--weather-accent), transparent 95%);
          overflow: hidden;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .forecast-row {
          display: grid;
          grid-template-columns: minmax(8rem, 0.75fr) minmax(11rem, 1fr) max-content 1.25rem;
          gap: 0.6rem;
          align-items: center;
          width: 100%;
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0.58rem 0.65rem;
          text-align: left;
        }
        .forecast-weather-name {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          color: #fff;
          font-weight: 850;
        }
        .forecast-window-time {
          min-width: 0;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.78rem;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forecast-counts {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 0.32rem;
          justify-self: end;
          min-width: 0;
        }
        .forecast-counts em {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(0,0,0,0.24);
          font-size: 0.68rem;
          font-weight: 900;
          font-style: normal;
          line-height: 1;
          padding: 0.32rem 0.45rem;
          white-space: nowrap;
        }
        .forecast-counts .favored {
          border-color: rgba(52, 211, 153, 0.28);
          color: #7cf2c0;
        }
        .forecast-counts .penalized {
          border-color: rgba(251, 113, 133, 0.26);
          color: #ff9bad;
        }
        .forecast-chevron {
          justify-self: end;
          color: var(--text-muted);
          transition: color 160ms ease, transform 160ms ease;
        }
        .forecast-item:hover,
        .forecast-item.active {
          border-color: color-mix(in srgb, var(--weather-accent), white 8%);
          background: color-mix(in srgb, var(--weather-accent), transparent 91%);
        }
        .forecast-item:hover {
          transform: translateY(-1px);
        }
        .forecast-item.active .forecast-chevron {
          color: #fff;
          transform: rotate(180deg);
        }
        .forecast-crosscheck {
          display: none;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
          border-top: 1px solid color-mix(in srgb, var(--weather-accent), transparent 82%);
          padding: 0.6rem 0.65rem 0.65rem;
        }
        .forecast-item.active .forecast-crosscheck {
          display: grid;
        }
        .forecast-enemy-group {
          display: grid;
          align-content: start;
          gap: 0.42rem;
          min-width: 0;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          background: rgba(0,0,0,0.18);
          padding: 0.52rem;
        }
        .forecast-enemy-group.favored {
          border-color: rgba(52, 211, 153, 0.16);
        }
        .forecast-enemy-group.penalized {
          border-color: rgba(251, 113, 133, 0.16);
        }
        .forecast-enemy-group strong {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          color: var(--text-muted);
          font-size: 0.66rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .forecast-enemy-group strong span {
          display: inline-grid;
          min-width: 1.35rem;
          place-items: center;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.64rem;
          line-height: 1;
          padding: 0.22rem 0.3rem;
        }
        .forecast-enemy-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          min-width: 0;
        }
        .forecast-enemy-chip {
          display: inline-grid;
          grid-template-columns: 1.35rem minmax(0, 1fr);
          align-items: center;
          gap: 0.35rem;
          max-width: 100%;
          min-height: 1.75rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          background: rgba(255,255,255,0.045);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 850;
          padding: 0.18rem 0.5rem 0.18rem 0.22rem;
          text-decoration: none;
          transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
        }
        .forecast-enemy-chip:hover,
        .forecast-enemy-chip:focus-visible {
          border-color: color-mix(in srgb, var(--weather-accent), white 10%);
          background: rgba(255,255,255,0.08);
          transform: translateY(-1px);
        }
        .forecast-enemy-chip img,
        .forecast-enemy-chip svg {
          width: 1.35rem;
          height: 1.35rem;
          object-fit: contain;
        }
        .forecast-enemy-chip span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .forecast-none,
        .forecast-more {
          display: inline-flex;
          align-items: center;
          min-height: 1.75rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.035);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.18rem 0.55rem;
        }
        .muted-empty {
          color: var(--text-muted);
        }
        .source-note {
          margin: -0.15rem 0 0.7rem;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 750;
          line-height: 1.35;
        }
        @media (min-width: 1280px) {
          .atlas-shell {
            grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
          }
        }
        @media (min-width: 1280px) and (max-width: 1660px) {
          .atlas-topbar {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .atlas-controls {
            justify-self: stretch;
            width: 100%;
          }
          .atlas-control-row {
            justify-content: space-between;
          }
        }
        @media (max-width: 1279px) {
          .atlas-shell,
          .intel-grid {
            grid-template-columns: 1fr;
          }
          .source-list {
            grid-column: auto;
          }
          .location-dossier {
            display: block;
            width: min(100%, 1040px);
            margin-inline: auto;
          }
          .location-image {
            height: auto;
            min-height: 0;
          }
          .source-strip,
          .poi-card,
          .quick-links,
          .weather-card {
            grid-column: auto;
          }
        }
        @media (max-width: 860px) {
          .map-page {
            padding: 0.75rem;
          }
          .atlas-topbar {
            grid-template-columns: 1fr;
          }
          .atlas-title h1 {
            font-size: 2rem;
            white-space: normal;
          }
          .atlas-controls {
            align-self: stretch;
          }
          .atlas-control-row {
            align-items: flex-start;
          }
          .map-pin {
            min-width: 116px;
            width: 140px;
            max-width: 150px;
            padding: 0.45rem 0.5rem;
          }
          .pin-title {
            font-size: 0.74rem;
          }
          .pin-level {
            font-size: 0.68rem;
            padding: 0.28rem 0.45rem;
          }
          .atlas-metrics,
          .source-columns,
          .poi-list,
          .source-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .location-dossier {
            display: block;
          }
          .location-image {
            height: auto;
            min-height: 0;
          }
          .forecast-row {
            grid-template-columns: minmax(0, 1fr) 1.4rem;
            gap: 0.42rem 0.5rem;
          }
          .forecast-weather-name {
            grid-column: 1;
          }
          .forecast-chevron {
            grid-column: 2;
            grid-row: 1;
          }
          .forecast-window-time,
          .forecast-counts {
            grid-column: 1 / -1;
            justify-self: start;
            text-align: left;
            white-space: normal;
          }
          .forecast-counts {
            justify-content: flex-start;
          }
          .forecast-crosscheck {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .map-page {
            padding-top: 1rem;
          }
          .atlas-panel,
          .intel-section {
            padding: 0.65rem;
          }
          .atlas-control-row {
            display: grid;
            gap: 0.55rem;
          }
          .atlas-actions {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .atlas-actions button {
            min-width: 0;
            padding: 0 0.45rem;
          }
          .map-result-count {
            justify-content: flex-end;
            min-height: 1rem;
          }
          .atlas-metrics,
          .source-columns,
          .poi-list,
          .source-strip,
          .drop-grid,
          .resource-grid {
            grid-template-columns: 1fr;
          }
          .map-pin {
            width: 44px;
            min-width: 0;
            max-width: none;
            height: 44px;
            border-radius: 50%;
            padding: 0;
            transform: translate(-50%, -50%);
          }
          .map-pin.edge-left,
          .map-pin.edge-right,
          .map-pin.edge-top,
          .map-pin.edge-bottom,
          .map-pin.edge-left.edge-top,
          .map-pin.edge-left.edge-bottom,
          .map-pin.edge-right.edge-top,
          .map-pin.edge-right.edge-bottom {
            transform: translate(-50%, -50%);
          }
          .pin-title {
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            font-size: 0;
          }
          .pin-weather {
            color: var(--pin-accent);
          }
          .pin-level {
            display: none;
          }
          .map-pin.active {
            width: min(156px, 42vw);
            min-width: 118px;
            height: auto;
            border-radius: 8px;
            padding: 0.42rem 0.5rem;
          }
          .map-pin.active .pin-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.35rem;
            height: auto;
            font-size: 0.72rem;
          }
          .map-pin.active .pin-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .map-pin.active .pin-level {
            display: block;
            margin-top: 0.2rem;
            font-size: 0.62rem;
            line-height: 1;
          }
          .mobile-location-rail {
            position: relative;
            display: flex;
            gap: 0.45rem;
            width: 100%;
            margin: 0.65rem 0 0;
            overflow-x: auto;
            overscroll-behavior-x: contain;
            padding: 0 1rem 0.35rem 0.05rem;
            scrollbar-width: thin;
          }
          .mobile-location-rail button {
            display: grid;
            gap: 0.16rem;
            flex: 0 0 auto;
            min-width: 138px;
            max-width: 176px;
            min-height: 48px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            background: rgba(255,255,255,0.035);
            color: var(--text-main);
            font: inherit;
            padding: 0.45rem 0.55rem;
            text-align: left;
          }
          .mobile-location-rail button.active {
            border-color: var(--border-focus);
            background: color-mix(in srgb, var(--text-accent), transparent 84%);
            color: #fff;
          }
          .mobile-location-rail span {
            display: flex;
            align-items: center;
            gap: 0.32rem;
            min-width: 0;
            overflow: hidden;
            font-size: 0.76rem;
            font-weight: 900;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .mobile-location-rail small {
            color: var(--text-muted);
            font-family: var(--font-mono);
            font-size: 0.66rem;
            font-weight: 900;
          }
          .map-compass {
            width: 54px;
            height: 54px;
          }
          .drop-chip {
            grid-template-columns: 32px minmax(0, 1fr);
          }
          .drop-chip strong {
            grid-column: 2;
            text-align: left;
          }
          .resource-chip {
            grid-template-columns: 38px minmax(0, 1fr);
          }
          .resource-chip strong {
            grid-column: 2;
            justify-self: start;
          }
          .source-card > span {
            grid-template-columns: 1fr;
            gap: 0.35rem;
          }
          .source-card small {
            justify-self: start;
          }
          .quick-links {
            grid-template-columns: 1fr;
          }
        }
    `}</style>
  );
}
