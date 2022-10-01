// Import the functions you need from the SDKs you need
import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, Auth as AuthType } from "firebase/auth";
import { firebaseConfig } from "./constants/firebase-config"; // eslint-disable-line require-path-exists/exists
import * as Notifications from "./elements/notifications";
import { createErrorMessage } from "./utils/misc";

// Initialize Firebase
export let app: FirebaseApp | undefined;
export let Auth: AuthType | undefined;

try {
  app = initializeApp(firebaseConfig);
  Auth = getAuth(app);
} catch (e) {
  app = undefined;
  Auth = undefined;
  console.error("Authentication failed to initialize", e);
  if (window.location.hostname === "localhost") {
    Notifications.addBanner(
      createErrorMessage(e, "Authentication uninitialized") +
        " Check your firebase-config.ts",
      0,
      undefined,
      false
    );
  }
}
