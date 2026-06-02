import { showUpdateNameModal } from "../components/modals/account-settings/UpdateName";
import { qs } from "../utils/dom";

qs(".pageAccountSettings")?.onChild("click", "#updateAccountName", () => {
  showUpdateNameModal();
});
