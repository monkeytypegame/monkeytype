import { showPopup } from "../modals/simple-modals";
import { qs } from "../utils/dom";

const lb = qs("#pageLeaderboards");

lb?.qsa(".jumpButtons button[data-action='goToPage']").on("click", () => {
  showPopup("lbGoToPage");
});
