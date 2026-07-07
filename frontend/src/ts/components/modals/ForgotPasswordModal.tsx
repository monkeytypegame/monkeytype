import { UserEmailSchema } from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";

import Ape from "../../ape";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal } from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { Captcha } from "../ui/form/Captcha";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { allFieldsMandatory, fromSchema } from "../ui/form/utils";

export function ForgotPasswordModal() {
  const form = createForm(() => ({
    defaultValues: {
      email: "",
      captcha: "",
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
    onSubmit: async ({ value }) => {
      await apply(value);
      form.reset();
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  return (
    <AnimatedModal id="ForgotPassword" title="Forgot password">
      <form
        class="flex flex-col justify-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="email"
          validators={{
            onChange: fromSchema(UserEmailSchema, {
              convert: (it) => it?.trim(),
            }),
          }}
          children={(field) => (
            <InputField field={field} placeholder="email" type="email" />
          )}
        />

        <form.Field
          name="captcha"
          children={(field) => <Captcha field={field} />}
        />

        <SubmitButton form={form} text="request password reset" />
      </form>
    </AnimatedModal>
  );
}

async function apply(options: {
  email: string;
  captcha: string;
}): Promise<void> {
  const { email, captcha } = options;

  if (email === undefined || email === "") {
    showNoticeNotification("Please enter your email address");
    return;
  }

  showLoaderBar();
  const result = await Ape.users.forgotPasswordEmail({
    body: { email, captcha },
  });

  hideLoaderBar();
  if (result.status !== 200) {
    showErrorNotification(
      `Failed to send password reset email: ${result.body.message}`,
    );
    return;
  }

  showSuccessNotification(result.body.message, { durationMs: 5000 });

  hideModal("ForgotPassword");
}
