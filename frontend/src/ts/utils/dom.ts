/**
 * DOM utility functions to replace jQuery operations with vanilla JavaScript.
 * Note: jQuery is still used for animations (.animate, .fadeIn, .fadeOut, etc.)
 */

/**
 * Select a single element
 */
export function select(
  selector: string,
  parent: Document | Element = document
): Element | null {
  return parent.querySelector(selector);
}

/**
 * Select multiple elements
 */
export function selectAll<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): NodeListOf<T> {
  return parent.querySelectorAll<T>(selector);
}

/**
 * Add class(es) to an element
 */
export function addClass(element: Element | null, ...classes: string[]): void {
  if (!element) return;
  element.classList.add(...classes);
}

/**
 * Remove class(es) from an element
 */
export function removeClass(
  element: Element | null,
  ...classes: string[]
): void {
  if (!element) return;
  element.classList.remove(...classes);
}

/**
 * Toggle class on an element
 */
export function toggleClass(element: Element | null, className: string): void {
  if (!element) return;
  element.classList.toggle(className);
}

/**
 * Check if element has a class
 */
export function hasClass(element: Element | null, className: string): boolean {
  if (!element) return false;
  return element.classList.contains(className);
}

/**
 * Set text content of an element
 */
export function setText(element: Element | null, text: string): void {
  if (!element) return;
  element.textContent = text;
}

/**
 * Get text content of an element
 */
export function getText(element: Element | null): string {
  if (!element) return "";
  return element.textContent || "";
}

/**
 * Set HTML content of an element
 */
export function setHtml(element: Element | null, html: string): void {
  if (!element) return;
  element.innerHTML = html;
}

/**
 * Get HTML content of an element
 */
export function getHtml(element: Element | null): string {
  if (!element) return "";
  return element.innerHTML;
}

/**
 * Set attribute on an element
 */
export function setAttr(
  element: Element | null,
  name: string,
  value: string
): void {
  if (!element) return;
  element.setAttribute(name, value);
}

/**
 * Get attribute from an element
 */
export function getAttr(element: Element | null, name: string): string | null {
  if (!element) return null;
  return element.getAttribute(name);
}

/**
 * Remove attribute from an element
 */
export function removeAttr(element: Element | null, name: string): void {
  if (!element) return;
  element.removeAttribute(name);
}

/**
 * Set CSS property on an element
 */
export function setCss(
  element: HTMLElement | null,
  property: string,
  value: string
): void;
export function setCss(
  element: HTMLElement | null,
  styles: Partial<CSSStyleDeclaration>
): void;
export function setCss(
  element: HTMLElement | null,
  propertyOrStyles: string | Partial<CSSStyleDeclaration>,
  value?: string
): void {
  if (!element) return;

  if (typeof propertyOrStyles === "string" && value !== undefined) {
    element.style.setProperty(propertyOrStyles, value);
  } else if (typeof propertyOrStyles === "object") {
    Object.assign(element.style, propertyOrStyles);
  }
}

/**
 * Get CSS property value from an element
 */
export function getCss(element: HTMLElement | null, property: string): string {
  if (!element) return "";
  return getComputedStyle(element).getPropertyValue(property);
}

/**
 * Show an element
 */
export function show(element: HTMLElement | null): void {
  if (!element) return;
  element.style.display = "";
}

/**
 * Hide an element
 */
export function hide(element: HTMLElement | null): void {
  if (!element) return;
  element.style.display = "none";
}

/**
 * Check if element is hidden
 */
export function isHidden(element: HTMLElement | null): boolean {
  if (!element) return true;
  return element.offsetParent === null;
}

/**
 * Get value from input element
 */
export function getValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
): string {
  if (!element) return "";
  return element.value;
}

/**
 * Set value on input element
 */
export function setValue(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null,
  value: string
): void {
  if (!element) return;
  element.value = value;
}

/**
 * Get checked state of checkbox/radio
 */
export function isChecked(element: HTMLInputElement | null): boolean {
  if (!element) return false;
  return element.checked;
}

/**
 * Set checked state of checkbox/radio
 */
export function setChecked(
  element: HTMLInputElement | null,
  checked: boolean
): void {
  if (!element) return;
  element.checked = checked;
}

/**
 * Get disabled state of an element
 */
export function isDisabled(
  element: HTMLInputElement | HTMLButtonElement | null
): boolean {
  if (!element) return false;
  return element.disabled;
}

/**
 * Set disabled state of an element
 */
export function setDisabled(
  element: HTMLInputElement | HTMLButtonElement | null,
  disabled: boolean
): void {
  if (!element) return;
  element.disabled = disabled;
}

/**
 * Append element(s) to parent
 */
export function append(
  parent: Element | null,
  ...children: (Element | string)[]
): void {
  if (!parent) return;
  for (const child of children) {
    if (typeof child === "string") {
      parent.insertAdjacentHTML("beforeend", child);
    } else {
      parent.appendChild(child);
    }
  }
}

/**
 * Prepend element(s) to parent
 */
export function prepend(
  parent: Element | null,
  ...children: (Element | string)[]
): void {
  if (!parent) return;
  for (const child of children) {
    if (typeof child === "string") {
      parent.insertAdjacentHTML("afterbegin", child);
    } else {
      parent.insertBefore(child, parent.firstChild);
    }
  }
}

/**
 * Remove element from DOM
 */
export function remove(element: Element | null): void {
  if (!element) return;
  element.remove();
}

/**
 * Empty element (remove all children)
 */
export function empty(element: Element | null): void {
  if (!element) return;
  element.innerHTML = "";
}

/**
 * Find element within parent
 */
export function find(parent: Element | null, selector: string): Element | null {
  if (!parent) return null;
  return parent.querySelector(selector);
}

/**
 * Find all elements within parent
 */
export function findAll<T extends Element = Element>(
  parent: Element | null,
  selector: string
): NodeListOf<T> | [] {
  if (!parent) return [] as unknown as NodeListOf<T>;
  return parent.querySelectorAll<T>(selector);
}

/**
 * Get parent element
 */
export function parent(element: Element | null): Element | null {
  if (!element) return null;
  return element.parentElement;
}

/**
 * Find closest ancestor matching selector
 */
export function closest(
  element: Element | null,
  selector: string
): Element | null {
  if (!element) return null;
  return element.closest(selector);
}

/**
 * Add event listener to element
 */
export function on<K extends keyof HTMLElementEventMap>(
  element: Element | Document | Window | null,
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void;
export function on(
  element: Element | Document | Window | null,
  eventName: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
): void;
export function on(
  element: Element | Document | Window | null,
  eventName: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
): void {
  if (!element) return;
  element.addEventListener(eventName, handler, options);
}

/**
 * Add event listener with delegation
 */
export function onDelegate(
  parent: Element | Document,
  eventName: string,
  selector: string,
  handler: (event: Event, target: Element) => void
): void {
  parent.addEventListener(eventName, (event: Event) => {
    const target = (event.target as Element).closest(selector);
    if (target) {
      handler(event, target);
    }
  });
}

/**
 * Remove event listener from element
 */
export function off<K extends keyof HTMLElementEventMap>(
  element: Element | Document | Window | null,
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | EventListenerOptions
): void;
export function off(
  element: Element | Document | Window | null,
  eventName: string,
  handler: EventListener,
  options?: boolean | EventListenerOptions
): void;
export function off(
  element: Element | Document | Window | null,
  eventName: string,
  handler: EventListener,
  options?: boolean | EventListenerOptions
): void {
  if (!element) return;
  element.removeEventListener(eventName, handler, options);
}

/**
 * Trigger/dispatch custom event
 */
export function trigger(
  element: Element | null,
  eventName: string,
  detail?: unknown
): void {
  if (!element) return;
  const event = new CustomEvent(eventName, { detail, bubbles: true });
  element.dispatchEvent(event);
}

/**
 * Focus an element
 */
export function focus(element: HTMLElement | null): void {
  if (!element) return;
  element.focus();
}

/**
 * Blur an element
 */
export function blur(element: HTMLElement | null): void {
  if (!element) return;
  element.blur();
}

/**
 * Check if element matches selector
 */
export function matches(element: Element | null, selector: string): boolean {
  if (!element) return false;
  return element.matches(selector);
}

/**
 * Check if element is focused
 */
export function isFocused(element: Element | null): boolean {
  if (!element) return false;
  return document.activeElement === element;
}

/**
 * Get siblings of an element
 */
export function siblings(element: Element | null): Element[] {
  if (!element || !element.parentElement) return [];
  return Array.from(element.parentElement.children).filter(
    (e) => e !== element
  );
}

/**
 * Execute callback when DOM is ready
 */
export function ready(callback: () => void): void {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
}
