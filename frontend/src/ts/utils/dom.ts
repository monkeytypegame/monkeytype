import {
  animate as animejsAnimate,
  AnimationParams,
  JSAnimation,
} from "animejs";
import { addBanner } from "../stores/banners";

/**
 * list of deferred callbacks to be executed once we reached ready state
 */
let readyList: (() => void)[] | undefined;
let isReady = false;

/**
 * Execute a callback function when the DOM is fully loaded.
 * Tries to mimic the ready function of jQuery https://github.com/jquery/jquery/blob/main/src/core/ready.js
 * If the document is already loaded, the callback is executed in the next event loop
 */
export function onDOMReady(callback: () => void): void {
  bindReady();
  if (isReady) {
    setTimeout(callback);
  } else {
    readyList?.push(callback);
  }
}

/**
 * initialize the readyList and bind the necessary events
 */
function bindReady(): void {
  // do nothing if we are bound already
  if (readyList !== undefined) return;

  readyList = [];

  if (document.readyState !== "loading") {
    // DOM is already loaded handle ready in the next event loop
    // Handle it asynchronously to allow scripts the opportunity to delay ready
    setTimeout(handleReady);
  } else {
    // register a single event listener for both events.
    document.addEventListener("DOMContentLoaded", handleReady);
    //load  event is used as a fallback "that will always work" according to jQuery source code
    window.addEventListener("load", handleReady);
  }
}

/**
 * call all deferred ready callbacks and cleanup the event listener
 */
function handleReady(): void {
  //make sure we only run once
  if (isReady) return;

  isReady = true;

  //cleanup event listeners that are no longer needed
  document.removeEventListener("DOMContentLoaded", handleReady);
  window.removeEventListener("load", handleReady);

  //call deferred callbacks and empty the list
  //flush the list in a loop in case callbacks were added during the execution
  while (readyList && readyList.length) {
    const callbacks = readyList;
    readyList = [];
    callbacks.forEach((it) => {
      //jQuery lets the callbacks fail independently
      try {
        it();
      } catch (e) {
        setTimeout(() => {
          throw e;
        });
      }
    });
  }
  readyList = undefined;
}

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

type ElementWithSelectableValue = HTMLInputElement | HTMLTextAreaElement;

export type OnChildEvent<T extends Event = Event> = T & {
  /**
   * target element matching the selector.
   */
  childTarget: EventTarget | null;
};

type OnChildEventListenerOrEventListenerObject =
  | { (evt: OnChildEvent): void }
  | { handleEvent(object: OnChildEvent): void };

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
   * Check if the element has the "hidden" class
   */
  isHidden(): boolean {
    return this.hasClass("hidden");
  }

  /**
   * Check if element is visible
   */
  isVisible(): boolean {
    return this.native.offsetWidth > 0 || this.native.offsetHeight > 0;
  }

  /**
   * Make element visible by scrolling the element's ancestor containers
   */
  scrollIntoView(options?: ScrollIntoViewOptions): this {
    this.native.scrollIntoView(options);
    return this;
  }

  /**
   * Add a class to the element
   */
  addClass(className: string | string[]): this {
    if (Array.isArray(className)) {
      this.native.classList.add(...className);
    } else {
      if (className.includes(" ")) {
        return this.addClass(
          className.split(" ").filter((cn) => cn.length > 0),
        );
      }
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
      if (className.includes(" ")) {
        return this.removeClass(
          className.split(" ").filter((cn) => cn.length > 0),
        );
      }
      this.native.classList.remove(className);
    }
    return this;
  }

  /**
   * Check if the element has a class
   */
  hasClass(className: string): boolean {
    if (className.includes(" ")) {
      return className
        .split(" ")
        .filter((cn) => cn.length > 0)
        .every((cn) => this.hasClass(cn));
    }
    return this.native.classList.contains(className);
  }

  /**
   * Toggle a class on the element
   */
  toggleClass(className: string, force?: boolean): this {
    this.native.classList.toggle(className, force);
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
   * Attach an event listener to child elements matching the selector.
   * Useful for dynamically added elements.
   *
   * The handler is not called when the event occurs directly on the bound element, but only for descendants (inner elements)
   * that match the selector. Bubbles the event from the event target up to the element where the handler is attached
   * (i.e., innermost to outermost element) and runs the handler for any elements along that path matching the selector.
   */
  onChild<K extends keyof HTMLElementEventMap>(
    event: K,
    /**
     * A selector string to filter the descendants of the selected elements that will call the handler.
     */
    selector: string,
    handler: (
      this: HTMLElement,
      ev: OnChildEvent<HTMLElementEventMap[K]>,
    ) => void,
  ): this;
  onChild(
    event: string,
    /**
     * A selector string to filter the descendants of the selected elements that will call the handler.
     */
    selector: string,
    handler: OnChildEventListenerOrEventListenerObject,
  ): this;
  onChild(
    event: keyof HTMLElementEventMap | string,
    /**
     * A selector string to filter the descendants of the selected elements that will call the handler.
     */
    selector: string,
    handler:
      | OnChildEventListenerOrEventListenerObject
      | ((this: HTMLElement, ev: OnChildEvent) => void),
  ): this {
    this.native.addEventListener(event, (e) => {
      const target = e.target as HTMLElement;
      if (target === null) return; //ignore event

      let childTarget = target.closest(selector);
      //bubble up until no match found or the parent element is reached
      while (
        childTarget !== null &&
        childTarget !== this.native && //stop on parent
        this.native.contains(childTarget) //stop above parent
      ) {
        if (typeof handler === "function") {
          handler.call(
            childTarget as HTMLElement,
            Object.assign(e, { childTarget }),
          );
        } else {
          handler.handleEvent(Object.assign(e, { childTarget }));
        }

        childTarget =
          childTarget.parentElement !== null
            ? childTarget.parentElement.closest(selector)
            : null;
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
  append(
    elementOrElements:
      | HTMLElement
      | ElementWithUtils
      | HTMLElement[]
      | ElementsWithUtils
      | ElementWithUtils[],
  ): this {
    if (elementOrElements instanceof ElementsWithUtils) {
      this.native.append(...elementOrElements.native);
      return this;
    }

    if (Array.isArray(elementOrElements)) {
      for (const element of elementOrElements) {
        if (element instanceof ElementWithUtils) {
          this.native.append(element.native);
        } else {
          this.native.append(element);
        }
      }
      return this;
    }

    if (elementOrElements instanceof ElementWithUtils) {
      this.native.appendChild(elementOrElements.native);
    } else {
      this.native.append(elementOrElements);
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
   * Get the element's screen bounds: top, left, width and height
   */
  screenBounds(): { top: number; left: number; width: number; height: number } {
    const rect = this.native.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
    };
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

  private hasSelectableValue(): this is ElementWithUtils<ElementWithSelectableValue> {
    return (
      this.native instanceof HTMLInputElement ||
      this.native instanceof HTMLTextAreaElement
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
   * Get value of input, textarea or select
   * @returns The value of the element, or undefined if the element is not an input, textarea or select.
   */
  getValue(this: ElementWithUtils<ElementWithValue>): string | undefined {
    if (this.hasValue()) {
      return this.native.value;
    }
    return undefined;
  }

  /**
   * Set checked state of input element
   * @param checked The checked state to set
   */
  setChecked(this: ElementWithUtils<HTMLInputElement>, checked: boolean): this {
    if (this.native instanceof HTMLInputElement) {
      this.native.checked = checked;
    }
    return this as unknown as this;
  }

  /**
   * Get checked state of input element
   * @returns The checked state of the element, or undefined if the element is not an input.
   */
  getChecked(this: ElementWithUtils<HTMLInputElement>): boolean | undefined {
    if (this.native instanceof HTMLInputElement) {
      return this.native.checked;
    }
    return undefined;
  }

  /**
   * Set selected state of option element
   * @param selected The selected state to set
   */
  setSelected(
    this: ElementWithUtils<HTMLOptionElement>,
    selected: boolean,
  ): this {
    if (this.native instanceof HTMLOptionElement) {
      this.native.selected = selected;
    }
    return this as unknown as this;
  }

  /**
   * Get selected state of option element
   * @returns The selected state of the element, or undefined if the element is not an option.
   */
  getSelected(this: ElementWithUtils<HTMLOptionElement>): boolean | undefined {
    if (this.native instanceof HTMLOptionElement) {
      return this.native.selected;
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
   * Get the first parent that matches a selector
   */

  closestParent(selector: string): ElementWithUtils | null {
    const closestParent = this.native.parentElement?.closest(
      selector,
    ) as HTMLElement;
    return closestParent !== null ? new ElementWithUtils(closestParent) : null;
  }

  /**
   * Check if element matches a selector
   */

  matches(selector: string): boolean {
    return this.native.matches(selector);
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
   * Get the element's height + margin
   */

  getOuterHeight(): number {
    const style = getComputedStyle(this.native);

    return (
      this.native.getBoundingClientRect().height +
      parseFloat(style.marginTop) +
      parseFloat(style.marginBottom)
    );
  }

  /**
   * Get The element's width + margin
   */

  getOuterWidth(): number {
    const style = getComputedStyle(this.native);

    return (
      this.native.getBoundingClientRect().width +
      parseFloat(style.marginLeft) +
      parseFloat(style.marginRight)
    );
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
   * Get the element's children wrapped in ElementWithUtils instances.
   *
   * Note: This method returns a new array of wrappers, but each wrapper maintains
   * a reference to the actual DOM element. Any operations performed on the returned
   * children (e.g., addClass, remove, setHtml) will modify the actual DOM elements
   * and reflect their live DOM state.
   *
   * @returns An ElementsWithUtils array containing wrapped child elements
   */
  getChildren(): ElementsWithUtils {
    const children = Array.from(this.native.children);
    const convertedChildren = new ElementsWithUtils(
      ...children.map((child) => new ElementWithUtils(child as HTMLElement)),
    );
    return convertedChildren;
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

  /**
   * Animate the element sliding down (expanding height from 0 to full height)
   * @param duration The duration of the animation in milliseconds (default: 250ms)
   */
  async slideDown(duration = 250): Promise<void> {
    this.show().setStyle({
      height: "",
      overflow: "hidden",
      marginTop: "",
      marginBottom: "",
      paddingTop: "",
      paddingBottom: "",
    });
    const { height, marginTop, marginBottom, paddingTop, paddingBottom } =
      getComputedStyle(this.native);
    this.setStyle({
      height: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
    });
    await this.promiseAnimate({
      height: [0, height],
      marginTop: [0, marginTop],
      marginBottom: [0, marginBottom],
      paddingTop: [0, paddingTop],
      paddingBottom: [0, paddingBottom],
      duration,
      onComplete: () => {
        this.setStyle({
          height: "",
          overflow: "",
          marginTop: "",
          marginBottom: "",
        });
      },
    });
  }

  /**
   * Animate the element sliding up (collapsing height from full height to 0)
   * @param duration The duration of the animation in milliseconds (default: 250ms)
   */
  async slideUp(
    duration = 250,
    options?: {
      hide?: boolean;
    },
  ): Promise<void> {
    this.show().setStyle({
      overflow: "hidden",
      height: "",
      marginTop: "",
      marginBottom: "",
      paddingTop: "",
      paddingBottom: "",
    });
    const { height, marginTop, marginBottom, paddingTop, paddingBottom } =
      getComputedStyle(this.native);
    await this.promiseAnimate({
      height: [height, 0],
      marginTop: [marginTop, 0],
      marginBottom: [marginBottom, 0],
      paddingTop: [paddingTop, 0],
      paddingBottom: [paddingBottom, 0],
      duration,
      onComplete: () => {
        if (options?.hide ?? true) {
          this.hide().setStyle({
            height: "",
            overflow: "",
            marginTop: "",
            marginBottom: "",
            paddingTop: "",
            paddingBottom: "",
          });
        }
      },
    });
  }

  /**
   * Focus the element
   */
  focus(options?: FocusOptions): this {
    this.native.focus(options);
    return this;
  }

  /**
   * Select the element's content (for input and textarea elements)
   */
  select(this: ElementWithUtils<ElementWithSelectableValue>): void {
    if (this.hasSelectableValue()) {
      this.native.select();
    }
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
   * Set value of all input elements in the array
   */
  setValue(this: ElementsWithUtils<ElementWithValue>, value: string): this {
    for (const item of this) {
      item.setValue(value);
    }
    return this as unknown as this;
  }

  /**
   * Query all elements in the array for a child element matching the selector
   */
  qs<U extends HTMLElement>(selector: string): ElementsWithUtils<U> {
    const allElements: ElementWithUtils<U>[] = [];

    for (const item of this) {
      const found = item.native.querySelector<U>(selector);
      if (found) allElements.push(new ElementWithUtils<U>(found));
    }

    return new ElementsWithUtils<U>(...allElements);
  }

  /**
   * Query all elements in the array for all child elements matching the selector
   */
  qsa<U extends HTMLElement = HTMLElement>(
    selector: string,
  ): ElementsWithUtils<U> {
    const allElements: ElementWithUtils<U>[] = [];

    for (const item of this) {
      const elements = Array.from(item.native.querySelectorAll<U>(selector));
      for (const el of elements) {
        if (el !== null) allElements.push(new ElementWithUtils<U>(el));
      }
    }

    return new ElementsWithUtils<U>(...allElements);
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

  /**
   * Append HTML string to all elements in the array
   */
  appendHtml(htmlString: string): this {
    for (const item of this) {
      item.appendHtml(htmlString);
    }
    return this;
  }

  override indexOf(element: ElementWithUtils<T>): number {
    return this.native.indexOf(element.native);
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

    addBanner({
      level: "error",
      icon: "fas fa-exclamation-triangle",
      text: "Warning: qs/qsr detected selector(s) matching multiple elements, check console for details.",
    });
  }
}

export const __testing = {
  resetReady: () => {
    isReady = false;
    readyList = undefined;
  },
};
