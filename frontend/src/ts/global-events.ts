import * as Commandline from "./commandline/commandline";
import * as Misc from "./utils/misc";
import * as PageTransition from "./states/page-transition";

function handleEscape(e: KeyboardEvent): void {
  const popupVisible = Misc.isAnyPopupVisible();
  const miniResultPopupVisible = Misc.isElementVisible(
    ".pageAccount .miniResultChartWrapper"
  );
  if (!popupVisible && !miniResultPopupVisible) {
    Commandline.show();
  }
}

document.addEventListener("keydown", (e) => {
  if (PageTransition.get()) return;

  if (e.key === "Escape") {
    handleEscape(e);
  }
});
