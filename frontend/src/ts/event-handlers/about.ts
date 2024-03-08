import * as SupportPopup from "../modals/support";

document
  .querySelector("#pageAbout #supportMeAboutButton")
  ?.addEventListener("click", () => {
    SupportPopup.show();
  });
