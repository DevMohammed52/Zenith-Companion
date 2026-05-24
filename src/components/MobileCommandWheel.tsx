"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { playZenithSound } from "@/lib/audio";
import { getActiveNavGroup, isNavItemActive, NAV_GROUPS } from "@/lib/navigation";

export default function MobileCommandWheel({
  open,
  closing = false,
  onClose,
  side = "left",
}: {
  open: boolean;
  closing?: boolean;
  onClose: () => void;
  side?: "left" | "right";
}) {
  const pathname = usePathname();
  const activeGroup = useMemo(() => getActiveNavGroup(pathname) ?? NAV_GROUPS[0], [pathname]);
  const [selectedGroupLabel, setSelectedGroupLabel] = useState(activeGroup.label);
  const idPrefix = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const groupRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previousPathname = useRef(pathname);

  const selectedGroup = NAV_GROUPS.find((group) => group.label === selectedGroupLabel) ?? activeGroup;
  const selectedIndex = NAV_GROUPS.findIndex((group) => group.label === selectedGroup.label);
  const selectedGroupHasActiveItem = selectedGroup.items.some((candidate) => isNavItemActive(pathname, candidate));
  const visible = open || closing;

  useEffect(() => {
    if (!open) return;
    setSelectedGroupLabel(activeGroup.label);
  }, [activeGroup.label, open]);

  useEffect(() => {
    if (!visible) return;
    const scrollY = window.scrollY;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalLeft = document.body.style.left;
    const originalRight = document.body.style.right;
    const originalWidth = document.body.style.width;
    const originalOverflow = document.body.style.overflow;
    document.body.classList.add("command-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.classList.remove("command-open");
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      document.body.style.right = originalRight;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;
      window.scrollTo(0, scrollY);
      document.getElementById("app-mobile-menu-button")?.focus({ preventScroll: true });
    };
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => {
      groupRefs.current[selectedIndex]?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        playZenithSound("close");
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? []).filter((node) => !node.hasAttribute("disabled") && node.getClientRects().length > 0);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
          return;
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = NAV_GROUPS[(selectedIndex + 1 + NAV_GROUPS.length) % NAV_GROUPS.length];
        setSelectedGroupLabel(next.label);
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const next = NAV_GROUPS[(selectedIndex - 1 + NAV_GROUPS.length) % NAV_GROUPS.length];
        setSelectedGroupLabel(next.label);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, selectedIndex]);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (open) onClose();
  }, [onClose, open, pathname]);

  if (!visible) return null;

  return (
    <div className={`command-wheel-layer ${closing ? "command-wheel-layer-closing" : ""}`} role="presentation">
      <button
        className="command-wheel-backdrop"
        type="button"
        aria-label="Close command wheel"
        onClick={() => {
          playZenithSound("close");
          onClose();
        }}
      />
      <section
        ref={dialogRef}
        className={`command-wheel command-wheel-side-${side} ${closing ? "command-wheel-closing" : ""}`}
        id="app-command-wheel"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="command-wheel-arc" aria-hidden="true" />
        <div className="command-wheel-halo" aria-hidden="true" />

        <div className="command-wheel-header">
          <span>
            <small>Command</small>
            <strong>{selectedGroup.label}</strong>
          </span>
          <button
            className="command-wheel-close"
            type="button"
            aria-label="Close command wheel"
            onClick={() => {
              playZenithSound("close");
              onClose();
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="command-wheel-stage">
          <div className="command-wheel-center" aria-hidden="true">
            <Activity size={24} />
            <strong>{selectedGroup.label}</strong>
            <small>{selectedGroup.eyebrow}</small>
          </div>

          <div className="command-wheel-groups" role="tablist" aria-label="Navigation sections">
            {NAV_GROUPS.map((group, index) => {
              const selected = group.label === selectedGroup.label;
              const active = group.label === activeGroup.label;
              const tabId = `${idPrefix}-tab-${index}`;
              const panelId = `${idPrefix}-panel`;
              return (
                <button
                  key={group.label}
                  id={tabId}
                  ref={(node) => {
                    groupRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  className={`command-wheel-group ${selected ? "command-wheel-group-selected" : ""} ${active ? "command-wheel-group-active" : ""}`}
                  style={{ ["--wheel-index" as string]: index }}
                  onClick={() => {
                    playZenithSound("ui");
                    setSelectedGroupLabel(group.label);
                  }}
                >
                  <span className="command-wheel-node"><ZenithIcon name={group.icon} size={17} /></span>
                  <span>
                    <strong>{group.label}</strong>
                    <small>{group.eyebrow}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`${idPrefix}-panel`}
          className="command-wheel-panel"
          role="tabpanel"
          aria-labelledby={`${idPrefix}-tab-${selectedIndex}`}
        >
          <div className="command-wheel-panel-heading">
            <button
              type="button"
              aria-label="Previous navigation section"
              onClick={() => {
                playZenithSound("ui");
                setSelectedGroupLabel(NAV_GROUPS[(selectedIndex - 1 + NAV_GROUPS.length) % NAV_GROUPS.length].label);
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              <strong>{selectedGroup.label}</strong>
              <small>{selectedGroup.items.length} destinations</small>
            </span>
            <button
              type="button"
              aria-label="Next navigation section"
              onClick={() => {
                playZenithSound("ui");
                setSelectedGroupLabel(NAV_GROUPS[(selectedIndex + 1 + NAV_GROUPS.length) % NAV_GROUPS.length].label);
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="command-wheel-links">
            {selectedGroup.items.map((item, index) => {
              const active = isNavItemActive(pathname, item);
              const highlighted = active || (!selectedGroupHasActiveItem && index === 0);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`command-wheel-link ${highlighted ? "command-wheel-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  style={{ ["--link-index" as string]: index }}
                  onClick={onClose}
                >
                  <span>
                    <ZenithIcon name={item.icon} size={17} />
                    <strong>{item.label}</strong>
                  </span>
                  {item.badge && <em>{item.badge}</em>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
