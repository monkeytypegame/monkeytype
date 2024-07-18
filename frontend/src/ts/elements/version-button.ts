import { isDevEnvironment } from "../utils/misc.js";
import * as Version from "../states/version.js";

function setText(text: string): void {
  $("footer .currentVersion .text").text(text);
}

function setIndicatorVisible(state: boolean): void {
  if (state) {
    $("#newVersionIndicator").removeClass("hidden");
  } else {
    $("#newVersionIndicator").addClass("hidden");
  }
}

export async function update(): Promise<void> {
  if (isDevEnvironment()) {
    setText("localhost");
    return;
  }

  const { version, isNew } = await Version.get();
  setText(version);
  setIndicatorVisible(isNew);
}
