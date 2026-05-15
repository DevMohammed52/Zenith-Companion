export const MUSEUM_CATEGORIES = [
  "SKINS",
  "BACKGROUNDS",
  "GUILD_ICONS",
  "PETS",
  "COLLECTIBLES",
  "BESTIARY",
] as const;

export type MuseumCategory = typeof MUSEUM_CATEGORIES[number];

export type MuseumItemId = string | number;

export type MuseumItem = {
  category: MuseumCategory;
  id: MuseumItemId;
  name: string;
  quantity: number;
  imageUrl: string;
};

export type MuseumSnapshotStatus = "imported" | "empty" | "private" | "unavailable" | "partial";

export type ProfileMuseumSnapshot = {
  status: MuseumSnapshotStatus;
  sourceHashTail?: string;
  importedAt?: string;
  endpointUpdatedAt?: string;
  pageCount?: number;
  itemCount?: number;
  pagination?: {
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
    total?: number;
    fetchedPages: number[];
    failedPages: number[];
  };
  missingOrPrivate: string[];
  errorMessage?: string;
  items: MuseumItem[];
};

export type MuseumCategorySummary = {
  category: MuseumCategory;
  label: string;
  itemCount: number;
  totalQuantity: number;
};

export type MuseumSortKey = "category" | "name" | "quantity";
export type MuseumSortDirection = "asc" | "desc";

const CATEGORY_LABELS: Record<MuseumCategory, string> = {
  SKINS: "Skins",
  BACKGROUNDS: "Backgrounds",
  GUILD_ICONS: "Guild Icons",
  PETS: "Pets",
  COLLECTIBLES: "Collectibles",
  BESTIARY: "Bestiary",
};

const MUSEUM_STATUS_VALUES = new Set<MuseumSnapshotStatus>([
  "imported",
  "empty",
  "private",
  "unavailable",
  "partial",
]);

function cleanDateString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? value : undefined;
}

function cleanStringList(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => typeof entry === "string" ? entry.trim() : "")
    .filter(Boolean)
    .slice(0, limit)
    .map((entry) => entry.slice(0, 120));
}

export function isMuseumCategory(value: unknown): value is MuseumCategory {
  return typeof value === "string" && MUSEUM_CATEGORIES.includes(value as MuseumCategory);
}

export function museumCategoryLabel(category: MuseumCategory | "ALL") {
  if (category === "ALL") return "All";
  return CATEGORY_LABELS[category];
}

export function sanitizeMuseumItem(input: unknown): MuseumItem | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const category = record.category;
  const id = record.id;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const quantity = Math.max(0, Math.floor(Number(record.quantity || 0)));
  const imageUrl = typeof record.imageUrl === "string"
    ? record.imageUrl
    : typeof record.image_url === "string"
      ? record.image_url
      : "";

  if (!isMuseumCategory(category) || !name || (typeof id !== "string" && typeof id !== "number")) return null;

  return {
    category,
    id,
    name: name.slice(0, 120),
    quantity,
    imageUrl,
  };
}

export function sanitizeMuseumSnapshot(input: unknown): ProfileMuseumSnapshot | undefined {
  if (!input || typeof input !== "object") return undefined;
  const record = input as Record<string, unknown>;
  const items = Array.isArray(record.items)
    ? record.items.map(sanitizeMuseumItem).filter((item): item is MuseumItem => Boolean(item))
    : [];
  const rawStatus = record.status;
  const status = MUSEUM_STATUS_VALUES.has(rawStatus as MuseumSnapshotStatus)
    ? rawStatus as MuseumSnapshotStatus
    : items.length
      ? "imported"
      : "empty";

  if (!items.length && status === "imported") return undefined;
  const pagination = record.pagination && typeof record.pagination === "object"
    ? record.pagination as Record<string, unknown>
    : {};
  const fetchedPages = Array.isArray(pagination.fetchedPages)
    ? pagination.fetchedPages.map((page) => Math.floor(Number(page))).filter((page) => page > 0)
    : [];
  const failedPages = Array.isArray(pagination.failedPages)
    ? pagination.failedPages.map((page) => Math.floor(Number(page))).filter((page) => page > 0)
    : [];

  return {
    status,
    sourceHashTail: typeof record.sourceHashTail === "string" ? record.sourceHashTail.slice(-12) : undefined,
    importedAt: cleanDateString(record.importedAt),
    endpointUpdatedAt: cleanDateString(record.endpointUpdatedAt),
    pageCount: Math.max(0, Math.floor(Number(record.pageCount || 0))) || undefined,
    itemCount: Math.max(0, Math.floor(Number(record.itemCount || items.length))) || items.length,
    pagination: pagination && Object.keys(pagination).length ? {
      currentPage: Math.max(1, Math.floor(Number(pagination.currentPage || pagination.current_page || 0))) || undefined,
      lastPage: Math.max(1, Math.floor(Number(pagination.lastPage || pagination.last_page || 0))) || undefined,
      perPage: Math.max(1, Math.floor(Number(pagination.perPage || pagination.per_page || 0))) || undefined,
      total: Math.max(0, Math.floor(Number(pagination.total || 0))) || undefined,
      fetchedPages,
      failedPages,
    } : undefined,
    missingOrPrivate: cleanStringList(record.missingOrPrivate),
    errorMessage: typeof record.errorMessage === "string" ? record.errorMessage.trim().slice(0, 180) : undefined,
    items,
  };
}

export function parseMuseumEndpointPage(input: unknown): {
  items: MuseumItem[];
  currentPage: number;
  lastPage: number;
  total: number;
} {
  const record = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const pagination = record.pagination && typeof record.pagination === "object"
    ? record.pagination as Record<string, unknown>
    : {};

  return {
    items: Array.isArray(record.items)
      ? record.items.map(sanitizeMuseumItem).filter((item): item is MuseumItem => Boolean(item))
      : [],
    currentPage: Math.max(1, Number(pagination.current_page || 1)),
    lastPage: Math.max(1, Number(pagination.last_page || 1)),
    total: Math.max(0, Number(pagination.total || 0)),
  };
}

export function summarizeMuseum(items: MuseumItem[]): MuseumCategorySummary[] {
  return MUSEUM_CATEGORIES.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    return {
      category,
      label: museumCategoryLabel(category),
      itemCount: categoryItems.length,
      totalQuantity: categoryItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}

export function filterMuseumItems({
  items,
  category,
  query,
}: {
  items: MuseumItem[];
  category: MuseumCategory | "ALL";
  query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "ALL" && item.category !== category) return false;
    if (!normalizedQuery) return true;
    return [
      item.name,
      item.category,
      museumCategoryLabel(item.category),
      String(item.id),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export function sortMuseumItems(items: MuseumItem[], key: MuseumSortKey, direction: MuseumSortDirection) {
  const sorted = [...items].sort((a, b) => {
    if (key === "quantity") return a.quantity - b.quantity;
    if (key === "category") {
      const categoryDiff = MUSEUM_CATEGORIES.indexOf(a.category) - MUSEUM_CATEGORIES.indexOf(b.category);
      if (categoryDiff !== 0) return categoryDiff;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
  });

  return direction === "desc" ? sorted.reverse() : sorted;
}
