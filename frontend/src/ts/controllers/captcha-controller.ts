/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { envConfig } from "../constants/env-config";
const siteKey = envConfig.recaptchaSiteKey;

const captchas: Record<string, number> = {};

type Grecaptcha = {
  render: (
    element: HTMLElement,
    options: { sitekey: string; callback?: (responseToken: string) => void }
  ) => number;
  reset: (widgetId: number) => void;
  getResponse: (widgetId: number) => string;
};

function getGrecaptcha(): Grecaptcha {
  if (!("grecaptcha" in window)) {
    throw new Error("grecaptcha is not defined");
  }

  return window.grecaptcha as Grecaptcha;
}

export function isCaptchaAvailable(): boolean {
  return "grecaptcha" in window;
}

export function render(
  element: HTMLElement,
  id: string,
  callback?: (responseToken: string) => void
): void {
  if (captchas[id] !== undefined && captchas[id] !== null) {
    return;
  }
  const widgetId = getGrecaptcha().render(element, {
    sitekey: siteKey,
    callback,
  });
  captchas[id] = widgetId;
}

export function reset(id: string): void {
  if (captchas[id] === undefined || captchas[id] === null) {
    return;
  }
  getGrecaptcha().reset(captchas[id]);
}

export function getResponse(id: string): string {
  if (captchas[id] === undefined || captchas[id] === null) {
    return "";
  }
  return getGrecaptcha().getResponse(captchas[id]);
}
