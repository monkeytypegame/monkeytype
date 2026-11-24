import {
  FirebaseApp,
  FirebaseOptions,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";

let appPromise: Promise<FirebaseApp> | undefined;

/**
 * The Firebase app, shared by the Firebase auth provider and analytics:
 * initialised on first use (or reused), retried after a failed load.
 */
export async function getFirebaseApp(): Promise<FirebaseApp> {
  appPromise ??= loadApp().catch((e: unknown) => {
    appPromise = undefined;
    throw e;
  });
  return appPromise;
}

async function loadApp(): Promise<FirebaseApp> {
  const { firebaseConfig } = (await import("../constants/firebase-config")) as {
    firebaseConfig: FirebaseOptions;
  };
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}
