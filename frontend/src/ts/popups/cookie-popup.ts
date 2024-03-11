import { activateAnalytics } from "../controllers/analytics-controller";
import * as Notifications from "../elements/notifications";
import { isPopupVisible } from "../utils/misc";
import * as AdController from "../controllers/ad-controller";
import AnimatedModal from "../utils/animated-modal";

type Accepted = {
  security: boolean;
  analytics: boolean;
};

function getAcceptedObject(): Accepted | null {
  const acceptedCookies = localStorage.getItem("acceptedCookies") ?? "";
  if (acceptedCookies) {
    return JSON.parse(acceptedCookies);
  } else {
    return null;
  }
}

function setAcceptedObject(obj: Accepted): void {
  localStorage.setItem("acceptedCookies", JSON.stringify(obj));
}

export function check(): void {
  const accepted = getAcceptedObject();
  if (accepted === null) {
    show();
  }
}

export function show(): void {
  void modal.show({
    afterAnimation: async () => {
      if (!isPopupVisible("cookiePopup")) {
        modal.destroy();
      }
    },
  });
}

async function hide(): Promise<void> {
  void modal.hide();
}

export function showSettings(): void {
  $("#cookiePopup .main").addClass("hidden");
  $("#cookiePopup .settings").removeClass("hidden");
}

function verifyVisible(): void {
  if (!modal.isOpen()) return;
  if (!isPopupVisible("cookiePopup")) {
    //removed by cookie popup blocking extension
    modal.destroy();
  }
}

$("#cookiePopup .acceptAll").on("click", () => {
  const accepted = {
    security: true,
    analytics: true,
  };
  setAcceptedObject(accepted);
  activateAnalytics();
  void hide();
});

$("#cookiePopup .rejectAll").on("click", () => {
  const accepted = {
    security: true,
    analytics: false,
  };
  setAcceptedObject(accepted);
  void hide();
});

$("#cookiePopup .acceptSelected").on("click", () => {
  const analytics = $("#cookiePopup .cookie.analytics input").prop("checked");
  const accepted = {
    security: true,
    analytics,
  };
  setAcceptedObject(accepted);
  void hide();

  if (analytics === true) {
    activateAnalytics();
  }
});

$("#cookiePopup .openSettings").on("click", () => {
  showSettings();
});

$(document).on("keypress", (e) => {
  verifyVisible();
  if (modal.isOpen()) {
    e.preventDefault();
  }
});

$("#cookiePopup .cookie.ads .textButton").on("click", () => {
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

const modal = new AnimatedModal("cookiePopup", "popups", undefined, {
  customEscapeHandler: (): void => {
    //
  },
  customWrapperClickHandler: (): void => {
    //
  },
});
