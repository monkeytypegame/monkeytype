import { UserNameSchema } from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";

import Ape from "../../ape";
import {
  cancelThirdPartySignUp,
  completeThirdPartySignUp,
} from "../../auth/actions";
import { getPendingSignUpUser } from "../../auth/state";
import { createEffectOn } from "../../hooks/effects";
import { hideModal, ModalId, showModal } from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { remoteValidationForm } from "../../utils/remote-validation";
import { AnimatedModal } from "../common/AnimatedModal";
import { Captcha } from "../common/form/Captcha";
import { InputField } from "../common/form/InputField";
import { SubmitButton } from "../common/form/SubmitButton";
import { allFieldsMandatory, fromSchema } from "../common/form/utils";

const modalId: ModalId = "ThirdPartySignUp";

/** A new third party user picks a name; opens while a sign up is pending. */
export function ThirdPartySignUpModal() {
  createEffectOn(getPendingSignUpUser, (user) => {
    if (user !== undefined) showModal(modalId);
  });

  const form = createForm(() => ({
    defaultValues: {
      username: "",
      captcha: "",
    },
    onSubmit: async ({ value }) => apply(value),
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  return (
    <AnimatedModal
      id={modalId}
      title="Account name"
      mode="dialog"
      afterHide={() => void afterHide()}
    >
      <p>Please enter a username before continuing</p>
      <form
        class="flex flex-col justify-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
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
            <InputField field={field} placeholder="username" type="input" />
          )}
        />
        <form.Field
          name="captcha"
          children={(field) => (
            <Captcha
              field={field}
              class="flex w-full flex-row justify-center"
            />
          )}
        />

        <SubmitButton form={form} text="continue" />
      </form>
    </AnimatedModal>
  );
}

async function afterHide(): Promise<void> {
  await cancelThirdPartySignUp();
}

async function apply(options: {
  username: string;
  captcha: string;
}): Promise<void> {
  try {
    await completeThirdPartySignUp(options.username, options.captcha);
  } finally {
    hideModal(modalId);
  }
}
