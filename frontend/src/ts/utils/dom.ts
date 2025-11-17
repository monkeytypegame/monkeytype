export function onDocumentReady(callback: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function qs<T extends HTMLElement = HTMLElement>(
  selector: string
): (T & ElementUtils) | null {
  const element = document.querySelector<T>(selector);
  return element ? addUtilsToElement(element) : null;
}

function addUtilsToElement<T extends HTMLElement>(
  element: T
): T & ElementUtils {
  const el = element as T & ElementUtils;

  el.disable = function () {
    this.setAttribute("disabled", "true");
  };

  el.enable = function () {
    this.removeAttribute("disabled");
  };

  el.addClass = function (className: string) {
    this.classList.add(className);
  };

  el.removeClass = function (className: string) {
    this.classList.remove(className);
  };

  el.on = function (
    event: string,
    handler: EventListenerOrEventListenerObject
  ) {
    this.addEventListener(event, handler);
  };

  el.html = function (content: string) {
    this.innerHTML = content;
  };

  el.text = function (content: string) {
    this.textContent = content;
  };

  el.remove = function () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };

  el.append = function (htmlString: string) {
    this.insertAdjacentHTML("beforeend", htmlString);
  };

  el.setStyle = function (object: Partial<CSSStyleDeclaration>) {
    for (const [key, value] of Object.entries(object)) {
      if (value !== undefined) {
        // @ts-expect-error index signature
        this.style[key] = value;
      }
    }
  };

  return el;
}

type ElementUtils = {
  disable(): void;
  enable(): void;
  addClass(className: string): void;
  removeClass(className: string): void;
  on(event: string, handler: EventListenerOrEventListenerObject): void;
  html(content: string): void;
  text(content: string): void;
  remove(): void;
  append(htmlString: string): void;
  setStyle(object: Partial<CSSStyleDeclaration>): void;
};
