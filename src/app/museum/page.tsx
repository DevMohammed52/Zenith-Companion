"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  Image as ImageIcon,
  LockKeyhole,
  Package,
  PawPrint,
  Search,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useProfiles } from "@/lib/profiles";
import {
  MUSEUM_CATEGORIES,
  filterMuseumItems,
  museumCategoryLabel,
  sortMuseumItems,
  summarizeMuseum,
  type MuseumCategory,
  type MuseumItem,
  type MuseumSortDirection,
  type MuseumSortKey,
} from "@/lib/museum";

const CATEGORY_ICONS: Record<MuseumCategory | "ALL", typeof Sparkles> = {
  ALL: Database,
  SKINS: UserRound,
  BACKGROUNDS: ImageIcon,
  GUILD_ICONS: Shield,
  PETS: PawPrint,
  COLLECTIBLES: Package,
  BESTIARY: BookOpen,
};

const SORT_OPTIONS: Array<{ key: MuseumSortKey; label: string }> = [
  { key: "category", label: "Category" },
  { key: "name", label: "Name" },
  { key: "quantity", label: "Quantity" },
];

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatDateTime(value?: string) {
  if (!value) return "Not imported yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Import timestamp unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPageList(pages?: number[]) {
  if (!pages?.length) return "None";
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  if (sorted.length <= 6) return sorted.join(", ");
  return `${sorted.slice(0, 5).join(", ")} +${sorted.length - 5}`;
}

function categoryTone(category: MuseumCategory) {
  switch (category) {
    case "SKINS":
      return "violet";
    case "BACKGROUNDS":
      return "cyan";
    case "GUILD_ICONS":
      return "gold";
    case "PETS":
      return "green";
    case "COLLECTIBLES":
      return "amber";
    case "BESTIARY":
      return "rose";
    default:
      return "violet";
  }
}

function museumStatusLabel(status?: string) {
  switch (status) {
    case "imported":
      return "Imported";
    case "partial":
      return "Partial import";
    case "empty":
      return "Imported empty";
    case "private":
      return "Private";
    case "unavailable":
      return "Unavailable";
    default:
      return "Not imported";
  }
}

function museumEmptyState(status?: string) {
  switch (status) {
    case "empty":
      return {
        icon: CheckCircle2,
        title: "Museum snapshot is empty",
        body: "This profile has a museum snapshot, but the import did not include any collection items.",
      };
    case "private":
      return {
        icon: LockKeyhole,
        title: "Museum is private",
        body: "The museum endpoint was not visible for this profile. You can still use the rest of the profile manually.",
      };
    case "unavailable":
      return {
        icon: AlertTriangle,
        title: "Museum unavailable",
        body: "The museum snapshot could not be imported. The saved status is kept so this is not mistaken for missing setup.",
      };
    case "partial":
      return {
        icon: AlertTriangle,
        title: "Partial museum snapshot",
        body: "The import recorded a partial museum result, but no usable collection items were saved.",
      };
    default:
      return {
        icon: Database,
        title: "No museum snapshot for this profile",
        body: "Museum data will appear here after a sanitized museum snapshot is saved for the active profile.",
      };
  }
}

function MuseumItemCard({ item }: { item: MuseumItem }) {
  const Icon = CATEGORY_ICONS[item.category];
  return (
    <article className={`museum-item tone-${categoryTone(item.category)}`}>
      <div className="museum-item-art">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <Icon size={28} aria-hidden="true" />}
      </div>
      <div className="museum-item-body">
        <div>
          <span>{museumCategoryLabel(item.category)}</span>
          <strong>{item.name}</strong>
        </div>
        <small>ID {String(item.id)}</small>
      </div>
      <div className="museum-item-quantity">
        <span>Qty</span>
        <strong>{formatNumber(item.quantity)}</strong>
      </div>
    </article>
  );
}

export default function MuseumPage() {
  const { activeProfile, loaded } = useProfiles();
  const [category, setCategory] = useState<MuseumCategory | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<MuseumSortKey>("category");
  const [sortDirection, setSortDirection] = useState<MuseumSortDirection>("asc");

  const museum = activeProfile?.museum;
  const items = useMemo(() => museum?.items || [], [museum]);
  const summaries = useMemo(() => summarizeMuseum(items), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const visibleItems = useMemo(() => {
    const filtered = filterMuseumItems({ items, category, query });
    return sortMuseumItems(filtered, sortKey, sortDirection);
  }, [category, items, query, sortDirection, sortKey]);

  const activeSummary = category === "ALL"
    ? { itemCount: items.length, totalQuantity }
    : summaries.find((summary) => summary.category === category) || { itemCount: 0, totalQuantity: 0 };

  const hasMuseum = items.length > 0;
  const emptyState = museumEmptyState(museum?.status);
  const EmptyIcon = emptyState.icon;
  const importSource = activeProfile?.importSource;
  const profileSourceTail = importSource?.characterHashTail;
  const sourceTail = museum?.sourceHashTail || profileSourceTail;
  const statusWarnings = [
    ...(museum?.missingOrPrivate || []),
    ...(importSource?.missingOrPrivate || []),
  ];
  const uniqueWarnings = Array.from(new Set(statusWarnings));
  const expectedItemCount = museum?.itemCount || museum?.pagination?.total || 0;
  const hasCountMismatch = Boolean(expectedItemCount && items.length && expectedItemCount !== items.length);
  const coverageText = museum?.pagination
    ? `${formatNumber(museum.pagination.fetchedPages.length)} / ${formatNumber(museum.pagination.lastPage || museum.pageCount || museum.pagination.fetchedPages.length || 0)} pages`
    : museum?.pageCount
      ? `${formatNumber(museum.pageCount)} pages`
      : "No page data";

  return (
    <main className="container museum-page">
      <section className="museum-hero">
        <div className="museum-hero-copy">
          <span className="eyebrow"><Sparkles size={14} aria-hidden="true" /> Museum</span>
          <h1>Collection Vault</h1>
          <p>Browse the museum items saved from your active profile, with category counts, search, and collection quantity totals.</p>
        </div>
        <div className="museum-profile-card" aria-label="Active profile museum source">
          <span>Active Profile</span>
          <strong>{activeProfile?.name || "No profile selected"}</strong>
          <small>{activeProfile?.className || "Create or import a profile first"}</small>
          <div className="museum-profile-links">
            <Link href="/profiles#profile-transfer">Import source</Link>
            <Link href="/pets/owned">Owned pets</Link>
          </div>
        </div>
      </section>

      <section className="museum-source-strip" aria-label="Museum import state">
        <div>
          <Clock3 size={16} aria-hidden="true" />
          <span>Imported</span>
          <strong>{formatDateTime(museum?.importedAt)}</strong>
        </div>
        <div>
          <Database size={16} aria-hidden="true" />
          <span>Game refresh</span>
          <strong>{formatDateTime(museum?.endpointUpdatedAt)}</strong>
        </div>
        <div>
          <UserRound size={16} aria-hidden="true" />
          <span>Character</span>
          <strong>{sourceTail ? `...${sourceTail}` : "Waiting for profile import"}</strong>
        </div>
        <div className={`museum-status status-${museum?.status || "none"}`}>
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>Status</span>
          <strong>{museumStatusLabel(museum?.status)}</strong>
        </div>
        <div>
          <BookOpen size={16} aria-hidden="true" />
          <span>Pages saved</span>
          <strong>{coverageText}</strong>
        </div>
        <div className={museum?.pagination?.failedPages?.length ? "museum-status status-partial" : ""}>
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Pages skipped</span>
          <strong>{formatPageList(museum?.pagination?.failedPages)}</strong>
        </div>
      </section>

      {(museum?.errorMessage || uniqueWarnings.length > 0 || hasCountMismatch) && (
        <section className="museum-warning-strip" aria-label="Museum import notes">
          <AlertTriangle size={17} aria-hidden="true" />
          <div>
            {museum?.errorMessage && <strong>{museum.errorMessage}</strong>}
            {hasCountMismatch && (
              <strong>{formatNumber(items.length)} saved items, {formatNumber(expectedItemCount)} expected from import metadata.</strong>
            )}
            {uniqueWarnings.length > 0 && (
              <p>{uniqueWarnings.join(" / ")}</p>
            )}
          </div>
        </section>
      )}

      {!loaded ? (
        <section className="museum-empty" role="status">
          <Database size={28} aria-hidden="true" />
          <h2>Loading profiles</h2>
          <p>Checking the local profile store for an imported museum snapshot.</p>
        </section>
      ) : !hasMuseum ? (
        <section className="museum-empty">
          <EmptyIcon size={30} aria-hidden="true" />
          <h2>{emptyState.title}</h2>
          <p>{emptyState.body}</p>
          <Link href="/profiles">Open Profiles</Link>
        </section>
      ) : (
        <>
          <section className="museum-summary" aria-label="Museum summary">
            <div className="museum-summary-main">
              <span>Total collected</span>
              <strong>{formatNumber(items.length)}</strong>
              <small>{formatNumber(totalQuantity)} total quantity{expectedItemCount ? ` / ${formatNumber(expectedItemCount)} expected` : ""}</small>
            </div>
            {summaries.map((summary) => {
              const Icon = CATEGORY_ICONS[summary.category];
              return (
                <button
                  key={summary.category}
                  type="button"
                  className={`museum-summary-card ${category === summary.category ? "active" : ""}`}
                  onClick={() => setCategory(summary.category)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{summary.label}</span>
                  <strong>{formatNumber(summary.itemCount)}</strong>
                  <small>{formatNumber(summary.totalQuantity)} qty</small>
                </button>
              );
            })}
          </section>

          <section className="museum-controls" aria-label="Museum filters">
            <div className="museum-search">
              <label htmlFor="museum-search-input">Search</label>
              <div>
                <Search size={16} aria-hidden="true" />
                <input
                  id="museum-search-input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, category, or ID..."
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="museum-segment" aria-label="Category filter">
              <button type="button" className={category === "ALL" ? "active" : ""} onClick={() => setCategory("ALL")}>All</button>
              {MUSEUM_CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={category === option ? "active" : ""}
                  onClick={() => setCategory(option)}
                >
                  {museumCategoryLabel(option)}
                </button>
              ))}
            </div>

            <div className="museum-sort" aria-label="Sort controls">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={sortKey === option.key ? "active" : ""}
                  onClick={() => setSortKey(option.key)}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className="museum-sort-direction"
                onClick={() => setSortDirection((current) => current === "asc" ? "desc" : "asc")}
                aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
              >
                <ArrowDownUp size={15} aria-hidden="true" />
                {sortDirection === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </section>

          <section className="museum-results-header" aria-live="polite">
            <div>
              <span>{category === "ALL" ? "All categories" : museumCategoryLabel(category)}</span>
              <strong>{formatNumber(visibleItems.length)} shown</strong>
            </div>
            <div>
              <span>Selected total</span>
              <strong>{formatNumber(activeSummary.itemCount)} collected / {formatNumber(activeSummary.totalQuantity)} qty</strong>
            </div>
          </section>

          {visibleItems.length ? (
            <section className="museum-grid" aria-label="Museum items">
              {visibleItems.map((item) => (
                <MuseumItemCard key={`${item.category}-${String(item.id)}-${item.name}`} item={item} />
              ))}
            </section>
          ) : (
            <section className="museum-empty compact" role="status">
              <Search size={24} aria-hidden="true" />
              <h2>No matching museum items</h2>
              <p>Adjust the search text or category filter.</p>
            </section>
          )}
        </>
      )}

      <style jsx global>{`
        .museum-page {
          display: grid;
          gap: 1rem;
          max-width: 1480px;
          min-width: 0;
        }

        .museum-hero {
          align-items: stretch;
          background:
            radial-gradient(circle at 14% 0%, rgba(176, 130, 255, 0.2), transparent 36%),
            radial-gradient(circle at 86% 18%, rgba(34, 211, 238, 0.12), transparent 38%),
            linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012));
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
          overflow: hidden;
          padding: clamp(1rem, 2.6vw, 1.6rem);
          position: relative;
        }

        .museum-hero-copy,
        .museum-profile-card,
        .museum-source-strip,
        .museum-empty,
        .museum-summary-main,
        .museum-summary-card,
        .museum-controls,
        .museum-results-header,
        .museum-item {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
        }

        .museum-hero-copy {
          border-color: transparent;
          background: transparent;
          padding: 0.2rem 0;
        }

        .eyebrow {
          align-items: center;
          color: var(--text-accent);
          display: inline-flex;
          font-size: 0.72rem;
          font-weight: 800;
          gap: 0.4rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1 {
          color: #fff;
          font-size: clamp(2rem, 4vw, 3.25rem);
          line-height: 1;
          margin: 0.45rem 0 0.55rem;
        }

        p {
          color: var(--text-muted);
          margin: 0;
          max-width: 680px;
        }

        .museum-profile-card {
          align-content: center;
          display: grid;
          gap: 0.35rem;
          padding: 1rem;
        }

        .museum-profile-card span,
        .museum-source-strip span,
        .museum-summary-main span,
        .museum-summary-card span,
        .museum-results-header span,
        .museum-item-quantity span,
        .museum-item-body span,
        .museum-search label {
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .museum-profile-card strong {
          color: #fff;
          font-size: 1.35rem;
        }

        .museum-profile-card small,
        .museum-source-strip strong,
        .museum-summary-main small,
        .museum-summary-card small,
        .museum-item-body small {
          color: var(--text-muted);
        }

        .museum-profile-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.4rem;
        }

        .museum-profile-links a {
          align-items: center;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          color: #fff;
          display: inline-flex;
          font-size: 0.78rem;
          font-weight: 800;
          min-height: 2rem;
          padding: 0 0.65rem;
          text-decoration: none;
        }

        .museum-profile-links a:hover {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 88%);
        }

        .museum-source-strip {
          display: grid;
          gap: 0.7rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          padding: 0.8rem;
        }

        .museum-source-strip > div {
          align-items: center;
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 7px;
          display: grid;
          gap: 0.2rem 0.55rem;
          grid-template-columns: auto minmax(0, 1fr);
          padding: 0.75rem;
        }

        .museum-source-strip svg {
          color: var(--text-accent);
          grid-row: span 2;
        }

        .museum-source-strip strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .museum-status.status-private svg,
        .museum-status.status-unavailable svg,
        .museum-status.status-partial svg {
          color: var(--text-warning);
        }

        .museum-warning-strip {
          align-items: center;
          background: color-mix(in srgb, var(--text-warning), transparent 92%);
          border: 1px solid color-mix(in srgb, var(--text-warning), transparent 72%);
          border-radius: 8px;
          color: var(--text-warning);
          display: grid;
          gap: 0.75rem;
          grid-template-columns: auto minmax(0, 1fr);
          padding: 0.85rem 1rem;
        }

        .museum-warning-strip strong {
          color: #fff;
          display: block;
          margin-bottom: 0.15rem;
        }

        .museum-warning-strip p {
          max-width: none;
        }

        .museum-empty {
          align-items: center;
          display: grid;
          gap: 0.65rem;
          justify-items: center;
          min-height: 280px;
          padding: 2rem;
          text-align: center;
        }

        .museum-empty.compact {
          min-height: 180px;
        }

        .museum-empty svg {
          color: var(--text-accent);
        }

        .museum-empty h2 {
          color: #fff;
          margin: 0;
        }

        .museum-empty a {
          align-items: center;
          background: color-mix(in srgb, var(--text-accent), transparent 78%);
          border: 1px solid var(--border-focus);
          border-radius: 7px;
          color: #fff;
          display: inline-flex;
          font-weight: 800;
          min-height: 42px;
          padding: 0 1rem;
          text-decoration: none;
        }

        .museum-summary {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: 1.35fr repeat(6, minmax(0, 1fr));
        }

        .museum-summary-main,
        .museum-summary-card {
          display: grid;
          gap: 0.35rem;
          min-width: 0;
          padding: 0.85rem;
          text-align: left;
        }

        .museum-summary-card {
          color: inherit;
          cursor: pointer;
          min-height: 112px;
        }

        .museum-summary-card:hover,
        .museum-summary-card.active {
          border-color: var(--border-focus);
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
        }

        .museum-summary-main strong,
        .museum-summary-card strong,
        .museum-results-header strong {
          color: #fff;
          font-size: 1.35rem;
        }

        .museum-summary-card svg {
          color: var(--text-accent);
        }

        .museum-controls {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: minmax(260px, 1fr) minmax(0, 2fr) minmax(260px, auto);
          padding: 0.9rem;
        }

        .museum-search {
          display: grid;
          gap: 0.45rem;
          min-width: 0;
        }

        .museum-search > div {
          align-items: center;
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          display: flex;
          min-height: 46px;
          position: relative;
        }

        .museum-search svg {
          color: var(--text-muted);
          left: 0.85rem;
          pointer-events: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
        }

        .museum-search input {
          background: transparent;
          border: 0;
          color: #fff;
          font: inherit;
          min-height: 44px;
          min-width: 0;
          outline: none;
          padding: 0 0.85rem 0 2.45rem;
          width: 100%;
        }

        .museum-search > div:focus-within {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 84%);
        }

        .museum-segment,
        .museum-sort {
          align-content: start;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .museum-segment button,
        .museum-sort button {
          align-items: center;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          font-weight: 800;
          gap: 0.35rem;
          min-height: 42px;
          padding: 0 0.8rem;
        }

        .museum-segment button:hover,
        .museum-segment button.active,
        .museum-sort button:hover,
        .museum-sort button.active {
          background: color-mix(in srgb, var(--text-accent), transparent 86%);
          border-color: var(--border-focus);
          color: #fff;
        }

        .museum-sort-direction {
          color: #fff !important;
        }

        .museum-results-header {
          align-items: center;
          display: flex;
          gap: 0.75rem;
          justify-content: space-between;
          padding: 0.85rem 1rem;
        }

        .museum-results-header > div {
          display: grid;
          gap: 0.2rem;
        }

        .museum-results-header > div:last-child {
          text-align: right;
        }

        .museum-grid {
          align-items: start;
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }

        .museum-item {
          align-items: center;
          display: grid;
          gap: 0.75rem;
          grid-template-columns: 68px minmax(0, 1fr) minmax(64px, auto);
          min-height: 104px;
          min-width: 0;
          padding: 0.8rem;
          overflow: hidden;
        }

        .museum-item-art {
          align-items: center;
          background: rgba(0,0,0,0.24);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          display: flex;
          height: 68px;
          justify-content: center;
          overflow: hidden;
          width: 68px;
        }

        .museum-item-art img {
          display: block;
          height: 60px;
          max-height: 60px;
          max-width: 60px;
          object-fit: contain;
          width: 60px;
        }

        .museum-item-body {
          display: grid;
          gap: 0.35rem;
          min-width: 0;
        }

        .museum-item-body div {
          display: grid;
          gap: 0.15rem;
          min-width: 0;
        }

        .museum-item-body strong {
          color: #fff;
          display: block;
          overflow-wrap: anywhere;
          line-height: 1.15;
        }

        .museum-item-quantity {
          background: rgba(0,0,0,0.24);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 7px;
          display: grid;
          gap: 0.2rem;
          min-width: 74px;
          padding: 0.55rem;
          text-align: right;
        }

        .museum-item-quantity strong {
          color: #fff;
        }

        .tone-violet { border-color: rgba(176, 130, 255, 0.18); }
        .tone-cyan { border-color: rgba(34, 211, 238, 0.18); }
        .tone-gold { border-color: rgba(250, 204, 21, 0.18); }
        .tone-green { border-color: rgba(52, 211, 153, 0.18); }
        .tone-amber { border-color: rgba(251, 146, 60, 0.18); }
        .tone-rose { border-color: rgba(251, 113, 133, 0.18); }

        @media (max-width: 1180px) {
          .museum-hero,
          .museum-source-strip,
          .museum-controls {
            grid-template-columns: 1fr;
          }

          .museum-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .museum-summary-main {
            grid-column: 1 / -1;
          }

          .museum-results-header {
            align-items: stretch;
            flex-direction: column;
          }

          .museum-results-header > div:last-child {
            text-align: left;
          }
        }

        @media (max-width: 640px) {
          .museum-page {
            gap: 0.8rem;
          }

          .museum-hero,
          .museum-source-strip,
          .museum-controls,
          .museum-results-header,
          .museum-empty {
            border-radius: 7px;
          }

          .museum-summary {
            grid-template-columns: 1fr;
          }

          .museum-segment,
          .museum-sort {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .museum-segment button,
          .museum-sort button {
            justify-content: center;
            min-width: 0;
            padding: 0 0.45rem;
          }

          .museum-grid {
          grid-template-columns: 1fr;
        }

        .museum-item {
            grid-template-columns: 58px minmax(0, 1fr);
          }

          .museum-item-art {
            height: 58px;
            width: 58px;
          }

          .museum-item-art img {
            height: 52px;
            max-height: 52px;
            max-width: 52px;
            width: 52px;
          }

          .museum-item-quantity {
            grid-column: 1 / -1;
            grid-template-columns: 1fr auto;
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}
