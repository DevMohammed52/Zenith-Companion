"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useId,
  KeyboardEvent,
  ReactNode,
} from "react";
import styles from "./Tabs.module.css";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
  variant: "underline" | "pill";
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be used within a Tabs provider.");
  }
  return context;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "pill";
  children?: ReactNode;
  className?: string;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = "underline",
  children,
  className = "",
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const baseId = useId();

  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (nextTab: string) => {
    if (value === undefined) {
      setInternalValue(nextTab);
    }
    onValueChange?.(nextTab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId, variant }}>
      <div className={`${styles.tabsContainer} ${className}`.trim()}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabListProps {
  "aria-label": string;
  children?: ReactNode;
  className?: string;
}

export function TabList({ "aria-label": ariaLabel, children, className = "" }: TabListProps) {
  const { variant } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!listRef.current) return;
    const tabs = Array.from(
      listRef.current.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')
    );
    if (!tabs.length) return;

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      tabs[prevIndex]?.focus();
      tabs[prevIndex]?.click();
    } else if (e.key === "Home") {
      e.preventDefault();
      tabs[0]?.focus();
      tabs[0]?.click();
    } else if (e.key === "End") {
      e.preventDefault();
      tabs[tabs.length - 1]?.focus();
      tabs[tabs.length - 1]?.click();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={`${styles.tabList} ${variant === "pill" ? styles.pillVariant : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export interface TabProps {
  value: string;
  badge?: number | string;
  icon?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Tab({
  value,
  badge,
  icon,
  disabled = false,
  children,
  className = "",
}: TabProps) {
  const { activeTab, setActiveTab, baseId } = useTabsContext();
  const isSelected = activeTab === value;

  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`${styles.tab} ${isSelected ? styles.isSelected : ""} ${className}`.trim()}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {badge !== undefined && <span className={styles.tabBadge}>{badge}</span>}
    </button>
  );
}

export interface TabPanelProps {
  value: string;
  children?: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className = "" }: TabPanelProps) {
  const { activeTab, baseId } = useTabsContext();
  const isSelected = activeTab === value;

  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  if (!isSelected) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      className={`${styles.tabPanel} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
