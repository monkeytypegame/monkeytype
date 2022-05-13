import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import Config, * as UpdateConfig from "../config";
import * as AccountButton from "../elements/account-button";
import * as VerificationController from "./verification-controller";
import * as Misc from "../utils/misc";
import * as Settings from "../pages/settings";
import * as AllTimeStats from "../account/all-time-stats";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";
import * as PageController from "./page-controller";
import * as PSA from "../elements/psa";
import * as Focus from "../test/focus";
import * as Loader from "../elements/loader";
import * as PageTransition from "../states/page-transition";
import * as ActivePage from "../states/active-page";
import * as TestActive from "../states/test-active";
import * as LoadingPage from "../pages/loading";
import * as LoginPage from "../pages/login";
import * as ResultFilters from "../account/result-filters";
import * as PaceCaret from "../test/pace-caret";
import * as CommandlineLists from "../elements/commandline-lists";
import * as TagController from "./tag-controller";
import * as ResultTagsPopup from "../popups/result-tags-popup";
import * as URLHandler from "../utils/url-handler";
import * as Account from "../pages/account";
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
  unlink as unlinkAuth,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  User as UserType,
} from "firebase/auth";
import { Auth } from "../firebase";
import differenceInDays from "date-fns/differenceInDays";
import { defaultSnap } from "../constants/default-snapshot";
import { dispatch as dispatchSignUpEvent } from "../observables/google-sign-up-event";
import {
  hideFavoriteQuoteLength,
  showFavoriteQuoteLength,
} from "../test/test-config";

export const gmailProvider = new GoogleAuthProvider();

export function sendVerificationEmail(): void {
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
    if (ActivePage.get() === "loading") {
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
  const snapshot = DB.getSnapshot();
  $("#menu .text-button.account .text").text(snapshot.name);
  showFavoriteQuoteLength();

  ResultFilters.loadTags(snapshot.tags);

  Promise.all([Misc.getLanguageList(), Misc.getFunboxList()]).then((values) => {
    const [languages, funboxes] = values;
    languages.forEach((language) => {
      ResultFilters.defaultResultFilters.language[language] = true;
    });
    funboxes.forEach((funbox) => {
      ResultFilters.defaultResultFilters.funbox[funbox.name] = true;
    });
    // filters = defaultResultFilters;
    ResultFilters.load();
  });

  if (snapshot.needsToChangeName) {
    Notifications.addBanner(
      "Your name was reset. <a class='openNameChange'>Click here</a> to change it and learn more about why.",
      -1,
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
      TestLogic.restart(false, true);
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
          TestLogic.restart(false, true);
        }
        DB.saveConfig(Config);
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
  CommandlineLists.updateTagCommands();
  TagController.loadActiveFromLocalStorage();
  ResultTagsPopup.updateButtons();
  Settings.showAccountSection();
  if (ActivePage.get() === "account") {
    Account.update();
  } else {
    Focus.set(false);
  }
  await PageController.change(undefined, true);
  PageTransition.set(false);
  console.log("account loading finished");
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
  AccountButton.update();
  AccountButton.loading(true);
  if ((await getDataAndInit()) === false) {
    signOut();
  }
  // var displayName = user.displayName;
  // var email = user.email;
  // var emailVerified = user.emailVerified;
  // var photoURL = user.photoURL;
  // var isAnonymous = user.isAnonymous;
  // var uid = user.uid;
  // var providerData = user.providerData;
  LoginPage.hidePreloader();

  // showFavouriteThemesAtTheTop();

  let text = "Account created on " + user.metadata.creationTime;

  const creationDate = new Date(user.metadata.creationTime as string);
  const diffDays = differenceInDays(new Date(), creationDate);

  text += ` (${diffDays} day${diffDays != 1 ? "s" : ""} ago)`;

  $(".pageAccount .group.createdDate").text(text);

  if (VerificationController.data !== null) {
    VerificationController.verify(user.uid);
  }
}

const authListener = Auth.onAuthStateChanged(async function (user) {
  // await UpdateConfig.loadPromise;
  const search = window.location.search;
  console.log(`auth state changed, user ${user ? true : false}`);
  if (user) {
    await loadUser(user);
  } else {
    if (window.location.pathname == "/account") {
      window.history.replaceState("", "", "/login");
    }
    PageTransition.set(false);
  }
  if (!user) {
    PageController.change();
    setTimeout(() => {
      Focus.set(false);
    }, 125 / 2);
  }

  URLHandler.loadCustomThemeFromUrl(search);
  URLHandler.loadTestSettingsFromUrl(search);
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
  PSA.show();
});

export function signIn(): void {
  UpdateConfig.setChangedBeforeDb(false);
  authListener();
  LoginPage.showPreloader();
  LoginPage.disableInputs();
  const email = ($(".pageLogin .login input")[0] as HTMLInputElement).value;
  const password = ($(".pageLogin .login input")[1] as HTMLInputElement).value;

  const persistence = $(".pageLogin .login #rememberMe input").prop("checked")
    ? browserLocalPersistence
    : browserSessionPersistence;

  setPersistence(Auth, persistence).then(function () {
    return signInWithEmailAndPassword(Auth, email, password)
      .then(async (e) => {
        await loadUser(e.user);
        if (TestLogic.notSignedInLastResult !== null) {
          TestLogic.setNotSignedInUid(e.user.uid);

          const response = await Ape.results.save(
            TestLogic.notSignedInLastResult
          );

          if (response.status !== 200) {
            return Notifications.add(
              "Failed to save last result: " + response.message,
              -1
            );
          }

          TestLogic.clearNotSignedInResult();
          Notifications.add("Last test result saved", 1);
        }
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
      });
  });
}

export async function signInWithGoogle(): Promise<void> {
  UpdateConfig.setChangedBeforeDb(false);
  LoginPage.showPreloader();
  LoginPage.disableInputs();
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
    });
}

export async function addGoogleAuth(): Promise<void> {
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
        "Failed to add Google authenication: " + error.message,
        -1
      );
    });
}

export function noGoogleNoMo(): void {
  const user = Auth.currentUser;
  if (user === null) return;
  if (
    user.providerData.find((provider) => provider.providerId === "password")
  ) {
    unlinkAuth(user, "google.com")
      .then(() => {
        console.log("unlinked");
        Settings.updateAuthSections();
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

export async function removeGoogleAuth(): Promise<void> {
  const user = Auth.currentUser;
  if (user === null) return;
  if (
    user.providerData.find((provider) => provider.providerId === "password")
  ) {
    Loader.show();
    try {
      await reauthenticateWithPopup(user, gmailProvider);
    } catch (e) {
      Loader.hide();
      const message = Misc.createErrorMessage(e, "Failed to reauthenticate");
      return Notifications.add(message, -1);
    }
    unlinkAuth(user, "google.com")
      .then(() => {
        Notifications.add("Google authentication removed", 1);
        Loader.hide();
        Settings.updateAuthSections();
      })
      .catch((error) => {
        Loader.hide();
        Notifications.add(
          "Failed to remove Google authentication: " + error.message,
          -1
        );
      });
  } else {
    Notifications.add(
      "Password authentication needs to be enabled to remove Google authentication",
      -1
    );
  }
}

export async function addPasswordAuth(
  email: string,
  password: string
): Promise<void> {
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
      Notifications.add("Password authenication added", 1);
      Settings.updateAuthSections();
    })
    .catch(function (error) {
      Loader.hide();
      Notifications.add(
        "Failed to add password authenication: " + error.message,
        -1
      );
    });
}

export function signOut(): void {
  if (!Auth.currentUser) return;
  Auth.signOut()
    .then(function () {
      Notifications.add("Signed out", 0, 2);
      AllTimeStats.clear();
      Settings.hideAccountSection();
      AccountButton.update();
      PageController.change("login");
      DB.setSnapshot(defaultSnap);
      $(".pageLogin .button").removeClass("disabled");
      $(".pageLogin input").prop("disabled", false);
      hideFavoriteQuoteLength();
    })
    .catch(function (error) {
      Notifications.add(error.message, -1);
    });
}

async function signUp(): Promise<void> {
  LoginPage.disableInputs();
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
    Notifications.add("Please fill in all fields", 0);
    return;
  }

  if (email !== emailVerify) {
    Notifications.add("Emails do not match", 0, 3);
    LoginPage.hidePreloader();
    $(".pageLogin .button").removeClass("disabled");
    $(".pageLogin input").prop("disabled", false);
    return;
  }

  if (password !== passwordVerify) {
    Notifications.add("Passwords do not match", 0, 3);
    LoginPage.hidePreloader();
    $(".pageLogin .button").removeClass("disabled");
    $(".pageLogin input").prop("disabled", false);
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
      email,
      createdAuthUser.user.uid
    );
    if (signInResponse.status !== 200) {
      throw signInResponse;
    }

    await updateProfile(createdAuthUser.user, { displayName: nname });
    await sendEmailVerification(createdAuthUser.user);
    AllTimeStats.clear();
    $("#menu .text-button.account .text").text(nname);
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
        DB.updateLocalStats({
          time:
            result.testDuration +
            result.incompleteTestSeconds -
            result.afkDuration,
          started: 1,
        });
      }
    }
    Notifications.add("Account created", 1, 3);
  } catch (e) {
    //make sure to do clean up here
    if (createdAuthUser) {
      await Ape.users.delete();
      await createdAuthUser.user.delete();
    }
    console.log(e);
    const message = Misc.createErrorMessage(e, "Failed to create account");
    Notifications.add(message, -1);
    LoginPage.hidePreloader();
    $(".pageLogin .button").removeClass("disabled");
    $(".pageLogin input").prop("disabled", false);
    signOut();
    return;
  }
}

$(".pageLogin #forgotPasswordButton").on("click", () => {
  const emailField =
    ($(".pageLogin .login input")[0] as HTMLInputElement).value || "";
  const email = prompt("Email address", emailField);
  if (email) {
    sendPasswordResetEmail(Auth, email)
      .then(function () {
        // Email sent.
        Notifications.add("Email sent", 1, 2);
      })
      .catch(function (error) {
        // An error happened.
        Notifications.add(error.message, -1);
      });
  }
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

$(".signOut").on("click", () => {
  signOut();
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
  addGoogleAuth();
});

$(".pageSettings #removeGoogleAuth").on("click", () => {
  removeGoogleAuth();
});

$(document).on("click", ".pageAccount .sendVerificationEmail", () => {
  sendVerificationEmail();
});
