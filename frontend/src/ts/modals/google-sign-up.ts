import { ElementWithUtils, qsr } from "../utils/dom";
import * as Notifications from "../elements/notifications";
import {
  sendEmailVerification,
  updateProfile,
  UserCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import Ape from "../ape";
import { createErrorMessage } from "../utils/misc";
import * as LoginPage from "../pages/login";
import * as AccountController from "../auth";
import * as CaptchaController from "../controllers/captcha-controller";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import { subscribe as subscribeToSignUpEvent } from "../observables/google-sign-up-event";
import AnimatedModal from "../utils/animated-modal";
import { resetIgnoreAuthCallback } from "../firebase";
import { ValidatedHtmlInputElement } from "../elements/input-validation";
import { UserNameSchema } from "@monkeytype/schemas/users";
import { remoteValidation } from "../utils/remote-validation";

let signedInUser: UserCredential | undefined = undefined;

function show(credential: UserCredential): void {
  void modal.show({
    mode: "dialog",
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      signedInUser = credential;

      if (!CaptchaController.isCaptchaAvailable()) {
        Notifications.add(
          "Could not show google sign up popup: Captcha is not avilable. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
          -1,
        );
        return;
      }
      CaptchaController.reset("googleSignUpModal");
      CaptchaController.render(
        modalEl.qsr(".captcha").native,
        "googleSignUpModal",
      );
      enableInput();
      disableButton();
    },
    afterAnimation: async () => {
      if (!CaptchaController.isCaptchaAvailable()) {
        void hide();
      }
    },
  });
}

async function hide(): Promise<void> {
  void modal.hide({
    afterAnimation: async () => {
      resetIgnoreAuthCallback();
      if (signedInUser !== undefined) {
        Notifications.add("Sign up process cancelled", 0, {
          duration: 5,
        });
        LoginPage.hidePreloader();
        LoginPage.enableInputs();
        if (getAdditionalUserInfo(signedInUser)?.isNewUser) {
          await Ape.users.delete();
          await signedInUser?.user.delete().catch(() => {
            //user might be deleted already by the server
          });
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
      -1,
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

  showLoaderBar();
  const name = modal
    .getModal()
    .qsr<HTMLInputElement>("input")
    .getValue() as string;
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
      hideLoaderBar();
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
      await signedInUser?.user.delete().catch(() => {
        //user might be deleted already by the server
      });
    }
    AccountController.signOut();
    signedInUser = undefined;
    void hide();
    hideLoaderBar();
    return;
  }
}

function enableButton(): void {
  modal.getModal().qsr("button").enable();
}

function disableButton(): void {
  modal.getModal().qsr("button").disable();
}

const nameInputEl = qsr<HTMLInputElement>("#googleSignUpModal input");

function enableInput(): void {
  nameInputEl?.enable();
}

function disableInput(): void {
  nameInputEl?.disable();
}

new ValidatedHtmlInputElement(nameInputEl, {
  schema: UserNameSchema,
  isValid: remoteValidation(
    async (name) => Ape.users.getNameAvailability({ params: { name } }),
    { check: (data) => data.available || "Name not available" },
  ),
  debounceDelay: 1000,
  callback: (result) => {
    if (result.status === "success") {
      enableButton();
    } else {
      disableButton();
    }
  },
});

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.on("submit", (e) => {
    e.preventDefault();
    void apply();
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
