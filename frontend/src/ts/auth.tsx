import { tryCatch } from "@monkeytype/util/trycatch";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
  linkWithPopup,
  User as UserType,
  AuthProvider,
} from "firebase/auth";

import Ape from "./ape";
import { updateFromServer as updateConfigFromServer } from "./config/remote";
import * as DB from "./db";
import { authEvent } from "./events/auth";
import {
  isAuthAvailable,
  getAuthenticatedUser,
  signOut as authSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  resetIgnoreAuthCallback,
} from "./firebase";
import * as Sentry from "./sentry";
import { isAuthenticated } from "./states/core";
import { showLoaderBar, hideLoaderBar } from "./states/loader-bar";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "./states/notifications";
import { createErrorMessage } from "./utils/error";

export type AuthResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export const gmailProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

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

async function getDataAndInit(): Promise<boolean> {
  try {
    console.log("getting account data");
    const snapshot = await DB.initSnapshot();

    if (snapshot === false) {
      throw new Error(
        "Snapshot didn't initialize due to lacking authentication even though user is authenticated",
      );
    }

    void Sentry.setUser(snapshot.uid, snapshot.name);

    await updateConfigFromServer();
    return true;
  } catch (error) {
    console.error(error);
    if (error instanceof DB.SnapshotInitError) {
      if (error.responseCode === 429) {
        showNoticeNotification(
          "Doing so will save you bandwidth, make the next test be ready faster and will not sign you out (which could mean your new personal best would not save to your account).",
          {
            durationMs: 0,
          },
        );
        showNoticeNotification(
          "You will run into this error if you refresh the website to restart the test. It is NOT recommended to do that. Instead, use tab + enter or just tab (with quick tab mode enabled) to restart the test.",
          {
            durationMs: 0,
          },
        );
      }

      showErrorNotification("Failed to get user data: " + error.message);
    } else {
      showErrorNotification("Failed to get user data", { error });
    }
    return false;
  }
}

export async function loadUser(_user: UserType): Promise<void> {
  if (!(await getDataAndInit())) {
    signOut();
    return;
  }
  authEvent.dispatch({ type: "snapshotUpdated", data: { isInitial: true } });
}

export async function onAuthStateChanged(
  authInitialisedAndConnected: boolean,
  user: UserType | null,
): Promise<void> {
  console.debug(`account controller ready`);

  let userPromise: Promise<void> = Promise.resolve();

  if (authInitialisedAndConnected) {
    console.debug(`auth state changed, user ${user ? "true" : "false"}`);
    if (user) {
      userPromise = loadUser(user);
    } else {
      DB.setSnapshot(undefined);
    }
  }

  if (!authInitialisedAndConnected || !user) {
    void Sentry.clearUser();
  }

  authEvent.dispatch({
    type: "authStateChanged",
    data: { isUserSignedIn: user !== null, loadPromise: userPromise },
  });
}

export async function signIn(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<AuthResult> {
  if (!isAuthAvailable()) {
    return { success: false, message: "Authentication uninitialized" };
  }

  const { error } = await tryCatch(
    signInWithEmailAndPassword(email, password, rememberMe),
  );

  if (error !== null) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

async function signInWithProvider(
  provider: AuthProvider,
  rememberMe: boolean,
): Promise<AuthResult> {
  if (!isAuthAvailable()) {
    return { success: false, message: "Authentication uninitialized" };
  }

  const { error } = await tryCatch(signInWithPopup(provider, rememberMe));

  if (error !== null) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function signInWithGoogle(
  rememberMe: boolean,
): Promise<AuthResult> {
  return signInWithProvider(gmailProvider, rememberMe);
}

export async function signInWithGitHub(
  rememberMe: boolean,
): Promise<AuthResult> {
  return signInWithProvider(githubProvider, rememberMe);
}

export async function addGoogleAuth(): Promise<void> {
  return addAuthProvider("Google", gmailProvider);
}

export async function addGithubAuth(): Promise<void> {
  return addAuthProvider("GitHub", githubProvider);
}

async function addAuthProvider(
  providerName: string,
  provider: AuthProvider,
): Promise<void> {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }
  showLoaderBar();
  const user = getAuthenticatedUser();
  if (!user) return;
  try {
    await linkWithPopup(user, provider);
    hideLoaderBar();
    showSuccessNotification(`${providerName} authentication added`);
    authEvent.dispatch({ type: "authConfigUpdated" });
  } catch (error) {
    hideLoaderBar();
    showErrorNotification(`Failed to add ${providerName} authentication`, {
      error,
    });
  }
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
    const createdAuthUser = await createUserWithEmailAndPassword(
      email,
      password,
    );

    const signInResponse = await Ape.users.create({
      body: {
        name: name,
        captcha: captchaToken,
        email,
        uid: createdAuthUser.user.uid,
      },
    });
    if (signInResponse.status !== 200) {
      throw new Error(`Failed to sign in: ${signInResponse.body.message}`);
    }

    await updateProfile(createdAuthUser.user, { displayName: name });
    await sendVerificationEmail();
    await onAuthStateChanged(true, createdAuthUser.user);
    resetIgnoreAuthCallback();

    showSuccessNotification("Account created");
    return { success: true };
  } catch (e) {
    let message = createErrorMessage(e, "Failed to create account");

    if (e instanceof Error) {
      if ("code" in e && e.code === "auth/email-already-in-use") {
        message = createErrorMessage(
          { message: "Email already in use" },
          "Failed to create account",
        );
      }
    }

    showErrorNotification(message);
    signOut();
    return { success: false, message };
  }
}
