import * as Notifications from "../elements/notifications";
import { debounce } from "throttle-debounce";
import {
  sendEmailVerification,
  updateProfile,
  UserCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import Ape from "../ape";
import { createErrorMessage } from "../utils/misc";
import * as LoginPage from "../pages/login";
import * as AllTimeStats from "../account/all-time-stats";
import * as AccountController from "../controllers/account-controller";
import * as TestLogic from "../test/test-logic";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import { subscribe as subscribeToSignUpEvent } from "../observables/google-sign-up-event";

let signedInUser: UserCredential | undefined = undefined;

export function show(credential: UserCredential): void {
  if ($("#googleSignUpPopupWrapper").hasClass("hidden")) {
    enableInput();
    disableButton();
    signedInUser = credential;
    $("#googleSignUpPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#googleSignUpPopup input").trigger("focus").select();
      });
  }
}

export async function hide(): Promise<void> {
  if (!$("#googleSignUpPopupWrapper").hasClass("hidden")) {
    if (signedInUser !== undefined) {
      Notifications.add("Sign up process canceled", 0, 5);
      LoginPage.hidePreloader();
      LoginPage.enableInputs();
      if (signedInUser && getAdditionalUserInfo(signedInUser)?.isNewUser) {
        Ape.users.delete();
        signedInUser.user.delete();
      }
      AccountController.signOut();
      signedInUser = undefined;
    }
    $("#googleSignUpPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#googleSignUpPopupWrapper").addClass("hidden");
        }
      );
  }
}

async function apply(): Promise<void> {
  if ($("#googleSignUpPopup .button").hasClass("disabled")) return;
  disableInput();
  disableButton();
  if (!signedInUser) {
    return Notifications.add(
      "Missing user credential. Please close the popup and try again.",
      -1
    );
  }
  Loader.show();
  const name = $("#googleSignUpPopup input").val() as string;
  try {
    if (name.length === 0) throw new Error("Name cannot be empty");
    const response = await Ape.users.create(name);
    if (response.status !== 200) {
      throw response;
    }

    if (response.status === 200) {
      await updateProfile(signedInUser.user, { displayName: name });
      await sendEmailVerification(signedInUser.user);
      AllTimeStats.clear();
      Notifications.add("Account created", 1, 3);
      $("#menu .text-button.account .text").text(name);
      LoginPage.enableInputs();
      LoginPage.hidePreloader();
      await AccountController.loadUser(signedInUser.user);
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
      signedInUser = undefined;
      Loader.hide();
      hide();
    }
  } catch (e) {
    console.log(e);
    const message = createErrorMessage(e, "Failed to sign in with Google");
    Notifications.add(message, -1);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    if (signedInUser && getAdditionalUserInfo(signedInUser)?.isNewUser) {
      await Ape.users.delete();
      await signedInUser.user.delete();
    }
    AccountController.signOut();
    signedInUser = undefined;
    hide();
    Loader.hide();
    return;
  }
}

function updateIndicator(
  state: "checking" | "available" | "unavailable" | "taken" | "none",
  balloon?: string
): void {
  $("#googleSignUpPopup .checkStatus .checking").addClass("hidden");
  $("#googleSignUpPopup .checkStatus .available").addClass("hidden");
  $("#googleSignUpPopup .checkStatus .unavailable").addClass("hidden");
  $("#googleSignUpPopup .checkStatus .taken").addClass("hidden");
  if (state !== "none") {
    $("#googleSignUpPopup .checkStatus ." + state).removeClass("hidden");
    if (balloon) {
      $("#googleSignUpPopup .checkStatus ." + state).attr(
        "aria-label",
        balloon
      );
    } else {
      $("#googleSignUpPopup .checkStatus ." + state).removeAttr("aria-label");
    }
  }
}

function enableButton(): void {
  $("#googleSignUpPopup .button").removeClass("disabled");
}

function disableButton(): void {
  $("#googleSignUpPopup .button").addClass("disabled");
}

function enableInput(): void {
  $("#googleSignUpPopup input").prop("disabled", false);
}

function disableInput(): void {
  $("#googleSignUpPopup input").prop("disabled", true);
}

$("#googleSignUpPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "googleSignUpPopupWrapper") {
    hide();
  }
});

const checkNameDebounced = debounce(1000, async () => {
  const val = $("#googleSignUpPopup input").val() as string;
  if (!val) return;
  const response = await Ape.users.getNameAvailability(val);

  if (response.status === 200) {
    updateIndicator("available", response.message);
    enableButton();
    return;
  }

  if (response.status == 422) {
    updateIndicator("unavailable", response.message);
    return;
  }

  if (response.status == 409) {
    updateIndicator("taken", response.message);
    return;
  }

  if (response.status !== 200) {
    updateIndicator("unavailable");
    return Notifications.add(
      "Failed to check name availability: " + response.message,
      -1
    );
  }
});

$("#googleSignUpPopup input").on("input", () => {
  setTimeout(() => {
    disableButton();
    const val = $("#googleSignUpPopup input").val() as string;
    if (val === "") {
      return updateIndicator("none");
    } else {
      updateIndicator("checking");
      checkNameDebounced();
    }
  }, 1);
});

$("#googleSignUpPopup input").on("keypress", (e) => {
  if (e.key === "Enter") {
    apply();
  }
});

$("#googleSignUpPopup .button").on("click", () => {
  apply();
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#googleSignUpPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});

subscribeToSignUpEvent((signedInUser, isNewUser) => {
  if (signedInUser && isNewUser) {
    show(signedInUser);
  }
});
