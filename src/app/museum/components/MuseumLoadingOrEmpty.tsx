import Link from "next/link";
import { Database } from "lucide-react";
import type { ElementType } from "react";
import styles from "../page.module.css";

export function MuseumLoading() {
  return (
    <section className={styles.museumEmpty} role="status">
      <Database size={28} aria-hidden="true" />
      <h2>Loading profiles</h2>
      <p>Checking browser-saved profiles for museum items.</p>
    </section>
  );
}

export function MuseumEmptySnapshot({
  EmptyIcon,
  title,
  body,
}: {
  EmptyIcon: ElementType;
  title: string;
  body: string;
}) {
  return (
    <section className={styles.museumEmpty}>
      <EmptyIcon size={30} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
      <Link href="/profiles#profile-transfer">Import or refresh profile</Link>
    </section>
  );
}
