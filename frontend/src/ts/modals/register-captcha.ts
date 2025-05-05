import * as CaptchaController from "../controllers/captcha-controller";
import AnimatedModal from "../utils/animated-modal";
import { promiseWithResolvers } from "../utils/misc";
import * as Notifications from "../elements/notifications";

let { promise, resolve } = promiseWithResolvers<string | undefined>();

export { promise };

export async function show(): Promise<void> {
  if (!CaptchaController.isCaptchaAvailable()) {
    Notifications.add(
      "Could not show register popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
      -1
    );
    resolve(undefined);
    return;
  }

  await modal.show({
    mode: "dialog",
    beforeAnimation: async (modal) => {
      ({ promise, resolve } = promiseWithResolvers<string | undefined>());
      CaptchaController.reset("register");

      CaptchaController.render(
        modal.querySelector(".g-recaptcha") as HTMLElement,
        "register",
        (token) => {
          resolve(token);
          hide();
        }
      );
    },
  });
}

function hide(resolveToUndefined = false): void {
  if (resolveToUndefined) resolve(undefined);
  void modal.hide();
}

const modal = new AnimatedModal({
  dialogId: "registerCaptchaModal",
  customEscapeHandler: async (): Promise<void> => {
    hide(true);
  },
  customWrapperClickHandler: async (): Promise<void> => {
    hide(true);
  },
});
