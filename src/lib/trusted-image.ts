const TRUSTED_REMOTE_IMAGE_HOST = "cdn.idle-mmo.com";

const TRUSTED_REMOTE_IMAGE_PATH_PREFIXES = [
  "/cdn-cgi/image/",
  "/global/",
  "/skins/",
  "/uploaded/",
];

export function getTrustedGameImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 1000) return "";

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "";
  }

  if (url.protocol !== "https:" || url.hostname !== TRUSTED_REMOTE_IMAGE_HOST) {
    return "";
  }

  return TRUSTED_REMOTE_IMAGE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
    ? trimmed
    : "";
}

export function isTrustedGameImageUrl(value: unknown): boolean {
  return Boolean(getTrustedGameImageUrl(value));
}

export function getTrustedCssImageUrl(value: unknown): string {
  const trustedUrl = getTrustedGameImageUrl(value);
  if (!trustedUrl) return "";

  return `url("${trustedUrl.replace(/["\\]/g, "\\$&")}")`;
}
