// Shared authentication entry point. Firebase remains the default provider.
import type { User, AuthProvider } from "firebase/auth";
import type { Analytics } from "firebase/analytics";
import { envConfig } from "virtual:env-config";
import * as Firebase from "./firebase-provider";
import * as LocalAuth from "./local-auth";
import { promiseWithResolvers } from "./utils/misc";
import { setUserState } from "./firebase-provider";

export type AuthenticatedUser = Pick<
  User,
  "uid" | "email" | "emailVerified" | "providerData"
>;
export function isLocalAuth(): boolean {
  return envConfig.authProvider === "local";
}
export const { promise: authPromise, resolve: resolveAuthPromise } =
  promiseWithResolvers();

export async function init(
  callback: (success: boolean, user: AuthenticatedUser | null) => Promise<void>,
): Promise<void> {
  try {
    if (isLocalAuth()) {
      await LocalAuth.init(async (success, user) => {
        setUserState(user);
        await callback(success, user);
      });
    } else {
      await Firebase.init(callback);
    }
  } catch (error) {
    console.error("Authentication failed to initialize", error);
    setUserState(null);
    await callback(false, null);
  } finally {
    resolveAuthPromise();
  }
}

export function getAuthenticatedUser(): AuthenticatedUser | null {
  return isLocalAuth()
    ? LocalAuth.getAuthenticatedUser()
    : Firebase.getAuthenticatedUser();
}
export function getFirebaseUser(): User | null {
  return Firebase.getAuthenticatedUser();
}
export function isAuthAvailable(): boolean {
  return isLocalAuth()
    ? LocalAuth.isAuthAvailable()
    : Firebase.isAuthAvailable();
}
export async function signOut(): Promise<void> {
  if (isLocalAuth()) await LocalAuth.signOut();
  else await Firebase.signOut();
}
export async function signInWithEmailAndPassword(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<void> {
  if (isLocalAuth()) await LocalAuth.signIn(email, password, rememberMe);
  else await Firebase.signInWithEmailAndPassword(email, password, rememberMe);
}
export async function signInWithPopup(
  provider: AuthProvider,
  rememberMe: boolean,
): Promise<void> {
  if (isLocalAuth()) {
    throw new Error("Social login is disabled on this instance");
  }
  await Firebase.signInWithPopup(provider, rememberMe);
}
export async function getIdToken(): Promise<string | null> {
  return isLocalAuth() ? null : Firebase.getIdToken();
}
export function getAnalytics(): Analytics {
  return Firebase.getAnalytics();
}
export {
  createUserWithEmailAndPassword,
  resetIgnoreAuthCallback,
  setUserState,
} from "./firebase-provider";
