import {
  PasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";
import { useQuery } from "@tanstack/solid-query";
import { createSignal, JSXElement, Show } from "solid-js";
import { z } from "zod";

import Ape from "../../ape";
import { signIn, signInWithGitHub, signInWithGoogle, signUp } from "../../auth";
import {
  IsValidResponse,
  ValidationResult,
} from "../../elements/input-validation";
import * as ForgotPasswordModal from "../../modals/forgot-password";
import { getServerConfigurationQueryOptions } from "../../queries/server-configuration";
import { getActivePage } from "../../signals/core";
import * as ConnectionState from "../../states/connection";
import {
  showLoginPageLoader,
  hideLoginPageLoader,
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
  getLoginPageLoader,
} from "../../stores/login";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../../stores/notifications";
import { isDevEnvironment } from "../../utils/misc";
import { remoteValidation } from "../../utils/remote-validation";
import TypoList from "../../utils/typo-list";
import { Conditional } from "../common/Conditional";
import { Separator } from "../common/Separator";
import { ValidatedInput } from "../ui/ValidatedInput";

let disposableEmailModule: typeof import("disposable-email-domains-js") | null =
  null;
let moduleLoadAttempted = false;

export function LoginPage(): JSXElement {
  const isOpen = () => getActivePage() === "login";

  const [nameValid, setNameValid] = createSignal(false);
  const [emailValid, setEmailValid] = createSignal(false);
  const [emailVerifyValid, setEmailVerifyValid] = createSignal(false);
  const [passwordValid, setPasswordValid] = createSignal(false);
  const [passwordVerifyValid, setPasswordVerifyValid] = createSignal(false);

  const [emailValue, setEmailValue] = createSignal("");
  const [passwordValue, setPasswordValue] = createSignal("");

  const [loginEmail, setLoginEmail] = createSignal("");
  const [loginPassword, setLoginPassword] = createSignal("");
  const [rememberMe, setRememberMe] = createSignal(true);

  const isRegisterFormComplete = () =>
    nameValid() &&
    emailValid() &&
    emailVerifyValid() &&
    passwordValid() &&
    passwordVerifyValid();

  const handleSignInWithGoogle = async () => {
    if (!ConnectionState.get()) {
      showNoticeNotification("You are offline");
      return;
    }
    showLoginPageLoader();
    disableLoginPageInputs();
    const data = await signInWithGoogle(rememberMe());
    hideLoginPageLoader();
    if (!data.success) {
      showErrorNotification(data.message);
      enableLoginPageInputs();
    }
  };

  const handleSignInWithGitHub = async () => {
    if (!ConnectionState.get()) {
      showNoticeNotification("You are offline");
      return;
    }
    showLoginPageLoader();
    disableLoginPageInputs();
    const data = await signInWithGitHub(rememberMe());
    hideLoginPageLoader();
    if (!data.success) {
      showErrorNotification(data.message);
      enableLoginPageInputs();
    }
  };

  const handleSignIn = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!ConnectionState.get()) {
      showNoticeNotification("You are offline");
      return;
    }
    if (loginEmail() === "" || loginPassword() === "") {
      showNoticeNotification("Please fill in all fields");
      return;
    }
    showLoginPageLoader();
    disableLoginPageInputs();
    const data = await signIn(loginEmail(), loginPassword(), rememberMe());
    hideLoginPageLoader();
    if (!data.success) {
      showErrorNotification(data.message);
      enableLoginPageInputs();
    }
  };

  const handleSignUp = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!ConnectionState.get()) {
      showNoticeNotification("You are offline");
      return;
    }
    if (!isRegisterFormComplete()) {
      showNoticeNotification("Please fill in all fields");
      return;
    }
    showLoginPageLoader();
    disableLoginPageInputs();
    const data = await signUp(nameValue(), emailValue(), passwordValue());
    hideLoginPageLoader();
    if (!data.success) {
      showErrorNotification(data.message);
      enableLoginPageInputs();
    }
  };

  const [nameValue, setNameValue] = createSignal("");

  const emailIsValid = async (email: string): Promise<IsValidResponse> => {
    const educationRegex =
      /@.*(student|education|school|\.edu$|\.edu\.|\.ac\.|\.sch\.)/i;
    if (educationRegex.test(email)) {
      return {
        warning:
          "Some education emails will fail to receive our messages, or disable the account as soon as you graduate. Consider using a personal email address.",
      };
    }

    const emailHasTypo = TypoList.some((typo) => email.endsWith(typo));
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
      } catch {
        // Silent failure
      }
    }

    return true;
  };

  const Register = () => (
    <div class="grid grid-cols-1 justify-center gap-2">
      <div class="inline-flex items-baseline text-sub">
        <i class="fas fa-user-plus mr-[0.5em]"></i>
        register
      </div>
      <form
        action=""
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete="off"
        class="grid w-full gap-2"
        onSubmit={handleSignUp}
      >
        <ValidatedInput
          type="text"
          class="w-68"
          placeholder="username"
          autocomplete="new-username"
          schema={UserNameSchema}
          isValid={remoteValidation(
            async (name: string) =>
              Ape.users.getNameAvailability({ params: { name } }),
            { check: (data) => data.available || "Name not available" },
          )}
          debounceDelay={1000}
          callback={(result: ValidationResult) => {
            setNameValid(result.success);
          }}
          onInput={(value: string) => setNameValue(value)}
        />
        <ValidatedInput
          type="email"
          class="w-68"
          placeholder="email"
          autocomplete="new-email"
          schema={UserEmailSchema}
          isValid={emailIsValid}
          debounceDelay={0}
          callback={(result: ValidationResult) => {
            setEmailValid(result.success);
          }}
          onInput={(value: string) => setEmailValue(value)}
          // oxlint-disable-next-line solid/reactivity
          onFocus={async () => {
            if (!moduleLoadAttempted) {
              moduleLoadAttempted = true;
              try {
                disposableEmailModule =
                  await import("disposable-email-domains-js");
              } catch {
                // Silent failure
              }
            }
          }}
        />
        <ValidatedInput
          type="email"
          class="w-68"
          placeholder="verify email"
          autocomplete="verify-email"
          // oxlint-disable-next-line solid/reactivity
          isValid={async (emailVerify: string) =>
            emailValue() === emailVerify
              ? true
              : "verify email not matching email"
          }
          debounceDelay={0}
          callback={(result: ValidationResult) => {
            setEmailVerifyValid(emailValid() && result.success);
          }}
        />
        <ValidatedInput
          type="password"
          class="w-68"
          placeholder="password"
          autocomplete="new-password"
          name="new-password"
          schema={isDevEnvironment() ? z.string().min(6) : PasswordSchema}
          callback={(result: ValidationResult) => {
            setPasswordValid(result.success);
          }}
          onInput={(value: string) => setPasswordValue(value)}
        />
        <ValidatedInput
          type="password"
          class="w-68"
          placeholder="verify password"
          autocomplete="verify-password"
          name="verify-password"
          // oxlint-disable-next-line solid/reactivity
          isValid={async (passwordVerify: string) =>
            passwordValue() === passwordVerify
              ? true
              : "verify password not matching password"
          }
          debounceDelay={0}
          callback={(result: ValidationResult) => {
            setPasswordVerifyValid(passwordValid() && result.success);
          }}
        />
        <button
          type="submit"
          disabled={!isRegisterFormComplete() || !getLoginPageInputsEnabled()}
        >
          <i class="fas fa-user-plus"></i>
          sign up
        </button>
      </form>
    </div>
  );

  const Login = () => (
    <div class="grid grid-cols-1 justify-center gap-2">
      <div class="inline-flex items-baseline text-sub">
        <i class="fas fa-sign-in-alt mr-[0.5em]"></i>
        login
      </div>
      <div class="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={!getLoginPageInputsEnabled()}
          onClick={handleSignInWithGoogle}
        >
          <i class="fab fa-google"></i>
        </button>
        <button
          type="button"
          disabled={!getLoginPageInputsEnabled()}
          onClick={handleSignInWithGitHub}
        >
          <i class="fab fa-github"></i>
        </button>
      </div>
      <form class="grid w-full gap-2" onSubmit={handleSignIn}>
        <Separator text="or" />
        <input
          name="current-email"
          type="email"
          class="w-68"
          placeholder="email"
          // oxlint-disable-next-line react/no-unknown-property
          autocomplete="current-email"
          disabled={!getLoginPageInputsEnabled()}
          onInput={(e) => setLoginEmail(e.target.value)}
        />
        <input
          name="current-password"
          type="password"
          class="w-68"
          placeholder="password"
          // oxlint-disable-next-line react/no-unknown-property
          autocomplete="current-password"
          disabled={!getLoginPageInputsEnabled()}
          onInput={(e) => setLoginPassword(e.target.value)}
        />
        <div>
          <label class="flex h-6 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe()}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={!getLoginPageInputsEnabled()}
            />
            <div>remember me</div>
          </label>
        </div>
        <button
          type="submit"
          class="signIn"
          disabled={!getLoginPageInputsEnabled()}
        >
          <i class="fas fa-sign-in-alt"></i>
          sign in
        </button>
      </form>
      <button
        type="button"
        class="text text-xs"
        style={{ "justify-content": "right" }}
        onClick={() => ForgotPasswordModal.show()}
        disabled={!getLoginPageInputsEnabled()}
      >
        forgot password?
      </button>
    </div>
  );

  const serverConfig = useQuery(() => getServerConfigurationQueryOptions());
  const showError = (): boolean => !(serverConfig.data?.users.signUp ?? true);

  return (
    <Show when={isOpen()}>
      <Show when={getLoginPageLoader()}>
        <div class="fixed top-1/2 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2 text-3xl text-main transition-opacity duration-250">
          <i class="fas fa-fw fa-spin fa-circle-notch"></i>
        </div>
      </Show>
      <Conditional
        if={showError()}
        then={
          <div class="grid h-full place-items-center">
            <p>
              Login/Signup is disabled or the server is down/under maintenance.
            </p>
          </div>
        }
        else={
          <div class="flex h-full items-center justify-around gap-4">
            <Register />
            <Login />
          </div>
        }
      />
    </Show>
  );
}
