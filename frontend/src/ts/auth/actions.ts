import Ape from "../ape";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import {
  addNotificationWithLevel,
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../states/notifications";
import { createErrorMessage } from "../utils/error";
import {
  AuthError,
  AuthProvider,
  AuthUser,
  isPasswordMethod,
  SignInOptions,
} from "./providers/types";
import {
  cancelSignUp,
  createProviderUser,
  deleteProviderUser,
  finishSignUp,
  getProviderUser,
  initAuth,
  linkMethod,
  reauthenticateWithProvider,
  signInToProvider,
  signOutOfProvider,
  unlinkMethod,
} from "./system";
import {
  getAuthMethodDisplay,
  getPreferredAuthMethod,
  getPendingSignUpUser,
  isAuthAvailable,
  isAuthenticated,
} from "./state";

/**
 * What an auth action did. Every action shows its own notifications (success
 * and failure), so callers only branch on the status, eg. to close a modal.
 */
export type AuthActionResult = { status: "success" | "notice" | "error" };

type ReauthResult =
  | { status: "success"; user: AuthUser }
  | { status: "notice" | "error"; message: string };

/** How to prove the user is present: their password, or a third party popup. */
export type ReauthOptions = Parameters<AuthProvider["reauthenticate"]>[0];

const unavailable = "Authentication uninitialized";

function notifyUnavailable(): AuthActionResult {
  showErrorNotification(unavailable, { durationMs: 3000 });
  return { status: "error" };
}

/**
 * Starts auth with the provider boot picked; resolves once the first auth
 * state is known, or auth failed to start.
 */
export async function startAuth(provider: AuthProvider): Promise<void> {
  await initAuth(provider);
}

export async function sendVerificationEmail(): Promise<AuthActionResult> {
  if (!isAuthAvailable()) return notifyUnavailable();

  showLoaderBar();
  const response = await Ape.users.verificationEmail();
  hideLoaderBar();
  if (response.status !== 200) {
    showErrorNotification("Failed to request verification email", { response });
    return { status: "error" };
  }
  showSuccessNotification("Verification email sent");
  return { status: "success" };
}

export async function signIn(
  options: SignInOptions,
): Promise<AuthActionResult> {
  const failed = isPasswordMethod(options)
    ? "Failed to sign in"
    : `Failed to sign in with ${getAuthMethodDisplay(options.method)}`;
  if (!isAuthAvailable()) {
    showErrorNotification(`${failed}: ${unavailable}`);
    return { status: "error" };
  }

  try {
    await signInToProvider(options);
    return { status: "success" };
  } catch (e) {
    // provider sign in errors carry a message ready to show
    showErrorNotification(`${failed}: ${(e as Error).message}`);
    return { status: "error" };
  }
}

export async function addAuthMethod(
  options:
    | { method: "password"; email: string; password: string }
    | { method: string },
): Promise<AuthActionResult> {
  if (!isAuthAvailable()) return notifyUnavailable();
  if (getProviderUser() === null) return { status: "error" };

  const methodName = getAuthMethodDisplay(options.method);
  showLoaderBar();
  try {
    if (isPasswordMethod(options)) {
      await addPasswordMethod(options);
    } else {
      await linkMethod(options);
    }
    showSuccessNotification(`${methodName} authentication added`);
    return { status: "success" };
  } catch (error) {
    showErrorNotification(`Failed to add ${methodName} authentication`, {
      error,
    });
    return { status: "error" };
  } finally {
    hideLoaderBar();
  }
}

async function addPasswordMethod(options: {
  email: string;
  password: string;
}): Promise<void> {
  // the user has no password yet: a third party proves it
  const method = getPreferredAuthMethod();
  if (method === undefined) throw new Error(noReauthMethod);
  const reauth = await tryReauthenticate({ method });
  if (reauth.status !== "success") {
    throw new Error(reauth.message);
  }
  await linkMethod({
    method: "password",
    email: options.email,
    password: options.password,
  });
  const response = await Ape.users.updateEmail({
    body: {
      newEmail: options.email,
      // read after linking, which updates the account's email
      previousEmail: getProviderUser()?.email as string,
    },
  });
  if (response.status !== 200) {
    throw new Error(
      "Password authentication added but updating the database email failed. This shouldn't happen, please contact support. Error",
    );
  }
}

/** Removes an auth method: a third party by its id, or `"password"`. */
export async function removeAuthMethod(
  authMethod: string,
  reauthOptions: ReauthOptions,
): Promise<AuthActionResult> {
  const reauth = await reauthenticate(reauthOptions);
  if (reauth.status !== "success") return reauth;

  try {
    await unlinkMethod(authMethod);
  } catch (e) {
    showErrorNotification(
      createErrorMessage(
        e,
        authMethod === "password"
          ? "Failed to remove password authentication"
          : `Failed to unlink ${getAuthMethodDisplay(authMethod)} account`,
      ),
    );
    return { status: "error" };
  }
  showSuccessNotification(
    `${getAuthMethodDisplay(authMethod)} authentication removed`,
  );
  return { status: "success" };
}

export function signOut(): AuthActionResult {
  if (!isAuthAvailable()) return notifyUnavailable();
  if (!isAuthenticated()) return { status: "notice" };
  void signOutOfProvider();
  return { status: "success" };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  captchaToken: string,
): Promise<AuthActionResult> {
  if (!isAuthAvailable()) {
    showErrorNotification(unavailable);
    return { status: "error" };
  }

  try {
    const createdAuthUser = await createProviderUser({ email, password, name });

    const signInResponse = await Ape.users.create({
      body: {
        name: name,
        captcha: captchaToken,
        email,
        uid: createdAuthUser.uid,
      },
    });
    if (signInResponse.status !== 200) {
      throw new Error(`Failed to sign in: ${signInResponse.body.message}`);
    }

    await sendVerificationEmail();
    finishSignUp();

    showSuccessNotification("Account created");
    return { status: "success" };
  } catch (e) {
    let message = createErrorMessage(e, "Failed to create account");

    if (e instanceof AuthError && e.code === "emailInUse") {
      message = createErrorMessage(
        { message: "Email already in use" },
        "Failed to create account",
      );
    }

    showErrorNotification(message);
    void cancelSignUp();
    return { status: "error" };
  }
}

/**
 * Finishes a third party sign up: the pending sign-up user (signed in to the
 * provider, signed out here) picked a name. Creates the backend user, or
 * cancels the sign up when that fails.
 */
export async function completeThirdPartySignUp(
  name: string,
  captcha: string,
): Promise<AuthActionResult> {
  const signedInUser = getPendingSignUpUser();
  if (!signedInUser) {
    showErrorNotification(
      "Missing user credential. Please close the popup and try again.",
    );
    return { status: "error" };
  }
  if (!captcha) {
    showNoticeNotification("Please complete the captcha");
    return { status: "notice" };
  }

  showLoaderBar();
  try {
    if (name.length === 0) throw new Error("Name cannot be empty");
    const response = await Ape.users.create({ body: { name, captcha } });
    if (response.status !== 200) {
      throw new Error(`Failed to create user: ${response.body.message}`);
    }

    // our server sends it, like for an email sign up; a third party may
    // already have verified the email
    if (!signedInUser.emailVerified) await sendVerificationEmail();
    finishSignUp();
    showSuccessNotification("Account created");
    return { status: "success" };
  } catch (e) {
    console.log(e);
    const thirdParty = signedInUser.methods.find((it) => it.id !== "password");
    showErrorNotification(
      `Failed to sign in with ${thirdParty === undefined ? "a third party" : getAuthMethodDisplay(thirdParty.id)}`,
      { error: e },
    );
    await abortThirdPartySignUp();
    return { status: "error" };
  } finally {
    hideLoaderBar();
  }
}

/** Cancels a third party sign up the user walked away from. */
export async function cancelThirdPartySignUp(): Promise<AuthActionResult> {
  // finished, or a failed completion already aborted it
  if (getPendingSignUpUser() === undefined) return { status: "success" };
  showNoticeNotification("Sign up process cancelled", {
    durationMs: 5000,
  });
  await abortThirdPartySignUp();
  return { status: "notice" };
}

/**
 * Deletes the new user the sign up created (it only runs for one), and signs
 * out of the auth provider.
 */
async function abortThirdPartySignUp(): Promise<void> {
  try {
    await Ape.users.delete();
    await deleteProviderUser().catch(() => {
      //user might be deleted already by the server
    });
  } finally {
    await cancelSignUp();
  }
}

const noReauthMethod =
  "Failed to reauthenticate: there is no valid authentication present on the account.";

/**
 * The auth method to reauthenticate with: the user's most preferred one,
 * except `exclude` (the one being removed). Tells the user and returns
 * `undefined` when there's none.
 */
export function pickReauthMethod(exclude?: string): string | undefined {
  const method = getPreferredAuthMethod(exclude);
  if (method === undefined) showErrorNotification(noReauthMethod);
  return method;
}

/**
 * Proves the user is present: with their password, or a third party popup
 * (pick the method with `pickReauthMethod`). Shows its own failure
 * notification.
 */
export async function reauthenticate(
  options: ReauthOptions,
): Promise<ReauthResult> {
  const result = await tryReauthenticate(options);
  if (result.status !== "success") {
    addNotificationWithLevel(result.message, result.status);
  }
  return result;
}

/** `reauthenticate`, telling the caller what failed instead of the user. */
async function tryReauthenticate(
  options: ReauthOptions,
): Promise<ReauthResult> {
  if (!isAuthAvailable()) {
    return {
      status: "error",
      message: "Authentication is not initialized",
    };
  }

  const user = getProviderUser();
  if (user === null) {
    return {
      status: "error",
      message: "User is not signed in",
    };
  }

  try {
    await reauthenticateWithProvider(options);
    return { status: "success", user };
  } catch (e) {
    const code = e instanceof AuthError ? e.code : "unknown";
    if (code === "wrongPassword") {
      return {
        status: "notice",
        message: "Incorrect password",
      };
    } else if (code === "invalidCredential") {
      return {
        status: "notice",
        message:
          "Password is incorrect or your account does not have password authentication enabled.",
      };
    } else {
      return {
        status: "error",
        message: `Failed to reauthenticate: ${
          (e as Error | undefined)?.message ?? JSON.stringify(e)
        }`,
      };
    }
  }
}
