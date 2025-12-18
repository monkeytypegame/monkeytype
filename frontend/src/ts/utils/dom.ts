import {
  animate as animejsAnimate,
  AnimationParams,
  JSAnimation,
} from "animejs";

// Implementation
/**
 * Query Selector
 *
 * Query the document for a single element matching the selector.
 * @returns An ElementWithUtils wrapping the found element, null if not found.
 */
export function qs<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementWithUtils<T> | null {
  checkUniqueSelector(selector);
  const el = document.querySelector<T>(selector);
  return el ? new ElementWithUtils(el) : null;
}

/**
 * Query Selector All
 *
 * Query the document for all elements matching the selector.
 * @returns An ArrayWithUtils containing ElementWithUtils wrapping each found element.
 */
export function qsa<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementsWithUtils<T> {
  const elements = Array.from(document.querySelectorAll<T>(selector))
    .filter((el) => el !== null)
    .map((el) => new ElementWithUtils(el));
  return new ElementsWithUtils<T>(...elements);
}

/**
 * Query Selector Required
 *
 * Query the document for a single element matching the selector.
 * Useful for elements that are guaranteed to exist,
 * as you don't need to handle the null case.
 * @returns An ElementWithUtils wrapping the found element.
 * @throws Error if the element is not found.
 */
export function qsr<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementWithUtils<T> {
  checkUniqueSelector(selector);
  const el = document.querySelector<T>(selector);
  if (el === null) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return new ElementWithUtils(el);
}

/**
 * Execute a callback function when the DOM is fully loaded. If you need to wait
 * for all resources (images, stylesheets, scripts, etc.) to load, use `onWindowLoad` instead.
 * If the document is already loaded, the callback is executed immediately.
 */
export function onDOMReady(callback: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

/**
 * Execute a callback function when the window 'load' event fires, which occurs
 * after the entire page (including all dependent resources such as images,
 * stylesheets, and scripts) has fully loaded.
 * If the window is already loaded, the callback is executed immediately.
 */
export function onWindowLoad(callback: () => void): void {
  if (document.readyState === "complete") {
    callback();
  } else {
    window.addEventListener("load", callback);
  }
}

/**
 * Creates an ElementWithUtils wrapping a newly created element.
 * @param tagName The tag name of the element to create.
 * @param options Optional options to set on the element.
 * @returns An ElementWithUtils wrapping the created element.
 */
export function createElementWithUtils<T extends HTMLElement>(
  tagName: string,
  options?: {
    classList?: string[];
  },
): ElementWithUtils<T> {
  const element = document.createElement(tagName) as T;
  if (options?.classList !== undefined) {
    element.classList.add(...options.classList);
  }
  return new ElementWithUtils(element);
}

type ElementWithValue =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

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
   * Remove disabled attribute
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
   * Check if the input element is checked
   */
  isChecked(this: ElementWithUtils<HTMLInputElement>): boolean | undefined {
    if (!(this.native instanceof HTMLInputElement)) {
      return undefined;
    }
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
  addClass(className: string | string[]): this {
    if (Array.isArray(className)) {
      this.native.classList.add(...className);
    } else {
      this.native.classList.add(className);
    }
    return this;
  }

  /**
   * Remove a class from the element
   */
  removeClass(className: string | string[]): this {
    if (Array.isArray(className)) {
      this.native.classList.remove(...className);
    } else {
      this.native.classList.remove(className);
    }
    return this;
  }

  /**
   * Check if the element has a class
   */
  hasClass(className: string): boolean {
    return this.native.classList.contains(className);
  }

  /**
   * Toggle a class on the element
   */
  toggleClass(className: string): this {
    this.native.classList.toggle(className);
    return this;
  }

  /**
   * Attach an event listener to the element
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: (this: T, ev: HTMLElementEventMap[K]) => void,
  ): this;
  on(event: string, handler: EventListenerOrEventListenerObject): this;
  on(
    event: keyof HTMLElementEventMap | string,
    handler:
      | EventListenerOrEventListenerObject
      | ((this: T, ev: Event) => void),
  ): this {
    // this type was some AI magic but if it works it works
    this.native.addEventListener(
      event,
      handler as EventListenerOrEventListenerObject,
    );
    return this;
  }

  /**
   * Attach an event listener to child elements matching the query.
   * Useful for dynamically added elements.
   */
  onChild<K extends keyof HTMLElementEventMap>(
    event: K,
    query: string,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  ): this;
  onChild(
    event: string,
    query: string,
    handler: EventListenerOrEventListenerObject,
  ): this;
  onChild(
    event: keyof HTMLElementEventMap | string,
    query: string,
    handler:
      | EventListenerOrEventListenerObject
      | ((this: HTMLElement, ev: Event) => void),
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
   * Set multiple style properties on the element.
   * Empty object clears all styles.
   */
  setStyle(object: Partial<CSSStyleDeclaration>): this {
    const entries = Object.entries(object);
    if (entries.length === 0) {
      this.native.style.cssText = "";
      return this;
    }
    for (const [key, value] of entries) {
      if (value !== undefined) {
        //@ts-expect-error -- Index signature issue
        this.native.style[key] = value;
      }
    }
    return this;
  }

  /**
   * Get the element's style object
   */
  getStyle(): CSSStyleDeclaration {
    return this.native.style;
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
  qs<U extends HTMLElement>(selector: string): ElementWithUtils<U> | null {
    checkUniqueSelector(selector, this);
    const found = this.native.querySelector<U>(selector);
    return found ? new ElementWithUtils(found) : null;
  }

  /**
   * Query the element for all child elements matching the selector
   */
  qsa<U extends HTMLElement = HTMLElement>(
    selector: string,
  ): ElementsWithUtils<U> {
    const elements = Array.from(this.native.querySelectorAll<U>(selector))
      .filter((el) => el !== null)
      .map((el) => new ElementWithUtils<U>(el));

    return new ElementsWithUtils<U>(...elements);
  }

  /**
   * Query the element for a child element matching the selector.
   * This element must exist, otherwise an error is thrown.
   * @throws Error if the element is not found.
   */
  qsr<U extends HTMLElement>(selector: string): ElementWithUtils<U> {
    checkUniqueSelector(selector, this);
    const found = this.native.querySelector<U>(selector);
    if (found === null) {
      throw new Error(`Required element not found: ${selector}`);
    }
    return new ElementWithUtils(found);
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
  dispatch(event: keyof HTMLElementEventMap, eventInitDict?: EventInit): this {
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

  private hasValue(): this is ElementWithUtils<ElementWithValue> {
    return (
      this.native instanceof HTMLInputElement ||
      this.native instanceof HTMLTextAreaElement ||
      this.native instanceof HTMLSelectElement
    );
  }

  /**
   * Set value of input or textarea to a string.
   */
  setValue(this: ElementWithUtils<ElementWithValue>, value: string): this {
    if (this.hasValue()) {
      this.native.value = value;
    }
    return this as unknown as this;
  }

  /**
   * Get value of input or textarea
   * @returns The value of the element, or undefined if the element is not an input or textarea.
   */
  getValue(this: ElementWithUtils<ElementWithValue>): string | undefined {
    if (this.hasValue()) {
      return this.native.value;
    }
    return undefined;
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

  /**
   * Replace this element with another element
   */
  replaceWith(element: HTMLElement | ElementWithUtils): this {
    if (element instanceof ElementWithUtils) {
      this.native.replaceWith(element.native);
    } else {
      this.native.replaceWith(element);
    }
    return this;
  }

  /**
   * Get the element's width
   */
  getOffsetWidth(): number {
    return this.native.offsetWidth;
  }

  /**
   * Get the element's height
   */
  getOffsetHeight(): number {
    return this.native.offsetHeight;
  }

  /**
   * Get the element's top offset relative to its offsetParent
   */
  getOffsetTop(): number {
    return this.native.offsetTop;
  }

  /**
   * Get the element's left offset relative to its offsetParent
   */
  getOffsetLeft(): number {
    return this.native.offsetLeft;
  }

  /**
   * Animate the element using Anime.js
   * @param animationParams The Anime.js animation parameters
   * @returns The JSAnimation instance created by Anime.js
   */
  animate(animationParams: AnimationParams): JSAnimation {
    return animejsAnimate(this.native, animationParams);
  }

  /**
   * Animate the element using Anime.js
   * @param animationParams The Anime.js animation parameters
   */
  async promiseAnimate(animationParams: AnimationParams): Promise<void> {
    return new Promise((resolve) => {
      animejsAnimate(this.native, {
        ...animationParams,
        onComplete: (self, e) => {
          animationParams.onComplete?.(self, e);
          resolve();
        },
      });
    });
  }
}

/**
 * An array of ElementWithUtils with utility methods that operate on all elements in the array.
 */
export class ElementsWithUtils<
  T extends HTMLElement = HTMLElement,
> extends Array<ElementWithUtils<T>> {
  /**
   * Array of native DOM elements
   */
  public native: T[];

  constructor(...items: ElementWithUtils<T>[]) {
    super(...items);
    this.native = items.map((item) => item.native);
  }

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
  removeClass(className: string | string[]): this {
    for (const item of this) {
      item.removeClass(className);
    }
    return this;
  }

  /**
   * Add a class to all elements in the array
   */
  addClass(className: string | string[]): this {
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

  /**
   * Set multiple style properties on all elements in the array.
   * An empty object clears all styles.
   */
  setStyle(object: Partial<CSSStyleDeclaration>): this {
    for (const item of this) {
      item.setStyle(object);
    }
    return this;
  }

  /**
   * Attach an event listener to all elements in the array
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: (this: T, ev: HTMLElementEventMap[K]) => void,
  ): this;
  on(event: string, handler: EventListenerOrEventListenerObject): this;
  on(
    event: keyof HTMLElementEventMap | string,
    handler:
      | EventListenerOrEventListenerObject
      | ((this: T, ev: Event) => void),
  ): this {
    for (const item of this) {
      item.on(event, handler);
    }
    return this;
  }

  /**
   * Set attribute value on all elements in the array
   */
  setAttribute(key: string, value: string): this {
    for (const item of this) {
      item.setAttribute(key, value);
    }
    return this;
  }
}

function checkUniqueSelector(
  selector: string,
  parent?: ElementWithUtils,
): void {
  if (!import.meta.env.DEV) return;
  const elements = parent ? parent.qsa(selector) : qsa(selector);
  if (elements.length > 1) {
    console.warn(
      `Multiple elements found for selector "${selector}". Did you mean to use QSA? If not, try making the query more specific.`,
      elements.native,
    );
    console.trace("Stack trace for qs/qsr call:");
    if (document.querySelector("#domUtilsQsWarning") !== null) return;

    const bannerCenter = document.querySelector("#bannerCenter");
    const warning = document.createElement("div");
    warning.classList.add("psa", "bad", "content-grid");
    warning.id = "domUtilsQsWarning";
    warning.innerHTML = `
        <div class="container">
          <div class="icon lefticon"><i class="fas fa-fw fa-exclamation-triangle"></i></div>
          <div class="text">
             "Warning: qs/qsr detected selector(s) matching multiple elements, check console for details."
          </div>
        </div>
      </div>`;
    bannerCenter?.appendChild(warning);
  }
}
