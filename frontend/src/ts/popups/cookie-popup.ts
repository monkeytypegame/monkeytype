import { activateAnalytics } from "../controllers/analytics-controller";
import { focusWords } from "../test/test-ui";

let visible = false;

type Accepted = {
  security: boolean;
  analytics: boolean;
};

function getAcceptedObject(): Accepted | null {
  const acceptedCookies = localStorage.getItem("acceptedCookies");
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
  if ($("#cookiePopupWrapper").hasClass("hidden")) {
    $("#cookiePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        visible = true;
      });
  }
}

export async function hide(): Promise<void> {
  if (!$("#cookiePopupWrapper").hasClass("hidden")) {
    focusWords();
    $("#cookiePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#cookiePopupWrapper").addClass("hidden");
          visible = false;
        }
      );
  }
}

export function showSettings(): void {
  $("#cookiePopup .main").addClass("hidden");
  $("#cookiePopup .settings").removeClass("hidden");
}

$("#cookiePopup .acceptAll").on("click", () => {
  const accepted = {
    security: true,
    analytics: true,
  };
  setAcceptedObject(accepted);
  activateAnalytics();
  hide();
});

$("#cookiePopup .acceptSelected").on("click", () => {
  const analytics = $("#cookiePopup .cookie.analytics input").prop("checked");
  const accepted = {
    security: true,
    analytics,
  };
  setAcceptedObject(accepted);
  hide();

  if (analytics === true) {
    activateAnalytics();
  }
});

$("#cookiePopup .openSettings").on("click", () => {
  showSettings();
});

$(document).on("keypress", (e) => {
  if (visible) {
    e.preventDefault();
  }
});
