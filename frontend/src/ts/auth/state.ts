import { createSignal } from "solid-js";

import type { AuthMethodInfo, AuthUser } from "./providers/types";

// written only by the auth system module (auth/system.ts)

export type AuthState = "unknown" | "signedIn" | "signedOut";
/** unknown until the auth provider reports the first auth state (or fails to load). */
export const [getAuthState, setAuthState] = createSignal<AuthState>("unknown");

export const [getUserId, setUserId] = createSignal<string | null>(null);
export const isAuthenticated = (): boolean => getUserId() !== null;
export const [isUserVerified, setUserVerified] = createSignal(false);

/** Whether auth works: false until the provider starts, and when it fails to. */
export const [isAuthAvailable, setAuthAvailable] = createSignal(false);

/** The auth methods the provider offers, most preferred first. */
export const [getOfferedAuthMethods, setOfferedAuthMethods] = createSignal<
  readonly AuthMethodInfo[]
>([]);

/** Whether the provider offers password auth. */
export function supportsPassword(): boolean {
  return getOfferedAuthMethods().some((it) => it.id === "password");
}

/** The third parties the provider offers, most preferred first. */
export function getThirdParties(): readonly AuthMethodInfo[] {
  return getOfferedAuthMethods().filter((it) => it.id !== "password");
}

/** An auth method's name to show. */
export function getAuthMethodDisplay(method: string): string {
  return (
    getOfferedAuthMethods().find((it) => it.id === method)?.display ?? method
  );
}

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
