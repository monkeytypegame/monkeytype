import FirebaseAdmin from "./../init/firebase-admin";
import { LRUCache } from "lru-cache";
import {
  recordTokenCacheAccess,
  setTokenCacheLength,
  setTokenCacheSize,
} from "./prometheus";
import { type DecodedIdToken } from "firebase-admin/auth";
import { getFrontendUrl } from "./misc";
import emailQueue from "../queues/email-queue";
import * as UserDAL from "../dal/user";
import { isFirebaseError } from "./error";
import { isLocalAuth } from "./auth-provider";
import * as LocalAuth from "../services/local-auth";

const tokenCache = new LRUCache<string, DecodedIdToken>({
  max: 20000,
  maxSize: 50000000, // 50MB
  sizeCalculation: (token, key): number =>
    JSON.stringify(token).length + key.length, //sizeInBytes
});

const TOKEN_CACHE_BUFFER = 1000 * 60 * 5; // 5 minutes

export async function verifyIdToken(
  idToken: string,
  noCache = false,
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
  email: string,
): Promise<void> {
  if (isLocalAuth()) return LocalAuth.updateEmail(uid, email);
  await revokeTokensByUid(uid);
  await FirebaseAdmin().auth().updateUser(uid, {
    email,
    emailVerified: false,
  });
}

export async function updateUserPassword(
  uid: string,
  password: string,
): Promise<void> {
  if (isLocalAuth()) return LocalAuth.updatePassword(uid, password);
  await revokeTokensByUid(uid);
  await FirebaseAdmin().auth().updateUser(uid, {
    password,
  });
}

export async function deleteUser(uid: string): Promise<void> {
  if (isLocalAuth()) return LocalAuth.deleteUser(uid);
  await revokeTokensByUid(uid);
  await FirebaseAdmin().auth().deleteUser(uid);
}

export async function revokeTokensByUid(uid: string): Promise<void> {
  if (isLocalAuth()) return LocalAuth.revokeSessions(uid);
  await FirebaseAdmin().auth().revokeRefreshTokens(uid);
  for (const entry of tokenCache.entries()) {
    if (entry[1].uid === uid) {
      tokenCache.delete(entry[0]);
    }
  }
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  if (isLocalAuth()) {
    throw new Error(
      "Contact your instance administrator to reset your password",
    );
  }
  try {
    const uid = (await FirebaseAdmin().auth().getUserByEmail(email)).uid;
    const { name } = await UserDAL.getPartialUser(
      uid,
      "request forgot password email",
      ["name"],
    );

    const link = await FirebaseAdmin()
      .auth()
      .generatePasswordResetLink(email, { url: getFrontendUrl() });

    await emailQueue.sendForgotPasswordEmail(email, name, link);
  } catch (err) {
    if (isFirebaseError(err) && err.errorInfo.code !== "auth/user-not-found") {
      // oxlint-disable-next-line only-throw-error
      throw err;
    }
  }
}
