import { isDevEnvironment } from "../utils/misc";
import * as Version from "../states/version";

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
