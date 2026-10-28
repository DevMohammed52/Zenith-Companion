"use client";

import React from "react";
import { BadgeCheck, FileUp, History, Loader2, Plus, X, Zap } from "lucide-react";
import { MAX_PROFILES, type CharacterProfile } from "@/lib/profiles";
import {
  deleteCachedProfileImport,
  formatCacheAge,
} from "@/lib/profile-import-cache";
import {
  LIVE_IMPORT_ERROR_ID,
  LIVE_IMPORT_HASH_HELP_ID,
  LIVE_IMPORT_STATUS_ID,
  LIVE_IMPORT_STEPS,
  TURNSTILE_SITE_KEY,
  formatWaitTime,
  profileDraftDisplayName,
  type UseLiveProfileImportReturn,
} from "../hooks/useLiveProfileImport";
import { formatProfileSourceDate } from "./ProfileHeader";

export function formatProfileSourceMode(mode?: string): string {
  if (mode === "imported") return "Imported";
  if (mode === "mixed") return "Mixed";
  return "Manual";
}

export interface ProfileLiveImportModalProps {
  profile: CharacterProfile;
  liveImport: UseLiveProfileImportReturn;
  profilesCount: number;
  profileHashDraft: string;
  setProfileHashDraft: (value: string) => void;
  handleCreateProfileFromHash: () => void;
}

export function ProfileLiveImportModal({
  profile,
  liveImport,
  profilesCount,
  profileHashDraft,
  setProfileHashDraft,
  handleCreateProfileFromHash,
}: ProfileLiveImportModalProps) {
  const {
    liveImportHash,
    setLiveImportHash,
    liveImportJobId,
    liveImportStatus,
    liveImportProgress,
    liveImportResult,
    liveImportSelectedIndex,
    liveImportError,
    setLiveImportError,
    liveImportRetryAfterMs,
    importReview,
    cachedImportMatch,
    setCachedImportMatch,
    recentCachedImports,
    forceRefreshScrape,
    setForceRefreshScrape,
    turnstileToken,
    turnstileReady,
    turnstileError,
    turnstileContainerRef,
    liveImportWaitText,
    liveImportRetryText,
    liveImportBusy,
    liveImportHasUnsavedResult,
    resolvedStep,
    isTerminalError,
    isRateLimited,
    isActiveProgress,
    isComplete,
    handleStartLiveProfileImport,
    handleReviewLiveImportCharacter,
    handleRestoreCachedImport,
    handleApplyProfileImport,
    handleCreateProfileFromSelectedImport,
    pollLiveImportJob,
    resetLiveImportState,
  } = liveImport;

  return (
    <div className="profile-live-import-container">
      <div className="profile-panel-heading">
        <div>
          <h2>Import from IdleMMO</h2>
          <p>Fetch your visible IdleMMO character details, choose the character you want, then save it to this local profile.</p>
        </div>
      </div>
      <div className="profile-import-current" aria-label="Saved IdleMMO import status">
        <div>
          <strong>
            {profile.importSource.importedAt || profile.importSource.refreshedAt
              ? `Last import: ${formatProfileSourceDate(profile.importSource.importedAt || profile.importSource.refreshedAt)}`
              : "No IdleMMO import saved yet"}
          </strong>
          <span>
            {profile.importSource.missingOrPrivate.length
              ? `${profile.importSource.missingOrPrivate.length} section${profile.importSource.missingOrPrivate.length === 1 ? "" : "s"} could not be imported because they were private or unavailable.`
              : profile.importSource.importedSections.length
                ? "Visible character details were saved to this profile."
                : "Start an import when you want Zenith to fill visible character details."}
          </span>
        </div>
        <span>{formatProfileSourceMode(profile.importSource.mode)}</span>
      </div>
      <div className="profile-live-import" aria-label="Import character from IdleMMO">
        <div className="profile-live-import-copy">
          <div>
            <strong>Character import</strong>
            <span>Use the hashed ID shown on your IdleMMO profile. Zenith will fetch visible levels, class, metrics, pets, visible alts, and museum entries.</span>
          </div>
          <div className="profile-live-import-notes" aria-label="Import privacy notes">
            <span>Your saved Zenith profile stays in this browser.</span>
            <span>The import service only handles the fetch job; it does not keep your final profile.</span>
            <span>Usually takes about {liveImportWaitText || "1-2 min"}.</span>
            <span>You can leave this page and come back.</span>
            <span>Never paste an IdleMMO API key here.</span>
          </div>
        </div>
        <details className="profile-import-help">
          <summary>Where is my imported data saved?</summary>
          <div>
            <p>Saved profiles, settings, queues, custom prices, and planner data are stored locally in this browser. Zenith does not store your character profile on a server.</p>
            <p>The import worker may briefly process visible IdleMMO profile data to finish the import, but you choose what to save, and the saved profile remains on your device. Export a backup before clearing browser data or switching devices.</p>
          </div>
        </details>
        <details className="profile-import-help">
          <summary>How do I find my hashed character ID?</summary>
          <ol>
            <li>Open IdleMMO, go to Settings, then find the Account section.</li>
            <li>Enable <strong>Show Hashed Identifiers</strong>.</li>
            <li>Open the character profile you want to import.</li>
            <li>Scroll to the Information box and copy the character&apos;s Hashed ID below Birth Date.</li>
          </ol>
        </details>
        <details className="profile-import-help profile-import-limits">
          <summary>What will not be imported?</summary>
          <div>
            <p>Zenith only reads public character data visible through IdleMMO. It does not fetch private account data or anything that requires your API key.</p>
            <ul>
              <li>Inventory, bank, storage, gold, shards, and market orders</li>
              <li>Equipped gear, tools, food, potions, and anything else</li>
              <li>Private or hidden alts, and unavailable profile sections</li>
              <li>Zenith-only settings such as membership, magic find, timers, housing, boosts, custom prices, and tool selections</li>
            </ul>
          </div>
        </details>
        <div className={`profile-live-import-form ${TURNSTILE_SITE_KEY ? "has-turnstile" : ""}`}>
          <label>
            <span>Character hashed ID</span>
            <input
              className="control-input"
              value={liveImportHash}
              aria-describedby={`${LIVE_IMPORT_HASH_HELP_ID} ${LIVE_IMPORT_STATUS_ID}${liveImportError ? ` ${LIVE_IMPORT_ERROR_ID}` : ""}`}
              aria-invalid={liveImportError && !liveImportJobId ? true : undefined}
              onChange={(event) => {
                setLiveImportHash(event.target.value);
                setLiveImportError("");
              }}
              placeholder="Your character hashed ID"
              autoComplete="off"
            />
            <small id={LIVE_IMPORT_HASH_HELP_ID}>Paste the character hashed ID only, not a full IdleMMO profile URL.</small>
          </label>
          {TURNSTILE_SITE_KEY ? (
            <div className="profile-turnstile" aria-label="Import safety check">
              <div ref={turnstileContainerRef} />
              {!turnstileReady && <span>Loading quick check...</span>}
              {turnstileError && <span className="profile-turnstile-error">{turnstileError}</span>}
            </div>
          ) : null}
          <button
            type="button"
            className="profile-action primary"
            onClick={handleStartLiveProfileImport}
            disabled={liveImportBusy || liveImportHasUnsavedResult || (Boolean(TURNSTILE_SITE_KEY) && (!turnstileReady || !turnstileToken))}
          >
            {liveImportBusy ? <Loader2 size={15} className="spin" /> : <FileUp size={15} />}
            {liveImportHasUnsavedResult ? "Save current import first" : "Start import"}
          </button>
        </div>
        <div className="profile-import-options">
          <label className="profile-force-refresh-toggle">
            <input
              type="checkbox"
              checked={forceRefreshScrape}
              onChange={(event) => setForceRefreshScrape(event.target.checked)}
              disabled={liveImportBusy || liveImportHasUnsavedResult}
            />
            <span>Force fresh scrape from game (bypass cache)</span>
          </label>
        </div>
        {!liveImportHash.trim() && recentCachedImports.length > 0 && !liveImportBusy && !liveImportHasUnsavedResult && (
          <div className="profile-cached-import-recents">
            <span className="profile-cached-import-recents-label">Recent imports:</span>
            <div className="profile-cached-import-pills">
              {recentCachedImports.map((entry) => (
                <button
                  key={entry.characterHash}
                  type="button"
                  className="profile-cached-pill"
                  onClick={() => {
                    setLiveImportHash(entry.characterHash);
                    setLiveImportError("");
                  }}
                  title={`Select ${entry.mainName} (${entry.characterHashTail})`}
                >
                  <History size={12} /> {entry.mainName} <small>({formatCacheAge(entry.timestamp)})</small>
                </button>
              ))}
            </div>
          </div>
        )}
        {cachedImportMatch && !liveImportBusy && !liveImportHasUnsavedResult && (
          <div className="profile-cached-import-card" role="region" aria-label="Cached character import">
            <div className="profile-cached-import-header">
              <div className="profile-cached-import-meta">
                <span className="profile-cached-import-badge">
                  <History size={13} /> Instant Cache Available
                </span>
                <strong>{cachedImportMatch.mainName}</strong>
                <span className="profile-cached-import-sub">
                  {cachedImportMatch.characterCount} {cachedImportMatch.characterCount === 1 ? "character" : "characters"} &bull; {cachedImportMatch.classes.join(", ") || "Saved draft"} &bull; {formatCacheAge(cachedImportMatch.timestamp)}
                </span>
              </div>
              <div className="profile-cached-import-actions">
                <button
                  type="button"
                  className="profile-action secondary"
                  onClick={() => handleRestoreCachedImport(cachedImportMatch)}
                  title="Restore this character draft immediately without re-scraping"
                >
                  <Zap size={14} /> Restore Cached
                </button>
                <button
                  type="button"
                  className="profile-cached-import-dismiss"
                  onClick={() => {
                    deleteCachedProfileImport(cachedImportMatch.characterHash);
                    setCachedImportMatch(null);
                  }}
                  title="Clear this cached draft"
                  aria-label="Clear cached draft"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Single unified status card with mutually exclusive states */}
        {isTerminalError ? (
          <div
            id={LIVE_IMPORT_STATUS_ID}
            className="profile-live-import-status error"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="profile-live-import-status-header">
              <div>
                <strong className="profile-live-import-step-badge text-danger">
                  {liveImportStatus === "expired" ? "Import expired" : "Import failed"}
                </strong>
                <p id={LIVE_IMPORT_ERROR_ID} className="profile-live-import-error-desc">
                  {liveImportError || "The import could not finish. Your local profile was not changed."}
                </p>
              </div>
              <div className="profile-live-import-status-stat">
                <strong className="text-danger">Failed</strong>
                <span>Unchanged</span>
              </div>
            </div>
            <div className="profile-live-import-status-footer">
              <span>Your local profile was not changed.</span>
              <div className="profile-live-import-status-actions">
                <button
                  type="button"
                  className="profile-action"
                  onClick={() => resetLiveImportState()}
                >
                  <X size={15} /> Start new import
                </button>
              </div>
            </div>
          </div>
        ) : isRateLimited ? (
          <div
            id={LIVE_IMPORT_STATUS_ID}
            className="profile-live-import-status cooldown"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="profile-live-import-status-header">
              <div>
                <strong className="profile-live-import-step-badge text-accent">
                  {resolvedStep.badge}
                </strong>
                <span className="profile-live-import-subtext">
                  {liveImportProgress?.label || "IdleMMO rate limit active. Resuming automatically."}
                </span>
              </div>
              <div className="profile-live-import-status-stat">
                <strong>{liveImportRetryText || formatWaitTime(liveImportRetryAfterMs ?? 0) || "Paused"}</strong>
                <span>{liveImportRetryText ? "Resuming in" : "Rate limited"}</span>
              </div>
            </div>
            <div
              className="profile-import-step-track"
              role="progressbar"
              aria-label="Import step progress"
              aria-valuenow={resolvedStep.stepIndex}
              aria-valuemin={1}
              aria-valuemax={4}
            >
              {LIVE_IMPORT_STEPS.map((step) => {
                let stateClass = "upcoming";
                if (step.index < resolvedStep.stepIndex) {
                  stateClass = "completed";
                } else if (step.index === resolvedStep.stepIndex) {
                  stateClass = "active";
                }
                return (
                  <div
                    key={step.key}
                    className={`profile-import-step-segment ${stateClass}`}
                    title={`Step ${step.index}: ${step.defaultLabel}`}
                    aria-label={`Step ${step.index}: ${step.defaultLabel} (${stateClass})`}
                  />
                );
              })}
            </div>
            <div className="profile-live-import-status-footer">
              <span>Saved to browser • Resumes automatically</span>
              <div className="profile-live-import-status-actions">
                <button
                  type="button"
                  className="profile-action"
                  onClick={() => resetLiveImportState()}
                >
                  <X size={15} /> Cancel import
                </button>
              </div>
            </div>
          </div>
        ) : isActiveProgress ? (
          <div
            id={LIVE_IMPORT_STATUS_ID}
            className={`profile-live-import-status ${liveImportStatus}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="profile-live-import-status-header">
              <div>
                <strong className="profile-live-import-step-badge">
                  {resolvedStep.badge}
                </strong>
                <span className="profile-live-import-subtext">
                  {resolvedStep.detail}
                </span>
              </div>
              <div className="profile-live-import-status-stat">
                <strong>
                  {liveImportProgress?.current !== undefined
                    ? `${liveImportProgress.current}/${liveImportProgress.total || 12}`
                    : liveImportWaitText
                      ? `~${liveImportWaitText}`
                      : "Active"}
                </strong>
                <span>{liveImportProgress?.current !== undefined ? "Requests used" : "Estimated time"}</span>
              </div>
            </div>
            <div
              className="profile-import-step-track"
              role="progressbar"
              aria-label="Import step progress"
              aria-valuenow={resolvedStep.stepIndex}
              aria-valuemin={1}
              aria-valuemax={4}
            >
              {LIVE_IMPORT_STEPS.map((step) => {
                let stateClass = "upcoming";
                if (step.index < resolvedStep.stepIndex) {
                  stateClass = "completed";
                } else if (step.index === resolvedStep.stepIndex) {
                  stateClass = "active";
                }
                return (
                  <div
                    key={step.key}
                    className={`profile-import-step-segment ${stateClass}`}
                    title={`Step ${step.index}: ${step.defaultLabel}`}
                    aria-label={`Step ${step.index}: ${step.defaultLabel} (${stateClass})`}
                  />
                );
              })}
            </div>
            <div className="profile-live-import-status-footer">
              <span>Import recovery active • Synced across tabs</span>
              <div className="profile-live-import-status-actions">
                {liveImportJobId && (
                  <button
                    type="button"
                    className="profile-action"
                    onClick={() => void pollLiveImportJob(liveImportJobId)}
                    disabled={liveImportBusy}
                  >
                    <Loader2 size={15} className={liveImportBusy ? "spin" : ""} /> Check status
                  </button>
                )}
                <button
                  type="button"
                  className="profile-action"
                  onClick={() => resetLiveImportState()}
                >
                  <X size={15} /> Cancel import
                </button>
              </div>
            </div>
          </div>
        ) : isComplete ? (
          <div
            id={LIVE_IMPORT_STATUS_ID}
            className="profile-live-import-status done"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="profile-live-import-status-header">
              <div>
                <strong className="profile-live-import-step-badge text-success">
                  Step 4 of 4: Profile assembled
                </strong>
                <span className="profile-live-import-subtext">
                  Choose a character below to preview and save to your active profile.
                </span>
              </div>
              <div className="profile-live-import-status-stat">
                <strong className="text-success">{liveImportResult?.characters?.length || 0}</strong>
                <span>Character{liveImportResult?.characters?.length === 1 ? "" : "s"} found</span>
              </div>
            </div>
            <div
              className="profile-import-step-track"
              role="progressbar"
              aria-label="Import step progress"
              aria-valuenow={4}
              aria-valuemin={1}
              aria-valuemax={4}
            >
              {LIVE_IMPORT_STEPS.map((step) => (
                <div
                  key={step.key}
                  className="profile-import-step-segment completed"
                  title={`Step ${step.index}: ${step.defaultLabel}`}
                  aria-label={`Step ${step.index}: ${step.defaultLabel} (completed)`}
                />
              ))}
            </div>
            <div className="profile-live-import-status-footer">
              <span>Import complete • Ready to save</span>
              <div className="profile-live-import-status-actions">
                <button
                  type="button"
                  className="profile-action"
                  onClick={() => resetLiveImportState()}
                >
                  <X size={15} /> Clear saved import
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            id={LIVE_IMPORT_STATUS_ID}
            className="profile-live-import-status idle"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="profile-live-import-status-header">
              <div>
                <strong className="profile-live-import-step-badge">Not started</strong>
                <span className="profile-live-import-subtext">
                  Paste a character hash to fetch visible IdleMMO profile details. Nothing is saved until you confirm.
                </span>
              </div>
              <div className="profile-live-import-status-stat">
                <strong>Ready</strong>
                <span>Waiting for hash</span>
              </div>
            </div>
          </div>
        )}
        {liveImportResult?.characters?.length ? (
          <div className="profile-live-import-results" aria-label="Imported characters ready to save">
            <div className="profile-live-import-result-heading">
              <strong>{liveImportResult.characters.length} character{liveImportResult.characters.length === 1 ? "" : "s"} found</strong>
              <span>{liveImportResult.requestCount || 0} safe request{liveImportResult.requestCount === 1 ? "" : "s"} used</span>
            </div>
            <div className="profile-live-import-character-list">
              {liveImportResult.characters.map((character, index) => {
                const draft = character.draft;
                const selected = index === liveImportSelectedIndex;
                return (
                  <button
                    type="button"
                    key={`${character.role || "character"}-${index}-${profileDraftDisplayName(draft)}`}
                    className={`profile-live-import-character ${selected ? "selected" : ""}`}
                    onClick={() => handleReviewLiveImportCharacter(index)}
                  >
                    <span>
                      <strong>{profileDraftDisplayName(draft)}</strong>
                      <small>{character.role === "visible_alt" ? "Visible alt" : "Entered character"}</small>
                    </span>
                    <span>
                      <b>{draft?.importSource?.importedSections?.length || 0}</b>
                      <small>Sections</small>
                    </span>
                    <span>
                      <b>{draft?.importSource?.missingOrPrivate?.length || "None"}</b>
                      <small>Missing/private</small>
                    </span>
                  </button>
                );
              })}
            </div>
            {(liveImportResult.warnings || []).length > 0 && (
              <p className="profile-transfer-message">{liveImportResult.warnings?.join(" ")}</p>
            )}
            {importReview && (
              <div className="profile-import-savebar">
                <div>
                  <strong>Ready to save {importReview.draftName || "selected character"}</strong>
                  <span>{importReview.appliedPaths.length} fields will update. {importReview.skippedManualPaths.length ? `${importReview.skippedManualPaths.length} filled manual fields will stay unchanged.` : "Blank/default fields can be filled by the import."}</span>
                </div>
                <button type="button" className="profile-action primary" onClick={handleApplyProfileImport}>
                  <BadgeCheck size={15} /> Save to active profile
                </button>
                <button type="button" className="profile-action" onClick={handleCreateProfileFromSelectedImport} disabled={profilesCount >= MAX_PROFILES}>
                  <Plus size={15} /> Create new profile
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
      {(profile.importSource.importedSections.length > 0 || profile.importSource.missingOrPrivate.length > 0 || profile.importSource.notes) && (
        <details className="profile-import-review-details profile-import-persistent" aria-label="Saved profile import detail">
          <summary>Import details</summary>
          <div>
            <strong>Imported</strong>
            <span>{profile.importSource.importedSections.join(", ") || "None recorded"}</span>
          </div>
          {profile.importSource.missingOrPrivate.length > 0 && (
            <div>
              <strong>Not imported</strong>
              <span>{profile.importSource.missingOrPrivate.join(", ")}</span>
            </div>
          )}
          {profile.importSource.notes && (
            <div>
              <strong>Notes</strong>
              <span>{profile.importSource.notes}</span>
            </div>
          )}
        </details>
      )}
      <div className="profile-import-handoff">
        <div>
          <strong>Hidden alt or separate character?</strong>
          <span>Create a local alt profile now, then paste that character&apos;s hashed ID above and import it when you switch to that profile.</span>
        </div>
        <label>
          <span>Character hash</span>
          <input
            className="control-input"
            value={profileHashDraft}
            onChange={(event) => setProfileHashDraft(event.target.value)}
            placeholder="Paste character hash ID..."
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="profile-action"
          onClick={handleCreateProfileFromHash}
          disabled={profilesCount >= MAX_PROFILES}
        >
          <Plus size={15} /> Create alt profile
        </button>
      </div>
    </div>
  );
}
