import admin from "firebase-admin";

export async function verifyIdToken(idToken) {
  return await admin.auth().verifyIdToken(idToken, true);
}

export async function updateAuthEmail(uid, email) {
  return await admin.auth().updateUser(uid, {
    email,
    emailVerified: false,
  });
}
