import Link from "next/link";
import { Compass, Home, PackageSearch, UsersRound } from "lucide-react";
import styles from "./not-found.module.css";

const quickLinks = [
  {
    href: "/items",
    label: "Item database",
    description: "Search items, drops, recipes, and market references.",
    icon: PackageSearch,
  },
  {
    href: "/profiles",
    label: "Profiles",
    description: "Review local profiles or import a fresh snapshot.",
    icon: UsersRound,
  },
  {
    href: "/map",
    label: "World map",
    description: "Jump back into locations, routes, and world data.",
    icon: Compass,
  },
];

export default function NotFound() {
  return (
    <main className={styles.notFound}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <div className={styles.code}>404</div>
        <div className={styles.copy}>
          <p className={styles.kicker}>Route not found</p>
          <h1 id="not-found-title">This page is outside the map.</h1>
          <p>
            The link may be old, mistyped, or pointed at data that is no longer
            public. Use the main tools or global search to get back to a known
            route.
          </p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/">
            <Home aria-hidden="true" size={18} />
            Dashboard
          </Link>
          <Link className={styles.secondaryAction} href="/items">
            <PackageSearch aria-hidden="true" size={18} />
            Search items
          </Link>
        </div>
      </section>

      <nav className={styles.quickLinks} aria-label="Useful pages">
        {quickLinks.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className={styles.quickLink}>
            <Icon aria-hidden="true" size={20} />
            <span>
              <strong>{label}</strong>
              <em>{description}</em>
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
