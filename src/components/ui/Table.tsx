"use client";

import React, { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { Icon } from "./Icon";
import styles from "./Table.module.css";

/* -------------------------------------------------------------------------- */
/* Table Container (Accessible Scroll Region with Lea Verou Scroll Shadows)   */
/* -------------------------------------------------------------------------- */

export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  scrollShadows?: boolean;
  maxHeight?: string | number;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(
  function TableContainer(
    {
      children,
      scrollShadows = true,
      maxHeight,
      ariaLabel,
      ariaLabelledBy,
      className = "",
      style,
      ...props
    },
    ref
  ) {
    const containerClasses = [
      styles.container,
      scrollShadows ? styles.scrollShadows : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        role="region"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={containerClasses}
        style={{
          maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Root                                                                 */
/* -------------------------------------------------------------------------- */

export type TableDensity = "compact" | "normal" | "relaxed";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  density?: TableDensity;
  striped?: boolean;
  hoverable?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  function Table(
    {
      children,
      density = "normal",
      striped = false,
      hoverable = true,
      className = "",
      ...props
    },
    ref
  ) {
    const densityClass =
      density === "compact"
        ? styles.densityCompact
        : density === "relaxed"
        ? styles.densityRelaxed
        : styles.densityNormal;

    const tableClasses = [
      styles.table,
      densityClass,
      striped ? styles.striped : "",
      hoverable ? styles.hoverable : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <table ref={ref} className={tableClasses} {...props}>
        {children}
      </table>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Caption                                                              */
/* -------------------------------------------------------------------------- */

export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {
  visuallyHidden?: boolean;
}

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption(
    { children, visuallyHidden = false, className = "", ...props },
    ref
  ) {
    const captionClasses = [
      visuallyHidden ? styles.captionVisuallyHidden : styles.caption,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <caption ref={ref} className={captionClasses} {...props}>
        {children}
      </caption>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Header (thead)                                                       */
/* -------------------------------------------------------------------------- */

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  sticky?: boolean;
}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ children, sticky = true, className = "", ...props }, ref) {
    const theadClasses = [
      styles.thead,
      sticky ? styles.stickyHeader : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <thead ref={ref} className={theadClasses} {...props}>
        {children}
      </thead>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Body (tbody)                                                         */
/* -------------------------------------------------------------------------- */

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody({ children, className = "", ...props }, ref) {
    return (
      <tbody ref={ref} className={className} {...props}>
        {children}
      </tbody>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Footer (tfoot)                                                       */
/* -------------------------------------------------------------------------- */

export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  function TableFooter({ children, className = "", ...props }, ref) {
    const tfootClasses = [styles.tfoot, className].filter(Boolean).join(" ");

    return (
      <tfoot ref={ref} className={tfootClasses} {...props}>
        {children}
      </tfoot>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Row (tr)                                                             */
/* -------------------------------------------------------------------------- */

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  interactive?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow(
    {
      children,
      selected = false,
      interactive = false,
      onClick,
      className = "",
      ...props
    },
    ref
  ) {
    const isInteractive = interactive || Boolean(onClick);

    const rowClasses = [
      styles.tr,
      selected ? styles.selected : "",
      isInteractive ? styles.interactive : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <tr
        ref={ref}
        className={rowClasses}
        onClick={onClick}
        aria-selected={selected ? true : undefined}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Head Cell (th)                                                       */
/* -------------------------------------------------------------------------- */

export type TableAlign = "left" | "center" | "right";
export type TableSortDirection = "ascending" | "descending" | "none" | false;

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlign;
  pinned?: boolean;
  sortable?: boolean;
  sortDirection?: TableSortDirection;
  onSort?: () => void;
  sortLabel?: string;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead(
    {
      children,
      align = "left",
      pinned = false,
      scope = "col",
      sortable = false,
      sortDirection = false,
      onSort,
      sortLabel,
      className = "",
      ...props
    },
    ref
  ) {
    const alignClass =
      align === "right"
        ? styles.alignRight
        : align === "center"
        ? styles.alignCenter
        : styles.alignLeft;

    const thClasses = [
      styles.th,
      alignClass,
      pinned ? styles.thPinned : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const ariaSortValue =
      sortDirection === "ascending" || sortDirection === "descending"
        ? sortDirection
        : sortable
        ? "none"
        : undefined;

    if (sortable) {
      const isActive = sortDirection === "ascending" || sortDirection === "descending";
      const iconName =
        sortDirection === "ascending"
          ? "sortAsc"
          : sortDirection === "descending"
          ? "sortDesc"
          : "sort";

      const sortButtonAlignClass =
        align === "right"
          ? styles.alignRight
          : align === "center"
          ? styles.alignCenter
          : styles.alignLeft;

      const directionDescription =
        sortDirection === "ascending"
          ? "sorted ascending"
          : sortDirection === "descending"
          ? "sorted descending"
          : "not sorted";

      const accessibleName =
        sortLabel ||
        (typeof children === "string"
          ? `Sort by ${children}, currently ${directionDescription}`
          : `Sort column, currently ${directionDescription}`);

      return (
        <th
          ref={ref}
          scope={scope}
          aria-sort={ariaSortValue}
          className={thClasses}
          {...props}
        >
          <button
            type="button"
            className={`${styles.sortButton} ${sortButtonAlignClass}`.trim()}
            onClick={onSort}
            aria-label={accessibleName}
          >
            {align === "right" ? (
              <>
                <span
                  aria-hidden="true"
                  className={`${styles.sortIndicator} ${
                    isActive ? styles.sortIndicatorActive : styles.sortIndicatorInactive
                  }`.trim()}
                >
                  <Icon name={iconName} size={13} />
                </span>
                <span>{children}</span>
              </>
            ) : (
              <>
                <span>{children}</span>
                <span
                  aria-hidden="true"
                  className={`${styles.sortIndicator} ${
                    isActive ? styles.sortIndicatorActive : styles.sortIndicatorInactive
                  }`.trim()}
                >
                  <Icon name={iconName} size={13} />
                </span>
              </>
            )}
          </button>
        </th>
      );
    }

    return (
      <th ref={ref} scope={scope} className={thClasses} {...props}>
        {children}
      </th>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Table Cell (td)                                                            */
/* -------------------------------------------------------------------------- */

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlign;
  numeric?: boolean;
  pinned?: boolean;
  truncate?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell(
    {
      children,
      align,
      numeric = false,
      pinned = false,
      truncate = false,
      className = "",
      ...props
    },
    ref
  ) {
    // If numeric is true, default to right align unless explicitly overridden
    const effectiveAlign = align || (numeric ? "right" : "left");

    const alignClass =
      effectiveAlign === "right"
        ? styles.alignRight
        : effectiveAlign === "center"
        ? styles.alignCenter
        : styles.alignLeft;

    const tdClasses = [
      styles.td,
      alignClass,
      numeric ? styles.numeric : "",
      pinned ? styles.tdPinned : "",
      truncate ? styles.truncate : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <td ref={ref} className={tdClasses} {...props}>
        {children}
      </td>
    );
  }
);
