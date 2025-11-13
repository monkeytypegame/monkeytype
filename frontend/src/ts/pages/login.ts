import Ape from "../ape";
import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import TypoList from "../utils/typo-list";
import {
  PasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";
import { validateWithIndicator } from "../elements/input-validation";
import { isDevEnvironment } from "../utils/misc";
import { z } from "zod";
import { remoteValidation } from "../utils/remote-validation";

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

function isFormComplete(): boolean {
  return (
    registerForm.name !== undefined &&
    registerForm.email !== undefined &&
    registerForm.password !== undefined
  );
}

export const updateSignupButton = (): void => {
  if (isFormComplete()) {
    enableSignUpButton();
  } else {
    disableSignUpButton();
  }
};

type SignupData = {
  name: string;
  email: string;
  password: string;
};
export function getSignupData(): SignupData | false {
  return isFormComplete() ? (registerForm as SignupData) : false;
}

const nameInputEl = document.querySelector(
  ".page.pageLogin .register.side input.usernameInput"
) as HTMLInputElement;
validateWithIndicator(nameInputEl, {
  schema: UserNameSchema,
  isValid: remoteValidation(
    async (name) => Ape.users.getNameAvailability({ params: { name } }),
    { check: (data) => data.available || "Name not available" }
  ),
  debounceDelay: 1000,
  callback: (result) => {
    registerForm.name =
      result.status === "success" ? nameInputEl.value : undefined;
    updateSignupButton();
  },
});

let disposableEmailModule: typeof import("disposable-email-domains-js") | null =
  null;
let moduleLoadAttempted = false;

const emailInputEl = validateWithIndicator(
  document.querySelector(
    ".page.pageLogin .register.side input.emailInput"
  ) as HTMLInputElement,
  {
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

      if (
        disposableEmailModule &&
        disposableEmailModule.isDisposableEmail !== undefined
      ) {
        try {
          if (disposableEmailModule.isDisposableEmail(email)) {
            return {
              warning:
                "Using a temporary email may cause issues with logging in, password resets and support. Consider using a permanent email address. Don't worry, we don't send spam.",
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
  }
);

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
      emailInputEl.getValidationResult().status === "success" &&
      result.status === "success"
        ? emailInputEl.value
        : undefined;
    updateSignupButton();
  },
});

const passwordInputEl = validateWithIndicator(
  document.querySelector(
    ".page.pageLogin .register.side .passwordInput"
  ) as HTMLInputElement,
  {
    schema: isDevEnvironment() ? z.string().min(6) : PasswordSchema,
    callback: (result) => {
      if (result.status === "success") {
        //re-validate the verify password
        passwordVerifyInputEl.dispatchEvent(new Event("input"));
      }
    },
  }
);

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
      passwordInputEl.getValidationResult().status === "success" &&
      result.status === "success"
        ? passwordInputEl.value
        : undefined;
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
