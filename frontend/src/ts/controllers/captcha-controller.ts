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

  captchas[id] = widgetId;
}

export function reset(id: string): void {
  if (captchas[id] === undefined || captchas[id] === null) {
    return;
  }

  //@ts-expect-error
  grecaptcha.reset(captchas[id]);
}

export function getResponse(id: string): string {
  if (captchas[id] === undefined || captchas[id] === null) {
    return "";
  }

  //@ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return grecaptcha.getResponse(captchas[id]);
}
