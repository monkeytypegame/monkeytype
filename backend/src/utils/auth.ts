import admin from "firebase-admin";
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return await admin.auth().verifyIdToken(idToken, true);
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
