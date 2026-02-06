type AllTimeCacheKey = {
  mode: string;
  language: string;
  mode2: string;
};

type CacheEntry = {
  data: unknown[];
  count: number;
};

class AllTimeLeaderboardCache {
  private cache = new Map<string, CacheEntry>();

  private getKey({ mode, language, mode2 }: AllTimeCacheKey): string {
    return `alltime-lb:${mode}:${language}:${mode2}`;
  }

  get(key: AllTimeCacheKey): CacheEntry | null {
    const cacheKey = this.getKey(key);
    const entry = this.cache.get(cacheKey);
    return entry ?? null;
  }

  set(key: AllTimeCacheKey, data: unknown[], count: number): void {
    this.cache.set(this.getKey(key), { data, count });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const allTimeLeaderboardCache = new AllTimeLeaderboardCache();