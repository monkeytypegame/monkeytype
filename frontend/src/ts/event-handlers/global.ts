import * as Misc from "../utils/misc";
import * as PageTransition from "../states/page-transition";
import Config from "../config";
import * as TestWords from "../test/test-words";
import { getCommandline } from "../utils/async-modules";

document.addEventListener("keydown", async (e) => {
  if (PageTransition.get()) return;

  if (
    (e.key === "Escape" && Config.quickRestart !== "esc") ||
    (e.key === "Tab" &&
      Config.quickRestart === "esc" &&
      !TestWords.hasTab &&
      !e.shiftKey) ||
    (e.key === "Tab" &&
      Config.quickRestart === "esc" &&
      TestWords.hasTab &&
      e.shiftKey) ||
    (e.key.toLowerCase() === "p" && (e.metaKey || e.ctrlKey) && e.shiftKey)
  ) {
    const popupVisible = Misc.isAnyPopupVisible();
    const miniResultPopupVisible = Misc.isElementVisible(
      ".pageAccount .miniResultChartWrapper"
    );
    if (!popupVisible && !miniResultPopupVisible) {
      (await getCommandline()).show();
    }
  }
});

export {};
