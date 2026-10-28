"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CharacterProfile, ProfilesState } from "@/lib/profiles";
import { createDefaultProfile, MAX_PROFILES } from "@/lib/profiles";
import {
  mergeImportedProfileDraft,
  type ImportedProfileDraft,
  type ImportedProfileMergeResult,
} from "@/lib/profile-import";
import {
  getCachedProfileImport,
  getRecentCachedProfileImports,
  saveCachedProfileImport,
  type CachedProfileImportEntry,
  IMPORT_CACHE_EVENT,
} from "@/lib/profile-import-cache";

export const PROFILE_IMPORT_API_URL = "/api";
export const CHARACTER_HASH_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
export const LIVE_IMPORT_STORAGE_KEY = "zenith.profileImport.active.v1";
export const LIVE_IMPORT_CHANNEL = "zenith-profile-import";
export const LIVE_IMPORT_LEASE_KEY = "zenith.profileImport.pollLease.v1";
export const LIVE_IMPORT_LEASE_MS = 18000;
export const LIVE_IMPORT_HASH_HELP_ID = "profile-live-import-hash-help";
export const LIVE_IMPORT_STATUS_ID = "profile-live-import-status";
export const LIVE_IMPORT_ERROR_ID = "profile-live-import-error";
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === "1"
  ? ""
  : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
export const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
export const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type LiveProfileImportStatus = "idle" | "queued" | "running" | "waiting_for_budget" | "done" | "error" | "expired";

export type LiveProfileImportCharacter = {
  role?: "root" | "visible_alt";
  draft?: ImportedProfileDraft;
};

export type LiveProfileImportResult = {
  rootHashTail?: string;
  requestCount?: number;
  durationMs?: number;
  characters?: LiveProfileImportCharacter[];
  warnings?: string[];
};

export type LiveProfileImportStepKey = "root_baseline" | "account_museum" | "alt_characters" | "final_assembly";

export interface LiveProfileImportStepConfig {
  key: LiveProfileImportStepKey;
  index: number;
  defaultLabel: string;
  gamerCopy: string;
}

export const LIVE_IMPORT_STEPS: readonly LiveProfileImportStepConfig[] = [
  { key: "root_baseline", index: 1, defaultLabel: "Reading root character", gamerCopy: "Reading root character" },
  { key: "account_museum", index: 2, defaultLabel: "Scanning museum", gamerCopy: "Scanning museum" },
  { key: "alt_characters", index: 3, defaultLabel: "Importing alts", gamerCopy: "Importing Alt characters" },
  { key: "final_assembly", index: 4, defaultLabel: "Assembling profile", gamerCopy: "Assembling profile" },
] as const;

export interface ResolvedLiveImportStep {
  step: LiveProfileImportStepKey | string;
  stepIndex: number;
  stepTotal: number;
  stepLabel: string;
  badge: string;
  detail: string;
}

export type LiveProfileImportProgress = {
  current?: number;
  total?: number;
  label?: string;
  estimatedRemainingMs?: number;
  step?: LiveProfileImportStepKey | string;
  stepIndex?: number;
  stepTotal?: number;
  stepLabel?: string;
};

export type LiveProfileImportSnapshot = {
  version: 1;
  jobId: string;
  characterHash?: string;
  characterHashTail?: string;
  status: LiveProfileImportStatus;
  progress?: LiveProfileImportProgress | null;
  result?: LiveProfileImportResult | null;
  selectedIndex?: number;
  error?: string;
  retryAfterMs?: number | null;
  estimatedMs?: number | null;
  startedAt: number;
  updatedAt: number;
};

export type LiveProfileImportLease = {
  tabId?: string;
  until?: number;
};

export type ProfileImportReview = ImportedProfileMergeResult & {
  draftName?: string;
  importedSections: string[];
  missingOrPrivate: string[];
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function formatWaitTime(ms?: number): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return "";
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

export function getRetryAfterMs(payload: unknown): number | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.retryAfterMs === "number" && Number.isFinite(payload.retryAfterMs) && payload.retryAfterMs > 0) {
    return Math.round(payload.retryAfterMs);
  }
  return null;
}

export function getPollAfterMs(payload: unknown, defaultMs = 3500): number {
  if (!isRecord(payload)) return defaultMs;
  if (typeof payload.pollAfterMs === "number" && Number.isFinite(payload.pollAfterMs) && payload.pollAfterMs > 0) {
    return Math.round(payload.pollAfterMs);
  }
  return defaultMs;
}

export function resolveLiveImportStep(progress: unknown, status?: LiveProfileImportStatus): ResolvedLiveImportStep {
  const stepTotal = isRecord(progress) && typeof progress.stepTotal === "number" && progress.stepTotal > 0
    ? progress.stepTotal
    : 4;

  let matchedConfig: LiveProfileImportStepConfig | undefined;

  if (isRecord(progress)) {
    if (typeof progress.stepIndex === "number" && Number.isFinite(progress.stepIndex) && progress.stepIndex >= 1) {
      const clampedIndex = Math.min(stepTotal, Math.round(progress.stepIndex));
      matchedConfig = LIVE_IMPORT_STEPS.find((s) => s.index === clampedIndex);
    }
    if (!matchedConfig && typeof progress.step === "string") {
      matchedConfig = LIVE_IMPORT_STEPS.find((s) => s.key === progress.step);
    }
  }

  if (!matchedConfig) {
    if (status === "done") {
      matchedConfig = LIVE_IMPORT_STEPS[3]; // final_assembly
    } else {
      matchedConfig = LIVE_IMPORT_STEPS[0]; // root_baseline
    }
  }

  const stepLabel = (isRecord(progress) && typeof progress.stepLabel === "string" && progress.stepLabel.trim())
    ? progress.stepLabel.trim()
    : matchedConfig.defaultLabel;

  const badge = `Step ${matchedConfig.index} of ${stepTotal}: ${stepLabel}`;

  let detail = matchedConfig.gamerCopy;
  if (isRecord(progress) && typeof progress.label === "string" && progress.label.trim()) {
    detail = progress.label.trim();
  } else if (status === "done") {
    detail = "Profile assembled and ready to save.";
  } else if (status === "waiting_for_budget") {
    detail = "IdleMMO rate limit cooldown active. Resuming automatically.";
  }

  return {
    step: matchedConfig.key,
    stepIndex: matchedConfig.index,
    stepTotal,
    stepLabel,
    badge,
    detail,
  };
}

export function isLiveImportTerminal(status: LiveProfileImportStatus): boolean {
  return status === "done" || status === "error" || status === "expired";
}

export function parseLiveImportSnapshot(value: string | null): LiveProfileImportSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.jobId !== "string" || !parsed.jobId) return null;
    const status = typeof parsed.status === "string" ? parsed.status as LiveProfileImportStatus : "idle";
    if (!["queued", "running", "waiting_for_budget", "done", "error", "expired"].includes(status)) return null;
    const startedAt = typeof parsed.startedAt === "number" ? parsed.startedAt : Date.now();
    const updatedAt = typeof parsed.updatedAt === "number" ? parsed.updatedAt : startedAt;
    return {
      version: 1,
      jobId: parsed.jobId,
      characterHash: typeof parsed.characterHash === "string" ? parsed.characterHash : undefined,
      characterHashTail: typeof parsed.characterHashTail === "string" ? parsed.characterHashTail : undefined,
      status,
      progress: isRecord(parsed.progress) ? parsed.progress : null,
      result: isRecord(parsed.result) ? parsed.result as LiveProfileImportResult : null,
      selectedIndex: typeof parsed.selectedIndex === "number" ? parsed.selectedIndex : 0,
      error: typeof parsed.error === "string" ? parsed.error : "",
      retryAfterMs: typeof parsed.retryAfterMs === "number" ? parsed.retryAfterMs : null,
      estimatedMs: typeof parsed.estimatedMs === "number" ? parsed.estimatedMs : null,
      startedAt,
      updatedAt,
    };
  } catch {
    return null;
  }
}

export function parseLiveImportLease(value: string | null): LiveProfileImportLease | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? {
      tabId: typeof parsed.tabId === "string" ? parsed.tabId : undefined,
      until: typeof parsed.until === "number" ? parsed.until : undefined,
    } : null;
  } catch {
    return null;
  }
}

export function liveProfileImportStatusLabel(status: LiveProfileImportStatus, retryAfterMs?: number | null): string {
  if (status === "queued") return "Queued";
  if (status === "running") return "Importing";
  if (status === "waiting_for_budget") return "Waiting for safe budget";
  if (status === "done") return "Ready to save";
  if (status === "error" && retryAfterMs) return "Import paused";
  if (status === "error") return "Import failed";
  if (status === "expired") return "Expired";
  return "Not started";
}

export function liveProfileImportStatusCopy(status: LiveProfileImportStatus, retryAfterMs?: number | null): string {
  if (status === "queued") return "Your import is queued. Zenith will restore it if you leave this page and come back.";
  if (status === "running") return "Zenith is fetching visible character details. You can leave this page and return later.";
  if (status === "waiting_for_budget") return "Another scraper or import is using the shared budget, so this job is waiting briefly.";
  if (status === "done") return "Choose the character you want, check the summary, then save it to the active profile.";
  if (status === "error" && retryAfterMs) return "Imports are busy right now. You can close this page and try again after the timer.";
  if (status === "error") return "The import could not finish. Your local profile was not changed.";
  if (status === "expired") return "This import result expired. Start a new import if you still need it.";
  return "Paste a character hash to fetch visible IdleMMO profile details. Nothing is saved until you confirm.";
}

export function profileDraftDisplayName(draft?: ImportedProfileDraft): string {
  return typeof draft?.name === "string" && draft.name.trim() ? draft.name.trim() : "Imported character";
}

export function getLiveImportErrorMessage(payload: unknown, fallback: string): string {
  const retryAfterMs = getRetryAfterMs(payload);
  const retryText = retryAfterMs ? formatWaitTime(retryAfterMs) : "";
  if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
    const message = payload.error.message.trim();
    return retryText && !message.toLowerCase().includes("try again")
      ? `${message} Try again in about ${retryText}.`
      : message;
  }
  return retryText ? `${fallback} Try again in about ${retryText}.` : fallback;
}

export interface UseLiveProfileImportOptions {
  profile: CharacterProfile | null;
  activeProfileSection: string;
  profilesState: ProfilesState;
  updateProfile: (id: string, updates: Partial<CharacterProfile>, options?: { markFields?: boolean }) => void;
  replaceState: (state: ProfilesState) => void;
  setToast: (message: string) => void;
  setTransferText?: (text: string) => void;
}

export interface UseLiveProfileImportReturn {
  liveImportHash: string;
  setLiveImportHash: (value: string) => void;
  liveImportJobId: string;
  liveImportStatus: LiveProfileImportStatus;
  liveImportProgress: LiveProfileImportProgress | null;
  liveImportResult: LiveProfileImportResult | null;
  liveImportSelectedIndex: number;
  liveImportError: string;
  setLiveImportError: (value: string) => void;
  liveImportRetryAfterMs: number | null;
  liveImportEstimatedMs: number | null;
  importReview: ProfileImportReview | null;
  cachedImportMatch: CachedProfileImportEntry | null;
  setCachedImportMatch: (entry: CachedProfileImportEntry | null) => void;
  recentCachedImports: CachedProfileImportEntry[];
  forceRefreshScrape: boolean;
  setForceRefreshScrape: (force: boolean) => void;
  turnstileToken: string;
  turnstileReady: boolean;
  turnstileError: string;
  turnstileContainerRef: React.RefObject<HTMLDivElement | null>;
  liveImportWaitText: string;
  liveImportRetryText: string;
  liveImportBusy: boolean;
  liveImportHasUnsavedResult: boolean;
  resolvedStep: ResolvedLiveImportStep;
  isTerminalError: boolean;
  isRateLimited: boolean;
  isActiveProgress: boolean;
  isComplete: boolean;
  handleStartLiveProfileImport: () => Promise<void>;
  handleReviewLiveImportCharacter: (index: number) => void;
  handleRestoreCachedImport: (cached: CachedProfileImportEntry) => void;
  handleApplyProfileImport: () => void;
  handleCreateProfileFromSelectedImport: () => void;
  pollLiveImportJob: (jobId: string) => Promise<void>;
  resetLiveImportState: (broadcast?: boolean) => void;
  clearLiveImportSnapshot: () => void;
}

export function useLiveProfileImport({
  profile,
  activeProfileSection,
  profilesState,
  updateProfile,
  replaceState,
  setToast,
  setTransferText,
}: UseLiveProfileImportOptions): UseLiveProfileImportReturn {
  const [importReview, setImportReview] = useState<ProfileImportReview | null>(null);
  const [liveImportHash, setLiveImportHash] = useState("");
  const [liveImportJobId, setLiveImportJobId] = useState("");
  const [liveImportStatus, setLiveImportStatus] = useState<LiveProfileImportStatus>("idle");
  const [liveImportProgress, setLiveImportProgress] = useState<LiveProfileImportProgress | null>(null);
  const [liveImportResult, setLiveImportResult] = useState<LiveProfileImportResult | null>(null);
  const [liveImportSelectedIndex, setLiveImportSelectedIndex] = useState(0);
  const [liveImportError, setLiveImportError] = useState("");
  const [liveImportRetryAfterMs, setLiveImportRetryAfterMs] = useState<number | null>(null);
  const [liveImportEstimatedMs, setLiveImportEstimatedMs] = useState<number | null>(null);
  const [cachedImportMatch, setCachedImportMatch] = useState<CachedProfileImportEntry | null>(null);
  const [recentCachedImports, setRecentCachedImports] = useState<CachedProfileImportEntry[]>([]);
  const [forceRefreshScrape, setForceRefreshScrape] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);
  const [turnstileError, setTurnstileError] = useState("");

  const liveImportPollRef = useRef<number | null>(null);
  const liveImportAbortRef = useRef<AbortController | null>(null);
  const liveImportChannelRef = useRef<BroadcastChannel | null>(null);
  const liveImportTabIdRef = useRef(`profile-import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetRef = useRef<string | null>(null);

  const buildProfileImportReview = useCallback((importedDraft: ImportedProfileDraft): ProfileImportReview | null => {
    if (!profile) return null;
    const result = mergeImportedProfileDraft(profile, importedDraft);
    return {
      ...result,
      draftName: typeof importedDraft.name === "string" ? importedDraft.name : undefined,
      importedSections: importedDraft.importSource?.importedSections || [],
      missingOrPrivate: importedDraft.importSource?.missingOrPrivate || [],
    };
  }, [profile]);

  const prepareProfileImportReview = useCallback((importedDraft: ImportedProfileDraft, source = "Imported character ready to save.") => {
    const nextReview = buildProfileImportReview(importedDraft);
    if (!nextReview) return;
    setImportReview(nextReview);
    if (source) setToast(source);
  }, [buildProfileImportReview, setToast]);

  const clearLiveImportSnapshot = useCallback(() => {
    window.localStorage.removeItem(LIVE_IMPORT_STORAGE_KEY);
    const lease = parseLiveImportLease(window.localStorage.getItem(LIVE_IMPORT_LEASE_KEY));
    if (lease?.tabId === liveImportTabIdRef.current) {
      window.localStorage.removeItem(LIVE_IMPORT_LEASE_KEY);
    }
    liveImportChannelRef.current?.postMessage({ type: "clear" });
  }, []);

  const saveLiveImportSnapshot = useCallback((patch: Partial<LiveProfileImportSnapshot> & { jobId: string; status: LiveProfileImportStatus }) => {
    const previous = typeof window !== "undefined" ? parseLiveImportSnapshot(window.localStorage.getItem(LIVE_IMPORT_STORAGE_KEY)) : null;
    const now = Date.now();
    const snapshot: LiveProfileImportSnapshot = {
      version: 1,
      jobId: patch.jobId,
      characterHash: patch.characterHash ?? previous?.characterHash,
      characterHashTail: patch.characterHashTail ?? previous?.characterHashTail,
      status: patch.status,
      progress: patch.progress !== undefined ? patch.progress : previous?.progress ?? null,
      result: patch.result !== undefined ? patch.result : previous?.result ?? null,
      selectedIndex: patch.selectedIndex !== undefined ? patch.selectedIndex : previous?.selectedIndex ?? 0,
      error: patch.error !== undefined ? patch.error : previous?.error ?? "",
      retryAfterMs: patch.retryAfterMs !== undefined ? patch.retryAfterMs : previous?.retryAfterMs ?? null,
      estimatedMs: patch.estimatedMs !== undefined ? patch.estimatedMs : previous?.estimatedMs ?? null,
      startedAt: patch.startedAt || previous?.startedAt || now,
      updatedAt: now,
    };

    window.localStorage.setItem(LIVE_IMPORT_STORAGE_KEY, JSON.stringify(snapshot));
    liveImportChannelRef.current?.postMessage({ type: "snapshot", snapshot });
    return snapshot;
  }, []);

  const acquireLiveImportPollingLease = useCallback(() => {
    const now = Date.now();
    const current = parseLiveImportLease(window.localStorage.getItem(LIVE_IMPORT_LEASE_KEY));
    if (current?.tabId && current.tabId !== liveImportTabIdRef.current && Number(current.until || 0) > now) {
      return false;
    }
    window.localStorage.setItem(LIVE_IMPORT_LEASE_KEY, JSON.stringify({
      tabId: liveImportTabIdRef.current,
      until: now + LIVE_IMPORT_LEASE_MS,
    }));
    return true;
  }, []);

  const scheduleLiveImportPoll = useCallback((jobId: string, delayMs = 3500) => {
    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
    }
    const fallbackDelay = document.visibilityState === "hidden" ? 15000 : 3500;
    const parsedDelay = Number(delayMs) || fallbackDelay;
    const minDelay = document.visibilityState === "hidden" ? 15000 : 2000;
    const safeDelay = Math.max(minDelay, parsedDelay);
    liveImportPollRef.current = window.setTimeout(() => {
      void pollLiveImportJob(jobId);
    }, safeDelay);
  }, []);

  const pollLiveImportJob = useCallback(async (jobId: string) => {
    if (!acquireLiveImportPollingLease()) {
      scheduleLiveImportPoll(jobId, document.visibilityState === "hidden" ? 15000 : 5000);
      return;
    }

    try {
      const response = await fetch(`${PROFILE_IMPORT_API_URL}/profile-import/status/${encodeURIComponent(jobId)}`);
      const payload = await response.json().catch(() => ({}));

      // HTTP 429: Rate-limited cooldown - transition to waiting_for_budget rather than fatal crash
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const headerSeconds = retryAfterHeader ? Number(retryAfterHeader) : null;
        const headerMs = headerSeconds && Number.isFinite(headerSeconds) && headerSeconds > 0 ? headerSeconds * 1000 : null;
        const payloadRetryMs = getRetryAfterMs(payload);
        const cooldownMs = headerMs || payloadRetryMs || 30000;

        setLiveImportStatus("waiting_for_budget");
        setLiveImportRetryAfterMs(cooldownMs);
        setLiveImportError("");
        saveLiveImportSnapshot({
          jobId,
          status: "waiting_for_budget",
          progress: isRecord(payload) && isRecord(payload.progress) ? payload.progress : null,
          error: "",
          retryAfterMs: cooldownMs,
        });
        scheduleLiveImportPoll(jobId, cooldownMs);
        return;
      }

      if (!response.ok && response.status !== 410) {
        throw new Error(getLiveImportErrorMessage(payload, "Could not read import status."));
      }

      const nextStatus = (isRecord(payload) && typeof payload.status === "string" ? payload.status : "error") as LiveProfileImportStatus;
      setLiveImportStatus(nextStatus);
      setLiveImportProgress(isRecord(payload) && isRecord(payload.progress) ? payload.progress : null);
      const retryAfterMs = getRetryAfterMs(payload);
      const pollAfterMs = getPollAfterMs(payload, 3500);
      setLiveImportRetryAfterMs(retryAfterMs);

      if (nextStatus === "done") {
        const result = isRecord(payload) && isRecord(payload.result) ? payload.result as LiveProfileImportResult : null;
        const characters = Array.isArray(result?.characters) ? result.characters.filter((entry) => isRecord(entry?.draft)) : [];
        const nextResult = result ? { ...result, characters } : { characters: [] };
        setLiveImportResult(result ? { ...result, characters } : { characters: [] });
        setLiveImportSelectedIndex(0);
        setLiveImportError(characters.length ? "" : "The import finished, but no visible character profile was returned.");
        saveLiveImportSnapshot({
          jobId,
          status: nextStatus,
          progress: isRecord(payload) && isRecord(payload.progress) ? payload.progress : null,
          result: nextResult,
          selectedIndex: 0,
          error: characters.length ? "" : "The import finished, but no visible character profile was returned.",
          retryAfterMs: null,
        });

        const targetHash = liveImportHash.trim() || (isRecord(payload) && typeof payload.targetHash === "string" ? payload.targetHash : "");
        if (characters.length && targetHash) {
          saveCachedProfileImport(targetHash, nextResult);
        }

        if (characters[0]?.draft) {
          prepareProfileImportReview(characters[0].draft, "Imported character ready to save.");
        }
        return;
      }

      if (nextStatus === "error" || nextStatus === "expired") {
        const errorMessage = `${getLiveImportErrorMessage(payload, "This import could not finish.")} Your local profile was not changed.`;
        setLiveImportError(errorMessage);
        saveLiveImportSnapshot({
          jobId,
          status: nextStatus,
          progress: isRecord(payload) && isRecord(payload.progress) ? payload.progress : null,
          error: errorMessage,
          retryAfterMs: retryAfterMs,
        });
        return;
      }

      saveLiveImportSnapshot({
        jobId,
        status: nextStatus,
        progress: isRecord(payload) && isRecord(payload.progress) ? payload.progress : null,
        error: "",
        retryAfterMs: retryAfterMs,
      });
      const nextDelayMs = (nextStatus === "waiting_for_budget" && retryAfterMs) ? retryAfterMs : pollAfterMs;
      scheduleLiveImportPoll(jobId, nextDelayMs);
    } catch (error) {
      const errorMessage = `${error instanceof Error ? error.message : "Could not read import status."} Your local profile was not changed.`;
      setLiveImportStatus("error");
      setLiveImportError(errorMessage);
      saveLiveImportSnapshot({ jobId, status: "error", error: errorMessage });
    }
  }, [acquireLiveImportPollingLease, liveImportHash, prepareProfileImportReview, saveLiveImportSnapshot, scheduleLiveImportPoll]);

  const applyLiveImportSnapshot = useCallback((snapshot: LiveProfileImportSnapshot, source: "local" | "remote" = "remote") => {
    setLiveImportJobId(snapshot.jobId);
    if (snapshot.characterHash) setLiveImportHash(snapshot.characterHash);
    setLiveImportStatus(snapshot.status);
    setLiveImportProgress(snapshot.progress || null);
    setLiveImportRetryAfterMs(snapshot.retryAfterMs ?? null);
    setLiveImportEstimatedMs(snapshot.estimatedMs ?? null);
    setLiveImportSelectedIndex(snapshot.selectedIndex || 0);
    setLiveImportError(snapshot.error || "");

    const result = snapshot.result ? {
      ...snapshot.result,
      characters: Array.isArray(snapshot.result.characters)
        ? snapshot.result.characters.filter((entry) => isRecord(entry?.draft))
        : [],
    } : null;
    setLiveImportResult(result);

    const selectedDraft = result?.characters?.[snapshot.selectedIndex || 0]?.draft;
    if (snapshot.status === "done" && selectedDraft) {
      prepareProfileImportReview(selectedDraft, source === "local" ? "" : "Imported character ready to save.");
    } else if (snapshot.status !== "done") {
      setImportReview(null);
    }

    if (!isLiveImportTerminal(snapshot.status)) {
      scheduleLiveImportPoll(snapshot.jobId, document.visibilityState === "hidden" ? 15000 : 3500);
    }
  }, [prepareProfileImportReview, scheduleLiveImportPoll]);

  const resetLiveImportState = useCallback((broadcast = true) => {
    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
      liveImportPollRef.current = null;
    }
    setLiveImportJobId("");
    setLiveImportStatus("idle");
    setLiveImportProgress(null);
    setLiveImportResult(null);
    setLiveImportSelectedIndex(0);
    setLiveImportError("");
    setLiveImportRetryAfterMs(null);
    setLiveImportEstimatedMs(null);
    setImportReview(null);
    if (broadcast) {
      clearLiveImportSnapshot();
    }
  }, [clearLiveImportSnapshot]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
    }
    liveImportAbortRef.current?.abort();
    const lease = parseLiveImportLease(window.localStorage.getItem(LIVE_IMPORT_LEASE_KEY));
    if (lease?.tabId === liveImportTabIdRef.current) {
      window.localStorage.removeItem(LIVE_IMPORT_LEASE_KEY);
    }
  }, []);

  // Turnstile lifecycle
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      setTurnstileReady(true);
      return;
    }
    if (activeProfileSection !== "transfer") {
      setTurnstileReady(true);
      setTurnstileToken("");
      setTurnstileError("");
      return;
    }

    let cancelled = false;
    let fallbackTimeout: number | null = null;
    setTurnstileReady(false);
    setTurnstileError("");

    const renderTurnstile = () => {
      if (cancelled || !turnstileContainerRef.current || !window.turnstile || turnstileWidgetRef.current) return;
      if (fallbackTimeout !== null) {
        window.clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      turnstileWidgetRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        callback: (token) => {
          setTurnstileToken(token);
          setTurnstileReady(true);
          setTurnstileError("");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setTurnstileError("Quick check expired. Run it again before importing.");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setTurnstileReady(true);
          setTurnstileError("Quick check could not load. Try refreshing this page.");
        },
      });
      setTurnstileReady(true);
    };

    const handleTurnstileLoadError = () => {
      if (cancelled) return;
      setTurnstileReady(true);
      setTurnstileError("Quick check could not load. Refresh this page or disable blockers for this site.");
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (window.turnstile) {
      renderTurnstile();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderTurnstile, { once: true });
      existingScript.addEventListener("error", handleTurnstileLoadError, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderTurnstile, { once: true });
      script.addEventListener("error", handleTurnstileLoadError, { once: true });
      document.head.appendChild(script);
    }

    fallbackTimeout = window.setTimeout(() => {
      if (!window.turnstile) {
        handleTurnstileLoadError();
        return;
      }
      renderTurnstile();
    }, 8000);

    return () => {
      cancelled = true;
      if (fallbackTimeout !== null) {
        window.clearTimeout(fallbackTimeout);
      }
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current);
      }
      turnstileWidgetRef.current = null;
    };
  }, [activeProfileSection]);

  const handleStartLiveProfileImport = async () => {
    if (!profile) return;
    const characterHash = liveImportHash.trim();
    if (!CHARACTER_HASH_PATTERN.test(characterHash)) {
      setLiveImportError("Paste only the character hashed ID, not a full profile URL.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setLiveImportError("Complete the quick check before starting the import.");
      return;
    }

    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
    }
    liveImportAbortRef.current?.abort();
    const controller = new AbortController();
    liveImportAbortRef.current = controller;

    setLiveImportError("");
    setLiveImportResult(null);
    setLiveImportProgress(null);
    setLiveImportRetryAfterMs(null);
    setLiveImportEstimatedMs(null);
    setImportReview(null);
    setLiveImportStatus("queued");

    try {
      const response = await fetch(`${PROFILE_IMPORT_API_URL}/profile-import/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterHash,
          includeVisibleAlts: true,
          includeMuseum: true,
          forceRefresh: forceRefreshScrape ? true : undefined,
          turnstileToken: TURNSTILE_SITE_KEY ? turnstileToken : undefined,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLiveImportRetryAfterMs(getRetryAfterMs(payload));
        throw new Error(getLiveImportErrorMessage(payload, "Could not start the import."));
      }
      const jobId = isRecord(payload) && typeof payload.jobId === "string" ? payload.jobId : "";
      if (!jobId) throw new Error("Import started without a job reference. Try again.");

      const isDone = isRecord(payload) && payload.status === "done";
      if (isDone) {
        const rawResult = isRecord(payload) && isRecord(payload.result) ? payload.result as LiveProfileImportResult : null;
        const characters = Array.isArray(rawResult?.characters)
          ? rawResult.characters.filter((entry) => isRecord(entry?.draft))
          : [];
        const nextResult: LiveProfileImportResult = rawResult ? { ...rawResult, characters } : { characters: [] };
        setLiveImportJobId(jobId);
        setLiveImportStatus("done");
        setLiveImportProgress(null);
        setLiveImportResult(nextResult);
        setLiveImportSelectedIndex(0);
        setLiveImportError(characters.length ? "" : "The import finished, but no visible character profile was returned.");
        setLiveImportRetryAfterMs(null);
        setLiveImportEstimatedMs(null);

        saveLiveImportSnapshot({
          jobId,
          characterHash,
          characterHashTail: characterHash.slice(-12),
          status: "done",
          progress: null,
          result: nextResult,
          selectedIndex: 0,
          error: characters.length ? "" : "The import finished, but no visible character profile was returned.",
          retryAfterMs: null,
          estimatedMs: 0,
          startedAt: Date.now(),
        });

        if (characters.length) {
          saveCachedProfileImport(characterHash, nextResult);
        }

        if (characters[0]?.draft) {
          const cacheAgeMsg = typeof payload.cacheAgeSeconds === "number"
            ? `${Math.max(1, Math.round(payload.cacheAgeSeconds / 60))}m ago`
            : "fresh edge cache";
          prepareProfileImportReview(characters[0].draft, `Loaded from edge cache (${cacheAgeMsg}).`);
        }
        setToast("Profile loaded from edge cache.");
        return;
      }

      const estimatedMs = isRecord(payload) && typeof payload.estimatedDurationMs === "number" ? payload.estimatedDurationMs : null;
      setLiveImportJobId(jobId);
      setLiveImportEstimatedMs(estimatedMs);
      setLiveImportStatus("queued");
      saveLiveImportSnapshot({
        jobId,
        characterHash,
        characterHashTail: characterHash.slice(-12),
        status: "queued",
        progress: null,
        result: null,
        selectedIndex: 0,
        error: "",
        retryAfterMs: null,
        estimatedMs,
        startedAt: Date.now(),
      });
      scheduleLiveImportPoll(jobId, getPollAfterMs(payload, 3000));
      setToast("Import started. You can leave this page and come back while Zenith prepares the saved profile preview.");
    } catch (error) {
      if (controller.signal.aborted) return;
      setLiveImportStatus("error");
      setLiveImportJobId("");
      setLiveImportError(`${error instanceof Error ? error.message : "Could not start the import."} Your local profile was not changed.`);
    } finally {
      if (TURNSTILE_SITE_KEY) {
        setTurnstileToken("");
        if (turnstileWidgetRef.current) window.turnstile?.reset(turnstileWidgetRef.current);
      }
    }
  };

  const handleReviewLiveImportCharacter = (index: number) => {
    const character = liveImportResult?.characters?.[index];
    if (!character?.draft) return;
    setLiveImportSelectedIndex(index);
    prepareProfileImportReview(character.draft, "Selected character ready to save.");
    if (liveImportJobId) {
      saveLiveImportSnapshot({
        jobId: liveImportJobId,
        status: liveImportStatus,
        selectedIndex: index,
      });
    }
  };

  const handleRestoreCachedImport = (cached: CachedProfileImportEntry) => {
    const characters = Array.isArray(cached.result?.characters)
      ? cached.result.characters.filter((entry) => isRecord(entry?.draft))
      : [];
    if (!characters.length) return;

    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
      liveImportPollRef.current = null;
    }
    liveImportAbortRef.current?.abort();

    const fakeJobId = `cached-${cached.timestamp}`;
    setLiveImportJobId(fakeJobId);
    setLiveImportHash(cached.characterHash);
    setLiveImportStatus("done");
    setLiveImportProgress(null);
    setLiveImportResult(cached.result);
    setLiveImportSelectedIndex(0);
    setLiveImportError("");
    setLiveImportRetryAfterMs(null);
    setLiveImportEstimatedMs(null);

    saveLiveImportSnapshot({
      jobId: fakeJobId,
      characterHash: cached.characterHash,
      characterHashTail: cached.characterHashTail,
      status: "done",
      progress: null,
      result: cached.result,
      selectedIndex: 0,
      error: "",
      retryAfterMs: null,
    });

    if (characters[0]?.draft) {
      prepareProfileImportReview(characters[0].draft, `Loaded ${cached.mainName} from instant cache.`);
    }
  };

  useEffect(() => {
    const updateCacheMatch = () => {
      const hash = liveImportHash.trim();
      if (hash) {
        setCachedImportMatch(getCachedProfileImport(hash));
      } else {
        setCachedImportMatch(null);
      }
      setRecentCachedImports(getRecentCachedProfileImports());
    };

    updateCacheMatch();

    if (typeof window !== "undefined") {
      window.addEventListener(IMPORT_CACHE_EVENT, updateCacheMatch);
      return () => {
        window.removeEventListener(IMPORT_CACHE_EVENT, updateCacheMatch);
      };
    }
  }, [liveImportHash]);

  useEffect(() => {
    const restoreSavedImport = () => {
      const snapshot = parseLiveImportSnapshot(window.localStorage.getItem(LIVE_IMPORT_STORAGE_KEY));
      if (snapshot) applyLiveImportSnapshot(snapshot, "local");
    };

    restoreSavedImport();

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LIVE_IMPORT_STORAGE_KEY) return;
      if (!event.newValue) {
        resetLiveImportState(false);
        return;
      }
      const snapshot = parseLiveImportSnapshot(event.newValue);
      if (snapshot) applyLiveImportSnapshot(snapshot, "remote");
    };

    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(LIVE_IMPORT_CHANNEL) : null;
    liveImportChannelRef.current = channel;
    if (channel) {
      channel.onmessage = (event: MessageEvent) => {
        const message = event.data;
        if (!isRecord(message)) return;
        if (message.type === "clear") {
          resetLiveImportState(false);
          return;
        }
        if (message.type === "snapshot") {
          const snapshot = parseLiveImportSnapshot(JSON.stringify(message.snapshot));
          if (snapshot) applyLiveImportSnapshot(snapshot, "remote");
        }
      };
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
        if (liveImportChannelRef.current === channel) liveImportChannelRef.current = null;
      }
    };
  }, [applyLiveImportSnapshot, resetLiveImportState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const snapshot = parseLiveImportSnapshot(window.localStorage.getItem(LIVE_IMPORT_STORAGE_KEY));
      if (!snapshot || isLiveImportTerminal(snapshot.status)) return;
      scheduleLiveImportPoll(snapshot.jobId, document.visibilityState === "hidden" ? 15000 : 1500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [scheduleLiveImportPoll]);

  useEffect(() => {
    if (liveImportStatus !== "done") return;
    const importedDraft = liveImportResult?.characters?.[liveImportSelectedIndex]?.draft;
    if (!importedDraft) return;
    const nextReview = buildProfileImportReview(importedDraft);
    if (nextReview) setImportReview(nextReview);
  }, [buildProfileImportReview, liveImportResult, liveImportSelectedIndex, liveImportStatus]);

  const handleApplyProfileImport = () => {
    if (!profile || !importReview) return;
    updateProfile(profile.id, importReview.profile, { markFields: false });
    if (setTransferText) setTransferText("");
    setToast(`Saved ${importReview.draftName || "imported details"} to ${profile.name || "the active profile"}. The other fetched characters are still available below.`);
    clearLiveImportSnapshot();
  };

  const handleCreateProfileFromSelectedImport = () => {
    const importedDraft = liveImportResult?.characters?.[liveImportSelectedIndex]?.draft;
    if (!importedDraft) return;
    if (profilesState.profiles.length >= MAX_PROFILES) {
      setToast("Profile limit reached.");
      return;
    }
    const baseProfile = {
      ...createDefaultProfile(""),
      kind: "alt" as const,
    };
    const created = {
      ...mergeImportedProfileDraft(baseProfile, importedDraft).profile,
      kind: "alt" as const,
    };
    replaceState({
      ...profilesState,
      activeProfileId: created.id,
      profiles: [...profilesState.profiles, created],
    });
    setToast(`Created ${created.name || "a new profile"} from the selected import. The fetched batch is still available.`);
    clearLiveImportSnapshot();
  };

  const liveImportWaitText = formatWaitTime(liveImportProgress?.estimatedRemainingMs || liveImportEstimatedMs || undefined);
  const liveImportRetryText = formatWaitTime(liveImportRetryAfterMs || undefined);
  const liveImportBusy = liveImportStatus === "queued" || liveImportStatus === "running" || liveImportStatus === "waiting_for_budget";
  const liveImportHasUnsavedResult = Boolean(liveImportResult?.characters?.length && importReview);

  const resolvedStep = resolveLiveImportStep(liveImportProgress, liveImportStatus);
  const isTerminalError = liveImportStatus === "error" || liveImportStatus === "expired";
  const isRateLimited = !isTerminalError && (liveImportStatus === "waiting_for_budget" || Boolean(liveImportRetryAfterMs && liveImportRetryAfterMs > 0));
  const isActiveProgress = !isTerminalError && !isRateLimited && (liveImportStatus === "running" || liveImportStatus === "queued" || (Boolean(liveImportJobId) && !isLiveImportTerminal(liveImportStatus)));
  const isComplete = !isTerminalError && liveImportStatus === "done";

  return {
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
    liveImportEstimatedMs,
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
    clearLiveImportSnapshot,
  };
}
