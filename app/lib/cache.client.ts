const CACHE_PREFIX = "bk-cache:";

interface CacheEntry<T> {
    hash: string;
    data: T;
    timestamp: number;
}

export function getCacheKey(route: string, params?: Record<string, string>): string {
    const paramStr = params
        ? ":" + Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&")
        : "";
    return `${CACHE_PREFIX}${route}${paramStr}`;
}

export function getCache<T>(key: string): CacheEntry<T> | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry = JSON.parse(raw) as CacheEntry<T>;
        // 7 天 TTL
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - entry.timestamp > MAX_AGE) {
            localStorage.removeItem(key);
            return null;
        }
        return entry;
    } catch {
        return null;
    }
}

export function setCache<T>(key: string, hash: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { hash, data, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // localStorage quota 超限，清除舊快取後重試
        clearAllCaches();
        try {
            const entry: CacheEntry<T> = { hash, data, timestamp: Date.now() };
            localStorage.setItem(key, JSON.stringify(entry));
        } catch {
            // 放棄，不影響功能
        }
    }
}

export function clearAllCaches(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            keys.push(key);
        }
    }
    keys.forEach(key => localStorage.removeItem(key));
}

export async function fetchDataHash(shareToken?: string): Promise<string | null> {
    try {
        const url = shareToken
            ? `/api/data-hash?shareToken=${encodeURIComponent(shareToken)}`
            : "/api/data-hash";
        const res = await fetch(url);
        if (!res.ok) return null;
        const { hash } = await res.json() as { hash: string | null };
        return hash;
    } catch {
        return null;
    }
}
