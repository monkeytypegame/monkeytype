import * as Notifications from "./notifications";

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
            // changePage("test");
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
            // changePage("test");
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
      setTimeout(() => {
        location.reload();
      }, 1000);

      //TODO Bring this back when possible

      // clearGlobalStats();
      // Settings.hideAccountSection();
      // updateAccountLoginButton();
      // changePage("login");
      // DB.setSnapshot(null);
    })
    .catch(function (error) {
      Notifications.add(error.message, -1);
    });
}
