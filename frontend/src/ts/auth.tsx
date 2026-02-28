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
import { updateFromServer as updateConfigFromServer } from "./config";
import * as DB from "./db";
import * as Notifications from "./elements/notifications";
import {
  isAuthAvailable,
  getAuthenticatedUser,
  isAuthenticated,
  signOut as authSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  resetIgnoreAuthCallback,
} from "./firebase";
import * as RegisterCaptchaModal from "./modals/register-captcha";
import { showPopup } from "./modals/simple-modals-base";
import * as AuthEvent from "./observables/auth-event";
import * as Sentry from "./sentry";
import { showLoaderBar, hideLoaderBar } from "./signals/loader-bar";
import { addBanner } from "./stores/banners";
import * as Misc from "./utils/misc";

export const gmailProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export async function sendVerificationEmail(): Promise<void> {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }

  showLoaderBar();
  const response = await Ape.users.verificationEmail();
  if (response.status !== 200) {
    hideLoaderBar();
    Notifications.add("Failed to request verification email", -1, { response });
  } else {
    hideLoaderBar();
    Notifications.add("Verification email sent", 1);
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
    if (snapshot.needsToChangeName) {
      addBanner({
        level: "error",
        icon: "fas fa-exclamation-triangle",
        customContent: (
          <>
            You need to update your account name.{" "}
            <button
              type="button"
              class="px-2 py-1"
              onClick={() => {
                showPopup("updateName");
              }}
            >
              Click here
            </button>{" "}
            to change it and learn more about why.
          </>
        ),
        important: true,
      });
    }

    await updateConfigFromServer();
    return true;
  } catch (error) {
    console.error(error);
    if (error instanceof DB.SnapshotInitError) {
      if (error.responseCode === 429) {
        Notifications.add(
          "Doing so will save you bandwidth, make the next test be ready faster and will not sign you out (which could mean your new personal best would not save to your account).",
          0,
          {
            duration: 0,
          },
        );
        Notifications.add(
          "You will run into this error if you refresh the website to restart the test. It is NOT recommended to do that. Instead, use tab + enter or just tab (with quick tab mode enabled) to restart the test.",
          0,
          {
            duration: 0,
          },
        );
      }

      Notifications.add("Failed to get user data: " + error.message, -1);
    } else {
      const message = Misc.createErrorMessage(error, "Failed to get user data");
      Notifications.add(message, -1);
    }
    return false;
  }
}

export async function loadUser(_user: UserType): Promise<void> {
  if (!(await getDataAndInit())) {
    signOut();
    return;
  }
  AuthEvent.dispatch({ type: "snapshotUpdated", data: { isInitial: true } });
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

  AuthEvent.dispatch({
    type: "authStateChanged",
    data: { isUserSignedIn: user !== null, loadPromise: userPromise },
  });
}

export async function signIn(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    }
> {
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
): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    }
> {
  if (!isAuthAvailable()) {
    return { success: false, message: "Authentication uninitialized" };
  }

  const { error } = await tryCatch(signInWithPopup(provider, rememberMe));

  if (error !== null) {
    if (error.message !== "") {
      Notifications.add(error.message, -1);
    }
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function signInWithGoogle(rememberMe: boolean): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    }
> {
  return signInWithProvider(gmailProvider, rememberMe);
}

export async function signInWithGitHub(rememberMe: boolean): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    }
> {
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
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  showLoaderBar();
  const user = getAuthenticatedUser();
  if (!user) return;
  try {
    await linkWithPopup(user, provider);
    hideLoaderBar();
    Notifications.add(`${providerName} authentication added`, 1);
    AuthEvent.dispatch({ type: "authConfigUpdated" });
  } catch (error) {
    hideLoaderBar();
    const message = Misc.createErrorMessage(
      error,
      `Failed to add ${providerName} authentication`,
    );
    Notifications.add(message, -1);
  }
}

export function signOut(): void {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  if (!isAuthenticated()) return;
  void authSignOut();
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    }
> {
  if (!isAuthAvailable()) {
    return { success: false, message: "Authentication uninitialized" };
  }
  await RegisterCaptchaModal.show();
  const captchaToken = await RegisterCaptchaModal.promise;
  if (captchaToken === undefined || captchaToken === "") {
    return { success: false, message: "Please complete the captcha" };
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

    Notifications.add("Account created", 1);
    return { success: true };
  } catch (e) {
    let message = Misc.createErrorMessage(e, "Failed to create account");

    if (e instanceof Error) {
      if ("code" in e && e.code === "auth/email-already-in-use") {
        message = Misc.createErrorMessage(
          { message: "Email already in use" },
          "Failed to create account",
        );
      }
    }

    Notifications.add(message, -1);
    signOut();
    return { success: false, message };
  }
}
