import Ape from "../ape";
import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import * as Misc from "../utils/misc";
import TypoList from "../utils/typo-list";
import { UserEmailSchema, UserNameSchema } from "@monkeytype/schemas/users";
import { validateWithIndicator } from "../elements/input-validation";
import { z } from "zod";

let registerForm: {
  name?: string;
  email?: string;
  password?: string;
} = {};

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
  if (Object.values(registerForm).some((it) => it === undefined)) {
    disableSignUpButton();
  } else {
    enableSignUpButton();
  }
};

type SignupData = {
  name: string;
  email: string;
  password: string;
};
export function getSignupData(): SignupData | false {
  return Object.values(registerForm).some((it) => it === undefined)
    ? false
    : (registerForm as SignupData);
}

const nameInputEl = document.querySelector(
  ".page.pageLogin .register.side input.usernameInput"
) as HTMLInputElement;
validateWithIndicator(nameInputEl, {
  schema: UserNameSchema,
  isValid: async (name: string) => {
    const checkNameResponse = (
      await Ape.users.getNameAvailability({
        params: { name: name },
      })
    ).status;

    return checkNameResponse === 200 ? true : "Name not available";
  },
  debounceDelay: 1000,
  callback: (result) => {
    registerForm.name =
      result.status === "success" ? nameInputEl.value : undefined;
    updateSignupButton();
  },
});

let disposableEmailModule: any = null;
let moduleLoadAttempted = false;

const emailInputEl = document.querySelector(
  ".page.pageLogin .register.side input.emailInput"
) as HTMLInputElement;

emailInputEl.addEventListener("focus", async () => {
  if (!moduleLoadAttempted) {
    moduleLoadAttempted = true;
    try {
      disposableEmailModule = await import("disposable-email-domains-js");
    } catch (e) {
      // Silent failure
    }
  }
});

validateWithIndicator(emailInputEl, {
  schema: UserEmailSchema,
  isValid: async (email: string) => {
    const educationRegex =
      /@.*(student|education|school|\.edu$|\.edu\.|\.ac\.|\.sch\.)/i;
    if (educationRegex.test(email)) {
      return {
        warning:
          "Some education emails will fail to receive our messages, or disable the account as soon as you graduate. Consider using a personal email address.",
      };
    }

    const emailHasTypo = TypoList.some((typo) => {
      return email.endsWith(typo);
    });
    if (emailHasTypo) {
      return {
        warning: "Please check your email address, it may contain a typo.",
      };
    }

    if (disposableEmailModule && disposableEmailModule.isDisposableEmail) {
      try {
        if (disposableEmailModule.isDisposableEmail(email)) {
          return {
            warning: "Be careful when using temporary emails - you will need it to log into your account",
          };
        }
      } catch (e) {
        // Silent failure
      }
    }

    return true;
  },
  debounceDelay: 0,
  callback: (result) => {
    if (result.status === "success") {
      //re-validate the verify email
      emailVerifyInputEl.dispatchEvent(new Event("input"));
    }
  },
});

const emailVerifyInputEl = document.querySelector(
  ".page.pageLogin .register.side input.verifyEmailInput"
) as HTMLInputElement;
validateWithIndicator(emailVerifyInputEl, {
  isValid: async (emailVerify: string) => {
    return emailInputEl.value === emailVerify
      ? true
      : "verify email not matching email";
  },
  debounceDelay: 0,
  callback: (result) => {
    registerForm.email =
      result.status === "success" ? emailInputEl.value : undefined;
    updateSignupButton();
  },
});

const passwordInputEl = document.querySelector(
  ".page.pageLogin .register.side .passwordInput"
) as HTMLInputElement;
validateWithIndicator(passwordInputEl, {
  schema: z.string().min(6), //firebase requires min 6 chars, we apply stricter rules on prod
  isValid: async (password: string) => {
    if (!Misc.isDevEnvironment() && !Misc.isPasswordStrong(password)) {
      if (password.length < 8) {
        return "Password must be at least 8 characters";
      } else if (password.length > 64) {
        return "Password must be at most 64 characters";
      } else {
        return "Password must contain at least one capital letter, number, and special character";
      }
    }
    return true;
  },
  debounceDelay: 0,
  callback: (result) => {
    if (result.status === "success") {
      //re-validate the verify password
      passwordVerifyInputEl.dispatchEvent(new Event("input"));
    }
  },
});

const passwordVerifyInputEl = document.querySelector(
  ".page.pageLogin .register.side .verifyPasswordInput"
) as HTMLInputElement;
validateWithIndicator(passwordVerifyInputEl, {
  isValid: async (passwordVerify: string) => {
    return passwordInputEl.value === passwordVerify
      ? true
      : "verify password not matching password";
  },
  debounceDelay: 0,
  callback: (result) => {
    registerForm.password =
      result.status === "success" ? passwordInputEl.value : undefined;
    updateSignupButton();
  },
});

export const page = new Page({
  id: "login",
  element: $(".page.pageLogin"),
  path: "/login",
  afterHide: async (): Promise<void> => {
    hidePreloader();
    Skeleton.remove("pageLogin");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLogin", "main");
    registerForm = {};
    $(".pageLogin input").val("");
    $(".pageLogin .register .indicator").addClass("hidden");
    enableInputs();
    disableSignUpButton();
  },
});

$(() => {
  Skeleton.save("pageLogin");
});
