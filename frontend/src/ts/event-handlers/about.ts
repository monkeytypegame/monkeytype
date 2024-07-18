import * as SupportPopup from "../modals/support.js";
import * as ContactModal from "../modals/contact.js";

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
