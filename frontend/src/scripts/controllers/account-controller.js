import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import Config, * as UpdateConfig from "../config";
import * as AccountButton from "../elements/account-button";
import * as Account from "../pages/account";
import * as VerificationController from "./verification-controller";
import * as Misc from "../misc";
import * as Settings from "../pages/settings";
import * as AllTimeStats from "../account/all-time-stats";
import * as DB from "../db";
import * as TestLogic from "../test/test-logic";
import * as PageController from "../controllers/page-controller";
import * as PSA from "../elements/psa";
import * as Focus from "../test/focus";
import * as Loader from "../elements/loader";
import * as PageTransition from "../states/page-transition";
import * as ActivePage from "../states/active-page";
import * as TestActive from "../states/test-active";
import * as LoadingPage from "../pages/loading";
import * as ResultFilters from "../account/result-filters";
import * as PaceCaret from "../test/pace-caret";
import * as CommandlineLists from "../elements/commandline-lists";
import * as TagController from "./tag-controller";
import * as ResultTagsPopup from "../popups/result-tags-popup";
import * as URLHandler from "../utils/url-handler";

export const gmailProvider = new firebase.auth.GoogleAuthProvider();
// const githubProvider = new firebase.auth.GithubAuthProvider();

export function sendVerificationEmail() {
  Loader.show();
  let cu = firebase.auth().currentUser;
  cu.sendEmailVerification()
    .then(() => {
      Loader.hide();
      Notifications.add("Email sent to " + cu.email, 4000);
    })
    .catch((e) => {
      Loader.hide();
      Notifications.add("Error: " + e.message, 3000);
      console.error(e.message);
    });
}

export async function getDataAndInit() {
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
  } catch (e) {
    AccountButton.loading(false);
    if (e?.response?.status === 429) {
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
    let msg = e?.response?.data?.message ?? e?.response?.data ?? e?.message;
    Notifications.add("Failed to get user data: " + msg, -1);

    $("#top #menu .account").css("opacity", 1);
    if (ActivePage.get() === "loading") PageController.change("");
    return false;
  }
  if (ActivePage.get() == "loading") {
    LoadingPage.updateBar(100);
  } else {
    LoadingPage.updateBar(45);
  }
  LoadingPage.updateText("Applying settings...");
  const snapshot = DB.getSnapshot();
  $("#menu .icon-button.account .text").text(snapshot.name);

  ResultFilters.loadTags(snapshot.tags);

  Promise.all([Misc.getLanguageList(), Misc.getFunboxList()]).then((values) => {
    let languages = values[0];
    let funboxModes = values[1];
    languages.forEach((language) => {
      ResultFilters.defaultResultFilters.language[language] = true;
    });
    funboxModes.forEach((funbox) => {
      ResultFilters.defaultResultFilters.funbox[funbox.name] = true;
    });
    // filters = defaultResultFilters;
    ResultFilters.load();
  });

  let user = firebase.auth().currentUser;
  if (!snapshot.name) {
    //verify username
    if (Misc.isUsernameValid(user.name)) {
      //valid, just update
      snapshot.name = user.name;
      DB.setSnapshot(snapshot);
      await Ape.users.updateName(user.name);
    } else {
      //invalid, get new
      let nameGood = false;
      let name = "";

      while (!nameGood) {
        name = prompt(
          "Please provide a new username (cannot be longer than 16 characters, can only contain letters, numbers, underscores, dots and dashes):"
        );

        if (!name) {
          return false;
        }

        const response = await Ape.users.updateName(name);

        if (response.status !== 200) {
          return Notifications.add(
            "Failed to update name: " + response.message,
            -1
          );
        }

        nameGood = true;
        Notifications.add("Name updated", 1);
        snapshot.name = name;
        DB.setSnapshot(snapshot);
        $("#menu .icon-button.account .text").text(name);
      }
    }
  }
  if (!UpdateConfig.changedBeforeDb) {
    //config didnt change before db loaded
    if (Config.localStorageConfig === null) {
      console.log("no local config, applying db");
      AccountButton.loading(false);
      UpdateConfig.apply(snapshot.config);
      Settings.update();
      UpdateConfig.saveFullConfigToLocalStorage(true);
      TestLogic.restart(false, true);
    } else if (snapshot.config !== undefined) {
      //loading db config, keep for now
      let configsDifferent = false;
      Object.keys(Config).forEach((key) => {
        if (!configsDifferent) {
          try {
            if (key !== "resultFilters") {
              if (Array.isArray(Config[key])) {
                Config[key].forEach((arrval, index) => {
                  if (arrval != snapshot.config[key][index]) {
                    configsDifferent = true;
                    console.log(
                      `.config is different: ${arrval} != ${snapshot.config[key][index]}`
                    );
                  }
                });
              } else {
                if (Config[key] != snapshot.config[key]) {
                  configsDifferent = true;
                  console.log(
                    `..config is different ${key}: ${Config[key]} != ${snapshot.config[key]}`
                  );
                }
              }
            }
          } catch (e) {
            console.log(e);
            configsDifferent = true;
            console.log(`...config is different: ${e.message}`);
          }
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
      PaceCaret.init(true);
    }
  }
  AccountButton.loading(false);
  ResultFilters.updateTags();
  CommandlineLists.updateTagCommands();
  TagController.loadActiveFromLocalStorage();
  ResultTagsPopup.updateButtons();
  Settings.showAccountSection();
  PageTransition.set(false);
  console.log("account loading finished");
}

async function loadUser(user) {
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
  $(".pageLogin .preloader").addClass("hidden");

  // showFavouriteThemesAtTheTop();

  let text = "Account created on " + user.metadata.creationTime;

  const date1 = new Date(user.metadata.creationTime);
  const date2 = new Date();
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  text += ` (${diffDays} day${diffDays != 1 ? "s" : ""} ago)`;

  $(".pageAccount .group.createdDate").text(text);

  if (VerificationController.data !== null) {
    VerificationController.verify(user.uid);
  }
}

const authListener = firebase.auth().onAuthStateChanged(async function (user) {
  // await UpdateConfig.loadPromise;
  console.log(`auth state changed, user ${user ? true : false}`);
  if (user) {
    await loadUser(user);
  } else {
    if (window.location.pathname == "/account") {
      window.history.replaceState("", null, "/login");
    }
    PageTransition.set(false);
  }
  if (user) {
    if (window.location.pathname == "/login") {
      PageController.change("account");
    } else if (window.location.pathname != "/account") {
      PageController.change();
      setTimeout(() => {
        Focus.set(false);
      }, 125 / 2);
    } else {
      Account.update();
      // SignOutButton.show();
    }
  } else {
    PageController.change();
    setTimeout(() => {
      Focus.set(false);
    }, 125 / 2);
  }

  URLHandler.loadCustomThemeFromUrl();
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

export function signIn() {
  UpdateConfig.setChangedBeforeDb(false);
  authListener();
  $(".pageLogin .preloader").removeClass("hidden");
  $(".pageLogin .button").addClass("disabled");
  let email = $(".pageLogin .login input")[0].value;
  let password = $(".pageLogin .login input")[1].value;

  const persistence = $(".pageLogin .login #rememberMe input").prop("checked")
    ? firebase.auth.Auth.Persistence.LOCAL
    : firebase.auth.Auth.Persistence.SESSION;

  firebase
    .auth()
    .setPersistence(persistence)
    .then(function () {
      return firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(async (e) => {
          await loadUser(e.user);
          PageController.change("account");
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
          //TODO: redirect user to relevant page
        })
        .catch(function (error) {
          let message = error.message;
          if (error.code === "auth/wrong-password") {
            message = "Incorrect password.";
          } else if (error.code === "auth/user-not-found") {
            message = "User not found.";
          }
          Notifications.add(message, -1);
          $(".pageLogin .preloader").addClass("hidden");
          $(".pageLogin .button").removeClass("disabled");
        });
    });
}

export async function signInWithGoogle() {
  UpdateConfig.setChangedBeforeDb(false);
  $(".pageLogin .preloader").removeClass("hidden");
  $(".pageLogin .button").addClass("disabled");
  authListener();
  let signedInUser;
  try {
    const persistence = $(".pageLogin .login #rememberMe input").prop("checked")
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    await firebase.auth().setPersistence(persistence);
    signedInUser = await firebase.auth().signInWithPopup(gmailProvider);

    if (signedInUser.additionalUserInfo.isNewUser) {
      //ask for username
      let nameGood = false;
      let name = "";

      while (!nameGood) {
        name = prompt(
          "Please provide a new username (cannot be longer than 16 characters, can only contain letters, numbers, underscores, dots and dashes):"
        );

        if (!name) {
          signOut();
          $(".pageLogin .preloader").addClass("hidden");
          return;
        }

        const response = await Ape.users.getNameAvailability(name);

        if (response.status !== 200) {
          return Notifications.add(
            "Failed to check name: " + response.message,
            -1
          );
        }

        nameGood = true;
      }
      //create database object for the new user
      // try {
      const response = await Ape.users.create(name);
      if (response.status !== 200) {
        throw response;
      }
      // } catch (e) {
      //   let msg = e?.response?.data?.message ?? e.message;
      //   Notifications.add("Failed to create account: " + msg, -1);
      //   return;
      // }
      if (response.status === 200) {
        await signedInUser.user.updateProfile({ displayName: name });
        await signedInUser.user.sendEmailVerification();
        AllTimeStats.clear();
        Notifications.add("Account created", 1, 3);
        $("#menu .icon-button.account .text").text(name);
        $(".pageLogin .button").removeClass("disabled");
        $(".pageLogin .preloader").addClass("hidden");
        await loadUser(signedInUser.user);
        PageController.change("account");
        if (TestLogic.notSignedInLastResult !== null) {
          TestLogic.setNotSignedInUid(signedInUser.user.uid);

          const resultsSaveResponse = await Ape.results.save(
            TestLogic.notSignedInLastResult
          );

          if (resultsSaveResponse.status === 200) {
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
      }
    } else {
      await loadUser(signedInUser.user);
      PageController.change("account");
    }
  } catch (e) {
    console.log(e);
    Notifications.add("Failed to sign in with Google: " + e.message, -1);
    $(".pageLogin .preloader").addClass("hidden");
    $(".pageLogin .button").removeClass("disabled");
    if (signedInUser?.additionalUserInfo?.isNewUser) {
      await Ape.users.delete();
      await signedInUser.user.delete();
    }
    signOut();
    return;
  }
}

// export async function signInWithGitHub() {
//   $(".pageLogin .preloader").removeClass("hidden");

//   try{
//     if ($(".pageLogin .login #rememberMe input").prop("checked")) {
//       //remember me
//       await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
//       let signedInUser = await firebase.auth().signInWithPopup(githubProvider);
//       console.log(signedInUser);
//     } else {
//       //dont remember
//       await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
//       let signedInUser = await firebase.auth().signInWithPopup(githubProvider);
//       console.log(signedInUser);
//     }
//   }catch(e){
//     Notifications.add("Failed to sign in with GitHub: " + e.message, -1);
//     $(".pageLogin .preloader").addClass("hidden");
//   }
// }

export function addGoogleAuth() {
  Loader.show();
  firebase
    .auth()
    .currentUser.linkWithPopup(gmailProvider)
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

export async function removeGoogleAuth() {
  let user = firebase.auth().currentUser;
  if (
    user.providerData.find((provider) => provider.providerId === "password")
  ) {
    Loader.show();
    try {
      await user.reauthenticateWithPopup(gmailProvider);
    } catch (e) {
      Loader.hide();
      return Notifications.add(e.message, -1);
    }
    firebase
      .auth()
      .currentUser.unlink("google.com")
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

export async function addPasswordAuth(email, password) {
  Loader.show();
  let user = firebase.auth().currentUser;
  if (
    user.providerData.find((provider) => provider.providerId === "google.com")
  ) {
    try {
      await firebase.auth().currentUser.reauthenticateWithPopup(gmailProvider);
    } catch (e) {
      Loader.hide();
      return Notifications.add("Could not reauthenticate: " + e.message, -1);
    }
  }
  let credential = firebase.auth.EmailAuthProvider.credential(email, password);
  firebase
    .auth()
    .currentUser.linkWithCredential(credential)
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

export function signOut() {
  firebase
    .auth()
    .signOut()
    .then(function () {
      Notifications.add("Signed out", 0, 2);
      AllTimeStats.clear();
      Settings.hideAccountSection();
      AccountButton.update();
      PageController.change("login");
      DB.setSnapshot(null);
      $(".pageLogin .button").removeClass("disabled");
    })
    .catch(function (error) {
      Notifications.add(error.message, -1);
    });
}

async function signUp() {
  $(".pageLogin .button").addClass("disabled");
  $(".pageLogin .preloader").removeClass("hidden");
  let nname = $(".pageLogin .register input")[0].value;
  let email = $(".pageLogin .register input")[1].value;
  let emailVerify = $(".pageLogin .register input")[2].value;
  let password = $(".pageLogin .register input")[3].value;
  let passwordVerify = $(".pageLogin .register input")[4].value;

  if (email !== emailVerify) {
    Notifications.add("Emails do not match", 0, 3);
    $(".pageLogin .preloader").addClass("hidden");
    $(".pageLogin .button").removeClass("disabled");
    return;
  }

  if (password !== passwordVerify) {
    Notifications.add("Passwords do not match", 0, 3);
    $(".pageLogin .preloader").addClass("hidden");
    $(".pageLogin .button").removeClass("disabled");
    return;
  }

  const response = await Ape.users.getNameAvailability(nname);

  if (response.status !== 200) {
    Notifications.add(response.message, -1);
    $(".pageLogin .preloader").addClass("hidden");
    $(".pageLogin .button").removeClass("disabled");
    return;
  }

  authListener();

  let createdAuthUser;
  try {
    createdAuthUser = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);

    const signInResponse = await Ape.users.create(
      nname,
      email,
      createdAuthUser.user.id
    );
    if (signInResponse.status !== 200) {
      throw signInResponse;
    }

    await createdAuthUser.user.updateProfile({ displayName: nname });
    await createdAuthUser.user.sendEmailVerification();
    AllTimeStats.clear();
    $("#menu .icon-button.account .text").text(nname);
    $(".pageLogin .button").removeClass("disabled");
    $(".pageLogin .preloader").addClass("hidden");
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
    PageController.change("account");
    Notifications.add("Account created", 1, 3);
  } catch (e) {
    //make sure to do clean up here
    if (createdAuthUser) {
      await Ape.users.delete();
      await createdAuthUser.user.delete();
    }
    let txt;
    if (e.response) {
      txt =
        e.response.data.message ||
        e.response.status + " " + e.response.statusText;
    } else {
      txt = e.message;
    }
    Notifications.add(txt, -1);
    $(".pageLogin .preloader").addClass("hidden");
    $(".pageLogin .button").removeClass("disabled");
    signOut();
    return;
  }
}

$(".pageLogin #forgotPasswordButton").on("click", (e) => {
  let email = prompt("Email address");
  if (email) {
    firebase
      .auth()
      .sendPasswordResetEmail(email)
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

$(".pageLogin .login .button.signIn").on("click", (e) => {
  UpdateConfig.setChangedBeforeDb(false);
  signIn();
});

$(".pageLogin .login .button.signInWithGoogle").on("click", (e) => {
  UpdateConfig.setChangedBeforeDb(false);
  signInWithGoogle();
});

// $(".pageLogin .login .button.signInWithGitHub").on("click",(e) => {
// UpdateConfig.setChangedBeforeDb(false);
// signInWithGitHub();
// });

$(".signOut").on("click", (e) => {
  signOut();
});

$(".pageLogin .register input").keyup((e) => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  if (e.key === "Enter") {
    signUp();
  }
});

$(".pageLogin .register .button").on("click", (e) => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  signUp();
});

$(".pageSettings #addGoogleAuth").on("click", async (e) => {
  await addGoogleAuth();
  setTimeout(() => {
    window.location.reload();
  }, 1000);
});

$(".pageSettings #removeGoogleAuth").on("click", (e) => {
  removeGoogleAuth();
});

$(document).on("click", ".pageAccount .sendVerificationEmail", (event) => {
  sendVerificationEmail();
});
