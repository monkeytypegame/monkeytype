import {
  FirebaseApp,
  FirebaseError,
  FirebaseOptions,
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
  getAdditionalUserInfo,
} from "firebase/auth";
import {
  createErrorMessage,
  isDevEnvironment,
  promiseWithResolvers,
} from "./utils/misc";

import {
  Analytics as AnalyticsType,
  getAnalytics as firebaseGetAnalytics,
} from "firebase/analytics";
import { tryCatch } from "@monkeytype/util/trycatch";
import { dispatch as dispatchSignUpEvent } from "./observables/google-sign-up-event";
import { addBanner } from "./stores/banners";
import { setUserId } from "./signals/core";

let app: FirebaseApp | undefined;
let Auth: AuthType | undefined;

/**
 * ignore auth callback. This is used during signup with google/github where we need to create the user on the backend first.
 */
let ignoreAuthCallback: boolean = false;

type ReadyCallback = (success: boolean, user: User | null) => Promise<void>;
let readyCallback: ReadyCallback | undefined;

const { promise: authPromise, resolve: resolveAuthPromise } =
  promiseWithResolvers();

export async function init(callback: ReadyCallback): Promise<void> {
  try {
    let firebaseConfig: FirebaseOptions | null;

    const constants = import.meta.glob("./constants/firebase-config.ts");
    const loader = constants["./constants/firebase-config.ts"];
    if (loader) {
      firebaseConfig = ((await loader()) as { firebaseConfig: FirebaseOptions })
        .firebaseConfig;
    } else {
      throw new Error(
        "No config file found. Make sure frontend/src/ts/constants/firebase-config.ts exists",
      );
    }

    readyCallback = callback;
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    Auth = getAuth(app);

    const rememberMe =
      window.localStorage.getItem("firebasePersistence") === "LOCAL";
    await setPersistence(rememberMe, false);

    onAuthStateChanged(Auth, async (user) => {
      if (!ignoreAuthCallback) {
        await callback(true, user);
        setUserId(user?.uid ?? null);
      }
    });
  } catch (e) {
    app = undefined;
    Auth = undefined;
    console.error("Firebase failed to initialize", e);
    await callback(false, null);
    setUserId(null);
    if (isDevEnvironment()) {
      addBanner({
        level: "notice",
        text: "Dev Info: Firebase failed to initialize",
        icon: "fas fa-exclamation-triangle",
      });
    }
  } finally {
    resolveAuthPromise();
  }
}

export function isAuthenticated(): boolean {
  return Auth?.currentUser !== undefined && Auth?.currentUser !== null;
}

/**
 *
 * @returns the current user if authenticated, else `null`
 */
export function getAuthenticatedUser(): User | null {
  return Auth?.currentUser ?? null;
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
  rememberMe: boolean,
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  await setPersistence(rememberMe, true);

  const { data: result, error } = await tryCatch(
    firebaseSignInWithEmailAndPassword(Auth, email, password),
  );
  if (error !== null) {
    console.error(error);
    throw translateFirebaseError(
      error,
      "Failed to sign in with email and password",
    );
  }

  return result;
}

export async function signInWithPopup(
  provider: AuthProvider,
  rememberMe: boolean,
): Promise<void> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  await setPersistence(rememberMe, true);
  ignoreAuthCallback = true;

  const { data: signedInUser, error } = await tryCatch(
    firebaseSignInWithPopup(Auth, provider),
  );
  if (error !== null) {
    ignoreAuthCallback = false;
    console.log(error);
    throw translateFirebaseError(error, "Failed to sign in with popup");
  }
  const additionalUserInfo = getAdditionalUserInfo(signedInUser);
  if (additionalUserInfo?.isNewUser) {
    dispatchSignUpEvent(signedInUser, true);
  } else {
    ignoreAuthCallback = false;
    await readyCallback?.(true, signedInUser.user);
  }
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  ignoreAuthCallback = true;
  const result = await firebaseCreateUserWithEmailAndPassword(
    Auth,
    email,
    password,
  );

  return result;
}

export async function getIdToken(): Promise<string | null> {
  const user = getAuthenticatedUser();
  if (user === null) return null;
  return firebaseGetIdToken(user);
}
async function setPersistence(
  rememberMe: boolean,
  store = false,
): Promise<void> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  const persistence = rememberMe
    ? indexedDBLocalPersistence
    : browserSessionPersistence;

  if (store) {
    window.localStorage.setItem(
      "firebasePersistence",
      rememberMe ? "LOCAL" : "SESSION",
    );
  }

  await firebaseSetPersistence(Auth, persistence);
}

function translateFirebaseError(
  error: Error | FirebaseError,
  defaultMessage: string,
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

export function resetIgnoreAuthCallback(): void {
  ignoreAuthCallback = false;
}

export { authPromise };
