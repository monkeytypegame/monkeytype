import Config from "../../config";
import * as TestInput from "../../test/test-input";
import * as Monkey from "../../test/monkey";

function handleKeyupTiming(event: KeyboardEvent, now: number): void {
  if (event.repeat) {
    console.log(
      "spacing debug keyup STOPPED - repeat",
      event.key,
      event.code,
      //ignore for logging
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.which
    );
    return;
  }

  let eventCode = event.code;

  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    eventCode = "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    eventCode = "NoCode";
  }

  if (eventCode === "" || event.key === "Unidentified") {
    eventCode = "NoCode";
  }
  TestInput.recordKeyupTime(now, eventCode);
}

export async function handleKeyup(event: KeyboardEvent): Promise<void> {
  const now = performance.now();
  handleKeyupTiming(event, now);

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
