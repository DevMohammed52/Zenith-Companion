"use client";

import React from "react";
import { MAX_PROFILES, type CharacterProfile } from "@/lib/profiles";
import { deleteCachedProfileImport, formatCacheAge } from "@/lib/profile-import-cache";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TextInput } from "@/components/ui/TextInput";
import styles from "../Profiles.module.css";
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

  const progressPercent = isComplete ? 100 : Math.round((resolvedStep.stepIndex / LIVE_IMPORT_STEPS.length) * 100);

  return (
    <div className={styles.importShell}>
      <div className={styles.panelHeading}>
        <div>
          <h2>Import from IdleMMO</h2>
          <p>
            Fetch visible IdleMMO character details, review what you want, and save locally into your roster.
          </p>
        </div>
        <Badge variant="neutral" size="md">
          Mode: {formatProfileSourceMode(profile.importSource.mode)}
        </Badge>
      </div>

      <div className={styles.importColumns}>
        <div className={styles.importShell} aria-label="Import character from IdleMMO">
          <div className={styles.selectedCard} aria-label="Saved IdleMMO import status" style={{ marginTop: 0 }}>
            <div className={styles.selectedCardCopy}>
              <strong>
                {profile.importSource.importedAt || profile.importSource.refreshedAt
                  ? `Last import: ${formatProfileSourceDate(
                      profile.importSource.importedAt || profile.importSource.refreshedAt,
                    )}`
                  : "No IdleMMO import saved yet"}
              </strong>
              <small>
                {profile.importSource.missingOrPrivate.length
                  ? `${profile.importSource.missingOrPrivate.length} section${
                      profile.importSource.missingOrPrivate.length === 1 ? "" : "s"
                    } unavailable or private.`
                  : profile.importSource.importedSections.length
                    ? "Visible character details saved locally."
                    : `Paste a hashed character ID below. Typical fetch takes ${liveImportWaitText || "1-2 min"}.`}
              </small>
            </div>
          </div>

          <div className={styles.importForm}>
            <TextInput
              label="Character hashed ID"
              value={liveImportHash}
              aria-describedby={`${LIVE_IMPORT_HASH_HELP_ID} ${LIVE_IMPORT_STATUS_ID}${
                liveImportError ? ` ${LIVE_IMPORT_ERROR_ID}` : ""
              }`}
              aria-invalid={liveImportError && !liveImportJobId ? true : undefined}
              onChange={(event) => {
                setLiveImportHash(event.target.value);
                setLiveImportError("");
              }}
              placeholder="Paste hashed character ID..."
              autoComplete="off"
            />

            <Button
              variant="primary"
              size="md"
              loading={liveImportBusy}
              icon={!liveImportBusy ? <Icon name="upload" size="sm" aria-hidden="true" /> : undefined}
              onClick={handleStartLiveProfileImport}
              disabled={
                liveImportBusy ||
                liveImportHasUnsavedResult ||
                (Boolean(TURNSTILE_SITE_KEY) && (!turnstileReady || !turnstileToken))
              }
            >
              {liveImportHasUnsavedResult ? "Save current import first" : "Start import"}
            </Button>
          </div>

          <small id={LIVE_IMPORT_HASH_HELP_ID} className={styles.importHint}>
            Paste only the character hashed ID (never a full profile URL or API key).
          </small>

          {TURNSTILE_SITE_KEY ? (
            <div className={`${styles.turnstileCard} profile-turnstile`} aria-label="Import safety check">
              <div className={styles.turnstileHead}>
                <strong>Verification check</strong>
                <span>{turnstileReady ? "Ready" : "Loading quick check..."}</span>
              </div>
              <div ref={turnstileContainerRef} className={styles.turnstileWidget} />
              {turnstileError && (
                <span style={{ color: "var(--text-danger)", fontSize: "0.8rem" }}>{turnstileError}</span>
              )}
            </div>
          ) : null}

          <div className={styles.importOptionsRow}>
            <Checkbox
              label="Force fresh scrape from game (bypass cache)"
              checked={forceRefreshScrape}
              onChange={(event) => setForceRefreshScrape(event.target.checked)}
              disabled={liveImportBusy || liveImportHasUnsavedResult}
            />
          </div>

          {!liveImportHash.trim() && recentCachedImports.length > 0 && !liveImportBusy && !liveImportHasUnsavedResult && (
            <div className={styles.importOptionsRow}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Recent imports:
              </span>
              <div className={styles.actionRow}>
                {recentCachedImports.map((entry) => (
                  <Button
                    key={entry.characterHash}
                    variant="secondary"
                    size="sm"
                    icon={<Icon name="history" size="xs" aria-hidden="true" />}
                    onClick={() => {
                      setLiveImportHash(entry.characterHash);
                      setLiveImportError("");
                    }}
                  >
                    {entry.mainName} ({formatCacheAge(entry.timestamp)})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {cachedImportMatch && !liveImportBusy && !liveImportHasUnsavedResult && (
            <div className={styles.statusCard} role="region" aria-label="Cached character import">
              <div className={styles.statusHeader}>
                <div className={styles.statusTitleGroup}>
                  <div className={styles.statusTitleRow}>
                    <Badge variant="premium" size="sm" icon={<Icon name="history" size="xs" aria-hidden="true" />}>
                      Instant Cache Available
                    </Badge>
                    <strong>{cachedImportMatch.mainName}</strong>
                  </div>
                  <p>
                    {cachedImportMatch.characterCount}{" "}
                    {cachedImportMatch.characterCount === 1 ? "character" : "characters"} |{" "}
                    {cachedImportMatch.classes.join(", ") || "Saved draft"} | {formatCacheAge(cachedImportMatch.timestamp)}
                  </p>
                </div>
                <div className={styles.actionRow}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Icon name="speed" size="xs" aria-hidden="true" />}
                    onClick={() => handleRestoreCachedImport(cachedImportMatch)}
                  >
                    Restore Cached
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icon name="close" size="xs" aria-hidden="true" />}
                    onClick={() => {
                      deleteCachedProfileImport(cachedImportMatch.characterHash);
                      setCachedImportMatch(null);
                    }}
                    aria-label="Clear cached draft"
                  />
                </div>
              </div>
            </div>
          )}

          {isTerminalError ? (
            <div id={LIVE_IMPORT_STATUS_ID} className={styles.statusCard} role="status" aria-live="polite" aria-atomic="true">
              <div className={styles.statusHeader}>
                <div className={styles.statusTitleGroup}>
                  <div className={styles.statusTitleRow}>
                    <Badge variant="danger" size="sm">
                      {liveImportStatus === "expired" ? "Import expired" : "Import failed"}
                    </Badge>
                    <strong>Local profile unchanged</strong>
                  </div>
                  <p id={LIVE_IMPORT_ERROR_ID} style={{ color: "var(--text-danger)" }}>
                    {liveImportError || "The import could not finish. Your local profile was not changed."}
                  </p>
                </div>
                <Button variant="secondary" size="sm" icon={<Icon name="close" size="xs" aria-hidden="true" />} onClick={() => resetLiveImportState()}>
                  Start new import
                </Button>
              </div>
            </div>
          ) : isRateLimited ? (
            <div id={LIVE_IMPORT_STATUS_ID} className={styles.statusCard} role="status" aria-live="polite" aria-atomic="true">
              <div className={styles.statusHeader}>
                <div className={styles.statusTitleGroup}>
                  <div className={styles.statusTitleRow}>
                    <Badge variant="warning" size="sm">{resolvedStep.badge}</Badge>
                    <strong>{liveImportRetryText || formatWaitTime(liveImportRetryAfterMs ?? 0) || "Paused"}</strong>
                  </div>
                  <p>{liveImportProgress?.label || "IdleMMO rate limit active. Resuming automatically."}</p>
                </div>
                <Button variant="secondary" size="sm" icon={<Icon name="close" size="xs" aria-hidden="true" />} onClick={() => resetLiveImportState()}>
                  Cancel import
                </Button>
              </div>
              <ProgressBar value={resolvedStep.stepIndex} min={1} max={4} label="Import step progress" valueText={`${progressPercent}%`} size="sm" />
            </div>
          ) : isActiveProgress ? (
            <div id={LIVE_IMPORT_STATUS_ID} className={styles.statusCard} role="status" aria-live="polite" aria-atomic="true">
              <div className={styles.statusHeader}>
                <div className={styles.statusTitleGroup}>
                  <div className={styles.statusTitleRow}>
                    <Badge variant="premium" size="sm">{resolvedStep.badge}</Badge>
                    <strong>
                      {liveImportProgress?.current !== undefined
                        ? `${liveImportProgress.current}/${liveImportProgress.total || 12} requests`
                        : liveImportWaitText
                          ? `~${liveImportWaitText}`
                          : "Active"}
                    </strong>
                  </div>
                  <p>{resolvedStep.detail}</p>
                </div>
                <div className={styles.actionRow}>
                  {liveImportJobId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={liveImportBusy}
                      icon={!liveImportBusy ? <Icon name="refresh" size="xs" aria-hidden="true" /> : undefined}
                      onClick={() => void pollLiveImportJob(liveImportJobId)}
                      disabled={liveImportBusy}
                    >
                      Check status
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={<Icon name="close" size="xs" aria-hidden="true" />} onClick={() => resetLiveImportState()}>
                    Cancel import
                  </Button>
                </div>
              </div>
              <ProgressBar value={resolvedStep.stepIndex} min={1} max={4} label="Import step progress" valueText={`Step ${resolvedStep.stepIndex} of 4`} size="sm" />
              <div className={styles.stepTrack}>
                {LIVE_IMPORT_STEPS.map((step) => {
                  const state = step.index < resolvedStep.stepIndex ? "done" : step.index === resolvedStep.stepIndex ? "active" : "pending";
                  return (
                    <div key={step.key} className={styles.stepItem} data-state={state}>
                      <div className={styles.stepItemTop}>
                        <span>Step {step.index}</span>
                        <span>{state === "done" ? "Done" : state === "active" ? "Running" : "Pending"}</span>
                      </div>
                      <span className={styles.stepItemTitle}>{step.defaultLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isComplete ? (
            <div id={LIVE_IMPORT_STATUS_ID} className={styles.statusCard} role="status" aria-live="polite" aria-atomic="true">
              <div className={styles.statusHeader}>
                <div className={styles.statusTitleGroup}>
                  <div className={styles.statusTitleRow}>
                    <Badge variant="success" size="sm">Step 4 of 4: Profile assembled</Badge>
                    <strong>{liveImportResult?.characters?.length || 0} character{liveImportResult?.characters?.length === 1 ? "" : "s"} found</strong>
                  </div>
                  <p>Select a character below to preview and save to your active profile.</p>
                </div>
                <Button variant="secondary" size="sm" icon={<Icon name="close" size="xs" aria-hidden="true" />} onClick={() => resetLiveImportState()}>
                  Clear saved import
                </Button>
              </div>
              <ProgressBar value={4} min={1} max={4} variant="success" label="Import step progress" valueText="Complete" size="sm" />
            </div>
          ) : (
            <div id={LIVE_IMPORT_STATUS_ID} className={styles.statusCard} role="status" aria-live="polite" aria-atomic="true">
              <div className={styles.statusHeader}>
                <div className={styles.statusTitleGroup}>
                  <div className={styles.statusTitleRow}>
                    <Badge variant="neutral" size="sm">Ready</Badge>
                    <strong>Waiting for character hash</strong>
                  </div>
                  <p>Nothing changes locally until you review and confirm saving.</p>
                </div>
              </div>
            </div>
          )}

          {liveImportResult?.characters?.length ? (
            <div className={styles.importShell} aria-label="Imported characters ready to save">
              <div className={styles.importOptionsRow}>
                <strong>{liveImportResult.characters.length} character{liveImportResult.characters.length === 1 ? "" : "s"} found</strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {liveImportResult.requestCount || 0} safe request{liveImportResult.requestCount === 1 ? "" : "s"} used
                </span>
              </div>

              <div className={styles.characterList}>
                {liveImportResult.characters.map((character, index) => {
                  const draft = character.draft;
                  const selected = index === liveImportSelectedIndex;
                  return (
                    <button
                      type="button"
                      key={`${character.role || "character"}-${index}-${profileDraftDisplayName(draft)}`}
                      className={`${styles.characterOption} ${selected ? styles.characterOptionSelected : ""}`}
                      aria-pressed={selected}
                      onClick={() => handleReviewLiveImportCharacter(index)}
                    >
                      <span className={styles.characterOptionMain}>
                        <strong>{profileDraftDisplayName(draft)}</strong>
                        <small>{character.role === "visible_alt" ? "Visible alt" : "Entered character"}</small>
                      </span>
                      <span className={styles.characterOptionLevel}>{draft?.importSource?.importedSections?.length || 0} sections</span>
                      <span className={styles.characterOptionStatus}>{draft?.importSource?.missingOrPrivate?.length || 0} private</span>
                    </button>
                  );
                })}
              </div>

              {(liveImportResult.warnings || []).length > 0 && (
                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  {liveImportResult.warnings?.join(" ")}
                </p>
              )}

              {importReview && (
                <div className={styles.selectedCard}>
                  <div className={styles.selectedCardCopy}>
                    <strong>Ready to save {importReview.draftName || "selected character"}</strong>
                    <small>
                      {importReview.appliedPaths.length} fields will update.{" "}
                      {importReview.skippedManualPaths.length
                        ? `${importReview.skippedManualPaths.length} manual fields stay unchanged.`
                        : "Blank fields can be populated by this import."}
                    </small>
                  </div>
                  <div className={styles.actionRow}>
                    <Button variant="primary" size="md" icon={<Icon name="membership" size="sm" aria-hidden="true" />} onClick={handleApplyProfileImport}>
                      Save to active profile
                    </Button>
                    <Button variant="secondary" size="md" icon={<Icon name="plus" size="sm" aria-hidden="true" />} onClick={handleCreateProfileFromSelectedImport} disabled={profilesCount >= MAX_PROFILES}>
                      Create new profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <aside className={styles.importShell} aria-label="Import guide and alt quick add">
          <div className={styles.sideCard}>
            <h3>How to find your Hashed ID</h3>
            <ol className={styles.sideSteps}>
              <li>Open IdleMMO Settings → Account.</li>
              <li>Enable <strong>Show Hashed Identifiers</strong>.</li>
              <li>Open your character profile and copy the Hashed ID under Birth Date.</li>
            </ol>
            <p className={styles.importHint}>
              Your data stays in this browser. Zenith only reads public profile pages and never accesses bank, inventory, market orders, gear, tools, or private alts.
            </p>
          </div>

          <div className={styles.sideCard}>
            <h3>Hidden alt or separate character?</h3>
            <p className={styles.importHint}>
              Create a new local alt slot and import that character&apos;s hashed ID above.
            </p>
            <TextInput
              label="Character hash"
              value={profileHashDraft}
              onChange={(event) => setProfileHashDraft(event.target.value)}
              placeholder="Paste character hash ID..."
              autoComplete="off"
            />
            <Button
              variant="secondary"
              size="md"
              icon={<Icon name="plus" size="sm" aria-hidden="true" />}
              onClick={handleCreateProfileFromHash}
              disabled={profilesCount >= MAX_PROFILES}
              fullWidth
            >
              Create alt profile
            </Button>
          </div>

          {(profile.importSource.importedSections.length > 0 ||
            profile.importSource.missingOrPrivate.length > 0 ||
            profile.importSource.notes) && (
            <details className={styles.accordionCard} style={{ marginTop: 0 }} aria-label="Saved profile import detail">
              <summary className={styles.accordionSummary}>
                <span className={styles.accordionTitleGroup}>
                  <strong>Last Import Details</strong>
                  <span>View imported and private sections from last sync</span>
                </span>
                <span className={styles.accordionCue}>
                  <span>Details</span>
                  <Icon name="chevronDown" size="sm" className={styles.accordionChevron} aria-hidden="true" />
                </span>
              </summary>
              <div className={styles.accordionBody} style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <div>
                  <strong style={{ color: "var(--text-main)" }}>Imported: </strong>
                  <span>{profile.importSource.importedSections.join(", ") || "None recorded"}</span>
                </div>
                {profile.importSource.missingOrPrivate.length > 0 && (
                  <div>
                    <strong style={{ color: "var(--text-main)" }}>Not imported: </strong>
                    <span>{profile.importSource.missingOrPrivate.join(", ")}</span>
                  </div>
                )}
                {profile.importSource.notes && (
                  <div>
                    <strong style={{ color: "var(--text-main)" }}>Notes: </strong>
                    <span>{profile.importSource.notes}</span>
                  </div>
                )}
              </div>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
