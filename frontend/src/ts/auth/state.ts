import { createMemo, createRoot, createSignal } from "solid-js";

import type { AuthMethodInfo, AuthUser } from "./providers/types";

// written only by the auth system module (auth/system.ts)

export type AuthState = "unknown" | "signedIn" | "signedOut";
/** unknown until the auth provider reports the first auth state (or fails to load). */
export const [getAuthState, setAuthState] = createSignal<AuthState>("unknown");

/**
 * The signed in user, `null` while signed out. A sign up's new user stays
 * `null` here until the sign up finishes (see `getPendingSignUpUser`).
 */
export const [getAuthUser, setAuthUser] = createSignal<AuthUser | null>(null);

// memos: a linked or unlinked method replaces the user, but mustn't re-run
// what depends on the id alone (eg. the user data load)
const userFields = createRoot(() => ({
  id: createMemo(() => getAuthUser()?.uid ?? null),
  verified: createMemo(() => getAuthUser()?.emailVerified ?? false),
}));

export const getUserId = (): string | null => userFields.id();
export const isAuthenticated = (): boolean => getUserId() !== null;
export const isUserVerified = (): boolean => userFields.verified();

/**
 * A new third party user picking a name: signed in to the auth provider, but
 * signed out here until the sign up finishes (the backend user doesn't exist
 * yet). The sign-up modal opens while it's set.
 */
export const [getPendingSignUpUser, setPendingSignUpUser] = createSignal<
  AuthUser | undefined
>(undefined);

/** Whether auth works: false until the provider starts, and when it fails to. */
export const [isAuthAvailable, setAuthAvailable] = createSignal(false);

/** The auth methods the provider offers, most preferred first. */
export const [getProviderAuthMethods, setProviderAuthMethods] = createSignal<
  readonly AuthMethodInfo[]
>([]);

/** Whether the provider offers password auth. */
export function supportsPassword(): boolean {
  return getProviderAuthMethods().some((it) => it.id === "password");
}

/** The third parties the provider offers, most preferred first. */
export function getThirdParties(): readonly AuthMethodInfo[] {
  return getProviderAuthMethods().filter((it) => it.id !== "password");
}

/** An auth method's name to show. */
export function getAuthMethodDisplay(method: string): string {
  return (
    getProviderAuthMethods().find((it) => it.id === method)?.display ?? method
  );
}

/** Whether the signed in user has this auth method (a third party id, or `"password"`). */
export function isUsingAuthMethod(id: string): boolean {
  return getAuthUser()?.methods.some((it) => it.id === id) ?? false;
}

export function isUsingPasswordAuth(): boolean {
  return isUsingAuthMethod("password");
}

/** The email the signed in user's auth method uses. */
export function getAuthMethodEmail(id: string): string | undefined {
  return getAuthUser()?.methods.find((it) => it.id === id)?.email ?? undefined;
}

/** Whether the signed in user could still sign in without this auth method. */
export function hasOtherAuthMethods(id: string): boolean {
  return getAuthUser()?.methods.some((it) => it.id !== id) ?? false;
}
