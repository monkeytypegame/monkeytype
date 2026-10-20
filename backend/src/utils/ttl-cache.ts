/**
 * Creates a caching function that loads data with a specified TTL (Time-to-Live).
 * If the cache has expired (based on TTL), it will re-fetch the data by calling the provided function.
 * Otherwise, it returns the cached value.
 *
 * @template T - The type of the value being cached.
 *
 * @param {number} ttlMs - The Time-to-Live (TTL) in milliseconds. The cache will refetch on call  after this duration.
 * @param {() => Promise<T>} fn - A function that returns a promise resolving to the data to cache.
 *
 * @returns {() => Promise<T | undefined>}
 */
export function cacheWithTTL<T>(
  ttlMs: number,
  fn: () => Promise<T>,
): () => Promise<T | undefined> {
  let lastFetchTime = 0;
  let cache: T | undefined;
  let pending: Promise<T> | undefined;

  return async () => {
    if (pending === undefined && lastFetchTime < Date.now() - ttlMs) {
      lastFetchTime = Date.now();
      pending = fn()
        .then((data) => {
          cache = data;
          return data;
        })
        .finally(() => {
          pending = undefined;
        });
    }
    await pending;
    return cache;
  };
}
