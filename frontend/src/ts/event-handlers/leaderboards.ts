import { showPopup } from "../modals/simple-modals";

const lb = document.getElementById("pageLeaderboards");

lb?.querySelector(
  ".jumpButtons button[data-action='goToPage']"
)?.addEventListener("click", () => {
  showPopup("lbGoToPage");
});
