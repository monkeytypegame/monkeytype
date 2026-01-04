import { isDevEnvironment } from "../utils/misc";
import * as Version from "../states/version";

function setText(text: string): void {
  const el = document.querySelector("footer .currentVersion .text");
  if (el) el.textContent = text;
}

function setIndicatorVisible(state: boolean): void {
  const indicator = document.getElementById("newVersionIndicator");
  indicator?.classList.toggle("hidden", !state);
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
