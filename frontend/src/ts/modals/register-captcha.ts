import * as CaptchaController from "../controllers/captcha-controller";
import AnimatedModal from "../utils/animated-modal";

let resolvePromise: (token?: string) => void;

export let promise = new Promise<string | undefined>((resolve) => {
  resolvePromise = resolve;
});

export function show(): void {
  void modal.show({
    mode: "dialog",
    beforeAnimation: async (modal) => {
      promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      CaptchaController.reset("register");

      CaptchaController.render(
        modal.querySelector(".g-recaptcha") as HTMLElement,
        "register",
        (token) => {
          resolvePromise(token);
          hide();
        }
      );
    },
  });
}

function hide(resolveToUndefined = false): void {
  if (resolveToUndefined) resolvePromise();
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
