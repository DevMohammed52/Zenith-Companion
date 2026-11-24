"use client";

import React, {
  createContext,
  useContext,
  useState,
  useId,
  useCallback,
  useRef,
} from "react";
import styles from "./Accordion.module.css";

type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  type: AccordionType;
  openValues: string[];
  toggleItem: (value: string) => void;
  collapsible?: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error(
      "Accordion subcomponents must be used within an <Accordion> parent"
    );
  }
  return ctx;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  triggerId: string;
  panelId: string;
  disabled?: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null
);

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) {
    throw new Error(
      "AccordionItem subcomponents must be used within an <AccordionItem> parent"
    );
  }
  return ctx;
}

export interface AccordionProps {
  type?: AccordionType;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = "single",
  value: controlledValue,
  defaultValue,
  onValueChange,
  collapsible = true,
  children,
  className = "",
}: AccordionProps) {
  const normalizeInitial = (): string[] => {
    if (defaultValue === undefined) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  };

  const [uncontrolledValues, setUncontrolledValues] =
    useState<string[]>(normalizeInitial);
  const isControlled = controlledValue !== undefined;
  const currentValues = isControlled
    ? Array.isArray(controlledValue)
      ? controlledValue
      : controlledValue
      ? [controlledValue]
      : []
    : uncontrolledValues;

  const toggleItem = useCallback(
    (itemValue: string) => {
      let next: string[];
      if (type === "single") {
        if (currentValues.includes(itemValue)) {
          next = collapsible ? [] : currentValues;
        } else {
          next = [itemValue];
        }
      } else {
        if (currentValues.includes(itemValue)) {
          next = currentValues.filter((v) => v !== itemValue);
        } else {
          next = [...currentValues, itemValue];
        }
      }

      if (!isControlled) {
        setUncontrolledValues(next);
      }
      onValueChange?.(type === "single" ? (next[0] || "") : next);
    },
    [currentValues, type, collapsible, isControlled, onValueChange]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const triggers = Array.from(
      containerRef.current.querySelectorAll<HTMLButtonElement>(
        'button[data-accordion-trigger="true"]:not(:disabled)'
      )
    );
    const activeIndex = triggers.findIndex((el) => el === document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % triggers.length;
      triggers[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (activeIndex - 1 + triggers.length) % triggers.length;
      triggers[prevIndex]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      triggers[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      triggers[triggers.length - 1]?.focus();
    }
  };

  return (
    <AccordionContext.Provider
      value={{ type, openValues: currentValues, toggleItem, collapsible }}
    >
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className={`${styles.root} ${className}`.trim()}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function AccordionItem({
  value,
  disabled = false,
  children,
  className = "",
}: AccordionItemProps) {
  const { openValues } = useAccordionContext();
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const panelId = `${generatedId}-panel`;
  const isOpen = openValues.includes(value);

  return (
    <AccordionItemContext.Provider
      value={{ value, isOpen, triggerId, panelId, disabled }}
    >
      <div
        className={`${styles.item} ${className}`.trim()}
        data-state={isOpen ? "open" : "closed"}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export interface AccordionHeaderProps {
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
  children?: React.ReactNode;
  className?: string;
}

export function AccordionHeader({
  as: HeadingTag = "h3",
  children,
  className = "",
}: AccordionHeaderProps) {
  return (
    <HeadingTag className={`${styles.header} ${className}`.trim()}>
      {children}
    </HeadingTag>
  );
}

export interface AccordionTriggerProps {
  children?: React.ReactNode;
  className?: string;
  showChevron?: boolean;
}

export function AccordionTrigger({
  children,
  className = "",
  showChevron = true,
}: AccordionTriggerProps) {
  const { toggleItem } = useAccordionContext();
  const { value, isOpen, triggerId, panelId, disabled } =
    useAccordionItemContext();

  return (
    <button
      id={triggerId}
      type="button"
      data-accordion-trigger="true"
      aria-expanded={isOpen}
      aria-controls={panelId}
      disabled={disabled}
      onClick={() => toggleItem(value)}
      className={`${styles.trigger} ${className}`.trim()}
    >
      <span>{children}</span>
      {showChevron && (
        <span
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      )}
    </button>
  );
}

export interface AccordionContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function AccordionContent({
  children,
  className = "",
}: AccordionContentProps) {
  const { isOpen, triggerId, panelId } = useAccordionItemContext();

  return (
    <div
      id={panelId}
      role="region"
      aria-labelledby={triggerId}
      className={`${styles.content} ${!isOpen ? styles.contentClosed : ""} ${className}`.trim()}
      hidden={!isOpen}
    >
      {children}
    </div>
  );
}
