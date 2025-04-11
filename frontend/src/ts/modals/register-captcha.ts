import * as CaptchaController from "../controllers/captcha-controller";
import AnimatedModal from "../utils/animated-modal";
import { promiseWithResolvers } from "../utils/misc";

let { promise, resolve } = promiseWithResolvers<string | undefined>();

export { promise };

export async function show(): Promise<void> {
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
