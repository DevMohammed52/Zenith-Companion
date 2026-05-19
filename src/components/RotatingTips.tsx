"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb, MessageCircle, X } from "lucide-react";

const TIP_VISIBLE_MS = 8500;
const TIP_INTERVAL_MS = 52000;
const TIP_INITIAL_DELAY_MS = 9000;
const TIP_SNOOZE_MS = 30 * 60 * 1000;
const TIP_SNOOZE_KEY = "zenith.tips.snoozedUntil.v1";

const tips = [
  {
    title: "Found a bug?",
    body: "Send the page name, what happened, and a screenshot to d3v_gh0st on Discord.",
    icon: "contact",
  },
  {
    title: "Profiles stay local",
    body: "Zenith profiles are saved in this browser unless you export or import them yourself.",
    icon: "tip",
  },
  {
    title: "Market checks",
    body: "Use Zenith for planning, then confirm official listings before large buys or sells.",
    icon: "tip",
  },
  {
    title: "Better calculations",
    body: "Set your profile buffs and tools so profit routes match your character more closely.",
    icon: "tip",
  },
  {
    title: "Still improving",
    body: "If a tool feels confusing or missing something, message d3v_gh0st with the use case.",
    icon: "contact",
  },
];

function getSnoozedUntil() {
  if (typeof window === "undefined") return 0;
  const stored = window.localStorage.getItem(TIP_SNOOZE_KEY);
  const parsed = stored ? Number(stored) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function RotatingTips() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hideTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let intervalTimer: number | undefined;

    const showTip = () => {
      if (Date.now() < getSnoozedUntil()) return;
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
      window.clearInterval(intervalTimer);
    };
  }, [mounted]);

  const dismiss = () => {
    window.clearTimeout(hideTimerRef.current);
    window.localStorage.setItem(TIP_SNOOZE_KEY, String(Date.now() + TIP_SNOOZE_MS));
    setVisible(false);
    setIndex((current) => (current + 1) % tips.length);
  };

  if (!mounted || !visible) return null;

  const tip = tips[index];
  const Icon = tip.icon === "contact" ? MessageCircle : Lightbulb;

  return (
    <aside className="rotating-tip" role="status" aria-live="polite" aria-label="Zenith tip">
      <div className="rotating-tip-icon" aria-hidden="true">
        <Icon size={17} />
      </div>
      <div className="rotating-tip-copy">
        <strong>{tip.title}</strong>
        <span>{tip.body}</span>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss tips for now">
        <X size={15} />
      </button>
    </aside>
  );
}
