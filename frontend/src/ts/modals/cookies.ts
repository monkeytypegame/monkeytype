import { activateAnalytics } from "../controllers/analytics-controller";
import * as Notifications from "../elements/notifications";
import { isPopupVisible } from "../utils/misc";
import * as AdController from "../controllers/ad-controller";
import AnimatedModal from "../utils/animated-modal";
import { focusWords } from "../test/test-ui";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { z } from "zod";

const AcceptedSchema = z.object({
  security: z.boolean(),
  analytics: z.boolean(),
});
type Accepted = z.infer<typeof AcceptedSchema>;

const acceptedCookiesLS = new LocalStorageWithSchema({
  key: "acceptedCookies",
  schema: AcceptedSchema,
  fallback: undefined,
});

function setAcceptedObject(obj: Accepted): void {
  acceptedCookiesLS.set(obj);
}

export function check(): void {
  if (acceptedCookiesLS.get() === undefined) {
    show();
  }
}

export function show(goToSettings?: boolean): void {
  void modal.show({
    beforeAnimation: async () => {
      if (goToSettings) {
        showSettings();
      }
    },
    afterAnimation: async () => {
      if (!isPopupVisible("cookiesModal")) {
        modal.destroy();
      }
    },
  });
}

function showSettings(): void {
  modal.getModal().querySelector(".main")?.classList.add("hidden");
  modal.getModal().querySelector(".settings")?.classList.remove("hidden");
}

async function hide(): Promise<void> {
  void modal.hide({
    afterAnimation: async () => {
      focusWords();
    },
  });
}

// function verifyVisible(): void {
//   if (!modal.isOpen()) return;
//   if (!isPopupVisible("cookiePopup")) {
//     //removed by cookie popup blocking extension
//     modal.destroy();
//   }
// }

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
      };
      setAcceptedObject(accepted);
      activateAnalytics();
      void hide();
    });
    modalEl.querySelector(".rejectAll")?.addEventListener("click", () => {
      const accepted = {
        security: true,
        analytics: false,
      };
      setAcceptedObject(accepted);
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
      const accepted = {
        security: true,
        analytics: analyticsChecked,
      };
      setAcceptedObject(accepted);
      void hide();

      if (analyticsChecked) {
        activateAnalytics();
      }
    });
  },
});
