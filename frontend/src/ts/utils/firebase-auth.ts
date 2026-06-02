import * as AccountController from "../auth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  User,
} from "firebase/auth";
import { getAuthenticatedUser, isAuthAvailable } from "../firebase";
import { FirebaseError } from "firebase/app";

type AuthMethod = "password" | "github.com" | "google.com";

type ReauthSuccess = {
  status: "success";
  message: string;
  user: User;
};

type ReauthFailed = {
  status: "error" | "notice";
  message: string;
};

type ReauthenticateOptions = {
  excludeMethod?: AuthMethod;
  password?: string;
};

export function isUsingPasswordAuthentication(): boolean {
  return isUsingAuthentication("password");
}

export function isUsingGithubAuthentication(): boolean {
  return isUsingAuthentication("github.com");
}

export function isUsingGoogleAuthentication(): boolean {
  return isUsingAuthentication("google.com");
}

function isUsingAuthentication(authProvider: AuthMethod): boolean {
  return (
    getAuthenticatedUser()?.providerData.some(
      (p) => p.providerId === authProvider,
    ) ?? false
  );
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
      const credential = EmailAuthProvider.credential(
        user.email as string,
        options.password,
      );
      await reauthenticateWithCredential(user, credential);
    } else {
      const authProvider =
        authMethod === "github.com"
          ? AccountController.githubProvider
          : AccountController.gmailProvider;
      await reauthenticateWithPopup(user, authProvider);
    }

    return {
      status: "success",
      message: "Reauthenticated",
      user,
    };
  } catch (e) {
    const typedError = e as FirebaseError;
    if (typedError.code === "auth/wrong-password") {
      return {
        status: "notice",
        message: "Incorrect password",
      };
    } else if (typedError.code === "auth/invalid-credential") {
      return {
        status: "notice",
        message:
          "Password is incorrect or your account does not have password authentication enabled.",
      };
    } else {
      return {
        status: "error",
        message: `Failed to reauthenticate: ${
          typedError?.message ?? JSON.stringify(e)
        }`,
      };
    }
  }
}

function getPreferredAuthenticationMethod(
  exclude?: AuthMethod,
): AuthMethod | undefined {
  const authMethods = ["password", "github.com", "google.com"] as AuthMethod[];
  const filteredMethods = authMethods.filter((it) => it !== exclude);
  for (const method of filteredMethods) {
    if (isUsingAuthentication(method)) return method;
  }
  return undefined;
}
