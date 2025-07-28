// Import the functions you need from the SDKs you need
import {
  FirebaseApp,
  FirebaseError,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  getAuth,
  Auth as AuthType,
  User,
  setPersistence as firebaseSetPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  getIdToken as firebaseGetIdToken,
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
import { tryCatch } from "@monkeytype/util/trycatch";

// Initialize Firebase
let app: FirebaseApp | undefined;
let Auth: AuthType | undefined;

type ReadyCallback = (success: boolean, user: User | null) => Promise<void>;

export async function init(callback: ReadyCallback): Promise<void> {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    Auth = getAuth(app);

    const rememberMe =
      window.localStorage.getItem("firebasePersistence") === "LOCAL";
    await setPersistence(rememberMe, false);

    onAuthStateChanged(Auth, async (user) => {
      await callback(true, user);
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

  const { data: result, error } = await tryCatch(
    firebaseSignInWithEmailAndPassword(Auth, email, password)
  );
  if (error !== null) {
    console.error(error);
    throw translateFirebaseError(
      error,
      "Failed to sign in with email and password"
    );
  }

  return result;
}

export async function signInWithPopup(
  provider: AuthProvider,
  rememberMe: boolean
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  await setPersistence(rememberMe, true);

  const { data: result, error } = await tryCatch(
    firebaseSignInWithPopup(Auth, provider)
  );
  if (error !== null) {
    console.log(error);
    throw translateFirebaseError(error, "Failed to sign in with popup");
  }
  return result;
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  return firebaseCreateUserWithEmailAndPassword(Auth, email, password);
}

export async function getIdToken(): Promise<string> {
  return firebaseGetIdToken(await getAuthenticatedUser());
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

function translateFirebaseError(
  error: Error | FirebaseError,
  defaultMessage: string
): Error {
  let message = createErrorMessage(error, defaultMessage);

  if (error instanceof FirebaseError) {
    if (error.code === "auth/wrong-password") {
      message = "Incorrect password";
    } else if (error.code === "auth/user-not-found") {
      message = "User not found";
    } else if (error.code === "auth/invalid-email") {
      message =
        "Invalid email format (make sure you are using your email to login - not your username)";
    } else if (error.code === "auth/invalid-credential") {
      message =
        "Email/password is incorrect or your account does not have password authentication enabled.";
    } else if (error.code === "auth/popup-closed-by-user") {
      message = "";
      // message = "Popup closed by user";
      // return;
    } else if (error.code === "auth/popup-blocked") {
      message =
        "Sign in popup was blocked by the browser. Check the address bar for a blocked popup icon, or update your browser settings to allow popups.";
    } else if (error.code === "auth/user-cancelled") {
      message = "";
      // message = "User refused to sign in";
      // return;
    } else if (error.code === "auth/account-exists-with-different-credential") {
      message =
        "Account already exists, but its using a different authentication method. Try signing in with a different method";
    }
  }

  return new Error(message, { cause: error });
}
