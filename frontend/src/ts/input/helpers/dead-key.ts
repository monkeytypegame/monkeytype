import { isComposing } from "../../states/test";
import { isDeadKeyPending, setDeadKeyPending } from "../state";

// On Windows, dead keys don't fire composition events like on Linux,
// only a keydown with key "Dead", so we track the pending accent ourselves.

export function onDeadKeyDown(): void {
  if (isComposing()) return;
  setDeadKeyPending(true);
}

export function clearDeadKey(): void {
  setDeadKeyPending(false);
}

/**
 * Backspace while a dead key is pending only cancels the accent, like the OS
 * does. Browsers would otherwise delete the previous letter (Chromium) or
 * insert the accent (Firefox).
 * Returns true if the backspace was consumed.
 */
export function cancelDeadKeyOnBackspace(event: KeyboardEvent): boolean {
  if (!isDeadKeyPending() || isComposing()) return false;
  event.preventDefault();
  clearDeadKey();
  return true;
}
