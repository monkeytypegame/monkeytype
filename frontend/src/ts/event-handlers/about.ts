import * as SupportModal from "../components/SupportModal";
import * as ContactModal from "../components/ContactModal";
import { qs } from "../utils/dom";

qs("#pageAbout #supportMeAboutButton")?.on("click", () => {
  SupportModal.show();
});

qs("#pageAbout #contactPopupButton2")?.on("click", () => {
  ContactModal.show();
});
