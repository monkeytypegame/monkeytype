import * as Notifications from "./notifications";
import * as UpdateConfig from "./config";
import * as AccountButton from "./account-button";
import * as Account from "./account";
import * as CommandlineLists from "./commandline-lists";
import * as VerificationController from "./verification-controller";
import * as Misc from "./misc";
import * as Settings from "./settings";
import * as ChallengeController from "./challenge-controller";
import Config from "./config";
import * as CloudFunctions from "./cloud-functions";
import * as AllTimeStats from "./all-time-stats";
import * as DB from "./db";
import * as TestLogic from "./test-logic";
import * as UI from "./ui";

var gmailProvider = new firebase.auth.GoogleAuthProvider();

export function signIn() {
  $(".pageLogin .preloader").removeClass("hidden");
  let email = $(".pageLogin .login input")[0].value;
  let password = $(".pageLogin .login input")[1].value;

  if ($(".pageLogin .login #rememberMe input").prop("checked")) {
    //remember me
    firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(function () {
        return firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then((e) => {
            // UI.changePage("test");
          })
          .catch(function (error) {
            Notifications.add(error.message, -1);
            $(".pageLogin .preloader").addClass("hidden");
          });
      });
  } else {
    //dont remember
    firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .then(function () {
        return firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then((e) => {
            // UI.changePage("test");
          })
          .catch(function (error) {
            Notifications.add(error.message, -1);
            $(".pageLogin .preloader").addClass("hidden");
          });
      });
  }
}

export async function signInWithGoogle() {
  $(".pageLogin .preloader").removeClass("hidden");

  if ($(".pageLogin .login #rememberMe input").prop("checked")) {
    //remember me
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    firebase
      .auth()
      .signInWithPopup(gmailProvider)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        Notifications.add(error.message, -1);
        $(".pageLogin .preloader").addClass("hidden");
      });
  } else {
    //dont remember
    await firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION);
    firebase
      .auth()
      .signInWithPopup(gmailProvider)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        Notifications.add(error.message, -1);
        $(".pageLogin .preloader").addClass("hidden");
      });
  }
}

export function linkWithGoogle() {
  firebase
    .auth()
    .currentUser.linkWithPopup(gmailProvider)
    .then(function (result) {
      console.log(result);
    })
    .catch(function (error) {
      console.log(error);
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
      UI.changePage("login");
      DB.setSnapshot(null);
    })
    .catch(function (error) {
      Notifications.add(error.message, -1);
    });
}

function signUp() {
  $(".pageLogin .register .button").addClass("disabled");
  $(".pageLogin .preloader").removeClass("hidden");
  let nname = $(".pageLogin .register input")[0].value;
  let email = $(".pageLogin .register input")[1].value;
  let password = $(".pageLogin .register input")[2].value;
  let passwordVerify = $(".pageLogin .register input")[3].value;

  if (password != passwordVerify) {
    Notifications.add("Passwords do not match", 0, 3);
    $(".pageLogin .preloader").addClass("hidden");
    $(".pageLogin .register .button").removeClass("disabled");
    return;
  }

  CloudFunctions.namecheck({ name: nname }).then((d) => {
    if (d.data.resultCode === -1) {
      Notifications.add("Name unavailable", -1);
      $(".pageLogin .preloader").addClass("hidden");
      $(".pageLogin .register .button").removeClass("disabled");
      return;
    } else if (d.data.resultCode === -2) {
      Notifications.add(
        "Name cannot contain special characters or contain more than 14 characters. Can include _ . and -",
        -1
      );
      $(".pageLogin .preloader").addClass("hidden");
      $(".pageLogin .register .button").removeClass("disabled");
      return;
    } else if (d.data.resultCode === 1) {
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((user) => {
          // Account has been created here.
          // dontCheckUserName = true;
          let usr = user.user;
          usr
            .updateProfile({
              displayName: nname,
            })
            .then(async function () {
              // Update successful.
              await firebase
                .firestore()
                .collection("users")
                .doc(usr.uid)
                .set({ name: nname }, { merge: true });
              CloudFunctions.reserveName({ name: nname, uid: usr.uid }).catch(
                (e) => {
                  console.error("Could not reserve name " + e);
                  throw "Could not reserve name";
                }
              );
              usr.sendEmailVerification();
              AllTimeStats.clear();
              Notifications.add("Account created", 1, 3);
              $("#menu .icon-button.account .text").text(nname);
              try {
                firebase.analytics().logEvent("accountCreated", usr.uid);
              } catch (e) {
                console.log("Analytics unavailable");
              }
              $(".pageLogin .preloader").addClass("hidden");
              DB.setSnapshot({
                results: [],
                personalBests: {},
                tags: [],
                globalStats: {
                  time: undefined,
                  started: undefined,
                  completed: undefined,
                },
              });
              if (TestLogic.notSignedInLastResult !== null) {
                TestLogic.setNotSignedInUid(usr.uid);
                CloudFunctions.testCompleted({
                  uid: usr.uid,
                  obj: TestLogic.notSignedInLastResult,
                });
                DB.getSnapshot().results.push(TestLogic.notSignedInLastResult);
              }
              UI.changePage("account");
              usr.sendEmailVerification();
              $(".pageLogin .register .button").removeClass("disabled");
            })
            .catch(function (error) {
              // An error happened.
              $(".pageLogin .register .button").removeClass("disabled");
              console.error(error);
              usr
                .delete()
                .then(function () {
                  // User deleted.
                  Notifications.add(
                    "Account not created. " + error.message,
                    -1
                  );
                  $(".pageLogin .preloader").addClass("hidden");
                })
                .catch(function (error) {
                  // An error happened.
                  $(".pageLogin .preloader").addClass("hidden");
                  Notifications.add(
                    "Something went wrong. " + error.message,
                    -1
                  );
                  console.error(error);
                });
            });
        })
        .catch(function (error) {
          // Handle Errors here.
          $(".pageLogin .register .button").removeClass("disabled");
          Notifications.add(error.message, -1);
          $(".pageLogin .preloader").addClass("hidden");
        });
    } else {
      $(".pageLogin .preloader").addClass("hidden");
      Notifications.add(
        "Something went wrong when checking name: " + d.data.message,
        -1
      );
    }
  });
}

$(".pageLogin #forgotPasswordButton").click((e) => {
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
  if (e.key == "Enter") {
    UpdateConfig.setChangedBeforeDb(false);
    signIn();
  }
});

$(".pageLogin .login .button.signIn").click((e) => {
  UpdateConfig.setChangedBeforeDb(false);
  signIn();
});

$(".pageLogin .login .button.signInWithGoogle").click((e) => {
  UpdateConfig.setChangedBeforeDb(false);
  signInWithGoogle();
});

$(".signOut").click((e) => {
  signOut();
});

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    $(".pageAccount .content p.accountVerificatinNotice").remove();
    if (user.emailVerified === false) {
      $(".pageAccount .content").prepend(
        `<p class="accountVerificatinNotice" style="text-align:center">Your account is not verified. Click <a onClick="sendVerificationEmail()">here</a> to resend the verification email.`
      );
    }
    AccountButton.update();
    AccountButton.loading(true);
    Account.getDataAndInit();
    var displayName = user.displayName;
    // var email = user.email;
    // var emailVerified = user.emailVerified;
    // var photoURL = user.photoURL;
    // var isAnonymous = user.isAnonymous;
    // var uid = user.uid;
    // var providerData = user.providerData;
    $(".pageLogin .preloader").addClass("hidden");
    $("#menu .icon-button.account .text").text(displayName);

    // showFavouriteThemesAtTheTop();
    CommandlineLists.updateThemeCommands();

    let text = "Account created on " + user.metadata.creationTime;

    const date1 = new Date(user.metadata.creationTime);
    const date2 = new Date();
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    text += ` (${diffDays} day${diffDays != 1 ? "s" : ""} ago)`;

    $(".pageAccount .group.createdDate").text(text);

    if (VerificationController.data !== null) {
      VerificationController.verify(user);
    }
  }
  let theme = Misc.findGetParameter("customTheme");
  if (theme !== null) {
    try {
      theme = theme.split(",");
      UpdateConfig.setCustomThemeColors(theme);
      Notifications.add("Custom theme applied.", 1);
    } catch (e) {
      Notifications.add(
        "Something went wrong. Reverting to default custom colors.",
        0
      );
      UpdateConfig.setCustomThemeColors(Config.defaultConfig.customThemeColors);
    }
    UpdateConfig.setCustomTheme(true);
    Settings.setCustomThemeInputs();
  }
  if (/challenge_.+/g.test(window.location.pathname)) {
    Notifications.add("Loading challenge", 0);
    let challengeName = window.location.pathname.split("_")[1];
    setTimeout(() => {
      ChallengeController.setup(challengeName);
    }, 1000);
  }
});

$(".pageLogin .register input").keyup((e) => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  if (e.key == "Enter") {
    signUp();
  }
});

$(".pageLogin .register .button").click((e) => {
  if ($(".pageLogin .register .button").hasClass("disabled")) return;
  signUp();
});
