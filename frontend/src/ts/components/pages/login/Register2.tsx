import {
  PasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement } from "solid-js";
import { z } from "zod";

import Ape from "../../../ape";
import { isDevEnvironment, sleep } from "../../../utils/misc";
import { remoteValidationForm } from "../../../utils/remote-validation";
import TypoList from "../../../utils/typo-list";
import { Button } from "../../common/Button";
import { InputField } from "../../ui/form/InputField";
import {
  fromSchema,
  handleResult,
  ValidationResult,
} from "../../ui/form/utils";
let disposableEmailModule: typeof import("disposable-email-domains-js") | null =
  null;
let moduleLoadAttempted = false;

export function Register2(): JSXElement {
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

  const [isEditable, setEditable] = createSignal(true);

  const form = createForm(() => ({
    defaultValues: {
      username: "",
      email: "",
      emailVerify: "",
      password: "",
      passwordVerify: "",
    },
    onSubmit: async ({ value }) => {
      setEditable(false);
      console.log("### the form data", value);
      await sleep(2000);
      setEditable(true);
    },
  }));

  return (
    <div class="grid w-full grid-cols-1 justify-center gap-2 sm:w-80">
      <div class="inline-flex items-baseline text-sub">
        <i class="fas fa-user-plus mr-[0.5em]"></i>
        register
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
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
            onChangeAsyncDebounceMs: 500,
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
              disabled={!isEditable()}
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
            onChangeAsync: async (field) => {
              if (!moduleLoadAttempted) {
                moduleLoadAttempted = true;
                try {
                  disposableEmailModule =
                    await import("disposable-email-domains-js");
                } catch {
                  // Silent failure
                }
              }
              return handleResult(
                field.fieldApi,
                await emailIsValid(field.value),
              );
            },
          }}
          children={(field) => (
            <InputField
              field={field}
              showIndicator
              autocomplete="new-email"
              disabled={!isEditable()}
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
              disabled={!isEditable()}
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
              disabled={!isEditable()}
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
              disabled={!isEditable()}
            />
          )}
        />
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
          children={(state) => (
            <Button
              fa={{ icon: "fa-user-plus" }}
              text="sign up"
              type="submit"
              disabled={!state().canSubmit}
            />
          )}
        />
      </form>
    </div>
  );
}
