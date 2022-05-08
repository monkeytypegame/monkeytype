import { debounce } from "throttle-debounce";
import Ape from "../ape";
import Page from "./page";
import * as Notifications from "../elements/notifications";

export function enableInputs(): void {
  $(".pageLogin .button").removeClass("disabled");
  $(".pageLogin input").prop("disabled", false);
}

export function disableInputs(): void {
  $(".pageLogin .button").addClass("disabled");
  $(".pageLogin input").prop("disabled", true);
}

export function showPreloader(): void {
  $(".pageLogin .preloader").removeClass("hidden");
}

export function hidePreloader(): void {
  $(".pageLogin .preloader").addClass("hidden");
}

function updateIndicator(
  state: "checking" | "available" | "unavailable" | "taken" | "none",
  balloon?: string
): void {
  $(".page.pageLogin .register.side .checkStatus .checking").addClass("hidden");
  $(".page.pageLogin .register.side .checkStatus .available").addClass(
    "hidden"
  );
  $(".page.pageLogin .register.side .checkStatus .unavailable").addClass(
    "hidden"
  );
  $(".page.pageLogin .register.side .checkStatus .taken").addClass("hidden");
  if (state !== "none") {
    $(".page.pageLogin .register.side .checkStatus ." + state).removeClass(
      "hidden"
    );
    if (balloon) {
      $(".page.pageLogin .register.side .checkStatus ." + state).attr(
        "aria-label",
        balloon
      );
    } else {
      $(".page.pageLogin .register.side .checkStatus ." + state).removeAttr(
        "aria-label"
      );
    }
  }
}

const checkNameDebounced = debounce(1000, async () => {
  const val = $(
    ".page.pageLogin .register.side .usernameInput"
  ).val() as string;
  if (!val) return;
  const response = await Ape.users.getNameAvailability(val);

  if (response.status === 200) {
    updateIndicator("available", response.message);
    return;
  }

  if (response.status == 422) {
    updateIndicator("unavailable", response.message);
    return;
  }

  if (response.status == 409) {
    updateIndicator("taken", response.message);
    return;
  }

  if (response.status !== 200) {
    updateIndicator("unavailable");
    return Notifications.add(
      "Failed to check name availability: " + response.message,
      -1
    );
  }
});

$(".page.pageLogin .register.side .usernameInput").on("input", () => {
  setTimeout(() => {
    const val = $(
      ".page.pageLogin .register.side .usernameInput"
    ).val() as string;
    if (val === "") {
      return updateIndicator("none");
    } else {
      updateIndicator("checking");
      checkNameDebounced();
    }
  }, 1);
});

export const page = new Page(
  "login",
  $(".page.pageLogin"),
  "/login",
  () => {
    //
  },
  () => {
    //
  },
  () => {
    //
  },
  () => {
    //
  }
);
