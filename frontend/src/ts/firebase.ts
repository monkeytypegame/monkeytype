// Import the functions you need from the SDKs you need
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  Auth as AuthType,
  User,
  setPersistence as firebaseSetPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  UserCredential,
  AuthProvider,
  onAuthStateChanged,
  indexedDBLocalPersistence,
} from "firebase/auth";
import { firebaseConfig } from "./constants/firebase-config";
import * as Notifications from "./elements/notifications";
import { createErrorMessage, isDevEnvironment } from "./utils/misc";

import {
  Analytics as AnalyticsType,
  getAnalytics as firebaseGetAnalytics,
} from "firebase/analytics";

// Initialize Firebase
let app: FirebaseApp | undefined;
let Auth: AuthType | undefined;

let wasAuthenticated = false;

type ReadyCallback = (success: boolean, user: User | null) => Promise<void>;

let logoutTimout = setTimeout(() => {
  //nothing
}, 0);
export async function init(callback: ReadyCallback): Promise<void> {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    Auth = getAuth(app);

    const rememberMe =
      window.localStorage.getItem("firebasePersistence") === "LOCAL";
    await setPersistence(rememberMe, false);

    onAuthStateChanged(Auth, async (user) => {
      console.log("### authstate", user);
      clearTimeout(logoutTimout);
      if (user === null) {
        if (wasAuthenticated) {
          logoutTimout = setTimeout(() => {
            console.log("auth debounced logout");
            wasAuthenticated = false;
            void callback(true, null);
          }, 5000);
        } else {
          await callback(true, null);
        }
      } else {
        if (wasAuthenticated) {
          return;
        }
        wasAuthenticated = true;
        await callback(true, user);
      }
      console.log("### authstate  done");
    });
  } catch (e) {
    app = undefined;
    Auth = undefined;
    console.error("Authentication failed to initialize", e);
    await callback(false, null);
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
}

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

export function getAnalytics(): AnalyticsType {
  return firebaseGetAnalytics(app);
}

export function isAuthAvailable(): boolean {
  return Auth !== undefined;
}

export async function signOut(): Promise<void> {
  console.log("auth signout");
  await Auth?.signOut();
}

export async function signInWithEmailAndPassword(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  await setPersistence(rememberMe, true);

  const result = await firebaseSignInWithEmailAndPassword(
    Auth,
    email,
    password
  );

  return result;
}

export async function signInWithPopup(
  provider: AuthProvider,
  rememberMe: boolean
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  await setPersistence(rememberMe, true);

  return firebaseSignInWithPopup(Auth, provider);
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  return firebaseCreateUserWithEmailAndPassword(Auth, email, password);
}

async function setPersistence(
  rememberMe: boolean,
  store = false
): Promise<void> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  const persistence = rememberMe
    ? indexedDBLocalPersistence
    : browserSessionPersistence;

  if (store) {
    window.localStorage.setItem(
      "firebasePersistence",
      rememberMe ? "LOCAL" : "SESSION"
    );
  }

  await firebaseSetPersistence(Auth, persistence);
}

window["user"] = getAuthenticatedUser;
