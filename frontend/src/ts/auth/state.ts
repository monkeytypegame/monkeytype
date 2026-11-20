import { createSignal } from "solid-js";

import type { AuthUser } from "./providers/types";

// written only by the auth session module (auth/session.ts)

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
