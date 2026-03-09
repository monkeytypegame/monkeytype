import {
  PasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";
import { createSignal, JSXElement } from "solid-js";
import { z } from "zod";

import Ape from "../../../ape";
import { signUp } from "../../../auth";
import {
  IsValidResponse,
  ValidationResult,
} from "../../../elements/input-validation";
import * as ConnectionState from "../../../states/connection";
import {
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
  hideLoginPageLoader,
  showLoginPageLoader,
} from "../../../stores/login";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../stores/notifications";
import { isDevEnvironment } from "../../../utils/misc";
import { remoteValidation } from "../../../utils/remote-validation";
import TypoList from "../../../utils/typo-list";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import { ValidatedInput } from "../../ui/ValidatedInput";

let disposableEmailModule: typeof import("disposable-email-domains-js") | null =
  null;
let moduleLoadAttempted = false;

export function Register(): JSXElement {
  const [nameValue, setNameValue] = createSignal("");
  const [emailValue, setEmailValue] = createSignal("");
  const [passwordValue, setPasswordValue] = createSignal("");

  const [nameValid, setNameValid] = createSignal(false);
  const [emailValid, setEmailValid] = createSignal(false);
  const [emailVerifyValid, setEmailVerifyValid] = createSignal(false);
  const [passwordValid, setPasswordValid] = createSignal(false);
  const [passwordVerifyValid, setPasswordVerifyValid] = createSignal(false);

  const isRegisterFormComplete = () =>
    nameValid() &&
    emailValid() &&
    emailVerifyValid() &&
    passwordValid() &&
    passwordVerifyValid();

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

  return (
    <div class="grid w-full grid-cols-1 justify-center gap-2 sm:w-80">
      <H3
        text="register"
        fa={{
          icon: "fa-user-plus",
        }}
        class="p-0"
      />
      <form
        action=""
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete="off"
        class="grid w-full gap-2"
        onSubmit={handleSignUp}
      >
        <ValidatedInput
          type="text"
          placeholder="username"
          autocomplete="new-username"
          schema={UserNameSchema}
          disabled={!getLoginPageInputsEnabled()}
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
          placeholder="email"
          autocomplete="new-email"
          schema={UserEmailSchema}
          disabled={!getLoginPageInputsEnabled()}
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
          placeholder="verify email"
          autocomplete="verify-email"
          // oxlint-disable-next-line solid/reactivity
          isValid={async (emailVerify: string) =>
            emailValue() === emailVerify
              ? true
              : "verify email not matching email"
          }
          disabled={!getLoginPageInputsEnabled()}
          debounceDelay={0}
          revalidateOn={emailValue}
          callback={(result: ValidationResult) => {
            setEmailVerifyValid(emailValid() && result.success);
          }}
        />
        <ValidatedInput
          type="password"
          placeholder="password"
          autocomplete="new-password"
          name="new-password"
          disabled={!getLoginPageInputsEnabled()}
          schema={isDevEnvironment() ? z.string().min(6) : PasswordSchema}
          callback={(result: ValidationResult) => {
            setPasswordValid(result.success);
          }}
          onInput={(value: string) => setPasswordValue(value)}
        />
        <ValidatedInput
          type="password"
          placeholder="verify password"
          autocomplete="verify-password"
          disabled={!getLoginPageInputsEnabled()}
          name="verify-password"
          // oxlint-disable-next-line solid/reactivity
          isValid={async (passwordVerify: string) =>
            passwordValue() === passwordVerify
              ? true
              : "verify password not matching password"
          }
          debounceDelay={0}
          revalidateOn={passwordValue}
          callback={(result: ValidationResult) => {
            setPasswordVerifyValid(passwordValid() && result.success);
          }}
        />
        <Button
          type="submit"
          disabled={!isRegisterFormComplete() || !getLoginPageInputsEnabled()}
          fa={{
            icon: "fa-user-plus",
          }}
          text="sign up"
        />
      </form>
    </div>
  );
}
