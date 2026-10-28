"use client";

import React from "react";
import { Copy, Download, FileUp, Plus, Trash2 } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { PROFILE_SECTIONS } from "../types";

export function ProfilesLoadingShell() {
  return (
    <main className="container profiles-page" aria-busy="true" aria-live="polite">
      <div className="header profile-header">
        <div>
          <h1 className="header-title"><ZenithIcon name="profile" size={24} style={{ color: "var(--text-accent)" }} /> Profiles</h1>
        </div>
        <div className="profile-header-actions" aria-hidden="true">
          <button className="profile-action" type="button" disabled>
            <Plus size={15} /> Add
          </button>
          <button className="profile-action" type="button" disabled>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <nav className="profile-section-nav profile-section-nav-loading" aria-label="Profile sections loading">
        {PROFILE_SECTIONS.map(([id, label]) => (
          <a key={id} aria-disabled="true" tabIndex={-1}>
            {label}
          </a>
        ))}
      </nav>

      <div className="profile-import-jump-card profile-loading-card" aria-hidden="true">
        <span>
          <FileUp size={17} />
          <strong>Import from IdleMMO</strong>
        </span>
        <em className="profile-skeleton-line" />
      </div>

      <div className="profile-backup-reminder profile-loading-card" aria-hidden="true">
        <div>
          <strong>Local browser data</strong>
          <span className="profile-skeleton-line" />
        </div>
        <button type="button" className="profile-action" disabled>
          <Download size={15} /> Copy backup
        </button>
      </div>

      <section className="profile-layout" aria-label="Profile manager loading">
        <section className="profile-list-panel">
          <div className="profile-count">
            <span>Loading</span>
            <strong>Local Profiles</strong>
          </div>
          <div className="profile-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="profile-list-item profile-loading-item" key={index}>
                <span className="profile-avatar" />
                <span>
                  <strong className="profile-skeleton-line" />
                  <small className="profile-skeleton-line short" />
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="profile-editor">
          <section className="profile-panel profile-identity-panel profile-loading-panel" tabIndex={-1}>
            <div className="profile-panel-heading">
              <div>
                <h2>Identity</h2>
                <p>Preparing saved character data.</p>
              </div>
              <div className="profile-inline-actions" aria-hidden="true">
                <button type="button" disabled><Copy size={15} /></button>
                <button type="button" disabled><Trash2 size={15} /></button>
              </div>
            </div>
            <div className="profile-game-hero profile-loading-hero">
              <div className="profile-game-hero-character" />
              <div className="profile-game-hero-panel">
                <div className="profile-skeleton-line title" />
                <div className="profile-chip-row">
                  <span>Class</span>
                  <span>Total Lv.</span>
                  <span>Location</span>
                </div>
              </div>
            </div>
            <div className="profile-grid identity-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="profile-field" key={index}>
                  <span className="profile-skeleton-line short" />
                  <div className="control-input profile-loading-input" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
