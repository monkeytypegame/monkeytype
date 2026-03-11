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
import {
  showNoticeNotification,
  showErrorNotification,
} from "../stores/notifications";
import * as ConnectionState from "../states/connection";

let registerForm: {
  name?: string;
  email?: string;
  password?: string;
} = {};

let loginForm: {
  email?: string;
  password?: string;
} = {};

export function enableSignUpButton(): void {
  qs(".page.pageLogin .register.side button.signUp")?.enable();
}

export function disableSignUpButton(): void {
  qs(".page.pageLogin .register.side button.signUp")?.disable();
}

export function enableSignInButton(): void {
  qs(".page.pageLogin .login.side button.signIn")?.enable();
}

export function disableSignInButton(): void {
  qs(".page.pageLogin .login.side button.signIn")?.disable();
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

function isRegisterFormComplete(): boolean {
  return (
    registerForm.name !== undefined &&
    registerForm.email !== undefined &&
    registerForm.password !== undefined
  );
}

function isLoginFormComplete(): boolean {
  return loginForm.email !== undefined && loginForm.password !== undefined;
}

export const updateSignUpButton = (): void => {
  if (isRegisterFormComplete()) {
    enableSignUpButton();
  } else {
    disableSignUpButton();
  }
};

export const updateSignInButton = (): void => {
  if (isLoginFormComplete()) {
    enableSignInButton();
  } else {
    disableSignInButton();
  }
};

type SignUpData = {
  name: string;
  email: string;
  password: string;
};

type SignInData = {
  email: string;
  password: string;
};

export function getSignUpData(): SignUpData | false {
  return isRegisterFormComplete() ? (registerForm as SignUpData) : false;
}

export function getSignInData(): SignInData | false {
  return isLoginFormComplete() ? (loginForm as SignInData) : false;
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
    updateSignUpButton();
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
    updateSignUpButton();
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
    updateSignUpButton();
  },
});

const loginEmailInputEl = qsr<HTMLInputElement>(
  '.page.pageLogin .login input[type="email"]',
);

loginEmailInputEl.on("input", () => {
  const value = loginEmailInputEl.getValue()?.trim();
  loginForm.email = value !== "" ? value : undefined;
  updateSignInButton();
});

const loginPasswordInputEl = qsr<HTMLInputElement>(
  '.page.pageLogin .login input[type="password"]',
);

loginPasswordInputEl.on("input", () => {
  const value = loginPasswordInputEl.getValue()?.trim();
  loginForm.password = value !== "" ? value : undefined;
  updateSignInButton();
});

qs(".pageLogin .login button.signInWithGoogle")?.on("click", async () => {
  if (!ConnectionState.get()) {
    showNoticeNotification("You are offline");
    return;
  }

  const rememberMe =
    qs<HTMLInputElement>(".pageLogin .login #rememberMe input")?.isChecked() ??
    false;

  showPreloader();
  disableInputs();
  disableSignInButton();
  const data = await signInWithGoogle(rememberMe);
  hidePreloader();

  if (!data.success) {
    showErrorNotification(data.message);
    enableInputs();
    enableSignInButton();
  }
});

qs(".pageLogin .login form")?.on("submit", async (e) => {
  e.preventDefault();

  if (!ConnectionState.get()) {
    showNoticeNotification("You are offline");
    return;
  }

  const signInData = getSignInData();
  const rememberMe =
    qs<HTMLInputElement>(".pageLogin .login #rememberMe input")?.isChecked() ??
    false;

  if (signInData === false) {
    showNoticeNotification("Please fill in all fields");
    return;
  }

  showPreloader();
  disableInputs();
  disableSignInButton();
  const data = await signIn(signInData.email, signInData.password, rememberMe);
  hidePreloader();

  if (!data.success) {
    showErrorNotification(data.message);
    enableInputs();
    enableSignInButton();
  }
});

qs(".pageLogin .login button.signInWithGitHub")?.on("click", async () => {
  if (!ConnectionState.get()) {
    showNoticeNotification("You are offline");
    return;
  }

  const rememberMe =
    qs<HTMLInputElement>(".pageLogin .login #rememberMe input")?.isChecked() ??
    false;

  showPreloader();
  disableInputs();
  disableSignInButton();
  const data = await signInWithGitHub(rememberMe);
  hidePreloader();

  if (!data.success) {
    showErrorNotification(data.message);
    enableInputs();
    enableSignInButton();
  }
});

qs(".pageLogin .register form")?.on("submit", async (e) => {
  e.preventDefault();

  if (!ConnectionState.get()) {
    showNoticeNotification("You are offline");
    return;
  }

  const signUpData = getSignUpData();
  if (signUpData === false) {
    showNoticeNotification("Please fill in all fields");
    return;
  }

  showPreloader();
  disableInputs();
  disableSignUpButton();

  const data = await signUp(
    signUpData.name,
    signUpData.email,
    signUpData.password,
  );

  hidePreloader();
  if (!data.success) {
    showErrorNotification(data.message);
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
    loginForm = {};
    const inputs = qsa<HTMLInputElement>(".pageLogin input");
    inputs.forEach((input) => {
      input.setValue("");
    });
    qsa(".pageLogin .register .indicator")?.hide();
    enableInputs();
    disableSignUpButton();
    disableSignInButton();
  },
});

onDOMReady(() => {
  Skeleton.save("pageLogin");
});
