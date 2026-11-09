import * as TestUI from "../../test/test-ui";
import {
  isComposing,
  isTestActive,
  setCompositionData,
} from "../../states/test";
import { isDeadKeyPending, setDeadKeyPending } from "../state";

type KeyboardLayoutMap = { get(code: string): string | undefined };
type NavigatorWithKeyboard = Navigator & {
  keyboard?: { getLayoutMap?: () => Promise<KeyboardLayoutMap> };
};

let layoutMap: KeyboardLayoutMap | undefined;

// shown when the browser can't tell us the accent (eg. brave blocks getLayoutMap)
const PLACEHOLDER = "◌";

async function getDeadKeyChar(event: KeyboardEvent): Promise<string> {
  // layout map only knows the unmodified character of a key
  if (event.shiftKey || event.altKey || event.ctrlKey) return "";
  try {
    layoutMap ??= await (
      navigator as NavigatorWithKeyboard
    ).keyboard?.getLayoutMap?.();
    return layoutMap?.get(event.code) ?? "";
  } catch {
    return "";
  }
}

/**
 * On Windows, dead keys don't fire composition events like on Linux,
 * only a keydown with key "Dead". Show the accent as pending composition.
 */
export async function onDeadKeyDown(event: KeyboardEvent): Promise<void> {
  if (isComposing()) return;
  setDeadKeyPending(true);
  if (!isTestActive()) return;
  const char = (await getDeadKeyChar(event)) || PLACEHOLDER;
  // another key may have resolved the dead key while we were waiting
  if (!isDeadKeyPending()) return;
  setCompositionData(char);
  TestUI.afterTestCompositionUpdate();
}

export function clearDeadKey(rerender = false): void {
  if (!isDeadKeyPending()) return;
  setDeadKeyPending(false);
  if (isComposing()) return;
  setCompositionData("");
  if (rerender && isTestActive()) TestUI.afterTestCompositionUpdate();
}

/**
 * Backspace while a dead key is pending should only cancel the accent.
 * Returns true if the backspace was consumed.
 */
export function cancelDeadKeyOnBackspace(event: KeyboardEvent): boolean {
  if (!isDeadKeyPending() || isComposing()) return false;
  event.preventDefault();
  clearDeadKey(true);
  return true;
}
