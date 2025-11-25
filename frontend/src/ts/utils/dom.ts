export function onDocumentReady(callback: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

export function qs<T extends HTMLElement = HTMLElement>(
  selector: string
): ElementWithUtils<T> | null;
export function qs<T extends HTMLElement = HTMLElement>(
  selector: string,
  options: { guaranteed: true }
): ElementWithUtils<T>;

export function qs<T extends HTMLElement = HTMLElement>(
  selector: string,
  options?: { guaranteed?: boolean }
): ElementWithUtils<T> | null {
  const el = document.querySelector<T>(selector);

  if (options?.guaranteed && el === null) {
    throw new Error(`Guaranteed element not found: ${selector}`);
  }

  return el ? new ElementWithUtils(el) : null;
}

export function qsa<T extends HTMLElement = HTMLElement>(
  selector: string
): ArrayWithUtils<T> {
  const elements = Array.from(document.querySelectorAll<T>(selector))
    .filter((el) => el !== null)
    .map((el) => new ElementWithUtils(el));

  return new ArrayWithUtils<T>(...elements);
}

export function createElementWithUtils<T extends HTMLElement>(
  tagName: string,
  options?: {
    className?: string;
    classList?: string[];
  }
): ElementWithUtils<T> {
  const element = document.createElement(tagName) as T;
  if (options?.className !== undefined) {
    element.className = options.className;
  }
  if (options?.classList !== undefined) {
    element.classList.add(...options.classList);
  }
  return new ElementWithUtils(element);
}
// export type ElementWithUtils<T = HTMLElement> = T & ElementUtils<T>;

// type ElementUtils<T> = {
//   /**
//    * Set disabled attribute to true
//    */
//   disable(): void;
//   /**
//    * Remove disabled attribute
//    */
//   enable(): void;
//   /**
//    * Check if the element is disabled
//    */
//   isDisabled(): boolean;
//   isChecked(): boolean;
//   addClass(className: string): void;
//   removeClass(className: string): ElementWithUtils<T>;
//   hasClass(className: string): boolean;
//   /**
//    * Attach an event listener to the element
//    */
//   on(
//     event: keyof HTMLElementEventMap,
//     handler: EventListenerOrEventListenerObject
//   ): void;
//   /**
//    * Attach an event listener to child elements matching the query. Useful for dynamically added elements.
//    */
//   onChild(
//     query: string,
//     event: keyof HTMLElementEventMap,
//     handler: EventListenerOrEventListenerObject
//   ): void;
//   html(content: string): void;
//   /**
//    * Set textContent of the element
//    */
//   setText(content: string): void;
//   remove(): void;
//   setStyle(object: Partial<CSSStyleDeclaration>): void;
//   isFocused(): boolean;
//   qs<T extends HTMLElement>(selector: string): ElementWithUtils<T> | null;
//   qsa<T extends HTMLElement>(
//     selector: string
//   ): ArrayWithUtils<ElementWithUtils<T>>;
//   empty(): void;
//   appendHtml(htmlString: string): void;
//   prependHtml(htmlString: string): void;
//   trigger(event: string): void;
//   offset(): {
//     top: number;
//     left: number;
//   };
//   wrapWith(htmlString: string): ElementWithUtils<T>;
//   setValue(value: string): void;
//   /**
//    * Get the parent element
//    */
//   getParent(): ElementWithUtils | null;
// };

type ValueElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export class ElementWithUtils<T extends HTMLElement = HTMLElement> {
  /**
   * The native dom element
   */
  public native: T;

  constructor(native: T) {
    this.native = native;
  }

  /**
   * Set disabled attribute to true
   */
  disable(): this {
    this.native.setAttribute("disabled", "true");
    return this;
  }

  /**
   * Check if the element is disabled
   */
  enable(): this {
    this.native.removeAttribute("disabled");
    return this;
  }

  /**
   * Check if the element is disabled
   */
  isDisabled(): boolean {
    return this.native.hasAttribute("disabled");
  }

  /**
   * Get attribute value
   */
  getAttribute(attribute: string): string | null {
    return this.native.getAttribute(attribute);
  }

  /**
   * Check if the element has the specified attribute
   */
  hasAttribute(attribute: string): boolean {
    return this.native.hasAttribute(attribute);
  }

  /**
   * Check if the input element is checked
   */
  isChecked(this: ElementWithUtils<HTMLInputElement>): boolean {
    return this.native.checked;
  }

  /**
   * Add the "hidden" class to the element
   */
  hide(): this {
    this.addClass("hidden");
    return this;
  }

  /**
   * Remove the "hidden" class from the element
   */
  show(): this {
    this.removeClass("hidden");
    return this;
  }

  /**
   * Add a class to the element
   */
  addClass(className: string): this {
    this.native.classList.add(className);
    return this;
  }

  /**
   * Remove a class from the element
   */
  removeClass(className: string): this {
    this.native.classList.remove(className);
    return this;
  }

  /**
   * Check if the element has a class
   */
  hasClass(className: string): boolean {
    return this.native.classList.contains(className);
  }

  /**
   * Attach an event listener to the element
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: (this: T, ev: HTMLElementEventMap[K]) => void
  ): this;
  on(event: string, handler: EventListenerOrEventListenerObject): this;
  on(
    event: keyof HTMLElementEventMap | string,
    handler: EventListenerOrEventListenerObject | ((this: T, ev: Event) => void)
  ): this {
    // this type was some AI magic but if it works it works
    this.native.addEventListener(
      event,
      handler as EventListenerOrEventListenerObject
    );
    return this;
  }

  /**
   * Attach an event listener to child elements matching the query.
   * Useful for dynamically added elements.
   */
  onChild<K extends keyof HTMLElementEventMap>(
    query: string,
    event: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void
  ): this;
  onChild(
    query: string,
    event: string,
    handler: EventListenerOrEventListenerObject
  ): this;
  onChild(
    query: string,
    event: keyof HTMLElementEventMap | string,
    handler:
      | EventListenerOrEventListenerObject
      | ((this: HTMLElement, ev: Event) => void)
  ): this {
    // this type was some AI magic but if it works it works
    this.native.addEventListener(event, (e) => {
      const target = e.target as HTMLElement;
      if (target !== null && target.matches(query)) {
        if (typeof handler === "function") {
          handler.call(target, e);
        } else {
          handler.handleEvent(e);
        }
      }
    });
    return this;
  }

  /**
   * Set innerHTML of the element
   */
  setHtml(content: string): this {
    this.native.innerHTML = content;
    return this;
  }

  /**
   * Set textContent of the element
   */
  setText(content: string): this {
    this.native.textContent = content;
    return this;
  }

  /**
   * Remove the element from the DOM
   */
  remove(): void {
    if (this.native.parentNode) {
      this.native.parentNode.removeChild(this.native);
    }
  }

  /**
   * Set multiple style properties on the element
   */
  setStyle(object: Partial<CSSStyleDeclaration>): this {
    for (const [key, value] of Object.entries(object)) {
      if (value !== undefined) {
        //@ts-expect-error -- Index signature issue
        this.native.style[key] = value;
      }
    }
    return this;
  }

  /**
   * Set attribute value
   */
  setAttribute(qualifiedName: string, value: string): this {
    this.native.setAttribute(qualifiedName, value);
    return this;
  }

  /**
   * Remove attribute
   */
  removeAttribute(qualifiedName: string): this {
    this.native.removeAttribute(qualifiedName);
    return this;
  }

  /**
   * Check if the element is focused
   */
  isFocused(): boolean {
    return this.native === document.activeElement;
  }

  /**
   * Query the element for a child element matching the selector
   */
  qs<U extends HTMLElement = HTMLElement>(
    selector: string
  ): ElementWithUtils<U> | null;
  qs<U extends HTMLElement = HTMLElement>(
    selector: string,
    options: { guaranteed: true }
  ): ElementWithUtils<U>;
  qs<U extends HTMLElement>(
    selector: string,
    options?: { guaranteed?: boolean }
  ): ElementWithUtils<U> | null {
    const found = this.native.querySelector<U>(selector);
    if (options?.guaranteed && found === null) {
      throw new Error(`Guaranteed child element not found: ${selector}`);
    }
    return found ? new ElementWithUtils(found) : null;
  }

  /**
   * Query the element for all child elements matching the selector
   */
  qsa<U extends HTMLElement = HTMLElement>(
    selector: string
  ): ArrayWithUtils<U> {
    const elements = Array.from(this.native.querySelectorAll<U>(selector))
      .filter((el) => el !== null)
      .map((el) => new ElementWithUtils<U>(el));

    return new ArrayWithUtils<U>(...elements);
  }

  /**
   * Empty the element's innerHTML
   */
  empty(): this {
    this.native.innerHTML = "";
    return this;
  }

  /**
   * Append HTML string to the element's innerHTML
   */
  appendHtml(htmlString: string): this {
    this.native.insertAdjacentHTML("beforeend", htmlString);
    return this;
  }

  /**
   * Append a child element
   */
  append(element: HTMLElement | ElementWithUtils): this {
    if (element instanceof ElementWithUtils) {
      this.native.appendChild(element.native);
    } else {
      this.native.append(element);
    }
    return this;
  }

  /**
   * Prepend HTML string to the element's innerHTML
   */
  prependHtml(htmlString: string): this {
    this.native.insertAdjacentHTML("afterbegin", htmlString);
    return this;
  }

  /**
   * Dispatch an event on the element
   */
  trigger(event: keyof HTMLElementEventMap, eventInitDict?: EventInit): this {
    this.native.dispatchEvent(new Event(event, eventInitDict));
    return this;
  }

  /**
   * Get the element's bounding client rect offset
   */
  offset(): { top: number; left: number } {
    const rect = this.native.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }

  /**
   * Wrap the element with the provided HTML string
   */
  wrapWith(htmlString: string): ElementWithUtils<T> {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = htmlString;
    const wrapperElement = wrapper.firstElementChild;
    if (wrapperElement === null) {
      throw new Error("Invalid HTML string provided to wrapWith.");
    }

    this.native.parentNode?.insertBefore(wrapperElement, this.native);
    wrapperElement.appendChild(this.native);
    return new ElementWithUtils(wrapperElement as T);
  }

  /**
   * Set value of input or textarea to a string.
   */
  setValue(this: ElementWithUtils<ValueElement>, value: string): this {
    this.native.value = value;
    return this as unknown as this;
  }

  /**
   * Get value of input or textarea
   */
  getValue(this: ElementWithUtils<ValueElement>): string {
    return this.native.value;
  }

  /**
   * Get the parent element
   */
  getParent<U extends HTMLElement = HTMLElement>(): ElementWithUtils<U> | null {
    if (this.native.parentElement) {
      return new ElementWithUtils(this.native.parentElement as U);
    }
    return null;
  }
}

class ArrayWithUtils<T extends HTMLElement = HTMLElement> extends Array<
  ElementWithUtils<T>
> {
  /**
   * Remove all elements in the array from the DOM
   */
  remove(): void {
    for (const item of this) {
      item.remove();
    }
  }

  /**
   * Remove a class from all elements in the array
   */
  removeClass(className: string): this {
    for (const item of this) {
      item.removeClass(className);
    }
    return this;
  }

  /**
   * Add a class to all elements in the array
   */
  addClass(className: string): this {
    for (const item of this) {
      item.addClass(className);
    }
    return this;
  }

  /**
   * Set innerHTML of all elements in the array
   */
  setHtml(htmlString: string): this {
    for (const item of this) {
      item.setHtml(htmlString);
    }
    return this;
  }

  /**
   * Set the disabled attribute on all elements in the array
   */
  disable(): this {
    for (const item of this) {
      item.disable();
    }
    return this;
  }

  /**
   * Remove the disabled attribute from all elements in the array
   */
  enable(): this {
    for (const item of this) {
      item.enable();
    }
    return this;
  }

  /**
   * Add the "hidden" class to all elements in the array
   */
  hide(): this {
    for (const item of this) {
      item.hide();
    }
    return this;
  }

  /**
   * Remove the "hidden" class from all elements in the array
   */
  show(): this {
    for (const item of this) {
      item.show();
    }
    return this;
  }
}
