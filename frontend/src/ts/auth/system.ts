import { batch } from "solid-js";
import { addBanner } from "../states/banners";
import {
  isAuthAvailable,
  setAuthAvailable,
  setAuthState,
  setAuthUser,
  setPendingSignUpUser,
  setProviderAuthMethods,
} from "./state";
import { isDevEnvironment } from "../utils/env";

import {
  AuthProvider,
  AuthUser,
  SignInOptions,
  SignInResult,
} from "./providers/types";

/** The provider boot picked. */
let provider: AuthProvider | undefined;

/**
 * Hold back the provider's user changes: set while a sign in is deciding
 * whether the user is new, and during a sign up, which signs in before the
 * backend user exists. Cleared by `finishSignUp` and `cancelSignUp`.
 */
let holdUserChanges = false;

/**
 * Starts the provider; resolves once it reported the first auth state, or
 * failed to start (auth is then unavailable).
 */
export async function initAuth(authProvider: AuthProvider): Promise<void> {
  provider = authProvider;
  setProviderAuthMethods(authProvider.methods);
  setAuthAvailable(true);
  try {
    // a provider nobody can sign in with is misconfigured
    if (authProvider.methods.length === 0) {
      throw new Error("The auth provider offers no auth methods");
    }
    await authProvider.init((user, info) => {
      if (holdUserChanges) return;
      if (user !== null && info?.isNewUser === true) {
        // a redirect sign up: signed in before the backend user exists
        startThirdPartySignUp(user);
        return;
      }
      setUserState(user);
    });
  } catch (e) {
    setAuthAvailable(false);
    console.error("Auth provider failed to initialize", e);
    setUserState(null);
    if (isDevEnvironment()) {
      addBanner({
        level: "notice",
        text: "Dev Info: Auth provider failed to initialize",
        icon: "fas fa-exclamation-triangle",
      });
    }
  }
}

/**
 * The provider, `undefined` while auth is unavailable; `required` throws
 * instead.
 */
function getAuthProvider(required: true): AuthProvider;
function getAuthProvider(required?: false): AuthProvider | undefined;
function getAuthProvider(required = false): AuthProvider | undefined {
  const started = isAuthAvailable() ? provider : undefined;
  if (required && started === undefined) {
    throw new Error("Authentication uninitialized");
  }
  return started;
}

/**
 * The provider's signed in user. During a sign up it is signed in here but
 * not yet in the app (`auth/state`).
 */
export function getProviderUser(): AuthUser | null {
  return getAuthProvider()?.getUser() ?? null;
}

export async function getIdToken(): Promise<string | null> {
  return (await getAuthProvider()?.getToken()) ?? null;
}

export async function signOutOfProvider(): Promise<void> {
  console.log("auth signout");
  await getAuthProvider()?.signOut();
}

/**
 * Signs in with a password or a third party. A new (third party) user becomes
 * the pending sign-up user, still signed out.
 */
export async function signInToProvider(options: SignInOptions): Promise<void> {
  const authProvider = getAuthProvider(true);
  holdUserChanges = true;
  let result: SignInResult;
  try {
    result = await authProvider.signIn(options);
  } catch (e) {
    holdUserChanges = false;
    throw e;
  }
  if (result.isNewUser) {
    startThirdPartySignUp(result.user);
  } else {
    holdUserChanges = false;
    setUserState(result.user);
  }
}

/** Holds the new user back while it picks a name (the sign-up modal). */
function startThirdPartySignUp(user: AuthUser): void {
  holdUserChanges = true;
  setPendingSignUpUser(user);
}

/** Stays signed out until `finishSignUp`. */
export async function createProviderUser(options: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthUser> {
  const authProvider = getAuthProvider(true);
  holdUserChanges = true;
  return authProvider.createUser(options);
}

/**
 * Signs in the user a sign up just created (the provider's current user): its
 * user changes were held back while the sign up created the user on the
 * backend.
 */
export function finishSignUp(): void {
  holdUserChanges = false;
  batch(() => {
    setPendingSignUpUser(undefined);
    setUserState(getProviderUser());
  });
}

/**
 * Ends a sign up that won't finish (failed or cancelled): listens to user
 * changes again and signs out of the provider. The app never saw the user sign
 * in, so its own sign out would do nothing.
 */
export async function cancelSignUp(): Promise<void> {
  holdUserChanges = false;
  setPendingSignUpUser(undefined);
  await getAuthProvider()?.signOut();
}

/** Deletes the signed in user from the auth provider. */
export async function deleteProviderUser(): Promise<void> {
  await getAuthProvider(true).deleteUser();
}

/** Proves the user is present before a sensitive change. */
export async function reauthenticateWithProvider(
  options: Parameters<AuthProvider["reauthenticate"]>[0],
): Promise<void> {
  await getAuthProvider(true).reauthenticate(options);
}

/**
 * Links an auth method; password auth's email becomes the account's email.
 */
export async function linkMethod(
  options: Parameters<AuthProvider["addMethod"]>[0],
): Promise<void> {
  await getAuthProvider(true).addMethod(options);
  refreshUserState();
}

/** Unlinks an auth method: `"password"`, or a third party id. */
export async function unlinkMethod(method: string): Promise<void> {
  await getAuthProvider(true).removeMethod(method);
  refreshUserState();
}

/** Rewrites the auth signals after the signed in user changed in place. */
function refreshUserState(): void {
  if (holdUserChanges) return;
  setUserState(getProviderUser());
}

/** The only writer of the auth signals (auth state, signed in user). */
function setUserState(user: AuthUser | null): void {
  batch(() => {
    setAuthUser(user);
    setAuthState(user === null ? "signedOut" : "signedIn");
  });
}
