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
): ElementWithUtils<T> | null {
  const element = document.querySelector<T>(selector);
  return element ? addUtilsToElement(element) : null;
}

export function qsa<T extends HTMLElement = HTMLElement>(
  selector: string
): ArrayWithUtils<ElementWithUtils<T>> {
  const elements = Array.from(document.querySelectorAll<T>(selector))
    .filter((el) => el !== null)
    .map((el) => addUtilsToElement(el));

  return new ArrayWithUtils<ElementWithUtils<T>>(...elements);
}

export function addUtilsToElement<T extends HTMLElement>(
  element: T
): T & ElementUtils<T> {
  type SafeProps = "innerHTML";
  const el = element as (Readonly<Omit<T, SafeProps>> & Pick<T, SafeProps>) &
    ElementUtils<T>;

  el.disable = function () {
    this.setAttribute("disabled", "true");
  };

  el.enable = function () {
    this.removeAttribute("disabled");
  };

  el.isDisabled = function (): boolean {
    return this.hasAttribute("disabled");
  };

  el.isChecked = function (): boolean {
    if (this instanceof HTMLInputElement) {
      return this.checked;
    }
    return false;
  };

  el.addClass = function (className: string) {
    this.classList.add(className);
    return this;
  };

  el.removeClass = function (className: string) {
    this.classList.remove(className);
    return this as ElementWithUtils<T>;
  };

  el.hasClass = function (className: string): boolean {
    return this.classList.contains(className);
  };

  el.on = function (
    event: string,
    handler: EventListenerOrEventListenerObject
  ) {
    this.addEventListener(event, handler);
  };

  el.onChild = function (
    query: string,
    event: string,
    handler: EventListenerOrEventListenerObject
  ) {
    this.addEventListener(event, (e) => {
      const target = e.target as HTMLElement;
      if (target !== null && target.matches(query)) {
        if (typeof handler === "function") {
          handler.call(target, e);
        } else {
          handler.handleEvent(e);
        }
      }
    });
  };

  el.html = function (content: string) {
    this.innerHTML = content;
  };

  el.setText = function (content: string) {
    //@ts-expect-error this is fine
    this.textContent = content;
  };

  el.remove = function () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };

  el.setStyle = function (object: Partial<CSSStyleDeclaration>) {
    for (const [key, value] of Object.entries(object)) {
      if (value !== undefined) {
        //@ts-expect-error -- Index signature issue
        this.style[key] = value;
      }
    }
  };

  el.isFocused = function (): boolean {
    return this === document.activeElement;
  };

  el.qs = function <T extends HTMLElement>(
    selector: string
  ): ElementWithUtils<T> | null {
    const found = qs<T>(selector);
    return found ? found : null;
  };

  el.qsa = function (selector: string): ArrayWithUtils<ElementWithUtils> {
    const nodeList = qsa(selector);
    const elements: ElementWithUtils[] = [];
    for (const node of nodeList) {
      const elWithUtils = addUtilsToElement(node as HTMLElement);
      if (elWithUtils === null) continue;
      elements.push(elWithUtils);
    }
    return new ArrayWithUtils<ElementWithUtils>(...elements);
  };

  el.empty = function () {
    this.innerHTML = "";
  };

  el.appendHtml = function (htmlString: string) {
    this.insertAdjacentHTML("beforeend", htmlString);
  };

  el.prependHtml = function (htmlString: string) {
    this.insertAdjacentHTML("afterbegin", htmlString);
  };

  el.trigger = function (event: string) {
    this.dispatchEvent(new Event(event));
  };

  el.offset = function (): { top: number; left: number } {
    const rect = this.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  };

  return el as T & ElementUtils<T>;
}

export type ElementWithUtils<T = HTMLElement> = T & ElementUtils<T>;

type ElementUtils<T> = {
  /**
   * Set disabled attribute to true
   */
  disable(): void;
  /**
   * Remove disabled attribute
   */
  enable(): void;
  isDisabled(): boolean;
  isChecked(): boolean;
  addClass(className: string): void;
  removeClass(className: string): ElementWithUtils<T>;
  hasClass(className: string): boolean;
  /**
   * Attach an event listener to the element
   */
  on(event: string, handler: EventListenerOrEventListenerObject): void;
  /**
   * Attach an event listener to child elements matching the query. Useful for dynamically added elements.
   */
  onChild(
    query: string,
    event: string,
    handler: EventListenerOrEventListenerObject
  ): void;
  html(content: string): void;
  /**
   * Set textContent of the element
   */
  setText(content: string): void;
  remove(): void;
  setStyle(object: Partial<CSSStyleDeclaration>): void;
  isFocused(): boolean;
  qs<T extends HTMLElement>(selector: string): ElementWithUtils<T> | null;
  qsa(selector: string): ArrayWithUtils<ElementWithUtils>;
  empty(): void;
  appendHtml(htmlString: string): void;
  prependHtml(htmlString: string): void;
  trigger(event: string): void;
  offset(): {
    top: number;
    left: number;
  };
};

class ArrayWithUtils<T> extends Array<ElementWithUtils<T>> {
  remove(): void {
    for (const item of this) {
      item.remove();
    }
  }

  removeClass(className: string): this {
    for (const item of this) {
      item.removeClass(className);
    }
    return this;
  }

  addClass(className: string): this {
    for (const item of this) {
      item.addClass(className);
    }
    return this;
  }

  html(htmlString: string): this {
    for (const item of this) {
      item.html(htmlString);
    }
    return this;
  }

  disable(): this {
    for (const item of this) {
      item.disable();
    }
    return this;
  }

  enable(): this {
    for (const item of this) {
      item.enable();
    }
    return this;
  }
}
