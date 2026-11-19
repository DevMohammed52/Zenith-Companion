"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ChevronDown } from "lucide-react";
import styles from "../page.module.css";

export function OptionMenu<T extends string>({
  label,
  value,
  options,
  open,
  onOpen,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  open: boolean;
  onOpen: (open: boolean) => void;
  onChange: (value: T) => void;
}) {
  const selected = options.find((option) => option.value === value) || options[0];
  const reactId = useId();
  const menuId = `pet-compare-menu-${reactId}`;
  const labelId = `${menuId}-label`;
  const valueId = `${menuId}-value`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    window.requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [open, selectedIndex]);

  const closeMenu = (returnFocus = true) => {
    onOpen(false);
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const moveToOption = (index: number) => {
    const nextIndex = Math.min(options.length - 1, Math.max(0, index));
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  };

  const chooseOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
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
        onOpen(true);
        return;
      }
      moveToOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        onOpen(true);
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
    <div className={`${styles.field} ${styles.menuField}`} data-menu-root>
      <span id={labelId}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className={styles.menuTrigger}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        onKeyDown={handleKeyDown}
        onClick={() => onOpen(!open)}
      >
        <span id={valueId}>{selected.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          className={styles.menuPanel}
          id={menuId}
          role="listbox"
          aria-labelledby={labelId}
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => (
            <button
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              key={option.value}
              className={option.value === value ? styles.selectedOption : ""}
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => {
                onChange(option.value);
                closeMenu();
              }}
              onFocus={() => setActiveIndex(index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
