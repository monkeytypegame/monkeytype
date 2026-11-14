import { batch } from "solid-js";
import { addBanner } from "../states/banners";
import { setAuthState, setUserId, setUserVerified } from "../states/auth";
import { showGoogleSignUpModal } from "../states/google-sign-up";
import { isDevEnvironment } from "../utils/env";
import { promiseWithResolvers } from "../utils/misc";

export type AuthMethod = "password" | "github" | "google";
export type ProviderAuthMethod = Exclude<AuthMethod, "password">;

/** The signed in user as the auth provider sees it. */
export type AuthUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /** auth methods linked to the account, with the email each one uses */
  methods: { method: AuthMethod; email: string | null }[];
};

/** Error codes the UI branches on; anything else is `unknown`. */
export type AuthErrorCode =
  | "wrongPassword"
  | "invalidCredential"
  | "emailInUse"
  | "unknown";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AuthError";
    this.code = code;
  }
}

export type ProviderSignInResult = { user: AuthUser; isNewUser: boolean };

/**
 * An auth backend: Firebase, or a self-hosted one (eg. Better Auth). Shaped to
 * fit both SDK-driven providers (Firebase: popups, explicit reauth, client-side
 * linking) and server-session ones (redirects, a fresh session instead of
 * reauth, linking through the provider's server).
 *
 * Throws `AuthError`s; sign in errors carry a message ready to show.
 *
 * Auth emails (verification, password reset) are not here: our server sends
 * them, with links from the backend's auth provider.
 */
export type AuthProvider = {
  /**
   * Throws when the provider can't start; auth is then unavailable. Reports
   * every sign in and out. A provider that signs in by redirect reports the
   * returning user here, with `isNewUser` when the redirect created it.
   */
  init(
    onUserChange: (
      user: AuthUser | null,
      info?: { isNewUser: boolean },
    ) => void,
  ): Promise<void>;
  /** The signed in user, from the provider's local session. */
  getUser(): AuthUser | null;
  /** Bearer token for the API, `null` when signed out. */
  getToken(): Promise<string | null>;
  signInWithPassword(
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<AuthUser>;
  /**
   * Signs in with a third party. A popup resolves with the user; a redirect
   * leaves the page and never resolves (the user arrives through `init`).
   */
  signInWithProvider(
    method: ProviderAuthMethod,
    rememberMe: boolean,
  ): Promise<ProviderSignInResult>;
  /** Creates a password user with this display name and signs it in. */
  createUser(options: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthUser>;
  /** Deletes the signed in user. */
  deleteUser(): Promise<void>;
  signOut(): Promise<void>;
  /**
   * Proves the user is present before a sensitive change (Firebase: reauth;
   * a session provider: a fresh sign in). May redirect for a third party.
   */
  reauthenticate(
    options:
      | { method: "password"; password: string }
      | { method: ProviderAuthMethod },
  ): Promise<void>;
  /**
   * Adds password auth with this email, which becomes the account's email.
   * Providers that only set passwords server-side do it through their server.
   */
  linkPassword(email: string, password: string): Promise<void>;
  /** Links a third party (popup, or a redirect that never resolves). */
  linkProvider(method: ProviderAuthMethod): Promise<void>;
  unlink(method: AuthMethod): Promise<void>;
};

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

/** The provider, or `undefined` when auth is unavailable. */
export function getAuthProvider(): AuthProvider | undefined {
  return provider;
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

export async function signInWithEmailAndPassword(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<AuthUser> {
  return requireAuthProvider().signInWithPassword(email, password, rememberMe);
}

/**
 * Signs in with a third party. A new user goes to the sign-up modal, still
 * signed out.
 */
export async function signInWithProvider(
  method: ProviderAuthMethod,
  rememberMe: boolean,
): Promise<void> {
  const authProvider = requireAuthProvider();
  holdUserChanges = true;
  let result: ProviderSignInResult;
  try {
    result = await authProvider.signInWithProvider(method, rememberMe);
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
