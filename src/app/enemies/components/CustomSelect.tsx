"use client";

import React, {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Option } from "../types";

export function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [menuMaxHeight, setMenuMaxHeight] = useState(260);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectId = useId();
  const labelId = `${selectId}-label`;
  const selected = options.find((option) => option.value === value) || options[0];
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selected.value));

  const focusOption = (index: number) => {
    const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']");
    const button = buttons?.[Math.max(0, Math.min(index, (buttons.length || 1) - 1))];
    button?.focus({ preventScroll: true });
  };

  const updatePlacement = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 12;
    const preferredHeight = 300;
    const isCompactViewport = window.matchMedia("(max-width: 820px)").matches;
    const spaceBelow = Math.max(72, window.innerHeight - rect.bottom - viewportPadding);
    const spaceAbove = Math.max(72, rect.top - viewportPadding);
    const nextPlacement = !isCompactViewport && spaceBelow < preferredHeight && spaceAbove > spaceBelow ? "up" : "down";
    setPlacement(nextPlacement);
    setMenuMaxHeight(Math.min(preferredHeight, nextPlacement === "up" ? spaceAbove : spaceBelow));
  };

  const openMenu = (focusIndex = selectedIndex) => {
    if (window.matchMedia("(max-width: 820px)").matches) {
      triggerRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    }
    updatePlacement();
    setActiveIndex(focusIndex);
    setOpen(true);
    window.setTimeout(() => focusOption(focusIndex), 0);
  };

  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      const option = options[activeIndex] || selected;
      onChange(option.value);
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = open ? (activeIndex + 1) % options.length : Math.min(selectedIndex + 1, options.length - 1);
      setActiveIndex(nextIndex);
      if (!open) openMenu(nextIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = open ? (activeIndex <= 0 ? options.length - 1 : activeIndex - 1) : Math.max(selectedIndex - 1, 0);
      setActiveIndex(nextIndex);
      if (!open) openMenu(nextIndex);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu(selectedIndex);
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") || []);
    const currentIndex = buttons.findIndex((button) => button === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex + 1 >= buttons.length ? 0 : currentIndex + 1;
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(buttons.length - 1);
      focusOption(buttons.length - 1);
    }
  };

  return (
    <div className={`custom-select ${open ? "open" : ""} ${open && placement === "up" ? "open-up" : ""}`} ref={rootRef}>
      <label id={labelId}>{label}</label>
      <button
        ref={triggerRef}
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${selectId}-value`}
        aria-controls={open ? `${selectId}-menu` : undefined}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openMenu(selectedIndex);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span id={`${selectId}-value`}>{selected.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          id={`${selectId}-menu`}
          className="select-menu"
          role="listbox"
          aria-label={label}
          ref={menuRef}
          onKeyDown={handleMenuKeyDown}
          style={{ "--enemy-select-max-height": `${menuMaxHeight}px` } as CSSProperties}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              className={`${option.value === value ? "selected" : ""} ${index === activeIndex ? "active" : ""}`.trim()}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                triggerRef.current?.focus({ preventScroll: true });
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
