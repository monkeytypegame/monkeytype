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
    event: keyof HTMLElementEventMap,
    handler: EventListenerOrEventListenerObject
  ) {
    this.addEventListener(event, handler);
  };

  el.onChild = function (
    query: string,
    event: keyof HTMLElementEventMap,
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
    const found = this.querySelector<T>(selector);
    return found ? addUtilsToElement(found) : null;
  };

  el.qsa = function <T extends HTMLElement = HTMLElement>(
    selector: string
  ): ArrayWithUtils<ElementWithUtils<T>> {
    const elements = Array.from(this.querySelectorAll<T>(selector))
      .filter((el) => el !== null)
      .map((el) => addUtilsToElement(el));

    return new ArrayWithUtils<ElementWithUtils<T>>(...elements);
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

  el.wrapWith = function (htmlString: string) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = htmlString;
    const wrapperElement = wrapper.firstElementChild;
    if (wrapperElement === null) {
      throw new Error("Invalid HTML string provided to wrapWith.");
    }

    this.parentNode?.insertBefore(wrapperElement, this);
    wrapperElement.appendChild(this);
    return addUtilsToElement(
      wrapperElement as HTMLElement
    ) as ElementWithUtils<T>;
  };

  el.setValue = function (value: string) {
    if (
      this instanceof HTMLInputElement ||
      this instanceof HTMLTextAreaElement
    ) {
      this.value = value;
    }
  };

  el.getParent = function (): ElementWithUtils | null {
    if (this.parentElement) {
      return addUtilsToElement(this.parentElement);
    }
    return null;
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
  /**
   * Check if the element is disabled
   */
  isDisabled(): boolean;
  isChecked(): boolean;
  addClass(className: string): void;
  removeClass(className: string): ElementWithUtils<T>;
  hasClass(className: string): boolean;
  /**
   * Attach an event listener to the element
   */
  on(
    event: keyof HTMLElementEventMap,
    handler: EventListenerOrEventListenerObject
  ): void;
  /**
   * Attach an event listener to child elements matching the query. Useful for dynamically added elements.
   */
  onChild(
    query: string,
    event: keyof HTMLElementEventMap,
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
  qsa<T extends HTMLElement>(
    selector: string
  ): ArrayWithUtils<ElementWithUtils<T>>;
  empty(): void;
  appendHtml(htmlString: string): void;
  prependHtml(htmlString: string): void;
  trigger(event: string): void;
  offset(): {
    top: number;
    left: number;
  };
  wrapWith(htmlString: string): ElementWithUtils<T>;
  setValue(value: string): void;
  /**
   * Get the parent element
   */
  getParent(): ElementWithUtils | null;
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
