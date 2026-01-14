import { showModal } from "../stores/modals";
import { qs } from "../utils/dom";

qs("#pageAbout #supportMeAboutButton")?.on("click", () => {
  showModal("Support");
});

qs("#pageAbout #contactPopupButton2")?.on("click", () => {
  showModal("Contact");
});
