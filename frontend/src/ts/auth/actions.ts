import { tryCatch } from "@monkeytype/util/trycatch";

import Ape from "../ape";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import {
  getGoogleSignUpUser,
  setGoogleSignUpUser,
} from "../states/google-sign-up";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../states/notifications";
import { createErrorMessage } from "../utils/error";
import {
  AuthError,
  AuthUser,
  isPasswordMethod,
  SignInOptions,
} from "./providers/types";
import {
  cancelSignUp,
  createProviderUser,
  deleteProviderUser,
  finishSignUp,
  getAuthenticatedUser,
  isAuthAvailable,
  linkMethod,
  getAuthMethodDisplay,
  getOfferedAuthMethods,
  reauthenticate as systemReauthenticate,
  signIn as systemSignIn,
  signOut as systemSignOut,
  unlinkMethod,
} from "./system";
import { isAuthenticated, isUsingAuthMethod } from "./state";

export type AuthResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

type ReauthSuccess = {
  status: "success";
  message: string;
  user: AuthUser;
};

type ReauthFailed = {
  status: "error" | "notice";
  message: string;
};

type ReauthenticateOptions = {
  /** an auth method id: a third party id, or `"password"` */
  excludeMethod?: string;
  password?: string;
};

export async function sendVerificationEmail(): Promise<void> {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }

  showLoaderBar();
  const response = await Ape.users.verificationEmail();
  if (response.status !== 200) {
    hideLoaderBar();
    showErrorNotification("Failed to request verification email", { response });
  } else {
    hideLoaderBar();
    showSuccessNotification("Verification email sent");
  }
}

export async function signIn(options: SignInOptions): Promise<AuthResult> {
  if (!isAuthAvailable()) {
    return { success: false, message: "Authentication uninitialized" };
  }

  const { error } = await tryCatch(systemSignIn(options));

  if (error !== null) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function addAuthMethod(
  options:
    | { method: "password"; email: string; password: string }
    | { method: string },
): Promise<void> {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }
  const user = getAuthenticatedUser();
  const providerName = getAuthMethodDisplay(options.method);

  if (!user) return;
  showLoaderBar();
  try {
    if (isPasswordMethod(options)) {
      await addPasswordProvider(options);
    } else {
      await linkMethod(options);
    }

    showSuccessNotification(`${providerName} authentication added`);
  } catch (error) {
    showErrorNotification(`Failed to add ${providerName} authentication`, {
      error,
    });
  } finally {
    hideLoaderBar();
  }
}

async function addPasswordProvider(options: {
  email: string;
  password: string;
}): Promise<void> {
  const reauth = await reauthenticate({ password: options.password });
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
      previousEmail: getAuthenticatedUser()?.email as string,
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
  options?: { password?: string },
): Promise<ReauthSuccess | ReauthFailed> {
  const reauth = await reauthenticate({
    password: options?.password,
    excludeMethod: authMethod,
  });
  if (reauth.status !== "success") {
    return {
      status: reauth.status,
      message: reauth.message,
    };
  }
  try {
    await unlinkMethod(authMethod);
  } catch (e) {
    const message = createErrorMessage(
      e,
      authMethod === "password"
        ? "Failed to remove password authentication"
        : `Failed to unlink ${getAuthMethodDisplay(authMethod)} account`,
    );
    return {
      status: "error",
      message,
    };
  }
  return {
    status: "success",
    message: `${getAuthMethodDisplay(authMethod)} authentication removed`,
    user: reauth.user,
  };
}

export function signOut(): void {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }
  if (!isAuthenticated()) return;
  void systemSignOut();
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  captchaToken: string,
): Promise<AuthResult> {
  if (!isAuthAvailable()) {
    return { success: false, message: "Authentication uninitialized" };
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
    return { success: true };
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
    return { success: false, message };
  }
}

/**
 * Finishes a third party sign up: the new user (held back, see
 * `startProviderSignUp`) picked a name. Creates the backend user, or cancels
 * the sign up when that fails.
 */
export async function completeThirdPartySignUp(
  name: string,
  captcha: string,
): Promise<void> {
  const signedInUser = getGoogleSignUpUser();
  if (!signedInUser) {
    showErrorNotification(
      "Missing user credential. Please close the popup and try again.",
    );
    return;
  }
  if (!captcha) {
    showNoticeNotification("Please complete the captcha");
    return;
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
    setGoogleSignUpUser(undefined);
  } catch (e) {
    console.log(e);
    showErrorNotification("Failed to sign in with Google", { error: e });
    await abortThirdPartySignUp();
  } finally {
    hideLoaderBar();
  }
}

/** Cancels a third party sign up the user walked away from. */
export async function cancelThirdPartySignUp(): Promise<void> {
  // finished, or a failed completion already aborted it
  if (getGoogleSignUpUser() === undefined) return;
  showNoticeNotification("Sign up process cancelled", {
    durationMs: 5000,
  });
  await abortThirdPartySignUp();
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
    setGoogleSignUpUser(undefined);
  }
}

export async function reauthenticate(
  options: ReauthenticateOptions,
): Promise<ReauthSuccess | ReauthFailed> {
  if (!isAuthAvailable()) {
    return {
      status: "error",
      message: "Authentication is not initialized",
    };
  }

  const user = getAuthenticatedUser();
  if (user === null) {
    return {
      status: "error",
      message: "User is not signed in",
    };
  }

  const authMethod = getPreferredAuthenticationMethod(options.excludeMethod);

  try {
    if (authMethod === undefined) {
      return {
        status: "error",
        message:
          "Failed to reauthenticate: there is no valid authentication present on the account.",
      };
    }

    if (authMethod === "password") {
      if (options.password === undefined) {
        return {
          status: "error",
          message: "Failed to reauthenticate using password: password missing.",
        };
      }
      await systemReauthenticate({
        method: "password",
        password: options.password,
      });
    } else {
      await systemReauthenticate({ method: authMethod });
    }

    return {
      status: "success",
      message: "Reauthenticated",
      user,
    };
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

/** The signed in user's most preferred auth method, in the provider's order. */
function getPreferredAuthenticationMethod(
  exclude?: string,
): string | undefined {
  return getOfferedAuthMethods()
    .map((it) => it.id)
    .find((it) => it !== exclude && isUsingAuthMethod(it));
}
