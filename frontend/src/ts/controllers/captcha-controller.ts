const siteKey = "6Lc-V8McAAAAAJ7s6LGNe7MBZnRiwbsbiWts87aj";

const captchas: Record<string, string> = {};

export function render(element: HTMLElement, id: string): void {
  const widgetId = grecaptcha.render(element, {
    sitekey: siteKey,
  });

  captchas[id] = widgetId;
}

export function reset(id: string): void {
  if (!captchas[id]) {
    return;
  }

  grecaptcha.reset(captchas[id]);

  delete captchas[id];
}

export function getResponse(id: string): string {
  if (!captchas[id]) {
    return "";
  }

  return grecaptcha.getResponse(captchas[id]);
}
