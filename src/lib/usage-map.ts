let cachedUsageMap: Record<string, unknown> | null = null;
let usageMapPromise: Promise<Record<string, unknown>> | null = null;

export function loadUsageMap<T extends Record<string, unknown> = Record<string, unknown>>() {
  if (cachedUsageMap) return Promise.resolve(cachedUsageMap as T);

  if (!usageMapPromise) {
    usageMapPromise = fetch('/usage-map.json')
      .then((response) => (response.ok ? response.json() : {}))
      .then((payload) => {
        cachedUsageMap = payload && typeof payload === 'object' && !Array.isArray(payload)
          ? payload as Record<string, unknown>
          : {};
        return cachedUsageMap;
      })
      .catch(() => {
        cachedUsageMap = {};
        return cachedUsageMap;
      })
      .finally(() => {
        usageMapPromise = null;
      });
  }

  return usageMapPromise as Promise<T>;
}
