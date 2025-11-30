import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as Monkey from "../../test/monkey";
import { logTestEvent } from "../../test/events/data";

export async function onKeyup(event: KeyboardEvent): Promise<void> {
  const now = performance.now();
  TestInput.recordKeyupTime(now, event);
  logTestEvent("keyup", now, {
    code: event.code,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
    repeat: event.repeat,
  });

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

  setTimeout(() => {
    Monkey.stop(event);
  }, 0);
}
