import React, { forwardRef } from "react";
import {
  type IconConcept,
  type IconSize,
  ICON_SIZES,
  DEFAULT_ICON_STROKE,
  getConceptIcon,
} from "@/lib/icons";
import styles from "./Icon.module.css";

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "name"> {
  name: IconConcept;
  size?: IconSize | number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  {
    name,
    size = "md",
    strokeWidth = DEFAULT_ICON_STROKE,
    label,
    className = "",
    style,
    ...props
  },
  ref
) {
  const SvgComponent = getConceptIcon(name);
  const pixelSize = typeof size === "number" ? size : ICON_SIZES[size] || 16;

  if (!SvgComponent) {
    return null;
  }

  // If a label is provided, the icon conveys standalone semantic meaning per WCAG 2.2 SC 1.1.1.
  // Otherwise, it is decorative and hidden from screen readers.
  const isDecorative = !label;

  return (
    <span
      ref={ref}
      className={`${styles.iconWrapper} ${className}`.trim()}
      style={style}
    >
      <SvgComponent
        width={pixelSize}
        height={pixelSize}
        size={pixelSize}
        strokeWidth={strokeWidth}
        aria-hidden={isDecorative ? "true" : undefined}
        aria-label={isDecorative ? undefined : label}
        role={isDecorative ? undefined : "img"}
        {...props}
      />
      {label && <span className={styles.srOnly}>{label}</span>}
    </span>
  );
});
