import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import {
  AuthResult,
  signIn,
  signInWithGitHub,
  signInWithGoogle,
} from "../../../auth";
import * as ForgotPasswordModal from "../../../modals/forgot-password";
import {
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
} from "../../../states/login";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../states/notifications";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import { Separator } from "../../common/Separator";
import { Checkbox } from "../../ui/form/Checkbox";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import { allFieldsMandatory } from "../../ui/form/utils";

export function Login(): JSXElement {
  const trySignIn = async (
    auth: () => Promise<AuthResult>,
    label?: string,
  ): Promise<void> => {
    disableLoginPageInputs();
    try {
      const data = await auth();
      if (!data.success) {
        showErrorNotification(
          `Failed to sign in${label !== undefined ? ` with ${label}` : ""}: ${data.message}`,
        );
      }
    } finally {
      enableLoginPageInputs();
    }
  };

  const form = createForm(() => ({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
    onSubmit: async ({ value }) =>
      await trySignIn(async () =>
        signIn(value.email, value.password, value.rememberMe),
      ),
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
        text="login"
        fa={{
          icon: "fa-sign-in-alt",
        }}
        class="p-0"
      />
      <div class="grid grid-cols-2 gap-4">
        <Button
          fa={{ icon: "fa-google", variant: "brand" }}
          onClick={() =>
            void trySignIn(
              async () => signInWithGoogle(form.getFieldValue("rememberMe")),
              "Google",
            )
          }
          disabled={!getLoginPageInputsEnabled()}
        />
        <Button
          fa={{ icon: "fa-github", variant: "brand" }}
          onClick={() =>
            void trySignIn(
              async () => signInWithGitHub(form.getFieldValue("rememberMe")),
              "GitHub",
            )
          }
          disabled={!getLoginPageInputsEnabled()}
        />
      </div>
      <form
        class="grid w-full gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Separator text="or" />
        <form.Field
          name="email"
          children={(field) => (
            <InputField
              field={field}
              autocomplete="current-email"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <form.Field
          name="password"
          children={(field) => (
            <InputField
              field={field}
              type="password"
              autocomplete="current-password"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <form.Field
          name="rememberMe"
          children={(field) => (
            <Checkbox
              field={field}
              disabled={!getLoginPageInputsEnabled()}
              label="remember me"
            />
          )}
        />

        <SubmitButton
          form={form}
          fa={{ icon: "fa-sign-in-alt" }}
          text="sign in"
          disabled={!getLoginPageInputsEnabled()}
        />
      </form>

      <Button
        text="forgot password?"
        variant="text"
        class="text justify-end text-xs"
        onClick={() => ForgotPasswordModal.show()}
        disabled={!getLoginPageInputsEnabled()}
      />
    </div>
  );
}
