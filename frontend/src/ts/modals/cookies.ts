import * as Notifications from "../elements/notifications";
import { isPopupVisible } from "../utils/misc";
import * as AdController from "../controllers/ad-controller";
import AnimatedModal from "../utils/animated-modal";
import { focusWords } from "../test/test-ui";
import {
  AcceptedCookies,
  getAcceptedCookies,
  setAcceptedCookies,
} from "../cookies";

export function show(goToSettings?: boolean): void {
  void modal.show({
    beforeAnimation: async () => {
      if (goToSettings) {
        const currentAcceptedCookies = getAcceptedCookies();
        showSettings(currentAcceptedCookies);
      }
    },
    afterAnimation: async () => {
      if (!isPopupVisible("cookiesModal")) {
        modal.destroy();
      }
    },
  });
}

function showSettings(currentAcceptedCookies?: AcceptedCookies): void {
  modal.getModal().querySelector(".main")?.classList.add("hidden");
  modal.getModal().querySelector(".settings")?.classList.remove("hidden");

  if (currentAcceptedCookies) {
    if (currentAcceptedCookies.analytics) {
      (
        modal
          .getModal()
          .querySelector(".cookie.analytics input") as HTMLInputElement
      ).checked = true;
    }
    if (currentAcceptedCookies.sentry) {
      (
        modal
          .getModal()
          .querySelector(".cookie.sentry input") as HTMLInputElement
      ).checked = true;
    }
  }
}

async function hide(): Promise<void> {
  void modal.hide({
    afterAnimation: async () => {
      focusWords();
    },
  });
}

const modal = new AnimatedModal({
  dialogId: "cookiesModal",
  customEscapeHandler: (): void => {
    //
  },
  customWrapperClickHandler: (): void => {
    //
  },
  setup: async (modalEl): Promise<void> => {
    modalEl.querySelector(".acceptAll")?.addEventListener("click", () => {
      const accepted = {
        security: true,
        analytics: true,
        sentry: true,
      };
      setAcceptedCookies(accepted);
      void hide();
    });
    modalEl.querySelector(".rejectAll")?.addEventListener("click", () => {
      const accepted = {
        security: true,
        analytics: false,
        sentry: false,
      };
      setAcceptedCookies(accepted);
      void hide();
    });
    modalEl.querySelector(".openSettings")?.addEventListener("click", () => {
      showSettings();
    });
    modalEl
      .querySelector(".cookie.ads .textButton")
      ?.addEventListener("click", () => {
        try {
          AdController.showConsentPopup();
        } catch (e) {
          console.error("Failed to open ad consent UI");
          Notifications.add(
            "Failed to open Ad consent popup. Do you have an ad or cookie popup blocker enabled?",
            -1
          );
        }
      });
    modalEl.querySelector(".acceptSelected")?.addEventListener("click", () => {
      const analyticsChecked = (
        modalEl.querySelector(".cookie.analytics input") as HTMLInputElement
      ).checked;
      const sentryChecked = (
        modalEl.querySelector(".cookie.sentry input") as HTMLInputElement
      ).checked;
      const accepted = {
        security: true,
        analytics: analyticsChecked,
        sentry: sentryChecked,
      };
      setAcceptedCookies(accepted);
      void hide();
    });
  },
});
