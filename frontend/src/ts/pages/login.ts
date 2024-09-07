import { debounce } from "throttle-debounce";
import Ape from "../ape";
import Page from "./page";
import * as Notifications from "../elements/notifications";
import { InputIndicator } from "../elements/input-indicator";
import * as Skeleton from "../utils/skeleton";
import * as Misc from "../utils/misc";
import TypoList from "../utils/typo-list";

export function enableSignUpButton(): void {
  $(".page.pageLogin .register.side button").prop("disabled", false);
}

export function disableSignUpButton(): void {
  $(".page.pageLogin .register.side button").prop("disabled", true);
}

export function enableInputs(): void {
  $(".pageLogin input").prop("disabled", false);
  $(".pageLogin button").prop("disabled", false);
}

export function disableInputs(): void {
  $(".pageLogin input").prop("disabled", true);
  $(".pageLogin button").prop("disabled", true);
}

export function showPreloader(): void {
  $(".pageLogin .preloader").removeClass("hidden");
}

export function hidePreloader(): void {
  $(".pageLogin .preloader").addClass("hidden");
}

export const updateSignupButton = (): void => {
  if (
    nameIndicator.get() !== "available" ||
    (emailIndicator.get() !== "valid" &&
      emailIndicator.get() !== "typo" &&
      emailIndicator.get() !== "edu") ||
    verifyEmailIndicator.get() !== "match" ||
    passwordIndicator.get() !== "good" ||
    verifyPasswordIndicator.get() !== "match"
  ) {
    disableSignUpButton();
  } else {
    enableSignUpButton();
  }
};

const checkNameDebounced = debounce(1000, async () => {
  const val = $(
    ".page.pageLogin .register.side .usernameInput"
  ).val() as string;

  if (!val) {
    updateSignupButton();
    return;
  }
  const response = await Ape.users.getNameAvailability({
    params: { name: val },
  });

  if (response.status === 200) {
    nameIndicator.show("available", response.body.message);
  } else if (response.status === 422) {
    nameIndicator.show("unavailable", response.body.message);
  } else if (response.status === 409) {
    nameIndicator.show("taken", response.body.message);
  } else {
    nameIndicator.show("unavailable", response.body.message);
    Notifications.add(
      "Failed to check name availability: " + response.body.message,
      -1
    );
  }

  updateSignupButton();
});

const checkEmail = (): void => {
  const email = $(".page.pageLogin .register.side .emailInput").val() as string;
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const educationRegex =
    /@.*(student|education|school|\.edu$|\.edu\.|\.ac\.|\.sch\.)/i;

  const emailHasTypo = TypoList.some((typo) => {
    return email.endsWith(typo);
  });

  if (emailRegex.test(email)) {
    if (emailHasTypo) {
      emailIndicator.show(
        "typo",
        "Please check your email address, it may contain a typo."
      );
    } else if (educationRegex.test(email)) {
      emailIndicator.show(
        "edu",
        "Some education emails will fail to receive our messages, or disable the account as soon as you graduate. Consider using a personal email address."
      );
    } else {
      emailIndicator.show("valid");
    }
  } else {
    emailIndicator.show("invalid");
  }

  updateSignupButton();
};

const checkEmailsMatch = (): void => {
  const email = $(".page.pageLogin .register.side .emailInput").val();
  const verifyEmail = $(
    ".page.pageLogin .register.side .verifyEmailInput"
  ).val();
  if (email === verifyEmail) {
    verifyEmailIndicator.show("match");
  } else {
    verifyEmailIndicator.show("mismatch");
  }

  updateSignupButton();
};

const checkPassword = (): void => {
  const password = $(
    ".page.pageLogin .register.side .passwordInput"
  ).val() as string;

  // Force user to use a capital letter, number, special character and reasonable length when setting up an account and changing password
  if (!Misc.isDevEnvironment() && !Misc.isPasswordStrong(password)) {
    if (password.length < 8) {
      passwordIndicator.show("short", "Password must be at least 8 characters");
    } else if (password.length > 64) {
      passwordIndicator.show("long", "Password must be at most 64 characters");
    } else {
      passwordIndicator.show(
        "weak",
        "Password must contain at least one capital letter, number, and special character"
      );
    }
  } else {
    passwordIndicator.show("good", "Password is good");
  }
  updateSignupButton();
};

const checkPasswordsMatch = (): void => {
  const password = $(".page.pageLogin .register.side .passwordInput").val();
  const verifyPassword = $(
    ".page.pageLogin .register.side .verifyPasswordInput"
  ).val();
  if (password === verifyPassword) {
    verifyPasswordIndicator.show("match");
  } else {
    verifyPasswordIndicator.show("mismatch");
  }

  updateSignupButton();
};

const nameIndicator = new InputIndicator(
  $(".page.pageLogin .register.side input.usernameInput"),
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
      icon: "fa-user",
      level: -1,
    },
    checking: {
      icon: "fa-circle-notch",
      spinIcon: true,
      level: 0,
    },
  }
);

const emailIndicator = new InputIndicator(
  $(".page.pageLogin .register.side input.emailInput"),
  {
    valid: {
      icon: "fa-check",
      level: 1,
    },
    invalid: {
      icon: "fa-times",
      level: -1,
    },
    typo: {
      icon: "fa-exclamation-triangle",
      level: 1,
    },
    edu: {
      icon: "fa-exclamation-triangle",
      level: 1,
    },
  }
);

const verifyEmailIndicator = new InputIndicator(
  $(".page.pageLogin .register.side input.verifyEmailInput"),
  {
    match: {
      icon: "fa-check",
      level: 1,
    },
    mismatch: {
      icon: "fa-times",
      level: -1,
    },
  }
);

const passwordIndicator = new InputIndicator(
  $(".page.pageLogin .register.side input.passwordInput"),
  {
    good: {
      icon: "fa-check",
      level: 1,
    },
    short: {
      icon: "fa-times",
      level: -1,
    },
    long: {
      icon: "fa-times",
      level: -1,
    },
    weak: {
      icon: "fa-times",
      level: -1,
    },
  }
);

const verifyPasswordIndicator = new InputIndicator(
  $(".page.pageLogin .register.side input.verifyPasswordInput"),
  {
    match: {
      icon: "fa-check",
      level: 1,
    },
    mismatch: {
      icon: "fa-times",
      level: -1,
    },
  }
);

$(".page.pageLogin .register.side .usernameInput").on("input", () => {
  setTimeout(() => {
    const val = $(
      ".page.pageLogin .register.side .usernameInput"
    ).val() as string;
    if (val === "") {
      nameIndicator.hide();
      return;
    } else {
      nameIndicator.show("checking");
      void checkNameDebounced();
    }
  }, 1);
});

$(".page.pageLogin .register.side .emailInput").on("input", () => {
  const emailInputValue = $(
    ".page.pageLogin .register.side .emailInput"
  ).val() as string;
  const verifyInputValue = $(
    ".page.pageLogin .register.side .verifyEmailInput"
  ).val() as string;

  if (!emailInputValue && !verifyInputValue) {
    emailIndicator.hide();
    verifyEmailIndicator.hide();
    return;
  }
  checkEmail();
  checkEmailsMatch();
});

$(".page.pageLogin .register.side .verifyEmailInput").on("input", () => {
  const emailInputValue = $(
    ".page.pageLogin .register.side .emailInput"
  ).val() as string;
  const verifyInputValue = $(
    ".page.pageLogin .register.side .verifyEmailInput"
  ).val() as string;

  if (!emailInputValue && !verifyInputValue) {
    emailIndicator.hide();
    verifyEmailIndicator.hide();
    return;
  }
  checkEmailsMatch();
});

$(".page.pageLogin .register.side .passwordInput").on("input", () => {
  const passwordInputValue = $(
    ".page.pageLogin .register.side .passwordInput"
  ).val() as string;
  const verifyPasswordInputValue = $(
    ".page.pageLogin .register.side .verifyPasswordInput"
  ).val() as string;

  if (!passwordInputValue && !verifyPasswordInputValue) {
    passwordIndicator.hide();
    verifyPasswordIndicator.hide();
    return;
  }
  checkPassword();
  checkPasswordsMatch();
});

$(".page.pageLogin .register.side .verifyPasswordInput").on("input", () => {
  const passwordInputValue = $(
    ".page.pageLogin .register.side .passwordInput"
  ).val() as string;
  const verifyPasswordInputValue = $(
    ".page.pageLogin .register.side .verifyPasswordInput"
  ).val() as string;

  if (!passwordInputValue && !verifyPasswordInputValue) {
    passwordIndicator.hide();
    verifyPasswordIndicator.hide();
    return;
  }
  checkPassword();
  checkPasswordsMatch();
});

export const page = new Page({
  name: "login",
  element: $(".page.pageLogin"),
  path: "/login",
  afterHide: async (): Promise<void> => {
    $(".pageLogin input").val("");
    nameIndicator.hide();
    emailIndicator.hide();
    verifyEmailIndicator.hide();
    passwordIndicator.hide();
    verifyPasswordIndicator.hide();
    Skeleton.remove("pageLogin");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLogin", "main");
    enableInputs();
    disableSignUpButton();
  },
});

$(() => {
  Skeleton.save("pageLogin");
});
