import * as SupportPopup from "../popups/support-popup";

document
  .querySelector("#pageAbout #supportMeAboutButton")
  ?.addEventListener("click", () => {
    SupportPopup.show();
  });
