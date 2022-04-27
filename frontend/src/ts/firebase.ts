// Import the functions you need from the SDKs you need
import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, Auth as AuthType } from "firebase/auth";
import { firebaseConfig } from "./constants/firebase-config"; // eslint-disable-line require-path-exists/exists

// Initialize Firebase
export let app: FirebaseApp;
export let Auth: AuthType;

try {
  app = initializeApp(firebaseConfig);
  Auth = getAuth(app);
} catch (e) {
  console.error(e);
  $("body").text(
    "Failed to initialize Firebase. Are you sure you have the correct config in the firebase-config.ts file?"
  );
}
