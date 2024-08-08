import FirebaseAdmin from "./../init/firebase-admin";
import LRUCache from "lru-cache";
import {
  recordTokenCacheAccess,
  setTokenCacheLength,
  setTokenCacheSize,
} from "./prometheus";
import { type DecodedIdToken, UserRecord } from "firebase-admin/auth";
import { isDevEnvironment } from "./misc";
import emailQueue from "../queues/email-queue";
import * as UserDAL from "../dal/user";

const tokenCache = new LRUCache<string, DecodedIdToken>({
  max: 20000,
  maxSize: 50000000, // 50MB
  sizeCalculation: (token, key): number =>
    JSON.stringify(token).length + key.length, //sizeInBytes
});

const TOKEN_CACHE_BUFFER = 1000 * 60 * 5; // 5 minutes

export async function verifyIdToken(
  idToken: string,
  noCache = false
): Promise<DecodedIdToken> {
  if (noCache) {
    return await FirebaseAdmin().auth().verifyIdToken(idToken, true);
  }

  setTokenCacheLength(tokenCache.size);
  setTokenCacheSize(tokenCache.calculatedSize ?? 0);

  const cached = tokenCache.get(idToken);

  if (cached) {
    const expirationDate = cached.exp * 1000 - TOKEN_CACHE_BUFFER;

    if (expirationDate < Date.now()) {
      recordTokenCacheAccess("hit_expired");
      tokenCache.delete(idToken);
    } else {
      recordTokenCacheAccess("hit");
      return cached;
    }
  } else {
    recordTokenCacheAccess("miss");
  }

  const decoded = await FirebaseAdmin().auth().verifyIdToken(idToken, true);
  tokenCache.set(idToken, decoded);
  return decoded;
}

export async function updateUserEmail(
  uid: string,
  email: string
): Promise<UserRecord> {
  await revokeTokensByUid(uid);
  return await FirebaseAdmin().auth().updateUser(uid, {
    email,
    emailVerified: false,
  });
}

export async function updateUserPassword(
  uid: string,
  password: string
): Promise<UserRecord> {
  await revokeTokensByUid(uid);
  return await FirebaseAdmin().auth().updateUser(uid, {
    password,
  });
}

export async function deleteUser(uid: string): Promise<void> {
  await revokeTokensByUid(uid);
  await FirebaseAdmin().auth().deleteUser(uid);
}

export async function revokeTokensByUid(uid: string): Promise<void> {
  await FirebaseAdmin().auth().revokeRefreshTokens(uid);
  for (const entry of tokenCache.entries()) {
    if (entry[1].uid === uid) {
      tokenCache.delete(entry[0]);
    }
  }
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  try {
    const uid = (await FirebaseAdmin().auth().getUserByEmail(email)).uid;
    const { name } = await UserDAL.getPartialUser(
      uid,
      "request forgot password email",
      ["name"]
    );

    const link = await FirebaseAdmin()
      .auth()
      .generatePasswordResetLink(email, {
        url: isDevEnvironment()
          ? "http://localhost:3000"
          : "https://monkeytype.com",
      });

    await emailQueue.sendForgotPasswordEmail(email, name, link);
  } catch (err) {
    if (err.errorInfo?.code !== "auth/user-not-found") {
      throw err;
    }
  }
}
