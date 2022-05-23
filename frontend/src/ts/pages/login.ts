import { debounce } from "throttle-debounce";
import Ape from "../ape";
import Page from "./page";
import * as Notifications from "../elements/notifications";
import { InputIndicator } from "../elements/input-indicator";

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

const nameIndicator = new InputIndicator(
  $(".page.pageLogin .register.side .username.inputAndIndicator"),
  {
    available: {
      icon: "fa-check",
      level: 1,
    },
    unavailable: {
      icon: "fa-times",
      level: -1,
    },
    taken: {
      icon: "fa-times",
      level: -1,
    },
    checking: {
      icon: "fa-circle-notch",
      spinIcon: true,
      level: 0,
    },
  }
);

$(".page.pageLogin .register.side .passwordInput").on("input", () => {
  checkPassword();
});

const passwordIndicator = new InputIndicator(
  $(".page.pageLogin .register.side .password.inputAndIndicator"),
  {
    good: {
      icon: "fa-check",
      level: 1,
    },
    short: {
      icon: "fa-times",
      level: -1,
    },
    weak: {
      icon: "fa-times",
      level: -1,
    },
    different: {
      icon: "fa-times",
      level: -1,
    },
  }
);

const checkPassword = (): void => {
  console.log("asdf");
  passwordIndicator.show("good");
  const password = $(
    ".page.pageLogin .register.side .passwordInput"
  ).val() as string;
  const passwordVerify = $(
    ".page.pageLogin .register.side .verifyPasswordInput"
  ).val() as string;

  // Force user to use a capital letter, number, special character when setting up an account and changing password
  if (password.length < 8) {
    passwordIndicator.show("short", "Password must be at least 8 characters");
    return;
  }

  const hasCapital = password.match(/[A-Z]/);
  const hasNumber = password.match(/[\d]/);
  const hasSpecial = password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/);
  if (!hasCapital || !hasNumber || !hasSpecial) {
    passwordIndicator.show(
      "weak",
      "Password must contain at least one capital letter, number, and special character"
    );
    return;
  }

  if (password !== passwordVerify) {
    passwordIndicator.show("unavailable", "Passwords do not match");
    return;
  }

  passwordIndicator.show("good");
};

const checkNameDebounced = debounce(1000, async () => {
  const val = $(
    ".page.pageLogin .register.side .usernameInput"
  ).val() as string;
  if (!val) return;
  const response = await Ape.users.getNameAvailability(val);

  if (response.status === 200) {
    nameIndicator.show("available", response.message);
    return;
  }

  if (response.status == 422) {
    nameIndicator.show("unavailable", response.message);
    return;
  }

  if (response.status == 409) {
    nameIndicator.show("taken", response.message);
    return;
  }

  if (response.status !== 200) {
    nameIndicator.show("unavailable", response.message);
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
      return nameIndicator.hide();
    } else {
      nameIndicator.show("checking");
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
