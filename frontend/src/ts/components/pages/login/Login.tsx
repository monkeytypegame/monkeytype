import { createForm } from "@tanstack/solid-form";
import { For, JSXElement } from "solid-js";

import { AuthActionResult, signIn } from "../../../auth/actions";
import { getThirdParties } from "../../../auth/state";
import {
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
} from "../../../states/login";
import { showModal } from "../../../states/modals";
import { showNoticeNotification } from "../../../states/notifications";
import { Button } from "../../common/Button";
import { Checkbox } from "../../common/form/Checkbox";
import { InputField } from "../../common/form/InputField";
import { SubmitButton } from "../../common/form/SubmitButton";
import { allFieldsMandatory } from "../../common/form/utils";
import { H3 } from "../../common/Headers";
import { Separator } from "../../common/Separator";

export function Login(): JSXElement {
  // the sign in action shows its own errors
  const trySignIn = async (
    auth: () => Promise<AuthActionResult>,
  ): Promise<void> => {
    disableLoginPageInputs();
    try {
      await auth();
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
        signIn({
          method: "password",
          email: value.email,
          password: value.password,
          rememberMe: value.rememberMe,
        }),
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
        <For each={getThirdParties()}>
          {(thirdParty) => (
            <Button
              fa={thirdParty.fa}
              onClick={() =>
                void trySignIn(async () =>
                  signIn({
                    method: thirdParty.id,
                    rememberMe: form.getFieldValue("rememberMe"),
                  }),
                )
              }
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        </For>
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
              placeholder="email"
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
              placeholder="password"
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
        onClick={() => showModal("ForgotPassword")}
        disabled={!getLoginPageInputsEnabled()}
      />
    </div>
  );
}
