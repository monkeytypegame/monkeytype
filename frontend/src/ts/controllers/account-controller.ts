import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import Config, * as UpdateConfig from "../config";
import * as AccountButton from "../elements/account-button";
import * as Misc from "../utils/misc";
import * as Settings from "../pages/settings";
import * as AllTimeStats from "../account/all-time-stats";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";
import * as Loader from "../elements/loader";
import * as PageTransition from "../states/page-transition";
import * as ActivePage from "../states/active-page";
import * as TestActive from "../states/test-active";
import * as LoadingPage from "../pages/loading";
import * as LoginPage from "../pages/login";
import * as ResultFilters from "../account/result-filters";
import * as PaceCaret from "../test/pace-caret";
import * as TagController from "./tag-controller";
import * as ResultTagsPopup from "../popups/result-tags-popup";
import * as RegisterCaptchaPopup from "../popups/register-captcha-popup";
import * as URLHandler from "../utils/url-handler";
import * as Account from "../pages/account";
import * as Alerts from "../elements/alerts";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  browserSessionPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  updateProfile,
  linkWithPopup,
  linkWithCredential,
  reauthenticateWithPopup,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  User as UserType,
  Unsubscribe,
} from "firebase/auth";
import { Auth } from "../firebase";
import { dispatch as dispatchSignUpEvent } from "../observables/google-sign-up-event";
import {
  hideFavoriteQuoteLength,
  showFavoriteQuoteLength,
} from "../test/test-config";
import { navigate } from "../observables/navigate-event";
import { update as updateTagsCommands } from "../commandline/lists/tags";
import * as ConnectionState from "../states/connection";

export const gmailProvider = new GoogleAuthProvider();
let canCall = true;

export function sendVerificationEmail(): void {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  Loader.show();
  const user = Auth.currentUser;
  if (user === null) return;
  sendEmailVerification(user)
    .then(() => {
      Loader.hide();
      Notifications.add("Email sent to " + user.email, 4000);
    })
    .catch((e) => {
      Loader.hide();
      Notifications.add("Error: " + e.message, 3000);
      console.error(e.message);
    });
}

export async function getDataAndInit(): Promise<boolean> {
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
        0
      );
      Notifications.add(
        "You will run into this error if you refresh the website to restart the test. It is NOT recommended to do that. Instead, use tab + enter or just tab (with quick tab mode enabled) to restart the test.",
        0,
        0
      );
    }
    const msg = e.message || e;
    Notifications.add("Failed to get user data: " + msg, -1);

    $("#top #menu .account").css("opacity", 1);
    return false;
  }
  if (ActivePage.get() == "loading") {
    LoadingPage.updateBar(100);
  } else {
    LoadingPage.updateBar(45);
  }
  LoadingPage.updateText("Applying settings...");
  const snapshot = DB.getSnapshot() as MonkeyTypes.Snapshot;
  $("#menu .textButton.account > .text").text(snapshot.name);
  showFavoriteQuoteLength();

  ResultFilters.loadTags(snapshot.tags);

  Promise.all([Misc.getLanguageList(), Misc.getFunboxList()])
    .then((values) => {
      const [languages, funboxes] = values;
      languages.forEach((language) => {
        ResultFilters.defaultResultFilters.language[language] = true;
      });
      funboxes.forEach((funbox) => {
        ResultFilters.defaultResultFilters.funbox[funbox.name] = true;
      });
      // filters = defaultResultFilters;
      ResultFilters.load();
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
    Notifications.addBanner(
      "Your name was reset. <a class='openNameChange'>Click here</a> to change it and learn more about why.",
      -1,
      undefined,
      true,
      undefined,
      true
    );
  }
  if (!UpdateConfig.changedBeforeDb) {
    //config didnt change before db loaded
    if (UpdateConfig.localStorageConfig === null && snapshot.config) {
      console.log("no local config, applying db");
      AccountButton.loading(false);
      UpdateConfig.apply(snapshot.config);
      Settings.update();
      UpdateConfig.saveFullConfigToLocalStorage(true);
      TestLogic.restart({
        nosave: true,
      });
    } else if (snapshot.config !== undefined) {
      //loading db config, keep for now
      let configsDifferent = false;
      Object.keys(Config).forEach((ke) => {
        const key = ke as keyof typeof Config;
        if (configsDifferent) return;
        try {
          if (key !== "resultFilters") {
            if (Array.isArray(Config[key])) {
              (Config[key] as string[]).forEach((arrval, index) => {
                const arrayValue = (
                  snapshot?.config?.[key] as
                    | string[]
                    | MonkeyTypes.QuoteLength[]
                    | MonkeyTypes.CustomBackgroundFilter
                )[index];
                if (arrval != arrayValue) {
                  configsDifferent = true;
                  console.log(
                    `.config is different: ${arrval} != ${arrayValue}`
                  );
                }
              });
            } else {
              if (Config[key] != snapshot?.config?.[key]) {
                configsDifferent = true;
                console.log(
                  `..config is different ${key}: ${Config[key]} != ${snapshot?.config?.[key]}`
                );
              }
            }
          }
        } catch (e) {
          console.log(e);
          configsDifferent = true;
          console.log(`...config is different`);
        }
      });
      if (configsDifferent) {
        console.log("configs are different, applying config from db");
        AccountButton.loading(false);
        UpdateConfig.apply(snapshot.config);
        Settings.update();
        UpdateConfig.saveFullConfigToLocalStorage(true);
        if (ActivePage.get() == "test") {
          TestLogic.restart({
            nosave: true,
          });
        }
        AccountButton.loading(true);
        DB.saveConfig(Config).then(() => {
          AccountButton.loading(false);
        });
      }
    }
    UpdateConfig.setDbConfigLoaded(true);
  } else {
    console.log("config changed before db");
    AccountButton.loading(false);
  }
  if (Config.paceCaret === "pb" || Config.paceCaret === "average") {
    if (!TestActive.get()) {
      PaceCaret.init();
    }
  }
  AccountButton.loading(false);
  ResultFilters.updateTags();
  updateTagsCommands();
  TagController.loadActiveFromLocalStorage();
  ResultTagsPopup.updateButtons();
  Settings.showAccountSection();
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
  $(".pageAccount .content p.accountVerificatinNotice").remove();
  if (user.emailVerified === false) {
    $(".pageAccount .content").prepend(
      `<p class="accountVerificatinNotice" style="text-align:center">Your account is not verified. <a class="sendVerificationEmail">Send the verification email again</a>.`
    );
  }
  PageTransition.set(false);
  AccountButton.loading(true);
  if ((await getDataAndInit()) === false) {
    signOut();
  }
  const { discordId, discordAvatar, xp, inboxUnreadSize } =
    DB.getSnapshot() as MonkeyTypes.Snapshot;
  AccountButton.update(xp, discordId, discordAvatar);
  Alerts.setNotificationBubbleVisible(inboxUnreadSize > 0);
  // var displayName = user.displayName;
  // var email = user.email;
  // var emailVerified = user.emailVerified;
  // var photoURL = user.photoURL;
  // var isAnonymous = user.isAnonymous;
  // var uid = user.uid;
  // var providerData = user.providerData;
  LoginPage.hidePreloader();

  $("#top .signInOut .icon").html(`<i class="fas fa-fw fa-sign-out-alt"></i>`);

  // showFavouriteThemesAtTheTop();

  if (TestLogic.notSignedInLastResult !== null) {
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

let authListener: Unsubscribe;

// eslint-disable-next-line no-constant-condition
if (Auth && ConnectionState.get()) {
  authListener = Auth?.onAuthStateChanged(async function (user) {
    // await UpdateConfig.loadPromise;
    const search = window.location.search;
    const hash = window.location.hash;
    console.log(`auth state changed, user ${user ? true : false}`);
    if (user) {
      $("#top .signInOut .icon").html(
        `<i class="fas fa-fw fa-sign-out-alt"></i>`
      );
      await loadUser(user);
    } else {
      $("#top .signInOut .icon").html(`<i class="far fa-fw fa-user"></i>`);
      if (window.location.pathname == "/account") {
        window.history.replaceState("", "", "/login");
      }
      PageTransition.set(false);
    }
    if (!user) {
      navigate();
    }

    URLHandler.loadCustomThemeFromUrl(search);
    URLHandler.loadTestSettingsFromUrl(search);
    URLHandler.linkDiscord(hash);

    if (/challenge_.+/g.test(window.location.pathname)) {
      Notifications.add(
        "Challenge links temporarily disabled. Please use the command line to load the challenge manually",
        0,
        7
      );
      return;
      // Notifications.add("Loading challenge", 0);
      // let challengeName = window.location.pathname.split("_")[1];
      // setTimeout(() => {
      //   ChallengeController.setup(challengeName);
      // }, 1000);
    }
  });
} else {
  $("#menu .signInOut").addClass("hidden");

  $("document").ready(async () => {
    // await UpdateConfig.loadPromise;
    const search = window.location.search;
    const hash = window.location.hash;
    $("#top .signInOut .icon").html(`<i class="far fa-fw fa-user"></i>`);
    if (window.location.pathname == "/account") {
      window.history.replaceState("", "", "/login");
    }
    PageTransition.set(false);
    navigate();

    URLHandler.loadCustomThemeFromUrl(search);
    URLHandler.loadTestSettingsFromUrl(search);
    URLHandler.linkDiscord(hash);

    if (/challenge_.+/g.test(window.location.pathname)) {
      Notifications.add(
        "Challenge links temporarily disabled. Please use the command line to load the challenge manually",
        0,
        7
      );
      return;
    }
  });
}

export async function signIn(): Promise<void> {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, 2);
    return;
  }

  UpdateConfig.setChangedBeforeDb(false);
  authListener();
  LoginPage.showPreloader();
  LoginPage.disableInputs();
  LoginPage.disableSignUpButton();
  LoginPage.disableSignInButton();
  const email = ($(".pageLogin .login input")[0] as HTMLInputElement).value;
  const password = ($(".pageLogin .login input")[1] as HTMLInputElement).value;

  if (email === "" || password === "") {
    Notifications.add("Please fill in all fields", 0);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.enableSignUpButton();
    LoginPage.enableSignInButton();
    return;
  }

  const persistence = $(".pageLogin .login #rememberMe input").prop("checked")
    ? browserLocalPersistence
    : browserSessionPersistence;

  await setPersistence(Auth, persistence);
  return signInWithEmailAndPassword(Auth, email, password)
    .then(async (e) => {
      await loadUser(e.user);
    })
    .catch(function (error) {
      let message = error.message;
      if (error.code === "auth/wrong-password") {
        message = "Incorrect password";
      } else if (error.code === "auth/user-not-found") {
        message = "User not found";
      } else if (error.code === "auth/invalid-email") {
        message =
          "Invalid email format (make sure you are using your email to login - not your username)";
      }
      Notifications.add(message, -1);
      LoginPage.hidePreloader();
      LoginPage.enableInputs();
      LoginPage.enableSignInButton();
      LoginPage.updateSignupButton();
    });
}

export async function forgotPassword(email: any): Promise<void> {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  if (!canCall) {
    return Notifications.add(
      "Please wait before requesting another password reset link",
      0,
      5000
    );
  }
  if (!email) return Notifications.add("Please enter an email!", -1);

  try {
    await sendPasswordResetEmail(Auth, email);
    Notifications.add("Email sent", 1, 2);
  } catch (error) {
    Notifications.add(
      Misc.createErrorMessage(error, "Failed to send email"),
      -1
    );
  }
  canCall = false;
  setTimeout(function () {
    canCall = true;
  }, 10000);
}

export async function signInWithGoogle(): Promise<void> {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, 2);
    return;
  }

  UpdateConfig.setChangedBeforeDb(false);
  LoginPage.showPreloader();
  LoginPage.disableInputs();
  LoginPage.disableSignUpButton();
  LoginPage.disableSignInButton();
  authListener();
  const persistence = $(".pageLogin .login #rememberMe input").prop("checked")
    ? browserLocalPersistence
    : browserSessionPersistence;

  await setPersistence(Auth, persistence);
  signInWithPopup(Auth, gmailProvider)
    .then(async (signedInUser) => {
      if (getAdditionalUserInfo(signedInUser)?.isNewUser) {
        dispatchSignUpEvent(signedInUser, true);
      } else {
        await loadUser(signedInUser.user);
      }
    })
    .catch((error) => {
      let message = error.message;
      if (error.code === "auth/wrong-password") {
        message = "Incorrect password";
      } else if (error.code === "auth/user-not-found") {
        message = "User not found";
      } else if (error.code === "auth/invalid-email") {
        message =
          "Invalid email format (make sure you are using your email to login - not your username)";
      } else if (error.code === "auth/popup-closed-by-user") {
        message = "Popup closed by user";
      }
      Notifications.add(message, -1);
      LoginPage.hidePreloader();
      LoginPage.enableInputs();
      LoginPage.enableSignInButton();
      LoginPage.updateSignupButton();
    });
}

export async function addGoogleAuth(): Promise<void> {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  Loader.show();
  if (Auth.currentUser === null) return;
  linkWithPopup(Auth.currentUser, gmailProvider)
    .then(function () {
      Loader.hide();
      Notifications.add("Google authentication added", 1);
      Settings.updateAuthSections();
    })
    .catch(function (error) {
      Loader.hide();
      Notifications.add(
        "Failed to add Google authentication: " + error.message,
        -1
      );
    });
}

export async function addPasswordAuth(
  email: string,
  password: string
): Promise<void> {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  Loader.show();
  const user = Auth.currentUser;
  if (user === null) return;
  if (
    user.providerData.find((provider) => provider.providerId === "google.com")
  ) {
    try {
      await reauthenticateWithPopup(user, gmailProvider);
    } catch (e) {
      Loader.hide();
      const message = Misc.createErrorMessage(e, "Failed to reauthenticate");
      return Notifications.add(message, -1);
    }
  }

  const credential = EmailAuthProvider.credential(email, password);
  linkWithCredential(user, credential)
    .then(function () {
      Loader.hide();
      Notifications.add("Password authentication added", 1);
      Settings.updateAuthSections();
    })
    .catch(function (error) {
      Loader.hide();
      Notifications.add(
        "Failed to add password authentication: " + error.message,
        -1
      );
    });
}

export function signOut(): void {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  if (!Auth.currentUser) return;
  Auth.signOut()
    .then(function () {
      Notifications.add("Signed out", 0, 2);
      AllTimeStats.clear();
      Settings.hideAccountSection();
      AccountButton.update();
      navigate("/login");
      DB.setSnapshot(undefined);
      $(".pageLogin .button").removeClass("disabled");
      $(".pageLogin input").prop("disabled", false);
      $("#top .signInOut .icon").html(`<i class="far fa-fw fa-user"></i>`);
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
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, 2);
    return;
  }
  RegisterCaptchaPopup.show();
  const captcha = await RegisterCaptchaPopup.promise;
  if (!captcha) {
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

  if (password.length > 25) {
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    Notifications.add("Password is too long", 0);
    return;
  }

  if (
    !email.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    Notifications.add("Invalid email", 0, 3);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  if (email !== emailVerify) {
    Notifications.add("Emails do not match", 0, 3);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  if (password !== passwordVerify) {
    Notifications.add("Passwords do not match", 0, 3);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  // Force user to use a capital letter, number, special character when setting up an account and changing password
  if (
    window.location.hostname !== "localhost" &&
    !Misc.isPasswordStrong(password)
  ) {
    Notifications.add(
      "Password must contain at least one capital letter, number, a special character and at least 8 characters long",
      0,
      4
    );
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    return;
  }

  authListener();

  let createdAuthUser;
  try {
    createdAuthUser = await createUserWithEmailAndPassword(
      Auth,
      email,
      password
    );

    const signInResponse = await Ape.users.create(
      nname,
      captcha,
      email,
      createdAuthUser.user.uid
    );
    if (signInResponse.status !== 200) {
      throw signInResponse;
    }

    await updateProfile(createdAuthUser.user, { displayName: nname });
    await sendEmailVerification(createdAuthUser.user);
    AllTimeStats.clear();
    $("#menu .textButton.account .text").text(nname);
    $(".pageLogin .button").removeClass("disabled");
    $(".pageLogin input").prop("disabled", false);
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
    Notifications.add("Account created", 1, 3);
  } catch (e) {
    //make sure to do clean up here
    if (createdAuthUser) {
      try {
        await Ape.users.delete();
      } catch (e) {
        // account might already be deleted
      }
      try {
        await createdAuthUser.user.delete();
      } catch (e) {
        // account might already be deleted
      }
    }
    console.log(e);
    const message = Misc.createErrorMessage(e, "Failed to create account");
    Notifications.add(message, -1);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.updateSignupButton();
    signOut();
    return;
  }
}

$(".pageLogin #forgotPasswordButton").on("click", () => {
  const emailField =
    ($(".pageLogin .login input")[0] as HTMLInputElement).value || "";
  const email = prompt("Email address", emailField);
  forgotPassword(email);
});

$(".pageLogin .login input").keyup((e) => {
  if (e.key === "Enter") {
    UpdateConfig.setChangedBeforeDb(false);
    signIn();
  }
});

$(".pageLogin .login .button.signIn").on("click", () => {
  UpdateConfig.setChangedBeforeDb(false);
  signIn();
});

$(".pageLogin .login .button.signInWithGoogle").on("click", () => {
  UpdateConfig.setChangedBeforeDb(false);
  signInWithGoogle();
});

// $(".pageLogin .login .button.signInWithGitHub").on("click",(e) => {
// UpdateConfig.setChangedBeforeDb(false);
// signInWithGitHub();
// });

$("#top .signInOut").on("click", () => {
  if (Auth === undefined) {
    Notifications.add("Authentication uninitialized", -1, 3);
    return;
  }
  if (Auth.currentUser) {
    signOut();
  } else {
    navigate("/login");
  }
});

$(".pageLogin .register input").keyup((e) => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  if (e.key === "Enter") {
    signUp();
  }
});

$(".pageLogin .register .button").on("click", () => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  signUp();
});

$(".pageSettings #addGoogleAuth").on("click", async () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, 2);
    return;
  }
  addGoogleAuth();
});

$(".pageAccount").on("click", ".sendVerificationEmail", () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, 2);
    return;
  }
  sendVerificationEmail();
});
