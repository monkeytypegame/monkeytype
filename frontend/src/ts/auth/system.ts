import { batch } from "solid-js";
import { addBanner } from "../states/banners";
import {
  isAuthAvailable,
  setAuthAvailable,
  setAuthMethods,
  setAuthState,
  setOfferedAuthMethods,
  setUserId,
  setUserVerified,
} from "./state";
import { showGoogleSignUpModal } from "../states/google-sign-up";
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
 * Hold back the provider's user changes. Used during a sign up, which signs in
 * before the backend user exists.
 */
let holdUserChanges = false;

/**
 * Starts the provider; resolves once it reported the first auth state, or
 * failed to start (auth is then unavailable).
 */
export async function initAuth(authProvider: AuthProvider): Promise<void> {
  provider = authProvider;
  setOfferedAuthMethods(authProvider.methods);
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
        startProviderSignUp(user);
        return;
      }
      setUserState(user);
    });
  } catch (e) {
    setAuthAvailable(false);
    console.error("Firebase failed to initialize", e);
    setUserState(null);
    if (isDevEnvironment()) {
      addBanner({
        level: "notice",
        text: "Dev Info: Firebase failed to initialize",
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
 *
 * @returns the current user if authenticated, else `null`
 */
export function getAuthenticatedUser(): AuthUser | null {
  return getAuthProvider()?.getUser() ?? null;
}

export async function getIdToken(): Promise<string | null> {
  return (await getAuthProvider()?.getToken()) ?? null;
}

export async function signOut(): Promise<void> {
  console.log("auth signout");
  await getAuthProvider()?.signOut();
}

/**
 * Signs in with a password or a third party. A new (third party) user goes to
 * the sign-up modal, still signed out.
 */
export async function signIn(options: SignInOptions): Promise<void> {
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
    startProviderSignUp(result.user);
  } else {
    holdUserChanges = false;
    setUserState(result.user);
  }
}

/** Holds the new user back while it picks a name in the sign-up modal. */
function startProviderSignUp(user: AuthUser): void {
  holdUserChanges = true;
  showGoogleSignUpModal(user);
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
  setUserState(getAuthenticatedUser());
}

/**
 * Ends a sign up that won't finish (failed or cancelled): listens to user
 * changes again and signs out of the provider. The app never saw the user sign
 * in, so its own sign out would do nothing.
 */
export async function cancelSignUp(): Promise<void> {
  holdUserChanges = false;
  await getAuthProvider()?.signOut();
}

/** Deletes the signed in user from the auth provider. */
export async function deleteProviderUser(): Promise<void> {
  await getAuthProvider(true).deleteUser();
}

/** Proves the user is present before a sensitive change. */
export async function reauthenticate(
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
  setUserState(getAuthenticatedUser());
}

/**
 * The only writer of the auth signals (auth state, user id, verified, auth
 * methods).
 */
function setUserState(user: AuthUser | null): void {
  batch(() => {
    if (user === null) {
      setUserId(null);
      setUserVerified(false);
      setAuthMethods([]);
      setAuthState("signedOut");
    } else {
      setUserId(user.uid);
      setUserVerified(user.emailVerified);
      setAuthMethods(user.methods);
      setAuthState("signedIn");
    }
  });
}
