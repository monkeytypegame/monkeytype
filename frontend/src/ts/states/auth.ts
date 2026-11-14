import { createSignal } from "solid-js";

// written only by the auth provider module (auth/provider.ts)

export type AuthState = "unknown" | "signedIn" | "signedOut";
/** unknown until the auth provider reports the first auth state (or fails to load). */
export const [getAuthState, setAuthState] = createSignal<AuthState>("unknown");

export const [getUserId, setUserId] = createSignal<string | null>(null);
export const isAuthenticated = (): boolean => getUserId() !== null;
export const [isUserVerified, setUserVerified] = createSignal(false);
