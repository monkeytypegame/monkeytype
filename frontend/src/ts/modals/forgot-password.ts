import * as CaptchaController from "../controllers/captcha-controller";
import AnimatedModal from "../utils/animated-modal";
import Ape from "../ape/index";
import { notify, notifyError, notifySuccess } from "../stores/notifications";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import { UserEmailSchema } from "@monkeytype/schemas/users";
import { ElementWithUtils } from "../utils/dom";

export function show(): void {
  if (!CaptchaController.isCaptchaAvailable()) {
    notifyError(
      "Could not show forgot password popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
    );
    return;
  }

  void modal.show({
    mode: "dialog",
    focusFirstInput: true,
    beforeAnimation: async (modal) => {
      CaptchaController.reset("forgotPasswordModal");
      CaptchaController.render(
        modal.qsr(".g-recaptcha").native,
        "forgotPasswordModal",
        async () => {
          await submit();
        },
      );
    },
  });
}

async function submit(): Promise<void> {
  const captchaResponse = CaptchaController.getResponse("forgotPasswordModal");
  if (!captchaResponse) {
    notify("Please complete the captcha");
    return;
  }

  const email =
    modal.getModal().qs<HTMLInputElement>("input")?.getValue()?.trim() ?? "";

  if (email === "") {
    notify("Please enter your email address");
    CaptchaController.reset("forgotPasswordModal");
    return;
  }

  const validation = UserEmailSchema.safeParse(email);
  if (!validation.success) {
    notify("Please enter a valid email address");
    CaptchaController.reset("forgotPasswordModal");
    return;
  }

  showLoaderBar();
  void Ape.users
    .forgotPasswordEmail({
      body: { email, captcha: captchaResponse },
    })
    .then((result) => {
      hideLoaderBar();
      if (result.status !== 200) {
        notifyError(
          "Failed to send password reset email: " + result.body.message,
        );
        return;
      }

      notifySuccess(result.body.message, { durationMs: 5000 });
    });

  hide();
}

function hide(): void {
  void modal.hide();
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs("button")?.on("click", async () => {
    await submit();
  });
}

const modal = new AnimatedModal({
  dialogId: "forgotPasswordModal",
  setup,
  customEscapeHandler: async (): Promise<void> => {
    hide();
  },
  customWrapperClickHandler: async (): Promise<void> => {
    hide();
  },
});
