import { getInputElement } from "../input-element";
import Config from "../../../config";
import * as TestInput from "../../../test/test-input";
import * as Monkey from "../../../test/monkey";

const inputEl = getInputElement();

inputEl.addEventListener("keyup", async (event) => {
  console.debug("wordsInput event keyup", {
    event,
    key: event.key,
    code: event.code,
  });

  const now = performance.now();
  TestInput.recordKeyupTime(now, event);

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
});
