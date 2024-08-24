import { envConfig } from "../constants/env-config";
import AnimatedModal from "../utils/animated-modal";
import { showPopup } from "./simple-modals";
import * as Notifications from "../elements/notifications";
import { setMediaQueryDebugLevel } from "../ui";
import { signIn } from "../controllers/account-controller";
import * as Loader from "../elements/loader";

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
        5
      );
      setMediaQueryDebugLevel(mediaQueryDebugLevel);
    });
  modalEl
    .querySelector(".showRealWordsInput")
    ?.addEventListener("click", () => {
      $("#wordsInput").css("opacity", "1");
      void modal.hide();
    });
  modalEl.querySelector(".quickLogin")?.addEventListener("click", () => {
    if (
      envConfig.quickLoginEmail === undefined ||
      envConfig.quickLoginPassword === undefined
    ) {
      Notifications.add(
        "Quick login credentials not set. Add QUICK_LOGIN_EMAIL and QUICK_LOGIN_PASSWORD to your frontend .env file.",
        -1
      );
      return;
    }
    Loader.show();
    void signIn(envConfig.quickLoginEmail, envConfig.quickLoginPassword).then(
      () => {
        Loader.hide();
      }
    );
    void modal.hide();
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
      `
  );
  document
    .querySelector("#devButtons .button.showDevOptionsModal")
    ?.addEventListener("click", () => {
      show();
    });
}
