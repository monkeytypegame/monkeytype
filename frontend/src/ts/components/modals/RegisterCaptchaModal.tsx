import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import { hideModal, showModal } from "../../states/modals";
import { promiseWithResolvers } from "../../utils/misc";
import { AnimatedModal } from "../common/AnimatedModal";
import { Captcha } from "../ui/form/Captcha";

const {
  promise: captchaPromise,
  resolve: resolveCaptcha,
  reset: resetCaptchaPromise,
} = promiseWithResolvers<string | undefined>();

export async function showRegisterCaptchaModal(): Promise<string | undefined> {
  resetCaptchaPromise();
  showModal("RegisterCaptcha");
  return captchaPromise;
}

export function RegisterCaptchaModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: { captcha: "" },
    onSubmit: async ({ value }) => {
      resolveCaptcha(value.captcha);
      hideModal("RegisterCaptcha");
    },
  }));

  return (
    <AnimatedModal
      id="RegisterCaptcha"
      mode="dialog"
      modalClass="p-4 sm:p-4 w-max"
      beforeShow={() => resetCaptchaPromise()}
      afterHide={() => resolveCaptcha(undefined)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="captcha"
          children={(field) => (
            <Captcha
              field={field}
              onSuccess={(captcha) => void form.handleSubmit({ captcha })}
            />
          )}
        />
      </form>
    </AnimatedModal>
  );
}
