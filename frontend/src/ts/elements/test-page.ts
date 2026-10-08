import { OnChildEvent, qs } from "../utils/dom";

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
