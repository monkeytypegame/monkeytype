const siteKey = "6Lc-V8McAAAAAJ7s6LGNe7MBZnRiwbsbiWts87aj";

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
  return grecaptcha.getResponse(captchas[id]);
}
