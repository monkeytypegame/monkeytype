import { envConfig } from "virtual:env-config";
import AnimatedModal from "../utils/animated-modal";
import { showPopup } from "./simple-modals";
import * as Notifications from "../elements/notifications";
import { setMediaQueryDebugLevel } from "../ui";
import { signIn } from "../auth";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import { update } from "../elements/xp-bar";
import { toggleUserFakeChartData } from "../test/result";
import { toggleCaretDebug } from "../utils/caret";
import { getInputElement } from "../input/input-element";
import { disableSlowTimerFail } from "../test/test-timer";
import { ElementWithUtils, qsr } from "../utils/dom";

let mediaQueryDebugLevel = 0;

export function show(): void {
  void modal.show();
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs(".generateData")?.on("click", () => {
    showPopup("devGenerateData");
  });
  modalEl.qs(".showTestNotifications")?.on("click", () => {
    Notifications.add("This is a test", 1, {
      duration: 0,
    });
    Notifications.add("This is a test", 0, {
      duration: 0,
    });
    Notifications.add("This is a test", -1, {
      duration: 0,
      details: { test: true, error: "Example error message" },
    });
    void modal.hide();
  });
  modalEl.qs(".toggleMediaQueryDebug")?.on("click", () => {
    mediaQueryDebugLevel++;
    if (mediaQueryDebugLevel > 2) {
      mediaQueryDebugLevel = 0;
    }
    Notifications.add(
      `Setting media query debug level to ${mediaQueryDebugLevel}`,
      5,
    );
    setMediaQueryDebugLevel(mediaQueryDebugLevel);
  });
  modalEl.qs(".showRealWordsInput")?.on("click", () => {
    getInputElement().style.opacity = "1";
    getInputElement().style.marginTop = "1.5em";
    getInputElement().style.caretColor = "red";
    void modal.hide();
  });
  modalEl.qs(".quickLogin")?.on("click", () => {
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
    showLoaderBar();
    void signIn(
      envConfig.quickLoginEmail,
      envConfig.quickLoginPassword,
      true,
    ).then(() => {
      hideLoaderBar();
    });
    void modal.hide();
  });
  modalEl.qs(".xpBarTest")?.on("click", () => {
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
  modalEl.qs(".toggleFakeChartData")?.on("click", () => {
    toggleUserFakeChartData();
  });
  modalEl.qs(".toggleCaretDebug")?.on("click", () => {
    toggleCaretDebug();
  });
  modalEl.qs(".disableSlowTimerFail")?.on("click", () => {
    disableSlowTimerFail();
  });
}

const modal = new AnimatedModal({
  dialogId: "devOptionsModal",
  setup,
});

export function appendButton(): void {
  qsr("body").prependHtml(
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
