"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BadgeCheck, Bell, Lightbulb, MessageCircle, TriangleAlert, X } from "lucide-react";
import { ZENITH_NOTIFY_EVENT, ZenithNotification } from "@/lib/notifications";
import { usePreferences } from "@/lib/preferences";

const TIP_VISIBLE_MS = 8500;
const TIP_INTERVAL_MS = 52000;
const TIP_INITIAL_DELAY_MS = 11000;
const PAGE_NOTICE_DELAY_MS = 1800;
const TIP_SNOOZE_MS = 30 * 60 * 1000;
const TIP_SNOOZE_KEY = "zenith.tips.snoozedUntil.v1";
const PAGE_NOTICE_STORAGE_KEY = "zenith.tips.seenPages.v1";

const tips: ZenithNotification[] = [
  {
    title: "Found a bug?",
    body: "Send the page name, what happened, and a screenshot to d3v_gh0st on Discord.",
    tone: "contact",
  },
  {
    title: "Profiles stay local",
    body: "Zenith profiles are saved in this browser unless you export or import them yourself.",
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
    title: "Use global search",
    body: "Press Ctrl K to jump to tools, items, pets, enemies, guilds, and recipes faster.",
  },
  {
    title: "Profile imports",
    body: "You only need the visible character hash. Never paste an IdleMMO API key into Zenith.",
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
    title: "Dashboard tip",
    body: "Use the dashboard cards or Ctrl K to jump directly into the tool you need.",
  },
  "/profiles": {
    title: "Profile tip",
    body: "Profiles are browser-local. Export a backup before clearing browser data.",
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
  return Boolean(
    document.body.classList.contains("command-open")
    || document.querySelector(".command-overlay")
    || document.querySelector(".command-wheel-layer")
    || document.querySelector(".mobile-backdrop")
    || document.querySelector(".modal-overlay")
    || document.querySelector('[role="dialog"][aria-modal="true"]')
    || document.querySelector('[role="alertdialog"]')
  );
}

export default function RotatingTips() {
  const pathname = usePathname();
  const { preferences, loaded } = usePreferences();
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<ZenithNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const pendingRetryRef = useRef<number | undefined>(undefined);
  const pendingRef = useRef<ZenithNotification | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showNotification = (notification: ZenithNotification) => {
    window.clearTimeout(hideTimerRef.current);
    setCurrent(notification);
    setVisible(true);
    hideTimerRef.current = window.setTimeout(() => setVisible(false), TIP_VISIBLE_MS);
  };

  const flushPendingIfClear = () => {
    const pending = pendingRef.current;
    if (!pending || isSuppressedByOverlay()) return false;
    pendingRef.current = null;
    showNotification(pending);
    return true;
  };

  const schedulePendingFlush = () => {
    window.clearTimeout(pendingRetryRef.current);
    const retry = (attemptsLeft: number) => {
      if (flushPendingIfClear() || attemptsLeft <= 0) return;
      pendingRetryRef.current = window.setTimeout(() => retry(attemptsLeft - 1), 450);
    };
    pendingRetryRef.current = window.setTimeout(() => retry(18), 450);
  };

  useEffect(() => {
    if (!mounted || !loaded || !preferences.inAppNotifications) {
      setVisible(false);
      return;
    }

    let intervalTimer: number | undefined;

    const showTip = () => {
      if (Date.now() < getSnoozedUntil()) return;
      if (isSuppressedByOverlay()) {
        pendingRef.current = tips[index];
        schedulePendingFlush();
        return;
      }
      const next = tips[index];
      window.clearTimeout(hideTimerRef.current);
      setCurrent(next);
      setVisible(true);
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        setIndex((current) => (current + 1) % tips.length);
      }, TIP_VISIBLE_MS);
    };

    const initialTimer = window.setTimeout(showTip, TIP_INITIAL_DELAY_MS);
    intervalTimer = window.setInterval(showTip, TIP_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearTimeout(hideTimerRef.current);
      window.clearTimeout(pendingRetryRef.current);
      window.clearInterval(intervalTimer);
    };
  }, [index, loaded, mounted, preferences.inAppNotifications]);

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
  }, [loaded, mounted, preferences.inAppNotifications]);

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
  }, [loaded, mounted, pathname, preferences.inAppNotifications]);

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
  }, [loaded, mounted, pathname, preferences.inAppNotifications, visible]);

  const dismiss = () => {
    window.clearTimeout(hideTimerRef.current);
    window.localStorage.setItem(TIP_SNOOZE_KEY, String(Date.now() + TIP_SNOOZE_MS));
    setVisible(false);
    setIndex((current) => (current + 1) % tips.length);
  };

  if (!mounted || !loaded || !preferences.inAppNotifications || !visible || !current) return null;

  const tone = current.tone || "tip";
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
    <aside className={`rotating-tip rotating-tip-${tone}`} role="status" aria-live="polite" aria-label="Zenith notification">
      <div className="rotating-tip-icon" aria-hidden="true">
        <Icon size={17} />
      </div>
      <div className="rotating-tip-copy">
        <strong>{current.title}</strong>
        <span>{current.body}</span>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss tips for now">
        <X size={15} />
      </button>
    </aside>
  );
}
