import { tryCatch } from "@monkeytype/util/trycatch";

import Ape from "../ape";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import { createErrorMessage } from "../utils/error";
import {
  getAuthMethodDisplay,
  getPreferredAuthenticationMethod,
} from "./methods";
import {
  AuthError,
  AuthMethod,
  AuthUser,
  SignInOptions,
  ThirdPartyAuthMethod,
} from "./providers/types";
import {
  cancelSignUp,
  createUser,
  finishSignUp,
  getAuthenticatedUser,
  isAuthAvailable,
  linkPassword,
  linkProvider,
  reauthenticate as sessionReauthenticate,
  signIn as sessionSignIn,
  signOut as sessionSignOut,
  unlink,
} from "./session";
import { isAuthenticated } from "./state";

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
  excludeMethod?: AuthMethod;
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

  const { error } = await tryCatch(sessionSignIn(options));

  if (error !== null) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function addAuthProvider(
  options:
    | { authMethod: ThirdPartyAuthMethod }
    | {
        authMethod: "password";
        email: string;
        password: string;
      },
): Promise<void> {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }
  const authMethod = options.authMethod;

  const user = getAuthenticatedUser();
  const providerName = getAuthMethodDisplay(authMethod);

  if (!user) return;
  showLoaderBar();
  try {
    if (authMethod === "password") {
      await addPasswordProvider(options);
    } else {
      await linkProvider(authMethod);
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
  await linkPassword(options.email, options.password);
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

export async function removeAuthProvider(
  authMethod: AuthMethod,
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
    await unlink(authMethod);
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
  void sessionSignOut();
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
    const createdAuthUser = await createUser({ email, password, name });

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
      await sessionReauthenticate({
        method: "password",
        password: options.password,
      });
    } else {
      await sessionReauthenticate({ method: authMethod });
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
