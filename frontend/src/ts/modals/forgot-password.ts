import * as CaptchaController from "../controllers/captcha-controller";
import AnimatedModal from "../utils/animated-modal";
import Ape from "../ape/index";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
import { z } from "zod";

export function show(): void {
  if (!CaptchaController.isCaptchaAvailable()) {
    Notifications.add(
      "Could not show forgot password popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
      -1
    );
    return;
  }

  void modal.show({
    mode: "dialog",
    focusFirstInput: true,
    beforeAnimation: async (modal) => {
      CaptchaController.reset("forgotPasswordModal");
      CaptchaController.render(
        modal.querySelector(".g-recaptcha") as HTMLElement,
        "forgotPasswordModal",
        async () => {
          await submit();
        }
      );
    },
  });
}

async function submit(): Promise<void> {
  const captchaResponse = CaptchaController.getResponse("forgotPasswordModal");
  if (!captchaResponse) {
    Notifications.add("Please complete the captcha");
    return;
  }

  const email = (
    modal.getModal().querySelector("input") as HTMLInputElement
  ).value.trim();

  if (!email) {
    Notifications.add("Please enter your email address");
    CaptchaController.reset("forgotPasswordModal");
    return;
  }

  const emailSchema = z.string().email();

  const validation = emailSchema.safeParse(email);
  if (!validation.success) {
    Notifications.add("Please enter a valid email address");
    CaptchaController.reset("forgotPasswordModal");
    return;
  }

  Loader.show();
  void Ape.users
    .forgotPasswordEmail({
      body: { email, captcha: captchaResponse },
    })
    .then((result) => {
      Loader.hide();
      if (result.status !== 200) {
        Notifications.add(
          "Failed to send password reset email: " + result.body.message,
          -1
        );
        return;
      }

      Notifications.add(result.body.message, 1, { duration: 5 });
    });

  hide();
}

function hide(): void {
  void modal.hide();
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector("button")?.addEventListener("click", async () => {
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
