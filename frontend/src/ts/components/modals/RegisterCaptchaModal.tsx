import { JSXElement } from "solid-js";

import {
  isCaptchaAvailable,
  render as renderCaptcha,
  reset as resetCaptcha,
} from "../../controllers/captcha-controller";
import { useRef } from "../../hooks/useRef";
import { hideModal, showModal } from "../../states/modals";
import { showErrorNotification } from "../../states/notifications";
import { promiseWithResolvers } from "../../utils/misc";
import { AnimatedModal } from "../common/AnimatedModal";

const {
  promise: captchaPromise,
  resolve: resolveCaptcha,
  reset: resetCaptchaPromise,
} = promiseWithResolvers<string | undefined>();

export async function showRegisterCaptchaModal(): Promise<string | undefined> {
  if (!isCaptchaAvailable()) {
    showErrorNotification(
      "Could not show register popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
    );
    return undefined;
  }

  resetCaptchaPromise();
  showModal("RegisterCaptcha");
  return captchaPromise;
}

export function RegisterCaptchaModal(): JSXElement {
  const [captchaRef, captchaEl] = useRef<HTMLDivElement>();

  const handleBeforeShow = (): void => {
    const el = captchaEl();
    if (el === undefined) return;
    resetCaptcha("register");
    renderCaptcha(el, "register", (token) => {
      resolveCaptcha(token);
      hideModal("RegisterCaptcha");
    });
  };

  return (
    <AnimatedModal
      id="RegisterCaptcha"
      mode="dialog"
      modalClass="p-4 sm:p-4 w-max"
      afterHide={() => resolveCaptcha(undefined)}
      beforeShow={handleBeforeShow}
    >
      <div ref={captchaRef}></div>
    </AnimatedModal>
  );
}
