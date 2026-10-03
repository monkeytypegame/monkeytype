import { ElementWithUtils, OnChildEvent, qs } from "../utils/dom";

/*
 * The test page is rendered by Solid and unmounted while another page is
 * shown, but vanilla test code keeps updating it in the background (config
 * changes, resizes, restarts). These helpers make that safe: refs resolve to
 * the mounted element, or to a detached placeholder when the page isn't
 * mounted, so background updates do nothing instead of throwing.
 */

/**
 * Lazy ref to an element inside the test page. Re-queries once the cached
 * element is no longer in the document (the page was remounted). While the
 * page is unmounted it returns the last element, or a detached placeholder if
 * the page was never mounted.
 */
export function testPageRef<T extends HTMLElement = HTMLElement>(
  selector: string,
): () => ElementWithUtils<T> {
  let el: ElementWithUtils<T> | undefined;
  return () => {
    if (el === undefined || !el.native.isConnected) {
      el = qs<T>(selector) ?? el;
    }
    el ??= createPlaceholder<T>("div");
    return el;
  };
}

/** A detached element standing in for a test page element while it's unmounted. */
export function createPlaceholder<T extends HTMLElement = HTMLElement>(
  tagName: keyof HTMLElementTagNameMap,
  id?: string,
): ElementWithUtils<T> {
  const el = document.createElement(tagName) as unknown as T;
  if (id !== undefined) el.id = id;
  return new ElementWithUtils(el);
}

/**
 * Delegated click listener for an element inside the test page.
 * Bound to <main> (static html) because the test page itself is rendered by
 * Solid, after modules that register these listeners are imported.
 */
export function onTestPageClick(
  selector: string,
  handler: (this: HTMLElement, event: OnChildEvent<MouseEvent>) => void,
): void {
  qs("main")?.onChild("click", `.pageTest ${selector}`, handler);
}
