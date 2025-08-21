import Ape from "./ape";
import * as Notifications from "./elements/notifications";
import Config, * as UpdateConfig from "./config";
import * as Misc from "./utils/misc";
import * as DB from "./db";
import * as Loader from "./elements/loader";
import * as LoginPage from "./pages/login";
import * as RegisterCaptchaModal from "./modals/register-captcha";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
  linkWithPopup,
  User as UserType,
  AuthProvider,
} from "firebase/auth";
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
import * as ConnectionState from "./states/connection";
import { navigate } from "./controllers/route-controller";
import { getActiveFunboxesWithFunction } from "./test/funbox/list";
import * as Sentry from "./sentry";
import { tryCatch } from "@monkeytype/util/trycatch";
import * as AuthEvent from "./observables/auth-event";

export const gmailProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

async function sendVerificationEmail(): Promise<void> {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }

  Loader.show();
  $(".sendVerificationEmail").prop("disabled", true);
  const result = await Ape.users.verificationEmail();
  $(".sendVerificationEmail").prop("disabled", false);
  if (result.status !== 200) {
    Loader.hide();
    Notifications.add(
      "Failed to request verification email: " + result.body.message,
      -1
    );
  } else {
    Loader.hide();
    Notifications.add("Verification email sent", 1);
  }
}

async function getDataAndInit(): Promise<boolean> {
  try {
    console.log("getting account data");
    const snapshot = await DB.initSnapshot();

    if (snapshot === false) {
      throw new Error(
        "Snapshot didn't initialize due to lacking authentication even though user is authenticated"
      );
    }

    void Sentry.setUser(snapshot.uid, snapshot.name);
    if (snapshot.needsToChangeName) {
      Notifications.addPSA(
        "You need to update your account name. <a class='openNameChange'>Click here</a> to change it and learn more about why.",
        -1,
        undefined,
        true,
        undefined,
        true
      );
    }

    const areConfigsEqual =
      JSON.stringify(Config) === JSON.stringify(snapshot.config);

    if (Config === undefined || !areConfigsEqual) {
      console.log(
        "no local config or local and db configs are different - applying db"
      );
      await UpdateConfig.apply(snapshot.config);
      UpdateConfig.saveFullConfigToLocalStorage(true);

      //funboxes might be different and they wont activate on the account page
      for (const fb of getActiveFunboxesWithFunction("applyGlobalCSS")) {
        fb.functions.applyGlobalCSS();
      }
    }
    return true;
  } catch (error) {
    console.error(error);
    LoginPage.enableInputs();
    $("header nav .view-account").css("opacity", 1);
    if (error instanceof DB.SnapshotInitError) {
      if (error.responseCode === 429) {
        Notifications.add(
          "Doing so will save you bandwidth, make the next test be ready faster and will not sign you out (which could mean your new personal best would not save to your account).",
          0,
          {
            duration: 0,
          }
        );
        Notifications.add(
          "You will run into this error if you refresh the website to restart the test. It is NOT recommended to do that. Instead, use tab + enter or just tab (with quick tab mode enabled) to restart the test.",
          0,
          {
            duration: 0,
          }
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
  user: UserType | null
): Promise<void> {
  console.debug(`account controller ready`);

  let userPromise: Promise<void> = Promise.resolve();

  if (authInitialisedAndConnected) {
    console.debug(`auth state changed, user ${user ? "true" : "false"}`);
    console.debug(user);
    if (user) {
      userPromise = loadUser(user);
    } else {
      DB.setSnapshot(undefined);
    }
  }

  if (!authInitialisedAndConnected || !user) {
    void Sentry.clearUser();
  }

  let keyframes = [
    {
      percentage: 90,
      durationMs: 1000,
      text: "Downloading user data...",
    },
  ];

  //undefined means navigate to whatever the current window.location.pathname is
  await navigate(undefined, {
    force: true,
    loadingOptions: {
      shouldLoad: () => {
        return user !== null;
      },
      waitFor: async () => {
        await userPromise;
      },
      style: "bar",
      keyframes: keyframes,
    },
  });

  AuthEvent.dispatch({
    type: "authStateChanged",
    data: { isUserSignedIn: user !== null },
  });
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1);
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  LoginPage.showPreloader();
  LoginPage.disableInputs();
  LoginPage.disableSignUpButton();

  if (email === "" || password === "") {
    Notifications.add("Please fill in all fields", 0);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.enableSignUpButton();
    return;
  }

  const rememberMe = $(".pageLogin .login #rememberMe input").prop(
    "checked"
  ) as boolean;

  const { error } = await tryCatch(
    signInWithEmailAndPassword(email, password, rememberMe)
  );

  if (error !== null) {
    Notifications.add(error.message, -1);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }
}

async function signInWithProvider(provider: AuthProvider): Promise<void> {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  LoginPage.showPreloader();
  LoginPage.disableInputs();
  LoginPage.disableSignUpButton();
  const rememberMe = $(".pageLogin .login #rememberMe input").prop(
    "checked"
  ) as boolean;

  const { error } = await tryCatch(signInWithPopup(provider, rememberMe));

  if (error !== null) {
    if (error.message !== "") {
      Notifications.add(error.message, -1);
    }
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }
}

async function signInWithGoogle(): Promise<void> {
  return signInWithProvider(gmailProvider);
}

async function signInWithGitHub(): Promise<void> {
  return signInWithProvider(githubProvider);
}

async function addGoogleAuth(): Promise<void> {
  return addAuthProvider("Google", gmailProvider);
}

async function addGithubAuth(): Promise<void> {
  return addAuthProvider("GitHub", githubProvider);
}

async function addAuthProvider(
  providerName: string,
  provider: AuthProvider
): Promise<void> {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  Loader.show();
  const user = getAuthenticatedUser();
  if (!user) return;
  try {
    await linkWithPopup(user, provider);
    Loader.hide();
    Notifications.add(`${providerName} authentication added`, 1);
    AuthEvent.dispatch({ type: "authConfigUpdated" });
  } catch (error) {
    Loader.hide();
    const message = Misc.createErrorMessage(
      error,
      `Failed to add ${providerName} authentication`
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

async function signUp(): Promise<void> {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  await RegisterCaptchaModal.show();
  const captchaToken = await RegisterCaptchaModal.promise;
  if (captchaToken === undefined || captchaToken === "") {
    Notifications.add("Please complete the captcha", -1);
    return;
  }
  LoginPage.disableInputs();
  LoginPage.disableSignUpButton();
  LoginPage.showPreloader();

  const signupData = LoginPage.getSignupData();
  if (signupData === false) {
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    Notifications.add("Please fill in all fields", 0);
    return;
  }
  const { name: nname, email, password } = signupData;

  try {
    const createdAuthUser = await createUserWithEmailAndPassword(
      email,
      password
    );

    const signInResponse = await Ape.users.create({
      body: {
        name: nname,
        captcha: captchaToken,
        email,
        uid: createdAuthUser.user.uid,
      },
    });
    if (signInResponse.status !== 200) {
      throw new Error(`Failed to sign in: ${signInResponse.body.message}`);
    }

    await updateProfile(createdAuthUser.user, { displayName: nname });
    await sendVerificationEmail();
    LoginPage.hidePreloader();
    await onAuthStateChanged(true, createdAuthUser.user);
    resetIgnoreAuthCallback();

    Notifications.add("Account created", 1);
  } catch (e) {
    let message = Misc.createErrorMessage(e, "Failed to create account");

    if (e instanceof Error) {
      if ("code" in e && e.code === "auth/email-already-in-use") {
        message = Misc.createErrorMessage(
          { message: "Email already in use" },
          "Failed to create account"
        );
      }
    }

    Notifications.add(message, -1);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    signOut();
    return;
  }
}

$(".pageLogin .login form").on("submit", (e) => {
  e.preventDefault();
  const email =
    ($(".pageLogin .login input")[0] as HTMLInputElement).value ?? "";
  const password =
    ($(".pageLogin .login input")[1] as HTMLInputElement).value ?? "";
  void signIn(email, password);
});

$(".pageLogin .login button.signInWithGoogle").on("click", () => {
  void signInWithGoogle();
});

$(".pageLogin .login button.signInWithGitHub").on("click", () => {
  void signInWithGitHub();
});

$("nav .accountButtonAndMenu .menu button.signOut").on("click", () => {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  signOut();
});

$(".pageLogin .register form").on("submit", (e) => {
  e.preventDefault();
  void signUp();
});

$(".pageAccountSettings").on("click", "#addGoogleAuth", () => {
  void addGoogleAuth();
});
$(".pageAccountSettings").on("click", "#addGithubAuth", () => {
  void addGithubAuth();
});

$(".pageAccount").on("click", ".sendVerificationEmail", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  void sendVerificationEmail();
});
