"use client";

import { useId, useRef, useState, useEffect, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ChevronDown, Check } from "lucide-react";
import { getQualityTextStyle } from "@/lib/quality";
import type { PetSelectOption } from "../types";

export function PetSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  open,
  onOpenChange,
}: {
  label: string;
  value: T;
  options: Array<PetSelectOption<T>>;
  onChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = options.find((option) => option.value === value) || options[0];
  const reactId = useId();
  const menuId = `pet-select-${reactId}`;
  const labelId = `${menuId}-label`;
  const valueId = `${menuId}-value`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [menuMaxHeight, setMenuMaxHeight] = useState(280);

  const renderOptionLabel = (option: PetSelectOption<T> | undefined) => {
    if (!option) return "";
    if (option.qualityTone) {
      return <span style={getQualityTextStyle(option.qualityTone)}>{option.label}</span>;
    }
    return option.label;
  };

  const updateMenuPlacement = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 12;
    const preferredHeight = 300;
    const isCompactPicker = window.matchMedia("(max-width: 820px)").matches;
    const spaceBelow = Math.max(72, window.innerHeight - rect.bottom - viewportPadding);
    const spaceAbove = Math.max(72, rect.top - viewportPadding);
    const nextPlacement = !isCompactPicker && spaceBelow < preferredHeight && spaceAbove > spaceBelow ? "up" : "down";
    setPlacement(nextPlacement);
    setMenuMaxHeight(Math.min(preferredHeight, nextPlacement === "up" ? spaceAbove : spaceBelow));
  };

  useEffect(() => {
    if (!open) return;
    updateMenuPlacement();
    if (window.matchMedia("(max-width: 820px)").matches) {
      triggerRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    }
    setActiveIndex(selectedIndex);
    window.requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
    window.addEventListener("resize", updateMenuPlacement);
    window.addEventListener("scroll", updateMenuPlacement, true);
    return () => {
      window.removeEventListener("resize", updateMenuPlacement);
      window.removeEventListener("scroll", updateMenuPlacement, true);
    };
  }, [open, selectedIndex]);

  const closeMenu = (returnFocus = true) => {
    onOpenChange(false);
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const chooseOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  };

  const moveToOption = (index: number) => {
    const nextIndex = Math.min(options.length - 1, Math.max(0, index));
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        onOpenChange(true);
        return;
      }
      moveToOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        onOpenChange(true);
        return;
      }
      moveToOption(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      if (open) moveToOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      if (open) moveToOption(options.length - 1);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      chooseOption(activeIndex);
    }
  };

  return (
    <div className={`pet-field pet-dropdown ${open ? "open" : ""} ${open && placement === "up" ? "open-up" : ""}`}>
      <span id={labelId}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className="pet-select-button"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (!open) updateMenuPlacement();
          onOpenChange(!open);
        }}
      >
        <span id={valueId}>{renderOptionLabel(selected)}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          className="pet-select-menu"
          id={menuId}
          role="listbox"
          aria-labelledby={labelId}
          onKeyDown={handleKeyDown}
          style={{ "--pet-select-max-height": `${menuMaxHeight}px` } as CSSProperties}
        >
          {options.map((option, index) => (
            <button
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              key={option.value}
              className={option.value === value ? "selected" : ""}
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => {
                onChange(option.value);
                closeMenu();
              }}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span>{renderOptionLabel(option)}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
