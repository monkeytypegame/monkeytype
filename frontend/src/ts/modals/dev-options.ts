import { envConfig } from "virtual:env-config";
import AnimatedModal from "../utils/animated-modal";
import { showPopup } from "./simple-modals";
import * as Notifications from "../elements/notifications";
import { setMediaQueryDebugLevel } from "../ui";
import { signIn } from "../auth";
import * as Loader from "../elements/loader";
import { update } from "../elements/xp-bar";
import { toggleUserFakeChartData } from "../test/result";
import { toggleCaretDebug } from "../utils/caret";
import { getInputElement } from "../input/input-element";
import { disableSlowTimerFail } from "../test/test-timer";

let mediaQueryDebugLevel = 0;

export function show(): void {
  void modal.show();
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector(".generateData")?.addEventListener("click", () => {
    showPopup("devGenerateData");
  });
  modalEl
    .querySelector(".showTestNotifications")
    ?.addEventListener("click", () => {
      Notifications.add("This is a test", 1, {
        duration: 0,
        details: { test: true, error: "Example error message" },
      });
      Notifications.add("This is a test", 0, {
        duration: 0,
      });
      Notifications.add("This is a test", -1, {
        duration: 0,
      });
      void modal.hide();
    });
  modalEl
    .querySelector(".toggleMediaQueryDebug")
    ?.addEventListener("click", () => {
      mediaQueryDebugLevel++;
      if (mediaQueryDebugLevel > 3) {
        mediaQueryDebugLevel = 0;
      }
      Notifications.add(
        `Setting media query debug level to ${mediaQueryDebugLevel}`,
        5,
      );
      setMediaQueryDebugLevel(mediaQueryDebugLevel);
    });
  modalEl
    .querySelector(".showRealWordsInput")
    ?.addEventListener("click", () => {
      getInputElement().style.opacity = "1";
      getInputElement().style.marginTop = "1.5em";
      getInputElement().style.caretColor = "red";
      void modal.hide();
    });
  modalEl.querySelector(".quickLogin")?.addEventListener("click", () => {
    if (
      envConfig.quickLoginEmail === undefined ||
      envConfig.quickLoginPassword === undefined
    ) {
      Notifications.add(
        "Quick login credentials not set. Add QUICK_LOGIN_EMAIL and QUICK_LOGIN_PASSWORD to your frontend .env file.",
        -1,
      );
      return;
    }
    Loader.show();
    void signIn(envConfig.quickLoginEmail, envConfig.quickLoginPassword).then(
      () => {
        Loader.hide();
      },
    );
    void modal.hide();
  });
  modalEl.querySelector(".xpBarTest")?.addEventListener("click", () => {
    setTimeout(() => {
      void update(1000000, 20800, {
        base: 100,
        fullAccuracy: 200,
        accPenalty: 300,
        quote: 400,
        punctuation: 500,
        streak: 10_000,
        configMultiplier: 2,
      });
    }, 500);
    void modal.hide();
  });
  modalEl
    .querySelector(".toggleFakeChartData")
    ?.addEventListener("click", () => {
      toggleUserFakeChartData();
    });
  modalEl.querySelector(".toggleCaretDebug")?.addEventListener("click", () => {
    toggleCaretDebug();
  });
  modalEl
    .querySelector(".disableSlowTimerFail")
    ?.addEventListener("click", () => {
      disableSlowTimerFail();
    });
}

const modal = new AnimatedModal({
  dialogId: "devOptionsModal",
  setup,
});

export function appendButton(): void {
  $("body").prepend(
    `
      <div id="devButtons">
        <a class='button configureAPI' href='${envConfig.backendUrl}/configure/' target='_blank' aria-label="Configure API" data-balloon-pos="right"><i class="fas fa-fw fa-server"></i></a>
        <button class='button showDevOptionsModal' aria-label="Dev options" data-balloon-pos="right"><i class="fas fa-fw fa-flask"></i></button>
      <div>
      `,
  );
  document
    .querySelector("#devButtons .button.showDevOptionsModal")
    ?.addEventListener("click", () => {
      show();
    });
}
