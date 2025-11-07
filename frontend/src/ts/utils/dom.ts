export function onDocumentReady(callback: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function qs<T extends HTMLElement>(
  selector: string,
  nonNull?: false
): T | null;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function qs<T extends HTMLElement>(selector: string, nonNull: true): T;
export function qs<T extends HTMLElement>(
  selector: string,
  nonNull = false
): T | null {
  const element = document.querySelector<T>(selector);
  if (nonNull && !element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

export function qsa<T extends HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}
