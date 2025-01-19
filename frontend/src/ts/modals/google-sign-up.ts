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
import * as CaptchaController from "../controllers/captcha-controller";
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
    Notifications.add(
      "Missing user credential. Please close the popup and try again.",
      -1
    );
    return;
  }

  const captcha = CaptchaController.getResponse("googleSignUpModal");
  if (!captcha) {
    Notifications.add("Please complete the captcha", 0);
    return;
  }

  disableInput();
  disableButton();

  Loader.show();
  const name = $("#googleSignUpModal input").val() as string;
  try {
    if (name.length === 0) throw new Error("Name cannot be empty");
    const response = await Ape.users.create({ body: { name, captcha } });
    if (response.status !== 200) {
      throw new Error(`Failed to create user: ${response.body.message}`);
    }

    if (response.status === 200) {
      await updateProfile(signedInUser.user, { displayName: name });
      await sendEmailVerification(signedInUser.user);
      Notifications.add("Account created", 1);
      LoginPage.enableInputs();
      LoginPage.hidePreloader();
      await AccountController.loadUser(signedInUser.user);

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
  const response = await Ape.users.getNameAvailability({
    params: { name: val },
  });

  if (response.status === 200) {
    nameIndicator.show("available", response.body.message);
    enableButton();
  } else if (response.status === 422) {
    nameIndicator.show("unavailable", response.body.message);
  } else if (response.status === 409) {
    nameIndicator.show("taken", response.body.message);
  } else {
    nameIndicator.show("unavailable");
    Notifications.add(
      "Failed to check name availability: " + response.body.message,
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
      nameIndicator.hide();
      return;
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
