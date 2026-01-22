import { getConnection } from "../init/redis";

const CACHE_PREFIX = "cache:";
const TTL = 300; // == 5 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getConnection();
  if (!redis) return null;

  try {
    const data = await redis.get(`${CACHE_PREFIX}${key}`);
    if (data === null || data === undefined || data === "") return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  const redis = getConnection();
  if (!redis) return;

  try {
    await redis.setex(`${CACHE_PREFIX}${key}`, TTL, JSON.stringify(data));
  } catch (err) {
    console.error("Cache set failed:", err);
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  const redis = getConnection();
  if (!redis) return;

  try {
    const keys = await redis.keys(`${CACHE_PREFIX}user:profile:${userId}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }
}