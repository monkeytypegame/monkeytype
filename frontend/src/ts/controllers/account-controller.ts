import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import Config, * as UpdateConfig from "../config";
import * as AccountButton from "../elements/account-button";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Settings from "../pages/settings";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";
import * as Loader from "../elements/loader";
import * as PageTransition from "../states/page-transition";
import * as ActivePage from "../states/active-page";
import * as LoadingPage from "../pages/loading";
import * as LoginPage from "../pages/login";
import * as ResultFilters from "../elements/account/result-filters";
import * as TagController from "./tag-controller";
import * as RegisterCaptchaModal from "../modals/register-captcha";
import * as URLHandler from "../utils/url-handler";
import * as Account from "../pages/account";
import * as Alerts from "../elements/alerts";
import * as SignInOutButton from "../elements/sign-in-out-button";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  browserSessionPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  updateProfile,
  linkWithPopup,
  getAdditionalUserInfo,
  User as UserType,
  Unsubscribe,
  AuthProvider,
} from "firebase/auth";
import { Auth, getAuthenticatedUser, isAuthenticated } from "../firebase";
import { dispatch as dispatchSignUpEvent } from "../observables/google-sign-up-event";
import {
  hideFavoriteQuoteLength,
  showFavoriteQuoteLength,
} from "../test/test-config";
import * as ConnectionState from "../states/connection";
import { navigate } from "./route-controller";
import { getHtmlByUserFlags } from "./user-flag-controller";

let signedOutThisSession = false;

export const gmailProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

async function sendVerificationEmail(): Promise<void> {
  if (Auth === undefined) {
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
      "Failed to request verification email: " + result.message,
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
    if (window.location.pathname !== "/account") {
      LoadingPage.updateBar(90);
    } else {
      LoadingPage.updateBar(45);
    }
    LoadingPage.updateText("Downloading user data...");
    await LoadingPage.showBar();
    await DB.initSnapshot();
  } catch (error) {
    const e = error as { message: string; responseCode: number };
    AccountButton.loading(false);
    if (e.responseCode === 429) {
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
    const msg = e.message || "Unknown error";
    Notifications.add("Failed to get user data: " + msg, -1);
    console.error(e);

    $("header nav .account").css("opacity", 1);
    return false;
  }
  if (ActivePage.get() === "loading") {
    LoadingPage.updateBar(100);
  } else {
    LoadingPage.updateBar(45);
  }
  LoadingPage.updateText("Applying settings...");
  const snapshot = DB.getSnapshot() as MonkeyTypes.Snapshot;
  $("nav .textButton.account > .text").text(snapshot.name);
  $("nav .textButton.account > .text").append(
    getHtmlByUserFlags(snapshot, { iconsOnly: true })
  );
  showFavoriteQuoteLength();

  ResultFilters.loadTags(snapshot.tags);

  Promise.all([JSONData.getLanguageList(), JSONData.getFunboxList()])
    .then((values) => {
      const [languages, funboxes] = values;
      languages.forEach((language) => {
        ResultFilters.defaultResultFilters.language[language] = true;
      });
      funboxes.forEach((funbox) => {
        ResultFilters.defaultResultFilters.funbox[funbox.name] = true;
      });
      // filters = defaultResultFilters;
      void ResultFilters.load();
    })
    .catch((e) => {
      console.log(
        Misc.createErrorMessage(
          e,
          "Something went wrong while loading the filters"
        )
      );
    });

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

  if (UpdateConfig.localStorageConfig === undefined || !areConfigsEqual) {
    console.log(
      "no local config or local and db configs are different - applying db"
    );
    await UpdateConfig.apply(snapshot.config);
    UpdateConfig.saveFullConfigToLocalStorage(true);
  }
  AccountButton.loading(false);
  TagController.loadActiveFromLocalStorage();
  if (window.location.pathname === "/account") {
    LoadingPage.updateBar(90);
    await Account.downloadResults();
  }
  if (window.location.pathname === "/login") {
    navigate("/account");
  } else {
    navigate();
  }
  return true;
}

export async function loadUser(user: UserType): Promise<void> {
  // User is signed in.
  PageTransition.set(false);
  AccountButton.loading(true);
  if (!(await getDataAndInit())) {
    signOut();
  }
  const { discordId, discordAvatar, xp, inboxUnreadSize } =
    DB.getSnapshot() as MonkeyTypes.Snapshot;
  void AccountButton.update(xp, discordId, discordAvatar);
  Alerts.setNotificationBubbleVisible(inboxUnreadSize > 0);
  // var displayName = user.displayName;
  // var email = user.email;
  // var emailVerified = user.emailVerified;
  // var photoURL = user.photoURL;
  // var isAnonymous = user.isAnonymous;
  // var uid = user.uid;
  // var providerData = user.providerData;
  LoginPage.hidePreloader();

  $("header .signInOut .icon").html(
    `<i class="fas fa-fw fa-sign-out-alt"></i>`
  );

  // showFavouriteThemesAtTheTop();

  if (TestLogic.notSignedInLastResult !== null && !signedOutThisSession) {
    TestLogic.setNotSignedInUid(user.uid);

    const response = await Ape.results.save(TestLogic.notSignedInLastResult);

    if (response.status !== 200) {
      return Notifications.add(
        "Failed to save last result: " + response.message,
        -1
      );
    }

    TestLogic.clearNotSignedInResult();
    Notifications.add("Last test result saved", 1);
  }
}

async function readyFunction(
  authInitialisedAndConnected: boolean,
  user: UserType | null
): Promise<void> {
  const search = window.location.search;
  const hash = window.location.hash;
  console.debug(`account controller ready`);
  if (authInitialisedAndConnected) {
    console.debug(`auth state changed, user ${user ? true : false}`);
    console.debug(user);
    if (user) {
      await loadUser(user);
    } else {
      if (window.location.pathname === "/account") {
        window.history.replaceState("", "", "/login");
      }
      PageTransition.set(false);
      navigate();
    }
  } else {
    console.debug(`auth not initialised or not connected`);
    if (window.location.pathname === "/account") {
      window.history.replaceState("", "", "/login");
    }
    PageTransition.set(false);
    navigate();
  }

  SignInOutButton.update();

  URLHandler.loadCustomThemeFromUrl(search);
  URLHandler.loadTestSettingsFromUrl(search);
  URLHandler.loadChallengeFromUrl(search);
  void URLHandler.linkDiscord(hash);

  Settings.updateAuthSections();
}

let disableAuthListener: Unsubscribe;

if (Auth && ConnectionState.get()) {
  disableAuthListener = Auth?.onAuthStateChanged(function (user) {
    void readyFunction(true, user);
  });
} else {
  $((): void => {
    void readyFunction(false, null);
  });
}

async function signIn(): Promise<void> {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1);
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  disableAuthListener();
  LoginPage.showPreloader();
  LoginPage.disableInputs();
  LoginPage.disableSignUpButton();
  const email = ($(".pageLogin .login input")[0] as HTMLInputElement).value;
  const password = ($(".pageLogin .login input")[1] as HTMLInputElement).value;

  if (email === "" || password === "") {
    Notifications.add("Please fill in all fields", 0);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.enableSignUpButton();
    return;
  }

  const persistence = ($(".pageLogin .login #rememberMe input").prop(
    "checked"
  ) as boolean)
    ? browserLocalPersistence
    : browserSessionPersistence;

  await setPersistence(Auth, persistence);
  return signInWithEmailAndPassword(Auth, email, password)
    .then(async (e) => {
      await loadUser(e.user);
    })
    .catch(function (error) {
      console.error(error);
      let message = error.message;
      if (error.code === "auth/wrong-password") {
        message = "Incorrect password";
      } else if (error.code === "auth/user-not-found") {
        message = "User not found";
      } else if (error.code === "auth/invalid-email") {
        message =
          "Invalid email format (make sure you are using your email to login - not your username)";
      } else if (error.code === "auth/invalid-credential") {
        message =
          "Email/password is incorrect or your account does not have password authentication enabled.";
      }
      Notifications.add(message, -1);
      LoginPage.hidePreloader();
      LoginPage.enableInputs();
      LoginPage.updateSignupButton();
    });
}

async function signInWithProvider(provider: AuthProvider): Promise<void> {
  if (Auth === undefined) {
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
  disableAuthListener();
  const persistence = ($(".pageLogin .login #rememberMe input").prop(
    "checked"
  ) as boolean)
    ? browserLocalPersistence
    : browserSessionPersistence;

  await setPersistence(Auth, persistence);
  signInWithPopup(Auth, provider)
    .then(async (signedInUser) => {
      if (getAdditionalUserInfo(signedInUser)?.isNewUser) {
        dispatchSignUpEvent(signedInUser, true);
      } else {
        await loadUser(signedInUser.user);
      }
    })
    .catch((error) => {
      console.log(error);
      let message = error.message;
      if (error.code === "auth/wrong-password") {
        message = "Incorrect password";
      } else if (error.code === "auth/user-not-found") {
        message = "User not found";
      } else if (error.code === "auth/invalid-email") {
        message =
          "Invalid email format (make sure you are using your email to login - not your username)";
      } else if (error.code === "auth/popup-closed-by-user") {
        message = "";
        // message = "Popup closed by user";
        // return;
      } else if (error.code === "auth/user-cancelled") {
        message = "";
        // message = "User refused to sign in";
        // return;
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        message =
          "Account already exists, but its using a different authentication method. Try signing in with a different method";
      }
      if (message !== "") {
        Notifications.add(message, -1);
      }
      LoginPage.hidePreloader();
      LoginPage.enableInputs();
      LoginPage.updateSignupButton();
    });
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
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  Loader.show();
  if (!isAuthenticated()) return;
  linkWithPopup(getAuthenticatedUser(), provider)
    .then(function () {
      Loader.hide();
      Notifications.add(`${providerName} authentication added`, 1);
      Settings.updateAuthSections();
    })
    .catch(function (error) {
      Loader.hide();
      Notifications.add(
        `Failed to add ${providerName} authentication: ` + error.message,
        -1
      );
    });
}

export function signOut(): void {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  if (!isAuthenticated()) return;
  Auth.signOut()
    .then(function () {
      Notifications.add("Signed out", 0, {
        duration: 2,
      });
      Settings.hideAccountSection();
      void AccountButton.update();
      navigate("/login");
      DB.setSnapshot(undefined);
      $("header .signInOut .icon").html(`<i class="far fa-fw fa-user"></i>`);
      setTimeout(() => {
        hideFavoriteQuoteLength();
      }, 125);
    })
    .catch(function (error) {
      Notifications.add(error.message, -1);
    });
}

async function signUp(): Promise<void> {
  if (Auth === undefined) {
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
  const nname = ($(".pageLogin .register input")[0] as HTMLInputElement).value;
  const email = ($(".pageLogin .register input")[1] as HTMLInputElement).value;
  const emailVerify = ($(".pageLogin .register input")[2] as HTMLInputElement)
    .value;
  const password = ($(".pageLogin .register input")[3] as HTMLInputElement)
    .value;
  const passwordVerify = (
    $(".pageLogin .register input")[4] as HTMLInputElement
  ).value;

  if (nname === "" || email === "" || emailVerify === "" || password === "") {
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    Notifications.add("Please fill in all fields", 0);
    return;
  }

  if (
    !email.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    Notifications.add("Invalid email", 0);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  if (email !== emailVerify) {
    Notifications.add("Emails do not match", 0);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  if (password !== passwordVerify) {
    Notifications.add("Passwords do not match", 0);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  // Force user to use a capital letter, number, special character and reasonable length when setting up an account and changing password
  if (!Misc.isDevEnvironment() && !Misc.isPasswordStrong(password)) {
    Notifications.add(
      "Password must contain at least one capital letter, number, a special character and must be between 8 and 64 characters long",
      0,
      {
        duration: 4,
      }
    );
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  disableAuthListener();

  try {
    const createdAuthUser = await createUserWithEmailAndPassword(
      Auth,
      email,
      password
    );

    const signInResponse = await Ape.users.create(
      nname,
      captchaToken,
      email,
      createdAuthUser.user.uid
    );
    if (signInResponse.status !== 200) {
      throw new Error(`Failed to sign in: ${signInResponse.message}`);
    }

    await updateProfile(createdAuthUser.user, { displayName: nname });
    await sendVerificationEmail();
    $("nav .textButton.account .text").text(nname);
    LoginPage.hidePreloader();
    await loadUser(createdAuthUser.user);
    if (TestLogic.notSignedInLastResult !== null) {
      TestLogic.setNotSignedInUid(createdAuthUser.user.uid);

      const response = await Ape.results.save(TestLogic.notSignedInLastResult);

      if (response.status === 200) {
        const result = TestLogic.notSignedInLastResult;
        DB.saveLocalResult(result);
        DB.updateLocalStats(
          1,
          result.testDuration +
            result.incompleteTestSeconds -
            result.afkDuration
        );
      }
    }
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
  void signIn();
});

$(".pageLogin .login button.signInWithGoogle").on("click", () => {
  void signInWithGoogle();
});

$(".pageLogin .login button.signInWithGitHub").on("click", () => {
  void signInWithGitHub();
});

$("header .signInOut").on("click", () => {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  if (isAuthenticated()) {
    signOut();
    signedOutThisSession = true;
  } else {
    navigate("/login");
  }
});

$(".pageLogin .register form").on("submit", (e) => {
  e.preventDefault();
  void signUp();
});

$(".pageSettings #addGoogleAuth").on("click", async () => {
  void addGoogleAuth();
});

$(".pageSettings #addGithubAuth").on("click", async () => {
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
