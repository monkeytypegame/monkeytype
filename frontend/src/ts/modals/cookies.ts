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
  modal.getModal().qs(".main")?.hide();
  modal.getModal().qs(".settings")?.show();

  if (currentAcceptedCookies) {
    if (currentAcceptedCookies.analytics) {
      modal
        .getModal()
        .qs<HTMLInputElement>(".cookie.analytics input")
        ?.setChecked(true);
    }
    if (currentAcceptedCookies.sentry) {
      modal
        .getModal()
        .qs<HTMLInputElement>(".cookie.sentry input")
        ?.setChecked(true);
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
    modalEl.qs(".acceptAll")?.on("click", () => {
      const accepted = {
        security: true,
        analytics: true,
        sentry: true,
      };
      setAcceptedCookies(accepted);
      void hide();
    });
    modalEl.qs(".rejectAll")?.on("click", () => {
      const accepted = {
        security: true,
        analytics: false,
        sentry: false,
      };
      setAcceptedCookies(accepted);
      void hide();
    });
    modalEl.qs(".openSettings")?.on("click", () => {
      showSettings();
    });
    modalEl.qs(".cookie.ads .textButton")?.on("click", () => {
      try {
        AdController.showConsentPopup();
      } catch (e) {
        console.error("Failed to open ad consent UI");
        Notifications.add(
          "Failed to open Ad consent popup. Do you have an ad or cookie popup blocker enabled?",
          -1,
        );
      }
    });
    modalEl.qs(".acceptSelected")?.on("click", () => {
      const analyticsChecked =
        modalEl.qs<HTMLInputElement>(".cookie.analytics input")?.getChecked() ??
        false;
      const sentryChecked =
        modalEl.qs<HTMLInputElement>(".cookie.sentry input")?.getChecked() ??
        false;
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
