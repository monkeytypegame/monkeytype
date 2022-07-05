export function cache<T extends unknown[], U>(
  fn: (...args: T) => U,
  options = {
    cacheDurationMilliseconds: 30000,
  }
): (...args: T) => U {
  let cacheTimestamp = Date.now();
  const cache = new Map();

  const isCacheExpired = (): boolean => {
    if (cacheTimestamp === null) {
      return true;
    }

    if (Date.now() > cacheTimestamp + options.cacheDurationMilliseconds) {
      return true;
    }

    return false;
  };

  const cachedFn = (...args: T): U => {
    if (isCacheExpired()) {
      cache.clear();
    }

    const cacheKey = JSON.stringify(args);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = fn(...args);

    cache.set(cacheKey, result);
    cacheTimestamp = Date.now();

    return result;
  };

  return cachedFn;
}
