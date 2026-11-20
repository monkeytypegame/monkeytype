import { NewPasswordSchema, PasswordSchema } from "@monkeytype/schemas/users";
import { typedKeys } from "@monkeytype/util/objects";
import { tryCatch } from "@monkeytype/util/trycatch";
import { createMemo, createRoot } from "solid-js";
import { z, ZodString } from "zod";

import Ape from "../ape";
import {
  AuthError,
  AuthMethod,
  AuthUser,
  signOut as authSignOut,
  createUser,
  finishSignUp,
  getAuthenticatedUser,
  isAuthAvailable,
  cancelSignUp,
  ThirdPartyAuthMethod,
  requireAuthProvider,
  signIn as providerSignIn,
  SignInOptions,
} from "./provider";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { createEffectOn } from "../hooks/effects";
import { getUserId, isAuthenticated } from "./state";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import { FaObject } from "../types/font-awesome";
import { isDevEnvironment } from "../utils/env";
import { createErrorMessage } from "../utils/error";

type AuthMethodInfo = {
  display: string;
  fa: FaObject;
};

/**
 * auth methods, keep order from most to least preferred.
 * This is used for reauthenticate
 */
const authMethods = {
  password: {
    display: "Password",
    fa: { icon: "fa-lock" },
  },
  github: {
    display: "GitHub",
    fa: { variant: "brand", icon: "fa-github" },
  },
  google: {
    display: "Google",
    fa: { variant: "brand", icon: "fa-google" },
  },
} as const satisfies Record<AuthMethod, AuthMethodInfo>;

export type { AuthMethod, ThirdPartyAuthMethod as ProviderAuthMethod };

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

const [getAuthenticatedUserReactive, { updateAuthenticatedUser }] =
  createSignalWithSetters<Pick<AuthUser, "methods"> | null>(null)({
    updateAuthenticatedUser: (set) => {
      const user = getAuthenticatedUser();
      if (user === null) {
        set(null);
      } else {
        set({ methods: user.methods });
      }
    },
  });
export { getAuthenticatedUser };

createRoot(() =>
  createEffectOn(getUserId, () => {
    updateAuthenticatedUser();
  }),
);

const authenticationMemos = createRoot(() =>
  Object.fromEntries(
    typedKeys(authMethods).map((authMethod) => {
      const memo = createMemo(() => {
        const user = getAuthenticatedUserReactive();
        if (user === null) return undefined;
        const provider = user.methods.find((it) => it.method === authMethod);
        const result = {
          isInUse: provider !== undefined,
          email: provider?.email ?? undefined,
          hasAdditionalAuthMethods: hasAdditionalAuthMethods(authMethod),
        };

        return result;
      });
      return [authMethod, memo];
    }),
  ),
);

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

  const { error } = await tryCatch(providerSignIn(options));

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
      await requireAuthProvider().linkProvider(authMethod);
    }

    showSuccessNotification(`${providerName} authentication added`);
    updateAuthenticatedUser();
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
  await requireAuthProvider().linkPassword(options.email, options.password);
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
    await requireAuthProvider().unlink(authMethod);
    updateAuthenticatedUser();
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
  void authSignOut();
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
      await requireAuthProvider().reauthenticate({
        method: "password",
        password: options.password,
      });
    } else {
      await requireAuthProvider().reauthenticate({ method: authMethod });
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

function getPreferredAuthenticationMethod(
  exclude?: AuthMethod,
): AuthMethod | undefined {
  const filteredMethods = typedKeys(authMethods).filter((it) => it !== exclude);
  for (const method of filteredMethods) {
    if (isUsingAuthentication(method)) return method;
  }
  return undefined;
}

export function isUsingAuthentication(authMethod: AuthMethod): boolean {
  return (
    getAuthenticatedUser()?.methods.some((it) => it.method === authMethod) ??
    false
  );
}

export function isUsingAuthenticationReactive(authMethod: AuthMethod): boolean {
  return authenticationMemos[authMethod]?.()?.isInUse ?? false;
}

/**
 * Returns the Zod schema for password validation.
 *
 * Set `isNew: true` for registration/creation flows (strict rules).
 * Omit it for re-authentication flows (lenient: just non-empty).
 *
 * @param options - Set `isNew: true` for password creation/registration.
 * @returns A Zod string schema.
 */
export function getPasswordSchema(options?: { isNew: boolean }): ZodString {
  if (!options?.isNew) return PasswordSchema;
  if (isDevEnvironment()) return z.string().min(6);
  return NewPasswordSchema;
}

export function isUsingPasswordAuthentication(): boolean {
  return isUsingAuthentication("password");
}

export function hasAdditionalAuthMethods(authMethod: AuthMethod): boolean {
  return typedKeys(authMethods).some(
    (it) => it !== authMethod && isUsingAuthentication(it),
  );
}

export function getAuthMethodEmailReactive(
  authMethod: AuthMethod,
): string | undefined {
  return authenticationMemos[authMethod]?.()?.email;
}

export function hasAdditionalAuthMethodsReactive(
  authMethod: AuthMethod,
): boolean {
  return authenticationMemos[authMethod]?.()?.hasAdditionalAuthMethods ?? false;
}

export function getAuthMethodDisplay(authMethod: AuthMethod): string {
  return authMethods[authMethod].display;
}

export function getAuthMethodIcon(authMethod: AuthMethod): FaObject {
  return authMethods[authMethod].fa;
}
