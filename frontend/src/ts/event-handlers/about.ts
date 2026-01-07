import * as SupportPopup from "../modals/support";
import * as ContactModal from "../modals/contact";
import { qs } from "../utils/dom";

qs("#pageAbout #supportMeAboutButton")?.on("click", () => {
  SupportPopup.show();
});

qs("#pageAbout #contactPopupButton2")?.on("click", () => {
  ContactModal.show();
});
