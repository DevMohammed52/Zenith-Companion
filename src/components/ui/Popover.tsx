"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Popover.module.css";

export type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end";

interface PopoverContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentId: string;
  placement: PopoverPlacement;
  offset: number;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

export function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover subcomponents must be used within a <Popover> parent");
  }
  return context;
}

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  offset?: number;
  children?: React.ReactNode;
}

export function Popover({
  open,
  defaultOpen = false,
  onOpenChange,
  placement = "bottom",
  offset = 8,
  children,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentId = useId();

  const setIsOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <PopoverContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerRef,
        contentId,
        placement,
        offset,
      }}
    >
      {children}
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps {
  children: React.ReactElement<any>;
  asChild?: boolean;
  className?: string;
}

export function PopoverTrigger({ children, className = "" }: PopoverTriggerProps) {
  const { isOpen, setIsOpen, triggerRef, contentId } = usePopoverContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    children.props.onClick?.(e);
    if (!e.defaultPrevented) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    children.props.onKeyDown?.(e);
    if (e.key === "Escape" && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  return React.cloneElement(children, {
    ref: (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      const childRef = (children.props as { ref?: React.Ref<HTMLButtonElement> })?.ref;
      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef && "current" in childRef) {
        (childRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    },
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    "aria-haspopup": "dialog",
    "aria-expanded": isOpen,
    "aria-controls": contentId,
    className: `${children.props.className || ""} ${className}`.trim(),
  } as any);
}

export interface PopoverContentProps {
  children?: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  align?: "start" | "center" | "end";
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function PopoverContent({
  children,
  className = "",
  showArrow = true,
  ariaLabel,
  ariaLabelledBy,
}: PopoverContentProps) {
  const { isOpen, setIsOpen, triggerRef, contentId, placement, offset } = usePopoverContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [arrowLeft, setArrowLeft] = useState<number>(16);
  const [actualSide, setActualSide] = useState<"top" | "bottom">("bottom");

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let side: "top" | "bottom" = placement.startsWith("top") ? "top" : "bottom";

    // Auto-flip if overflowing bottom or top
    if (side === "bottom" && triggerRect.bottom + offset + contentRect.height > viewportHeight - 12) {
      if (triggerRect.top - offset - contentRect.height > 12) {
        side = "top";
      }
    } else if (side === "top" && triggerRect.top - offset - contentRect.height < 12) {
      if (triggerRect.bottom + offset + contentRect.height <= viewportHeight - 12) {
        side = "bottom";
      }
    }

    setActualSide(side);

    // Compute vertical position with scroll offset
    let top = 0;
    if (side === "bottom") {
      top = triggerRect.bottom + window.scrollY + offset;
    } else {
      top = triggerRect.top + window.scrollY - contentRect.height - offset;
    }

    // Compute horizontal alignment
    let left = triggerRect.left + window.scrollX;
    if (placement.endsWith("-end")) {
      left = triggerRect.right + window.scrollX - contentRect.width;
    } else if (!placement.endsWith("-start")) {
      // Center
      left = triggerRect.left + window.scrollX + (triggerRect.width - contentRect.width) / 2;
    }

    // Viewport edge collision shift (keep 12px from viewport borders)
    const minLeft = window.scrollX + 12;
    const maxLeft = window.scrollX + viewportWidth - contentRect.width - 12;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    setCoords({ top, left });

    // Calculate arrow position relative to popover so it points directly to trigger center
    const triggerCenter = triggerRect.left + window.scrollX + triggerRect.width / 2;
    const relativeArrowLeft = triggerCenter - left - 4; // 4px is half of 8px arrow
    const boundedArrowLeft = Math.max(12, Math.min(relativeArrowLeft, contentRect.width - 20));
    setArrowLeft(boundedArrowLeft);
  }, [isOpen, placement, offset, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  // Click outside and Escape dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen, triggerRef]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      ref={contentRef}
      id={contentId}
      role="dialog"
      aria-modal="false"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`${styles.content} ${className}`.trim()}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      tabIndex={-1}
    >
      {showArrow && (
        <div
          className={`${styles.arrow} ${
            actualSide === "bottom" ? styles.arrowBottom : styles.arrowTop
          }`}
          style={{ left: `${arrowLeft}px` }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>,
    document.body
  );
}

export interface PopoverCloseProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function PopoverClose({ children, className = "", onClick }: PopoverCloseProps) {
  const { setIsOpen, triggerRef } = usePopoverContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-label="Close popover"
    >
      {children || (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </button>
  );
}
