"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import QualityText from "@/components/QualityText";
import { SKILL_TOOLS, type ToolSkill } from "@/lib/skill-profit";

export default function ToolPicker({
  skill,
  value,
  open,
  onToggle,
  onChange,
}: {
  skill: ToolSkill;
  value: string;
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const selected = SKILL_TOOLS[skill].find((tool) => tool.name === value) || SKILL_TOOLS[skill][0];
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuMetrics, setMenuMetrics] = useState({ dropUp: false, maxHeight: 288 });

  useEffect(() => {
    if (!open) return;
    const updateMenuMetrics = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const edgePadding = 14;
      const gap = 8;
      const below = Math.max(0, viewportHeight - rect.bottom - edgePadding - gap);
      const above = Math.max(0, rect.top - edgePadding - gap);
      const dropUp = below < 260 && above > below;
      const available = dropUp ? above : below;
      setMenuMetrics({ dropUp, maxHeight: Math.max(176, Math.min(288, available)) });
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onToggle();
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    updateMenuMetrics();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuMetrics);
    window.addEventListener("scroll", updateMenuMetrics, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuMetrics);
      window.removeEventListener("scroll", updateMenuMetrics, true);
    };
  }, [onToggle, open]);

  return (
    <div className="settings-tool-picker">
      <button
        type="button"
        ref={triggerRef}
        className={`settings-tool-trigger ${open ? "settings-tool-trigger-open" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`settings-tool-menu-${skill.toLowerCase()}`}
      >
        <span>
          <strong>{skill}</strong>
          <small>{selected.name}</small>
        </span>
        <em>+{selected.efficiency}%</em>
      </button>
      {open && (
        <div
          className={`settings-tool-menu ${menuMetrics.dropUp ? "settings-tool-menu-up" : ""}`}
          id={`settings-tool-menu-${skill.toLowerCase()}`}
          role="listbox"
          aria-label={`${skill} fallback tool`}
          style={{ "--settings-tool-menu-max-height": `${menuMetrics.maxHeight}px` } as CSSProperties}
        >
          {SKILL_TOOLS[skill].map((tool) => (
            <button
              type="button"
              role="option"
              aria-selected={tool.name === value}
              className={tool.name === value ? "settings-tool-option-active" : ""}
              key={tool.name}
              onClick={() => onChange(tool.name)}
            >
              <span>
                <strong>{tool.name}</strong>
                <small><QualityText value={tool.quality}>{tool.quality}</QualityText> - Lv. {tool.level}</small>
              </span>
              <em>+{tool.efficiency}%</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
