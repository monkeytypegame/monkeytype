import * as SupportPopup from "../modals/support";
import * as ContactModal from "../modals/contact";

document
  .querySelector("#pageAbout #supportMeAboutButton")
  ?.addEventListener("click", () => {
    SupportPopup.show();
  });

document
  .querySelector("#pageAbout #contactPopupButton2")
  ?.addEventListener("click", () => {
    ContactModal.show();
  });
