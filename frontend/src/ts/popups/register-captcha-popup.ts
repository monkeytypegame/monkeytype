import * as CaptchaController from "../controllers/captcha-controller";

let resolvePromise: (data?: string) => void;

export let promise: Promise<string | undefined> = new Promise((resolve) => {
  resolvePromise = resolve;
});

export function show(): void {
  if ($("#registerCaptchaPopupWrapper").hasClass("hidden")) {
    promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    CaptchaController.reset("register");
    CaptchaController.render(
      $("#registerCaptchaPopup .g-recaptcha")[0],
      "register",
      (data) => {
        resolvePromise(data);
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

export function hide(resolveToUndefined = false): void {
  if (!$("#registerCaptchaPopupWrapper").hasClass("hidden")) {
    if (resolveToUndefined) resolvePromise();
    $("#registerCaptchaPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#registerCaptchaPopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#registerCaptchaPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "registerCaptchaPopupWrapper") {
    hide(true);
  }
});
