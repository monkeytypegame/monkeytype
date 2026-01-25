type AllTimeCacheKey = {
  mode: string;
  language: string;
};

type CacheEntry = {
  data: unknown[];
  count: number;
  timestamp: number;
};

class AllTimeLeaderboardCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 900_000; // == 15 minutes of TTL

  private getKey({ mode, language }: AllTimeCacheKey): string {
    return `alltime-lb:${mode}:${language}`;
  }

  get(key: AllTimeCacheKey): CacheEntry | null {
    const cacheKey = this.getKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry || Date.now() - entry.timestamp > this.TTL) {
      if (entry) this.cache.delete(cacheKey);
      return null;
    }
    return entry;
  }

  set(key: AllTimeCacheKey, data: unknown[], count: number): void {
    this.cache.set(this.getKey(key), { data, count, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const allTimeLeaderboardCache = new AllTimeLeaderboardCache();
