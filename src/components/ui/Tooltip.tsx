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
import styles from "./Tooltip.module.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface TooltipProviderContextValue {
  isOpenRecently: boolean;
  notifyOpen: () => void;
  notifyClose: () => void;
}

const TooltipProviderContext = createContext<TooltipProviderContextValue>({
  isOpenRecently: false,
  notifyOpen: () => {},
  notifyClose: () => {},
});

export function TooltipProvider({
  children,
  skipDelayDuration = 300,
}: {
  children: React.ReactNode;
  skipDelayDuration?: number;
}) {
  const [isOpenRecently, setIsOpenRecently] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const notifyOpen = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpenRecently(true);
  }, []);

  const notifyClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpenRecently(false);
    }, skipDelayDuration);
  }, [skipDelayDuration]);

  return (
    <TooltipProviderContext.Provider
      value={{ isOpenRecently, notifyOpen, notifyClose }}
    >
      {children}
    </TooltipProviderContext.Provider>
  );
}

interface TooltipContextValue {
  isOpen: boolean;
  openTooltip: () => void;
  closeTooltip: (immediate?: boolean) => void;
  cancelClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  tooltipId: string;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function useTooltipContext() {
  const ctx = useContext(TooltipContext);
  if (!ctx) {
    throw new Error("Tooltip subcomponents must be used within <Tooltip>");
  }
  return ctx;
}

export interface TooltipProps {
  children?: React.ReactNode;
  content?: React.ReactNode;
  placement?: TooltipPlacement;
  delayDuration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
  children,
  content,
  placement = "top",
  delayDuration = 250,
  open: controlledOpen,
  onOpenChange,
}: TooltipProps) {
  const { isOpenRecently, notifyOpen, notifyClose } = useContext(
    TooltipProviderContext
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipId = useId();
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
      if (nextOpen) {
        notifyOpen();
      } else {
        notifyClose();
      }
    },
    [isControlled, onOpenChange, notifyOpen, notifyClose]
  );

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openTooltip = useCallback(() => {
    cancelClose();
    if (openTimerRef.current) clearTimeout(openTimerRef.current);

    const delay = isOpenRecently ? 0 : delayDuration;
    if (delay === 0) {
      setOpen(true);
    } else {
      openTimerRef.current = setTimeout(() => {
        setOpen(true);
      }, delay);
    }
  }, [delayDuration, isOpenRecently, setOpen, cancelClose]);

  const closeTooltip = useCallback(
    (immediate = false) => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      cancelClose();

      if (immediate) {
        setOpen(false);
      } else {
        // WCAG 2.2 SC 1.4.13 Hoverable grace period (150ms) to allow moving into tooltip
        closeTimerRef.current = setTimeout(() => {
          setOpen(false);
        }, 150);
      }
    },
    [setOpen, cancelClose]
  );

  // If used with shorthand `content` prop:
  if (content !== undefined) {
    return (
      <TooltipContext.Provider
        value={{ isOpen, openTooltip, closeTooltip, cancelClose, triggerRef, tooltipId }}
      >
        <TooltipTrigger asChild>{children as React.ReactElement<any>}</TooltipTrigger>
        <TooltipContent placement={placement}>{content}</TooltipContent>
      </TooltipContext.Provider>
    );
  }

  return (
    <TooltipContext.Provider
      value={{ isOpen, openTooltip, closeTooltip, cancelClose, triggerRef, tooltipId }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps {
  children: React.ReactElement<any>;
  asChild?: boolean;
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  const { openTooltip, closeTooltip, cancelClose, triggerRef, tooltipId, isOpen } =
    useTooltipContext();

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    children.props.onMouseEnter?.(e);
    cancelClose();
    openTooltip();
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    children.props.onMouseLeave?.(e);
    closeTooltip(false); // 150ms grace period to allow pointer movement into tooltip
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    children.props.onFocus?.(e);
    openTooltip();
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    children.props.onBlur?.(e);
    closeTooltip(true);
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    children.props.onClick?.(e);
    closeTooltip(true);
  };

  const existingDescribedBy = children.props["aria-describedby"];
  const combinedDescribedBy = isOpen
    ? existingDescribedBy
      ? `${existingDescribedBy} ${tooltipId}`
      : tooltipId
    : existingDescribedBy;

  return React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children.props as { ref?: React.Ref<HTMLElement> })?.ref;
      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef && "current" in childRef) {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onClick: handleClick,
    "aria-describedby": combinedDescribedBy,
  } as any);
}

export interface TooltipContentProps {
  children?: React.ReactNode;
  placement?: TooltipPlacement;
  offset?: number;
  className?: string;
  showArrow?: boolean;
}

export function TooltipContent({
  children,
  placement = "top",
  offset = 8,
  className = "",
  showArrow = true,
}: TooltipContentProps) {
  const { isOpen, closeTooltip, cancelClose, triggerRef, tooltipId } = useTooltipContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [computedPlacement, setComputedPlacement] =
    useState<TooltipPlacement>(placement);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalPlacement = placement;

    // Viewport boundary collision flip
    if (placement === "top" && triggerRect.top - contentRect.height - offset < 8) {
      finalPlacement = "bottom";
    } else if (
      placement === "bottom" &&
      triggerRect.bottom + contentRect.height + offset > viewportHeight - 8
    ) {
      finalPlacement = "top";
    }

    setComputedPlacement(finalPlacement);

    let top = 0;
    let left = 0;

    if (finalPlacement === "top") {
      top = triggerRect.top + window.scrollY - contentRect.height - offset;
      left =
        triggerRect.left +
        window.scrollX +
        (triggerRect.width - contentRect.width) / 2;
    } else if (finalPlacement === "bottom") {
      top = triggerRect.bottom + window.scrollY + offset;
      left =
        triggerRect.left +
        window.scrollX +
        (triggerRect.width - contentRect.width) / 2;
    } else if (finalPlacement === "left") {
      top =
        triggerRect.top +
        window.scrollY +
        (triggerRect.height - contentRect.height) / 2;
      left = triggerRect.left + window.scrollX - contentRect.width - offset;
    } else if (finalPlacement === "right") {
      top =
        triggerRect.top +
        window.scrollY +
        (triggerRect.height - contentRect.height) / 2;
      left = triggerRect.right + window.scrollX + offset;
    }

    // Shift to keep within viewport bounds (8px margin)
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + viewportWidth - contentRect.width - 8;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    setCoords({ top, left });
  }, [isOpen, placement, offset, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  // Escape key dismiss per WCAG 2.2 SC 1.4.13
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeTooltip(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeTooltip]);

  if (!isOpen || !mounted) return null;

  const arrowClass =
    computedPlacement === "top"
      ? styles.arrowTop
      : computedPlacement === "bottom"
      ? styles.arrowBottom
      : computedPlacement === "left"
      ? styles.arrowLeft
      : styles.arrowRight;

  return createPortal(
    <div
      ref={contentRef}
      id={tooltipId}
      role="tooltip"
      onMouseEnter={cancelClose} // Persistent hover over tooltip per WCAG 2.2 SC 1.4.13
      onMouseLeave={() => closeTooltip(false)}
      className={`${styles.content} ${className}`.trim()}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
    >
      {showArrow && (
        <div className={`${styles.arrow} ${arrowClass}`} aria-hidden="true" />
      )}
      {children}
    </div>,
    document.body
  );
}
