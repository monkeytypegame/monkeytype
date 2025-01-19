/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { envConfig } from "../constants/env-config";
const siteKey = envConfig.recaptchaSiteKey;

const captchas: Record<string, number> = {};

export function render(
  element: HTMLElement,
  id: string,
  callback?: (responseToken: string) => void
): void {
  if (captchas[id] !== undefined && captchas[id] !== null) {
    return;
  }

  //@ts-expect-error
  const widgetId = grecaptcha.render(element, {
    sitekey: siteKey,
    callback,
  });

  captchas[id] = widgetId as number;
}

export function reset(id: string): void {
  if (captchas[id] === undefined || captchas[id] === null) {
    return;
  }

  //@ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  grecaptcha.reset(captchas[id]);
}

export function getResponse(id: string): string {
  if (captchas[id] === undefined || captchas[id] === null) {
    return "";
  }

  //@ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return grecaptcha.getResponse(captchas[id]);
}
