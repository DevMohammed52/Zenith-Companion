"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Bell, Lightbulb, MessageCircle, TriangleAlert, X } from "lucide-react";
import { playZenithSound } from "@/lib/audio";
import { ZENITH_NOTIFY_EVENT, ZenithNotification } from "@/lib/notifications";
import { usePreferences } from "@/lib/preferences";

const TIP_VISIBLE_MS = 8500;
const TIP_INTERVAL_MS = 52000;
const TIP_INITIAL_DELAY_MS = 26000;
const PAGE_NOTICE_DELAY_MS = 1800;
const TIP_SNOOZE_MS = 30 * 60 * 1000;
const TIP_SNOOZE_KEY = "zenith.tips.snoozedUntil.v1";
const PAGE_NOTICE_STORAGE_KEY = "zenith.tips.seenPages.v1";
const KO_FI_URL = "https://ko-fi.com/d3vxgh0st";

const tips: ZenithNotification[] = [
  {
    title: "Found a bug?",
    body: "Send the page name, what happened, and a screenshot to d3v_gh0st on Discord.",
    tone: "contact",
  },
  {
    title: "Profiles stay local",
    body: "Zenith does not save your character profiles on a server. Profiles, queues, and settings stay in this browser.",
  },
  {
    title: "Market checks",
    body: "Use Zenith for planning, then confirm official listings before large buys or sells.",
  },
  {
    title: "Better calculations",
    body: "Set your profile buffs and tools so profit routes match your character more closely.",
  },
  {
    title: "Still improving",
    body: "If a tool feels confusing or missing something, message d3v_gh0st with the use case.",
    tone: "contact",
  },
  {
    title: "Support Zenith",
    body: "If Zenith saves you time, you can support the project and future UI work on Ko-fi.",
    actionLabel: "Open Ko-fi",
    actionHref: KO_FI_URL,
  },
  {
    title: "Use global search",
    body: "Press Ctrl K to jump to tools, items, pets, enemies, guilds, and recipes faster.",
  },
  {
    title: "Profile imports",
    body: "Imports briefly fetch visible IdleMMO data, then the saved profile stays on your device. Never paste an API key.",
    tone: "warning",
  },
  {
    title: "Local backups",
    body: "Export your Zenith profiles before switching browsers, clearing site data, or testing another device.",
  },
  {
    title: "Skill profit accuracy",
    body: "Unknown prices are not treated as free. Routes that need data are marked before ranking.",
  },
  {
    title: "Mobile navigation",
    body: "The radial menu side can be changed in Settings if it blocks your thumb reach.",
  },
];

const pageNotices: Record<string, ZenithNotification> = {
  "/": {
    title: "Daily check tip",
    body: "Use the quick cards or Ctrl K to jump straight to prices, profiles, bosses, routes, or cached data.",
  },
  "/profiles": {
    title: "Profile tip",
    body: "Profiles are browser-local and not saved on Zenith servers. Export a backup before clearing browser data.",
  },
  "/items": {
    title: "Item tip",
    body: "Open item details to compare safe market value, vendor value, sources, and recipe links.",
  },
  "/alchemy": {
    title: "Alchemy tip",
    body: "Set membership, bartering, and custom prices before trusting large profit batches.",
  },
  "/skill-profit": {
    title: "Skill route tip",
    body: "Choose the right active profile and tool setup so routes match your character.",
  },
  "/crafting": {
    title: "Crafting tip",
    body: "Use the queue as a shopping checklist before committing to a long crafting run.",
  },
  "/forge": {
    title: "Forge tip",
    body: "Saved recipes can reuse your custom prices and profile settings for cleaner planning.",
  },
  "/combat": {
    title: "Combat tip",
    body: "Combat planning is estimate-first. Confirm enemy stacks and food needs in game.",
  },
  "/bosses": {
    title: "Boss route tip",
    body: "World boss route value depends on teleport cost, travel distance, and your magic find.",
  },
  "/dungeons": {
    title: "Dungeon tip",
    body: "Dungeon loot values are useful for comparison, but rare drops can swing real results.",
  },
  "/enemies": {
    title: "Enemy tip",
    body: "Weather behavior and drops are indexed here when you need a quick target check.",
  },
  "/pets": {
    title: "Pet tip",
    body: "Pet database values help compare species before saving owned snapshots.",
  },
  "/pets/owned": {
    title: "Owned pet tip",
    body: "Save strong pet snapshots so you can compare them later without re-entering stats.",
  },
  "/pets/compare": {
    title: "Pet compare tip",
    body: "Side-by-side pet stats are better when active profile boosts are already set.",
  },
  "/guilds": {
    title: "Guild tip",
    body: "Guild data is snapshot-based, so use it for discovery and verify current details in game.",
  },
  "/museum": {
    title: "Museum tip",
    body: "Imported museum snapshots make collection gaps easier to scan across profiles.",
  },
  "/weather": {
    title: "Weather tip",
    body: "Check weather windows before choosing long skilling or combat sessions.",
  },
  "/map": {
    title: "Map tip",
    body: "Use locations and weather together when route planning across regions.",
  },
  "/market-alerts": {
    title: "Market Watch tip",
    body: "Browser alerts only run while Zenith can stay active in this browser.",
  },
  "/bis": {
    title: "BiS tip",
    body: "Gear rankings are more useful when your combat style and profile stats are current.",
  },
  "/housing": {
    title: "Housing tip",
    body: "Guest buffs and component choices can change long-run skill planning.",
  },
  "/conquest": {
    title: "Conquest tip",
    body: "Conquest data is best used as a planning snapshot, not a live official scoreboard.",
  },
  "/lore": {
    title: "Lore tip",
    body: "Lore entries are organized for browsing, search, and quick source-oriented reading.",
  },
  "/settings": {
    title: "Settings tip",
    body: "This page controls global defaults such as theme, navigation, custom prices, and tips.",
  },
};

function getSnoozedUntil() {
  if (typeof window === "undefined") return 0;
  const stored = window.localStorage.getItem(TIP_SNOOZE_KEY);
  const parsed = stored ? Number(stored) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function readSeenPages() {
  try {
    const stored = window.localStorage.getItem(PAGE_NOTICE_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set<string>();
  } catch {
    window.localStorage.removeItem(PAGE_NOTICE_STORAGE_KEY);
    return new Set<string>();
  }
}

function rememberSeenPage(pathname: string) {
  const seen = readSeenPages();
  seen.add(pathname);
  window.localStorage.setItem(PAGE_NOTICE_STORAGE_KEY, JSON.stringify(Array.from(seen).slice(-60)));
}

function isSuppressedByOverlay() {
  if (typeof document === "undefined") return true;
  const isVisibleBlockingElement = (selector: string) => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return elements.some((element) => {
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || style.pointerEvents === "none") {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    });
  };

  return Boolean(
    document.body.classList.contains("command-open")
    || isVisibleBlockingElement(".command-overlay")
    || isVisibleBlockingElement(".command-wheel-layer")
    || isVisibleBlockingElement(".mobile-backdrop")
    || isVisibleBlockingElement(".modal-overlay")
    || isVisibleBlockingElement('[role="dialog"][aria-modal="true"]')
    || isVisibleBlockingElement('[role="alertdialog"]')
  );
}

export default function RotatingTips() {
  const pathname = usePathname();
  const { preferences, loaded } = usePreferences();
  const titleId = useId();
  const bodyId = useId();
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<ZenithNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const hideStartedAtRef = useRef(0);
  const hideRemainingRef = useRef(TIP_VISIBLE_MS);
  const hideCallbackRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(false);
  const pendingRetryRef = useRef<number | undefined>(undefined);
  const pendingRef = useRef<ZenithNotification | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearHideTimer = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = undefined;
  }, []);

  const armHideTimer = useCallback((duration = TIP_VISIBLE_MS, onAutoHide?: () => void) => {
    clearHideTimer();
    hideRemainingRef.current = duration;
    hideCallbackRef.current = onAutoHide ?? null;
    pausedRef.current = false;
    hideStartedAtRef.current = Date.now();
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = undefined;
      hideRemainingRef.current = TIP_VISIBLE_MS;
      pausedRef.current = false;
      setVisible(false);
      hideCallbackRef.current?.();
      hideCallbackRef.current = null;
    }, duration);
  }, [clearHideTimer]);

  const showNotification = useCallback((notification: ZenithNotification) => {
    setCurrent(notification);
    setVisible(true);
    playZenithSound(notification.tone && notification.tone !== "tip" ? notification.tone : "notify");
    armHideTimer();
  }, [armHideTimer]);

  const pauseHideTimer = useCallback(() => {
    if (!visible || !hideTimerRef.current || pausedRef.current) return;
    const elapsed = Date.now() - hideStartedAtRef.current;
    clearHideTimer();
    hideRemainingRef.current = Math.max(1600, hideRemainingRef.current - elapsed);
    pausedRef.current = true;
  }, [clearHideTimer, visible]);

  const resumeHideTimer = useCallback(() => {
    if (!visible || !pausedRef.current) return;
    armHideTimer(hideRemainingRef.current, hideCallbackRef.current ?? undefined);
  }, [armHideTimer, visible]);

  const flushPendingIfClear = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending || isSuppressedByOverlay()) return false;
    pendingRef.current = null;
    showNotification(pending);
    return true;
  }, [showNotification]);

  const schedulePendingFlush = useCallback(() => {
    window.clearTimeout(pendingRetryRef.current);
    const retry = (attemptsLeft: number) => {
      if (flushPendingIfClear() || attemptsLeft <= 0) return;
      pendingRetryRef.current = window.setTimeout(() => retry(attemptsLeft - 1), 450);
    };
    pendingRetryRef.current = window.setTimeout(() => retry(18), 450);
  }, [flushPendingIfClear]);

  useEffect(() => {
    if (!mounted || !loaded || !preferences.inAppNotifications) {
      setVisible(false);
      return;
    }

    const showTip = () => {
      if (Date.now() < getSnoozedUntil()) return;
      if (isSuppressedByOverlay()) {
        pendingRef.current = tips[index];
        schedulePendingFlush();
        return;
      }
      const next = tips[index];
      setCurrent(next);
      setVisible(true);
      armHideTimer(TIP_VISIBLE_MS, () => setIndex((current) => (current + 1) % tips.length));
    };

    const initialTimer = window.setTimeout(showTip, TIP_INITIAL_DELAY_MS);
    const intervalTimer = window.setInterval(showTip, TIP_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimer);
      clearHideTimer();
      window.clearTimeout(pendingRetryRef.current);
      window.clearInterval(intervalTimer);
    };
  }, [armHideTimer, clearHideTimer, index, loaded, mounted, preferences.inAppNotifications, schedulePendingFlush]);

  useEffect(() => {
    if (!mounted || !loaded || !preferences.inAppNotifications) return;
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<ZenithNotification>;
      if (!customEvent.detail?.title || !customEvent.detail?.body) return;
      pendingRef.current = customEvent.detail;
      if (isSuppressedByOverlay()) {
        schedulePendingFlush();
        return;
      }
      flushPendingIfClear();
    };
    window.addEventListener(ZENITH_NOTIFY_EVENT, handleNotification);
    return () => window.removeEventListener(ZENITH_NOTIFY_EVENT, handleNotification);
  }, [flushPendingIfClear, loaded, mounted, preferences.inAppNotifications, schedulePendingFlush]);

  useEffect(() => {
    if (!mounted || !loaded || !preferences.inAppNotifications) return;
    const notice = pageNotices[pathname];
    if (!notice) return;
    const seen = readSeenPages();
    if (seen.has(pathname)) return;
    const timer = window.setTimeout(() => {
      rememberSeenPage(pathname);
      if (isSuppressedByOverlay()) {
        pendingRef.current = notice;
        schedulePendingFlush();
        return;
      }
      showNotification(notice);
    }, PAGE_NOTICE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [loaded, mounted, pathname, preferences.inAppNotifications, schedulePendingFlush, showNotification]);

  useEffect(() => {
    if (!mounted || !loaded || !preferences.inAppNotifications) return;
    const timer = window.setInterval(() => {
      if (visible && isSuppressedByOverlay()) {
        window.clearTimeout(hideTimerRef.current);
        setVisible(false);
        schedulePendingFlush();
        return;
      }
      flushPendingIfClear();
    }, 550);
    return () => window.clearInterval(timer);
  }, [flushPendingIfClear, loaded, mounted, pathname, preferences.inAppNotifications, schedulePendingFlush, visible]);

  const dismiss = () => {
    clearHideTimer();
    hideCallbackRef.current = null;
    window.localStorage.setItem(TIP_SNOOZE_KEY, String(Date.now() + TIP_SNOOZE_MS));
    setVisible(false);
    setIndex((current) => (current + 1) % tips.length);
  };

  const followAction = () => {
    clearHideTimer();
    hideCallbackRef.current = null;
    pendingRef.current = null;
    setVisible(false);
  };

  if (!mounted || !loaded || !preferences.inAppNotifications || !visible || !current) return null;

  const tone = current.tone || "tip";
  const hasAction = Boolean(current.actionHref && current.actionLabel);
  const isExternalAction = Boolean(current.actionHref?.startsWith("http://") || current.actionHref?.startsWith("https://"));
  const Icon = tone === "contact"
    ? MessageCircle
    : tone === "success"
      ? BadgeCheck
      : tone === "warning"
        ? TriangleAlert
        : tone === "tip" && current.title.toLowerCase().includes("tip")
          ? Lightbulb
          : Bell;

  return (
    <div
      className={`rotating-tip rotating-tip-${tone}`}
      role="status"
      aria-live="polite"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onPointerEnter={pauseHideTimer}
      onPointerLeave={resumeHideTimer}
      onFocusCapture={pauseHideTimer}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          resumeHideTimer();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          dismiss();
        }
      }}
    >
      <div className="rotating-tip-icon" aria-hidden="true">
        <Icon size={17} />
      </div>
      <div className="rotating-tip-copy">
        <strong id={titleId}>{current.title}</strong>
        <span id={bodyId}>{current.body}</span>
        {hasAction && isExternalAction && (
          <a
            href={current.actionHref}
            className="rotating-tip-action"
            onClick={followAction}
            rel="noreferrer"
            target="_blank"
          >
            {current.actionLabel}
          </a>
        )}
        {hasAction && !isExternalAction && (
          <Link href={current.actionHref || "#"} className="rotating-tip-action" onClick={followAction}>
            {current.actionLabel}
          </Link>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss tips for now">
        <X size={15} />
      </button>
    </div>
  );
}
