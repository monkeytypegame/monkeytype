import { showPopup } from "../modals/simple-modals";

const lb = document.getElementById("pageLeaderboards");

for (const button of lb?.querySelectorAll(
  ".jumpButtons button[data-action='goToPage']"
) ?? []) {
  button?.addEventListener("click", () => {
    showPopup("lbGoToPage");
  });
}
