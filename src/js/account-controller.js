import * as Notifications from "./notifications";
import Config, * as UpdateConfig from "./config";
import * as AccountButton from "./account-button";
import * as Account from "./account";
import * as AccountController from "./account-controller";
import * as CommandlineLists from "./commandline-lists";
import * as VerificationController from "./verification-controller";
import * as Misc from "./misc";
import * as Settings from "./settings";
import * as AllTimeStats from "./all-time-stats";
import * as DB from "./db";
import * as TestLogic from "./test-logic";
import * as UI from "./ui";
import axiosInstance from "./axios-instance";
import * as PSA from "./psa";

export const gmailProvider = new firebase.auth.GoogleAuthProvider();
// const githubProvider = new firebase.auth.GithubAuthProvider();

async function loadUser(user) {
  // User is signed in.
  $(".pageAccount .content p.accountVerificatinNotice").remove();
  if (user.emailVerified === false) {
    $(".pageAccount .content").prepend(
      `<p class="accountVerificatinNotice" style="text-align:center">Your account is not verified. Click <a onClick="sendVerificationEmail()">here</a> to resend the verification email.`
    );
  }
  UI.setPageTransition(false);
  AccountButton.update();
  AccountButton.loading(true);
  await Account.getDataAndInit();
  // var displayName = user.displayName;
  // var email = user.email;
  // var emailVerified = user.emailVerified;
  // var photoURL = user.photoURL;
  // var isAnonymous = user.isAnonymous;
  // var uid = user.uid;
  // var providerData = user.providerData;
  $(".pageLogin .preloader").addClass("hidden");

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

const authListener = firebase.auth().onAuthStateChanged(async function (user) {
  // await UpdateConfig.loadPromise;
  console.log(`auth state changed, user ${user ? true : false}`);
  if (user) {
    await loadUser(user);
  } else {
    UI.setPageTransition(false);
    if ($(".pageLoading").hasClass("active")) UI.changePage("");
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
  authListener();
  $(".pageLogin .preloader").removeClass("hidden");
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
          if (TestLogic.notSignedInLastResult !== null) {
            TestLogic.setNotSignedInUid(e.user.uid);
            let response;
            try {
              response = await axiosInstance.post("/results/add", {
                result: TestLogic.notSignedInLastResult,
              });
            } catch (e) {
              let msg = e?.response?.data?.message ?? e.message;
              Notifications.add("Failed to save last result: " + msg, -1);
              return;
            }
            if (response.status !== 200) {
              Notifications.add(response.data.message);
            } else {
              TestLogic.clearNotSignedInResult();
              Notifications.add("Last test result saved", 1);
            }
            // UI.changePage("account");
          }
          // UI.changePage("test");
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
        });
    });
}

export async function signInWithGoogle() {
  $(".pageLogin .preloader").removeClass("hidden");
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

      while (nameGood === false) {
        name = await prompt(
          "Please provide a new username (cannot be longer than 16 characters, can only contain letters, numbers, underscores, dots and dashes):"
        );

        if (name == null) {
          AccountController.signOut();
          $(".pageLogin .preloader").addClass("hidden");
          return;
        }

        let response;
        try {
          response = await axiosInstance.post("/user/checkName", { name });
        } catch (e) {
          let msg = e?.response?.data?.message ?? e.message;
          if (e.response.status >= 500) {
            Notifications.add("Failed to check name: " + msg, -1);
            throw e;
          } else {
            alert(msg);
          }
        }
        if (response?.status == 200) {
          nameGood = true;
        }
      }
      //create database object for the new user
      let response;
      // try {
      response = await axiosInstance.post("/user/signUp", {
        name,
      });
      // } catch (e) {
      //   let msg = e?.response?.data?.message ?? e.message;
      //   Notifications.add("Failed to create account: " + msg, -1);
      //   return;
      // }
      if (response.status == 200) {
        await signedInUser.user.updateProfile({ displayName: name });
        await signedInUser.user.sendEmailVerification();
        AllTimeStats.clear();
        Notifications.add("Account created", 1, 3);
        $("#menu .icon-button.account .text").text(name);
        $(".pageLogin .register .button").removeClass("disabled");
        $(".pageLogin .preloader").addClass("hidden");
        await loadUser(signedInUser.user);
        if (TestLogic.notSignedInLastResult !== null) {
          TestLogic.setNotSignedInUid(signedInUser.user.uid);
          axiosInstance
            .post("/results/add", {
              result: TestLogic.notSignedInLastResult,
            })
            .then((result) => {
              if (result.status === 200) {
                DB.getSnapshot().results.push(TestLogic.notSignedInLastResult);
              }
            });
          // UI.changePage("account");
        }
      }
    } else {
      loadUser(signedInUser.user);
    }
  } catch (e) {
    console.log(e);
    Notifications.add("Failed to sign in with Google: " + e.message, -1);
    $(".pageLogin .preloader").addClass("hidden");
    signedInUser.user.delete();
    axiosInstance.post("/user/delete", { uid: signedInUser.user.uid });
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

export function unlinkGoogle() {
  firebase.auth().currentUser.unlink("google.com").then((result) => {
    console.log(result);
  }).catch((error) => {
    console.log(error);
  });
}

export function linkWithEmail(email, password) {
  var credential = firebase.auth.EmailAuthProvider.credential(email, password);
  firebase
    .auth()
    .currentUser.linkWithCredential(credential)
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

async function signUp() {
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

  try {
    await axiosInstance.post("/user/checkName", {
      name: nname,
    });
  } catch (e) {
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
    $(".pageLogin .register .button").removeClass("disabled");
    return;
  }

  authListener();

  let createdAuthUser;
  try {
    createdAuthUser = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    await axiosInstance.post("/user/signup", {
      name: nname,
      email,
      uid: createdAuthUser.user.uid,
    });
    await createdAuthUser.user.updateProfile({ displayName: nname });
    await createdAuthUser.user.sendEmailVerification();
    AllTimeStats.clear();
    Notifications.add("Account created", 1, 3);
    $("#menu .icon-button.account .text").text(nname);
    $(".pageLogin .register .button").removeClass("disabled");
    $(".pageLogin .preloader").addClass("hidden");
    await loadUser(createdAuthUser.user);
    if (TestLogic.notSignedInLastResult !== null) {
      TestLogic.setNotSignedInUid(createdAuthUser.user.uid);
      axiosInstance
        .post("/results/add", {
          result: TestLogic.notSignedInLastResult,
        })
        .then((result) => {
          if (result.status === 200) {
            DB.getSnapshot().results.push(TestLogic.notSignedInLastResult);
          }
        });
      UI.changePage("account");
    }
  } catch (e) {
    //make sure to do clean up here
    if (createdAuthUser) {
      await createdAuthUser.user.delete();
      axiosInstance.post("/user/delete", { uid: createdAuthUser.user.uid });
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
    $(".pageLogin .register .button").removeClass("disabled");
    return;
  }

  return;

  // axiosInstance.get(`/nameCheck/${nname}`).then((d) => {
  //   console.log(d.data);
  //   if (d.data.resultCode === -1) {
  //     Notifications.add("Name unavailable", -1);
  //     $(".pageLogin .preloader").addClass("hidden");
  //     $(".pageLogin .register .button").removeClass("disabled");
  //     return;
  //   } else if (d.data.resultCode === -2) {
  //     Notifications.add(
  //       "Name cannot contain special characters or contain more than 14 characters. Can include _ . and -",
  //       -1
  //     );
  //     $(".pageLogin .preloader").addClass("hidden");
  //     $(".pageLogin .register .button").removeClass("disabled");
  //     return;
  //   } else if (d.data.resultCode === 1) {
  //     firebase
  //       .auth()
  //       .createUserWithEmailAndPassword(email, password)
  //       .then((user) => {
  //         // Account has been created here.
  //         // dontCheckUserName = true;
  //         let usr = user.user;
  //         //maybe there's a better place for the api call
  //         axiosInstance.post("/signUp", {
  //           name: nname,
  //           uid: usr.uid,
  //           email: email,
  //         });
  //         usr
  //           .updateProfile({
  //             displayName: nname,
  //           })
  //           .then(async function () {
  //             // Update successful.
  //             usr.sendEmailVerification();
  //             AllTimeStats.clear();
  //             Notifications.add("Account created", 1, 3);
  //             $("#menu .icon-button.account .text").text(nname);
  //             try {
  //               firebase.analytics().logEvent("accountCreated", usr.uid);
  //             } catch (e) {
  //               console.log("Analytics unavailable");
  //             }
  //             $(".pageLogin .preloader").addClass("hidden");
  //             DB.setSnapshot({
  //               results: [],
  //               personalBests: {},
  //               tags: [],
  //               globalStats: {
  //                 time: undefined,
  //                 started: undefined,
  //                 completed: undefined,
  //               },
  //             });
  //             if (TestLogic.notSignedInLastResult !== null) {
  //               TestLogic.setNotSignedInUid(usr.uid);
  //               axiosInstance
  //                 .post("/testCompleted", {
  //                   obj: TestLogic.notSignedInLastResult,
  //                 })
  //                 .then(() => {
  //                   DB.getSnapshot().results.push(
  //                     TestLogic.notSignedInLastResult
  //                   );
  //                 });
  //             }
  //             UI.changePage("account");
  //             usr.sendEmailVerification();
  //             $(".pageLogin .register .button").removeClass("disabled");
  //           })
  //           .catch(function (error) {
  //             // An error happened.
  //             $(".pageLogin .register .button").removeClass("disabled");
  //             console.error(error);
  //             usr
  //               .delete()
  //               .then(function () {
  //                 // User deleted.
  //                 Notifications.add(
  //                   "Account not created. " + error.message,
  //                   -1
  //                 );
  //                 $(".pageLogin .preloader").addClass("hidden");
  //               })
  //               .catch(function (error) {
  //                 // An error happened.
  //                 $(".pageLogin .preloader").addClass("hidden");
  //                 Notifications.add(
  //                   "Something went wrong. " + error.message,
  //                   -1
  //                 );
  //                 console.error(error);
  //               });
  //           });
  //       })
  //       .catch(function (error) {
  //         // Handle Errors here.
  //         $(".pageLogin .register .button").removeClass("disabled");
  //         Notifications.add(error.message, -1);
  //         $(".pageLogin .preloader").addClass("hidden");
  //       });
  //   } else {
  //     $(".pageLogin .preloader").addClass("hidden");
  //     Notifications.add(
  //       "Something went wrong when checking name: " + d.data.message,
  //       -1
  //     );
  //   }
  // });
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

// $(".pageLogin .login .button.signInWithGitHub").click((e) => {
// UpdateConfig.setChangedBeforeDb(false);
// signInWithGitHub();
// });

$(".signOut").click((e) => {
  signOut();
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
