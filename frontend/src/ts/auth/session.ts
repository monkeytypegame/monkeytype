import { batch } from "solid-js";
import { addBanner } from "../states/banners";
import { setAuthState, setUserId, setUserVerified } from "./state";
import { showGoogleSignUpModal } from "../states/google-sign-up";
import { isDevEnvironment } from "../utils/env";
import { promiseWithResolvers } from "../utils/misc";

import {
  AuthProvider,
  AuthUser,
  SignInOptions,
  SignInResult,
} from "./providers/types";

let provider: AuthProvider | undefined;

/**
 * Hold back the provider's user changes. Used during a sign up, which signs in
 * before the backend user exists.
 */
let holdUserChanges = false;

const { promise: authPromise, resolve: resolveAuthPromise } =
  promiseWithResolvers();

export async function initAuth(authProvider: AuthProvider): Promise<void> {
  provider = authProvider;
  try {
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
    provider = undefined;
    console.error("Firebase failed to initialize", e);
    setUserState(null);
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

export function requireAuthProvider(): AuthProvider {
  if (provider === undefined) throw new Error("Authentication uninitialized");
  return provider;
}

export function isAuthAvailable(): boolean {
  return provider !== undefined;
}

/**
 *
 * @returns the current user if authenticated, else `null`
 */
export function getAuthenticatedUser(): AuthUser | null {
  return provider?.getUser() ?? null;
}

export async function getIdToken(): Promise<string | null> {
  return (await provider?.getToken()) ?? null;
}

export async function signOut(): Promise<void> {
  console.log("auth signout");
  await provider?.signOut();
}

/**
 * Signs in with a password or a third party. A new (third party) user goes to
 * the sign-up modal, still signed out.
 */
export async function signIn(options: SignInOptions): Promise<void> {
  const authProvider = requireAuthProvider();
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
export async function createUser(options: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthUser> {
  const authProvider = requireAuthProvider();
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
  await provider?.signOut();
}

/** The only writer of the auth signals (auth state, user id, verified). */
function setUserState(user: AuthUser | null): void {
  batch(() => {
    if (user === null) {
      setUserId(null);
      setUserVerified(false);
      setAuthState("signedOut");
    } else {
      setUserId(user.uid);
      setUserVerified(user.emailVerified);
      setAuthState("signedIn");
    }
  });
}

export { authPromise };
