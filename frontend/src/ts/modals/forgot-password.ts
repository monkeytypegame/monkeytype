import * as CaptchaController from "../controllers/captcha-controller";
import AnimatedModal from "../utils/animated-modal";
import Ape from "../ape/index";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
import { UserEmailSchema } from "@monkeytype/schemas/users";
import { ElementWithUtils } from "../utils/dom";

export function show(): void {
  if (!CaptchaController.isCaptchaAvailable()) {
    Notifications.add(
      "Could not show forgot password popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
      -1,
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
    Notifications.add("Please complete the captcha");
    return;
  }

  const email =
    modal.getModal().qs<HTMLInputElement>("input")?.getValue()?.trim() ?? "";

  if (email === "") {
    Notifications.add("Please enter your email address");
    CaptchaController.reset("forgotPasswordModal");
    return;
  }

  const validation = UserEmailSchema.safeParse(email);
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
          -1,
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
