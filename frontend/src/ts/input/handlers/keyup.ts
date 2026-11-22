import { Config } from "../../config/store";
import { logTestEvent } from "../../test/engine/events/data";
import { getTestEventCode, keysToTrack } from "../helpers/test-event-code";

export async function onKeyup(event: KeyboardEvent): Promise<void> {
  const now = performance.now();
  const code = getTestEventCode(event);
  if (keysToTrack.has(code)) {
    logTestEvent("keyup", now, {
      code,
      ctrl: event.ctrlKey ? true : undefined,
      shift: event.shiftKey ? true : undefined,
      alt: event.altKey ? true : undefined,
      meta: event.metaKey ? true : undefined,
    });
  }

  // allow arrows in arrows funbox
  const arrowsActive = Config.funbox.includes("arrows");
  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown" ||
    (event.key.startsWith("Arrow") && !arrowsActive)
  ) {
    event.preventDefault();
    return;
  }
}
