import Ape from "../ape";
import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import TypoList from "../utils/typo-list";
import {
  PasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";
import { ValidatedHtmlInputElement } from "../elements/input-validation";
import { isDevEnvironment } from "../utils/misc";
import { z } from "zod";
import { remoteValidation } from "../utils/remote-validation";
import { qs, qsa, qsr, onDOMReady } from "../utils/dom";
import { signIn, signInWithGitHub, signInWithGoogle, signUp } from "../auth";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";

let registerForm: {
  name?: string;
  email?: string;
  password?: string;
} = {};

export function enableSignUpButton(): void {
  qs(".page.pageLogin .register.side button")?.enable();
}

export function disableSignUpButton(): void {
  qs(".page.pageLogin .register.side button")?.disable();
}

export function enableInputs(): void {
  qsa(".pageLogin input")?.enable();
  qsa(".pageLogin button")?.enable();
}

export function disableInputs(): void {
  qsa(".pageLogin input")?.disable();
  qsa(".pageLogin button")?.disable();
}

export function showPreloader(): void {
  qs(".pageLogin .preloader")?.show();
}

export function hidePreloader(): void {
  qs(".pageLogin .preloader")?.hide();
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

const nameInputEl = qsr<HTMLInputElement>(
  ".page.pageLogin .register.side input.usernameInput",
);
new ValidatedHtmlInputElement(nameInputEl, {
  schema: UserNameSchema,
  isValid: remoteValidation(
    async (name) => Ape.users.getNameAvailability({ params: { name } }),
    { check: (data) => data.available || "Name not available" },
  ),
  debounceDelay: 1000,
  callback: (result) => {
    registerForm.name =
      result.status === "success" ? nameInputEl?.getValue() : undefined;
    updateSignupButton();
  },
});

let disposableEmailModule: typeof import("disposable-email-domains-js") | null =
  null;
let moduleLoadAttempted = false;

const emailInputEl = new ValidatedHtmlInputElement(
  qsr(".page.pageLogin .register.side input.emailInput"),
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
        emailVerifyInputEl?.dispatch("input");
      }
    },
  },
);

emailInputEl.on("focus", async () => {
  if (!moduleLoadAttempted) {
    moduleLoadAttempted = true;
    try {
      disposableEmailModule = await import("disposable-email-domains-js");
    } catch (e) {
      // Silent failure
    }
  }
});

const emailVerifyInputEl = qsr<HTMLInputElement>(
  ".page.pageLogin .register.side input.verifyEmailInput",
);
new ValidatedHtmlInputElement(emailVerifyInputEl, {
  isValid: async (emailVerify: string) => {
    return emailInputEl.getValue() === emailVerify
      ? true
      : "verify email not matching email";
  },
  debounceDelay: 0,
  callback: (result) => {
    registerForm.email =
      emailInputEl.getValidationResult().status === "success" &&
      result.status === "success"
        ? emailInputEl.getValue()
        : undefined;
    updateSignupButton();
  },
});

const passwordInputEl = new ValidatedHtmlInputElement(
  qsr(".page.pageLogin .register.side .passwordInput"),
  {
    schema: isDevEnvironment() ? z.string().min(6) : PasswordSchema,
    callback: (result) => {
      if (result.status === "success") {
        //re-validate the verify password
        passwordVerifyInputEl?.dispatch("input");
      }
    },
  },
);

const passwordVerifyInputEl = qsr<HTMLInputElement>(
  ".page.pageLogin .register.side .verifyPasswordInput",
);
new ValidatedHtmlInputElement(passwordVerifyInputEl, {
  isValid: async (passwordVerify: string) => {
    return passwordInputEl.getValue() === passwordVerify
      ? true
      : "verify password not matching password";
  },
  debounceDelay: 0,
  callback: (result) => {
    registerForm.password =
      passwordInputEl.getValidationResult().status === "success" &&
      result.status === "success"
        ? passwordInputEl.getValue()
        : undefined;
    updateSignupButton();
  },
});

qs(".pageLogin .login button.signInWithGoogle")?.on("click", async () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0);
    return;
  }

  const rememberMe =
    qs<HTMLInputElement>(".pageLogin .login #rememberMe input")?.isChecked() ??
    false;

  showPreloader();
  disableInputs();
  disableSignUpButton();
  const data = await signInWithGoogle(rememberMe);
  hidePreloader();

  if (!data.success) {
    Notifications.add(data.message, -1);
    enableInputs();
    enableSignUpButton();
  }
});

qs(".pageLogin .login form")?.on("submit", async (e) => {
  e.preventDefault();

  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0);
    return;
  }

  const email =
    qsa<HTMLInputElement>(".pageLogin .login input")?.[0]?.getValue() ?? "";
  const password =
    qsa<HTMLInputElement>(".pageLogin .login input")?.[1]?.getValue() ?? "";
  const rememberMe =
    qs<HTMLInputElement>(".pageLogin .login #rememberMe input")?.isChecked() ??
    false;

  if (email === "" || password === "") {
    Notifications.add("Please fill in all fields", 0);
    return;
  }

  showPreloader();
  disableInputs();
  disableSignUpButton();
  const data = await signIn(email, password, rememberMe);
  hidePreloader();

  if (!data.success) {
    Notifications.add(data.message, -1);
    enableInputs();
    enableSignUpButton();
  }
});

qs(".pageLogin .login button.signInWithGitHub")?.on("click", async () => {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0);
    return;
  }

  const rememberMe =
    qs<HTMLInputElement>(".pageLogin .login #rememberMe input")?.isChecked() ??
    false;

  showPreloader();
  disableInputs();
  disableSignUpButton();
  const data = await signInWithGitHub(rememberMe);
  hidePreloader();

  if (!data.success) {
    Notifications.add(data.message, -1);
    enableInputs();
    enableSignUpButton();
  }
});

qs(".pageLogin .register form")?.on("submit", async (e) => {
  e.preventDefault();

  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0);
    return;
  }

  const signupData = getSignupData();
  if (signupData === false) {
    Notifications.add("Please fill in all fields", 0);
    return;
  }

  showPreloader();
  disableInputs();
  disableSignUpButton();

  const data = await signUp(
    signupData.name,
    signupData.email,
    signupData.password,
  );

  hidePreloader();
  if (!data.success) {
    Notifications.add(data.message, -1);
    enableInputs();
    enableSignUpButton();
  }
});

export const page = new Page({
  id: "login",
  element: qsr(".page.pageLogin"),
  path: "/login",
  afterHide: async (): Promise<void> => {
    hidePreloader();
    Skeleton.remove("pageLogin");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLogin", "main");
    registerForm = {};
    const inputs = qsa<HTMLInputElement>(".pageLogin input");
    inputs.forEach((input) => {
      input.setValue("");
    });
    qsa(".pageLogin .register .indicator")?.hide();
    enableInputs();
    disableSignUpButton();
  },
});

onDOMReady(() => {
  Skeleton.save("pageLogin");
});
