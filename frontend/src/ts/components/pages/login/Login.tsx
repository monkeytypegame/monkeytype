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
} from "../../../stores/login";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../stores/notifications";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import { Separator } from "../../common/Separator";
import { Checkbox } from "../../ui/form/Checkbox";
import { InputField } from "../../ui/form/InputField";

export function Login(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
    onSubmit: async ({ value, meta }) => {
      disableLoginPageInputs();
      const action = (meta as { action: "Google" | "GitHub" })?.action;
      try {
        let data: AuthResult;

        if (action === "Google") {
          data = await signInWithGoogle(value.rememberMe);
        } else if (action === "GitHub") {
          data = await signInWithGitHub(value.rememberMe);
        } else {
          if (value.email === "" || value.password === "") {
            showNoticeNotification("Please fill in all fields");
            return;
          }
          data = await signIn(value.email, value.password, value.rememberMe);
        }
        if (!data.success) {
          showErrorNotification(
            `Failed to sign in${action !== undefined ? " with " + action : ""} : ${data.message}`,
          );
        }
      } finally {
        enableLoginPageInputs();
      }
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
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
          onClick={void form.handleSubmit({ action: "Google" })}
          disabled={!getLoginPageInputsEnabled()}
        />
        <Button
          fa={{ icon: "fa-github", variant: "brand" }}
          onClick={void form.handleSubmit({ action: "GitHub" })}
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

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
          children={(state) => (
            <Button
              fa={{ icon: "fa-sign-in-alt" }}
              text="sign in"
              type="submit"
              disabled={!getLoginPageInputsEnabled() || !state().canSubmit}
            />
          )}
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
