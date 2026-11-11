interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const memoryCache = new Map<string, CacheEntry>();

export interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
  cacheTtlMs?: number;
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const retries = options.retries ?? 1;
  const cacheTtlMs = options.cacheTtlMs ?? 0;

  if (cacheTtlMs > 0) {
    const hit = memoryCache.get(url);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
      }
      const json = (await response.json()) as T;
      if (cacheTtlMs > 0) {
        memoryCache.set(url, { expiresAt: Date.now() + cacheTtlMs, value: json });
      }
      return json;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  const message = lastError instanceof Error ? lastError.message : "Request failed";
  throw new Error(message);
}

export function clearFetchCache(): void {
  memoryCache.clear();
}
