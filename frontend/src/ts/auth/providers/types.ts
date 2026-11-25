import type { FaObject } from "../../types/font-awesome";

/**
 * An auth method the provider offers, as the UI shows it: `"password"`, or a
 * third party (eg. `"google"`).
 */
export type AuthMethodInfo = { id: string; display: string; fa: FaObject };

/**
 * Narrows auth method options to their password form. A third party's
 * `method` is its id, a `string`, so comparing alone doesn't narrow.
 */
export function isPasswordMethod<T extends { method: string }>(
  options: T,
): options is Extract<T, { method: "password" }> {
  return options.method === "password";
}

/** The signed in user as the auth provider sees it. */
export type AuthUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /**
   * auth methods linked to the account, with the email each one uses: a third
   * party id, or `"password"`
   */
  methods: { id: string; email: string | null }[];
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

export type SignInOptions = (
  | { method: "password"; email: string; password: string }
  | { method: string }
) & { rememberMe: boolean };

export type SignInResult = { user: AuthUser; isNewUser: boolean };

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
   * The auth methods users can sign in with (`"password"` when offered, and
   * third parties), most preferred first. Never empty: auth fails to start
   * without one.
   */
  readonly methods: readonly AuthMethodInfo[];
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
  /**
   * Signs in with a password or a third party. A third party's popup resolves
   * with the user; a redirect leaves the page and never resolves (the user
   * arrives through `init`). Only a third party can create a user here.
   */
  signIn(options: SignInOptions): Promise<SignInResult>;
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
    options: { method: "password"; password: string } | { method: string },
  ): Promise<void>;
  /**
   * Links an auth method. Password auth takes this email, which becomes the
   * account's email (providers that only set passwords server-side do it
   * through their server); a third party links by popup, or a redirect that
   * never resolves.
   */
  addMethod(
    options:
      | { method: "password"; email: string; password: string }
      | { method: string },
  ): Promise<void>;
  /** Unlinks an auth method: `"password"`, or a third party id. */
  removeMethod(method: string): Promise<void>;
};
