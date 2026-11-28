import React from "react";
import styles from "./Timeline.module.css";

export type TimelineVariant = "default" | "success" | "danger" | "warning";

export interface TimelineItem {
  id?: string | number;
  htmlId?: string;
  title: React.ReactNode;
  timestamp: string | Date;
  formattedTime?: string;
  status?: string;
  variant?: TimelineVariant;
  body?: React.ReactNode;
  children?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  title?: string;
  headingLevel?: "h2" | "h3";
  directionNotice?: string;
  className?: string;
  "aria-label"?: string;
}

export function Timeline({
  items,
  title,
  headingLevel = "h3",
  directionNotice = "Order: Newest updates first | Server Time (UTC)",
  className,
  "aria-label": ariaLabel,
}: TimelineProps) {
  if (!items || items.length === 0) return null;

  const SectionHeading = headingLevel;
  const EntryHeading = headingLevel === "h2" ? "h3" : "h4";

  return (
    <section
      className={`${styles.container} ${className || ""}`.trim()}
      aria-label={ariaLabel || title || "Timeline"}
    >
      {(title || directionNotice) && (
        <div className={styles.header}>
          {title && <SectionHeading className={styles.title}>{title}</SectionHeading>}
          {directionNotice && (
            <p className={styles.directionNotice}>{directionNotice}</p>
          )}
        </div>
      )}

      <ol className={styles.timeline}>
        {items.map((item, index) => {
          const dateObj =
            typeof item.timestamp === "string"
              ? new Date(item.timestamp)
              : item.timestamp;
          const isoString = isNaN(dateObj.getTime())
            ? String(item.timestamp)
            : dateObj.toISOString();
          const displayTime =
            item.formattedTime ||
            (isNaN(dateObj.getTime())
              ? String(item.timestamp)
              : dateObj.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }));

          const variantClass = item.variant ? styles[item.variant] : "";

          return (
            <li key={item.id ?? index} id={item.htmlId} className={styles.entry}>
              <div className={styles.marker} aria-hidden="true">
                <span className={`${styles.dot} ${variantClass}`.trim()} />
                <span className={styles.line} />
              </div>

              <div className={styles.content}>
                <div className={styles.meta}>
                  <time
                    dateTime={isoString}
                    className={styles.time}
                    title={isoString}
                  >
                    {displayTime}
                  </time>
                  {item.status && (
                    <span className={styles.statusTag}>
                      <span className="sr-only">Status: </span>
                      {item.status}
                    </span>
                  )}
                </div>

                <EntryHeading className={styles.entryTitle}>{item.title}</EntryHeading>

                {item.body && <p className={styles.body}>{item.body}</p>}
                {item.children}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
