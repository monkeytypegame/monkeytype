export type AuthMethod = "password" | "github" | "google";
export type ThirdPartyAuthMethod = Exclude<AuthMethod, "password">;

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

export type SignInOptions = (
  | { method: "password"; email: string; password: string }
  | { method: ThirdPartyAuthMethod }
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
    options:
      | { method: "password"; password: string }
      | { method: ThirdPartyAuthMethod },
  ): Promise<void>;
  /**
   * Adds password auth with this email, which becomes the account's email.
   * Providers that only set passwords server-side do it through their server.
   */
  linkPassword(email: string, password: string): Promise<void>;
  /** Links a third party (popup, or a redirect that never resolves). */
  linkProvider(method: ThirdPartyAuthMethod): Promise<void>;
  unlink(method: AuthMethod): Promise<void>;
};
