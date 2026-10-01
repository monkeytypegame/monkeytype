import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, onMount } from "solid-js";
import { envConfig } from "virtual:env-config";

import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { showErrorNotification } from "../../../states/notifications";
import { ElementWithUtils } from "../../../utils/dom";

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
  const [captchaRef, captchaEl] = useRefWithUtils<HTMLDivElement>();

  onMount(() => {
    const el = captchaEl() as ElementWithUtils<HTMLDivElement>;

    const grecaptcha = getGrecaptcha();
    if (grecaptcha === undefined) {
      el.setText(errorText);
    }
    getGrecaptcha()?.render(el.native, {
      sitekey: envConfig.recaptchaSiteKey,
      callback: (token) => {
        props.field().setValue(token);
        props.onSuccess?.(token);
      },
    });
  });
  return <div ref={captchaRef} class={props.class}></div>;
}

function getGrecaptcha(): Grecaptcha | undefined {
  if (!("grecaptcha" in window)) {
    showErrorNotification(errorText);
    return undefined;
  }

  return (window as { grecaptcha?: Grecaptcha }).grecaptcha;
}
