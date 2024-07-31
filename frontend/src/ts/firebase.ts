// Import the functions you need from the SDKs you need
import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, Auth as AuthType, User } from "firebase/auth";
// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
//@ts-ignore
// eslint-disable-next-line import/no-unresolved
import { firebaseConfig } from "./constants/firebase-config";
import * as Notifications from "./elements/notifications";
import { createErrorMessage, isDevEnvironment } from "./utils/misc";

// Initialize Firebase
export let app: FirebaseApp | undefined;
export let Auth: AuthType | undefined;

export function isAuthenticated(): boolean {
  return Auth?.currentUser !== undefined && Auth?.currentUser !== null;
}

export function getAuthenticatedUser(): User {
  const user = Auth?.currentUser;
  if (user === undefined || user === null)
    throw new Error(
      "User authentication is required but no user is logged in."
    );
  return user;
}

try {
  app = initializeApp(firebaseConfig);
  Auth = getAuth(app);
} catch (e) {
  app = undefined;
  Auth = undefined;
  console.error("Authentication failed to initialize", e);
  if (isDevEnvironment()) {
    Notifications.addPSA(
      createErrorMessage(e, "Authentication uninitialized") +
        " Check your firebase-config.ts",
      0,
      undefined,
      false
    );
  }
}
