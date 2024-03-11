import * as ShareCustomThemeModal from "../modals/share-custom-theme";

const settingsPage = document.querySelector("#pageSettings");

settingsPage
  ?.querySelector("#shareCustomThemeButton")
  ?.addEventListener("click", () => {
    ShareCustomThemeModal.show();
  });
