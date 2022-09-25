import admin from "firebase-admin";
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import LRUCache from "lru-cache";
import {
  recordTokenCacheAccess,
  setTokenCacheLength,
  // setTokenCacheSize,
} from "./prometheus";

const tokenCache = new LRUCache<string, DecodedIdToken>({
  max: 20000,
  // maxSize: 20000000, // 20MB
  // sizeCalculation: (token, key): number =>
  // JSON.stringify(token).length + key.length, //sizeInBytes
});

const TOKEN_CACHE_BUFFER = 1000 * 60 * 5; // 5 minutes

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  setTokenCacheLength(tokenCache.size);
  // setTokenCacheSize(tokenCache.calculatedSize ?? 0);

  const cached = tokenCache.get(idToken);

  if (cached) {
    const expirationDate = (cached.exp - TOKEN_CACHE_BUFFER) * 1000;

    if (expirationDate > Date.now()) {
      recordTokenCacheAccess("hit_expired");
      tokenCache.delete(idToken);
    } else {
      recordTokenCacheAccess("hit");
      return cached;
    }
  }
  recordTokenCacheAccess("miss");

  const decoded = await admin.auth().verifyIdToken(idToken, true);
  tokenCache.set(idToken, decoded);
  return decoded;
}

export async function updateUserEmail(
  uid: string,
  email: string
): Promise<UserRecord> {
  return await admin.auth().updateUser(uid, {
    email,
    emailVerified: false,
  });
}
