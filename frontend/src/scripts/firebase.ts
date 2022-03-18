// Import the functions you need from the SDKs you need
import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, Auth as AuthType } from "firebase/auth";
import { firebaseConfig } from "./constants/firebase-config"; // eslint-disable-line require-path-exists/exists
import { Analytics as AnalyticsType, getAnalytics } from "firebase/analytics";

// Initialize Firebase
let app: FirebaseApp;

export let Auth: AuthType;
export let Analytics: AnalyticsType;

try {
  app = initializeApp(firebaseConfig);
  Auth = getAuth(app);
  Analytics = getAnalytics(app);
} catch (e) {
  $("body").text(
    "Failed to initialize Firebase. Are you sure you have the correct config in the firebase-config.ts file?"
  );
}
