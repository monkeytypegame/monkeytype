import {
  PasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";
import { z } from "zod";

import Ape from "../../../ape";
import { signUp } from "../../../auth";
import TypoList from "../../../constants/typo-list";
import {
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
} from "../../../states/login";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../states/notifications";
import { isDevEnvironment } from "../../../utils/env";
import { remoteValidationForm } from "../../../utils/remote-validation";
import { H3 } from "../../common/Headers";
import { showRegisterCaptchaModal } from "../../modals/RegisterCaptchaModal";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import {
  allFieldsMandatory,
  fromSchema,
  handleResult,
  ValidationResult,
} from "../../ui/form/utils";
let disposableEmailModule: typeof import("disposable-email-domains-js") | null =
  null;
let moduleLoadAttempted = false;

export function Register(): JSXElement {
  const emailIsValid = async (
    email: string,
  ): Promise<undefined | ValidationResult[]> => {
    const messages: ValidationResult[] = [];

    const educationRegex =
      /@.*(student|education|school|\.edu$|\.edu\.|\.ac\.|\.sch\.)/i;
    if (educationRegex.test(email)) {
      messages.push({
        type: "warning",
        message:
          "Some education emails will fail to receive our messages, or disable the account as soon as you graduate. Consider using a personal email address.",
      });
    }

    const emailHasTypo = TypoList.some((typo) => email.endsWith(typo));
    if (emailHasTypo) {
      messages.push({
        type: "warning",
        message: "Please check your email address, it may contain a typo.",
      });
    }

    if (
      disposableEmailModule &&
      disposableEmailModule.isDisposableEmail !== undefined
    ) {
      try {
        if (disposableEmailModule.isDisposableEmail(email)) {
          messages.push({
            type: "warning",
            message:
              "Using a temporary email may cause issues with logging in, password resets and support. Consider using a permanent email address. Don't worry, we don't send spam.",
          });
        }
      } catch {
        // Silent failure
      }
    }

    return messages.length > 0 ? messages : undefined;
  };

  const form = createForm(() => ({
    defaultValues: {
      username: "",
      email: "",
      emailVerify: "",
      password: "",
      passwordVerify: "",
    },
    onSubmit: async ({ value }) => {
      disableLoginPageInputs();
      const captchaToken = await showRegisterCaptchaModal();
      if (captchaToken === undefined || captchaToken === "") {
        showErrorNotification("Please complete the captcha");
        enableLoginPageInputs();
        return;
      }
      try {
        const data = await signUp(
          value.username,
          value.email,
          value.password,
          captchaToken,
        );
        if (!data.success) {
          showErrorNotification(data.message);
        }
      } finally {
        enableLoginPageInputs();
      }
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

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
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!form.state.canSubmit || !form.state.isValid) {
            form.options.onSubmitInvalid?.({
              value: form.state.values,
              formApi: form,
              meta: undefined,
            });
            return;
          }
          // we are calling onSubmit manually to bypass an unnecessary extra validation
          // that runs when running handleSubmit, since we block the submit button when the form is invalid
          void form.options.onSubmit?.({
            value: form.state.values,
            formApi: form,
            meta: undefined,
          });
        }}
        action=""
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete="off"
        class="grid w-full gap-2"
      >
        <form.Field
          name="username"
          validators={{
            onChange: fromSchema(UserNameSchema),
            onChangeAsyncDebounceMs: 1000,
            onChangeAsync: remoteValidationForm(
              async (name: string) =>
                Ape.users.getNameAvailability({ params: { name } }),
              { check: (data) => data.available || "Name not available" },
            ),
          }}
          children={(field) => (
            <InputField
              field={field}
              showIndicator
              autocomplete="new-username"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <form.Field
          name="email"
          validators={{
            onChange: (field) => {
              void field.fieldApi.form.validateField("emailVerify", "change");
              return fromSchema(UserEmailSchema)(field);
            },
            onChangeAsyncDebounceMs: 0,
            onChangeAsync: async (field) =>
              handleResult(field.fieldApi, await emailIsValid(field.value)),
          }}
          children={(field) => (
            <InputField
              field={field}
              showIndicator
              autocomplete="new-email"
              disabled={!getLoginPageInputsEnabled()}
              onFocus={() => {
                if (!moduleLoadAttempted) {
                  moduleLoadAttempted = true;
                  void import("disposable-email-domains-js")
                    .then((it) => (disposableEmailModule = it))
                    .catch(() => {
                      // Silent failure
                    });
                }
              }}
            />
          )}
        />
        <form.Field
          name="emailVerify"
          validators={{
            onChange: (field) =>
              field.value === field.fieldApi.form.getFieldValue("email")
                ? undefined
                : "verify email not matching email",
          }}
          children={(field) => (
            <InputField
              field={field}
              showIndicator
              autocomplete="verify-email"
              placeholder="verify email"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <form.Field
          name="password"
          validators={{
            onChange: (field) => {
              void field.fieldApi.form.validateField(
                "passwordVerify",
                "change",
              );
              return fromSchema(
                isDevEnvironment() ? z.string().min(6) : PasswordSchema,
              )(field);
            },
          }}
          children={(field) => (
            <InputField
              field={field}
              showIndicator
              autocomplete="new-password"
              type="password"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <form.Field
          name="passwordVerify"
          validators={{
            onChange: (field) =>
              field.value === field.fieldApi.form.getFieldValue("password")
                ? undefined
                : "verify password not matching password",
          }}
          children={(field) => (
            <InputField
              field={field}
              showIndicator
              placeholder="verify password"
              autocomplete="verify-password"
              type="password"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <SubmitButton
          form={form}
          fa={{ icon: "fa-user-plus" }}
          text="sign up"
          disabled={!getLoginPageInputsEnabled()}
        />
      </form>
    </div>
  );
}
