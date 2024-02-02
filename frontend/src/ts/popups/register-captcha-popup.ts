import * as CaptchaController from "../controllers/captcha-controller";
import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "registerCaptchaPopupWrapper";

let resolvePromise: (token?: string) => void;

export let promise: Promise<string | undefined> = new Promise((resolve) => {
  resolvePromise = resolve;
});

export function show(): void {
  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    CaptchaController.reset("register");
    CaptchaController.render(
      $("#registerCaptchaPopup .g-recaptcha")[0] as HTMLElement,
      "register",
      (token) => {
        resolvePromise(token);
        hide();
      }
    );
    $("#registerCaptchaPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hide(resolveToUndefined = false): void {
  if (isPopupVisible(wrapperId)) {
    if (resolveToUndefined) resolvePromise();
    $("#registerCaptchaPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#registerCaptchaPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

$("#registerCaptchaPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "registerCaptchaPopupWrapper") {
    hide(true);
  }
});

Skeleton.save(wrapperId);
