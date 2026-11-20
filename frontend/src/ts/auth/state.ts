import { createSignal } from "solid-js";

export type AuthState = "unknown" | "signedIn" | "signedOut";
/** unknown until Firebase reports the first auth state (or fails to load). */
export const [getAuthState, setAuthState] = createSignal<AuthState>("unknown");

export const [getUserId, setUserId] = createSignal<string | null>(null);
export const isAuthenticated = (): boolean => getUserId() !== null;
