import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, onMount } from "solid-js";
import { envConfig } from "virtual:env-config";

import { showErrorNotification } from "../../../states/notifications";

const errorText =
  "Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.";

type Grecaptcha = {
  render: (
    element: HTMLElement,
    options: { sitekey: string; callback?: (responseToken: string) => void },
  ) => number;
  reset: (widgetId: number) => void;
  getResponse: (widgetId: number) => string;
};

export function Captcha(props: {
  field: Accessor<AnyFieldApi>;
  class?: string;
  onSuccess?: (responseToken: string) => void;
}) {
  let captchaRef: HTMLDivElement | undefined;

  onMount(() => {
    if (captchaRef === undefined) return;

    const grecaptcha = getGrecaptcha();
    if (grecaptcha === undefined) {
      captchaRef.textContent = errorText;
    }
    getGrecaptcha()?.render(captchaRef, {
      sitekey: envConfig.recaptchaSiteKey,
      callback: (token) => {
        props.field().setValue(token);
        props.onSuccess?.(token);
      },
    });
  });
  return <div ref={(el) => (captchaRef = el)} class={props.class}></div>;
}

function getGrecaptcha(): Grecaptcha | undefined {
  if (!("grecaptcha" in window)) {
    showErrorNotification(errorText);
    return undefined;
  }

  return (window as { grecaptcha?: Grecaptcha }).grecaptcha;
}
