"use client";

import React, {
  createContext,
  useContext,
  useState,
  useId,
  useCallback,
} from "react";
import styles from "./Collapsible.module.css";

interface CollapsibleContextValue {
  isOpen: boolean;
  toggleOpen: () => void;
  contentId: string;
  triggerId: string;
  disabled?: boolean;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) {
    throw new Error(
      "Collapsible subcomponents must be used within a <Collapsible> parent"
    );
  }
  return ctx;
}

export interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  children,
  className = "",
  id: externalId,
}: CollapsibleProps) {
  const generatedId = useId();
  const baseId = externalId || generatedId;
  const contentId = `${baseId}-content`;
  const triggerId = `${baseId}-trigger`;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    const next = !isOpen;
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  }, [disabled, isOpen, isControlled, onOpenChange]);

  return (
    <CollapsibleContext.Provider
      value={{ isOpen, toggleOpen, contentId, triggerId, disabled }}
    >
      <div className={`${styles.root} ${className}`.trim()}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

export interface CollapsibleTriggerProps {
  children?: React.ReactNode;
  className?: string;
  showChevron?: boolean;
}

export function CollapsibleTrigger({
  children,
  className = "",
  showChevron = true,
}: CollapsibleTriggerProps) {
  const { isOpen, toggleOpen, contentId, triggerId, disabled } =
    useCollapsibleContext();

  return (
    <button
      id={triggerId}
      type="button"
      aria-expanded={isOpen}
      aria-controls={contentId}
      disabled={disabled}
      onClick={toggleOpen}
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

export interface CollapsibleContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function CollapsibleContent({
  children,
  className = "",
}: CollapsibleContentProps) {
  const { isOpen, contentId, triggerId } = useCollapsibleContext();

  return (
    <div
      id={contentId}
      aria-labelledby={triggerId}
      className={`${styles.content} ${!isOpen ? styles.contentClosed : ""} ${className}`.trim()}
      hidden={!isOpen}
    >
      {children}
    </div>
  );
}
