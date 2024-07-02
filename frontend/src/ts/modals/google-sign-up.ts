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
import * as AccountController from "../controllers/account-controller";
import * as TestLogic from "../test/test-logic";
import * as CaptchaController from "../controllers/captcha-controller";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import { subscribe as subscribeToSignUpEvent } from "../observables/google-sign-up-event";
import { InputIndicator } from "../elements/input-indicator";
import AnimatedModal from "../utils/animated-modal";

let signedInUser: UserCredential | undefined = undefined;

function show(credential: UserCredential): void {
  void modal.show({
    mode: "dialog",
    focusFirstInput: true,
    beforeAnimation: async () => {
      CaptchaController.reset("googleSignUpModal");
      CaptchaController.render(
        $("#googleSignUpModal .captcha")[0] as HTMLElement,
        "googleSignUpModal"
      );
      enableInput();
      disableButton();
      signedInUser = credential;
    },
  });
}

async function hide(): Promise<void> {
  void modal.hide({
    afterAnimation: async () => {
      if (signedInUser !== undefined) {
        Notifications.add("Sign up process cancelled", 0, {
          duration: 5,
        });
        LoginPage.hidePreloader();
        LoginPage.enableInputs();
        if (getAdditionalUserInfo(signedInUser)?.isNewUser) {
          await Ape.users.delete();
          await signedInUser.user.delete();
        }
        AccountController.signOut();
        signedInUser = undefined;
      }
    },
  });
}

async function apply(): Promise<void> {
  if (!signedInUser) {
    return Notifications.add(
      "Missing user credential. Please close the popup and try again.",
      -1
    );
  }

  const captcha = CaptchaController.getResponse("googleSignUpModal");
  if (!captcha) {
    return Notifications.add("Please complete the captcha", 0);
  }

  disableInput();
  disableButton();

  Loader.show();
  const name = $("#googleSignUpModal input").val() as string;
  try {
    if (name.length === 0) throw new Error("Name cannot be empty");
    const response = await Ape.users.create(name, captcha);
    if (response.status !== 200) {
      throw new Error(`Failed to create user: ${response.message}`);
    }

    if (response.status === 200) {
      await updateProfile(signedInUser.user, { displayName: name });
      await sendEmailVerification(signedInUser.user);
      Notifications.add("Account created", 1);
      $("nav .textButton.account .text").text(name);
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
          DB.updateLocalStats(
            1,
            result.testDuration +
              result.incompleteTestSeconds -
              result.afkDuration
          );
        }
      }
      signedInUser = undefined;
      Loader.hide();
      void hide();
    }
  } catch (e) {
    console.log(e);
    const message = createErrorMessage(e, "Failed to sign in with Google");
    Notifications.add(message, -1);
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    LoginPage.enableSignUpButton();
    if (signedInUser && getAdditionalUserInfo(signedInUser)?.isNewUser) {
      await Ape.users.delete();
      await signedInUser.user.delete();
    }
    AccountController.signOut();
    signedInUser = undefined;
    void hide();
    Loader.hide();
    return;
  }
}

function enableButton(): void {
  $("#googleSignUpModal button").prop("disabled", false);
}

function disableButton(): void {
  $("#googleSignUpModal button").prop("disabled", true);
}

function enableInput(): void {
  $("#googleSignUpModal input").prop("disabled", false);
}

function disableInput(): void {
  $("#googleSignUpModal input").prop("disabled", true);
}

const nameIndicator = new InputIndicator($("#googleSignUpModal input"), {
  available: {
    icon: "fa-check",
    level: 1,
  },
  unavailable: {
    icon: "fa-times",
    level: -1,
  },
  taken: {
    icon: "fa-user",
    level: -1,
  },
  checking: {
    icon: "fa-circle-notch",
    spinIcon: true,
    level: 0,
  },
});

const checkNameDebounced = debounce(1000, async () => {
  const val = $("#googleSignUpModal input").val() as string;
  if (!val) return;
  const response = await Ape.users.getNameAvailability(val);

  if (response.status === 200) {
    nameIndicator.show("available", response.message);
    enableButton();
    return;
  }

  if (response.status === 422) {
    nameIndicator.show("unavailable", response.message);
    return;
  }

  if (response.status === 409) {
    nameIndicator.show("taken", response.message);
    return;
  }

  if (response.status !== 200) {
    nameIndicator.show("unavailable");
    return Notifications.add(
      "Failed to check name availability: " + response.message,
      -1
    );
  }
});

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    void apply();
  });
  modalEl.querySelector("input")?.addEventListener("input", () => {
    disableButton();
    const val = $("#googleSignUpModal input").val() as string;
    if (val === "") {
      return nameIndicator.hide();
    } else {
      nameIndicator.show("checking");
      void checkNameDebounced();
    }
  });
}

subscribeToSignUpEvent((signedInUser, isNewUser) => {
  if (signedInUser !== undefined && isNewUser) {
    show(signedInUser);
  }
});

const modal = new AnimatedModal({
  dialogId: "googleSignUpModal",
  setup,
  customEscapeHandler: async (): Promise<void> => {
    void hide();
  },
  customWrapperClickHandler: async (): Promise<void> => {
    void hide();
  },
});
