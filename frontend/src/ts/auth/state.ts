import { createSignal } from "solid-js";

import type { AuthUser } from "./providers/types";

// written only by the auth system module (auth/system.ts)

export type AuthState = "unknown" | "signedIn" | "signedOut";
/** unknown until the auth provider reports the first auth state (or fails to load). */
export const [getAuthState, setAuthState] = createSignal<AuthState>("unknown");

export const [getUserId, setUserId] = createSignal<string | null>(null);
export const isAuthenticated = (): boolean => getUserId() !== null;
export const [isUserVerified, setUserVerified] = createSignal(false);

/** The signed in user's linked auth methods, empty while signed out. */
export const [getAuthMethods, setAuthMethods] = createSignal<
  AuthUser["methods"]
>([]);

/** Whether the signed in user has this auth method (a third party id, or `"password"`). */
export function isUsingAuthMethod(id: string): boolean {
  return getAuthMethods().some((it) => it.id === id);
}

export function isUsingPasswordAuth(): boolean {
  return isUsingAuthMethod("password");
}

/** The email the signed in user's auth method uses. */
export function getAuthMethodEmail(id: string): string | undefined {
  return getAuthMethods().find((it) => it.id === id)?.email ?? undefined;
}

/** Whether the signed in user could still sign in without this auth method. */
export function hasOtherAuthMethods(id: string): boolean {
  return getAuthMethods().some((it) => it.id !== id);
}
