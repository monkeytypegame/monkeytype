import { showErrorNotification } from "../states/notifications";
import { ShowOptions } from "../utils/animated-modal";
import { SimpleModal } from "../elements/simple-modal";

export type PopupKey =
  | "updateEmail"
  | "updateName"
  | "updatePassword"
  | "removeGoogleAuth"
  | "removeGithubAuth"
  | "removePasswordAuth"
  | "addPasswordAuth"
  | "deleteAccount"
  | "resetAccount"
  | "optOutOfLeaderboards"
  | "applyCustomFont"
  | "resetPersonalBests"
  | "resetSettings"
  | "revokeAllTokens"
  | "unlinkDiscord"
  | "editApeKey"
  | "updateCustomTheme"
  | "deleteCustomTheme"
  | "devGenerateData";

export const list: Record<PopupKey, SimpleModal | undefined> = {
  updateEmail: undefined,
  updateName: undefined,
  updatePassword: undefined,
  removeGoogleAuth: undefined,
  removeGithubAuth: undefined,
  removePasswordAuth: undefined,
  addPasswordAuth: undefined,
  deleteAccount: undefined,
  resetAccount: undefined,
  optOutOfLeaderboards: undefined,
  applyCustomFont: undefined,
  resetPersonalBests: undefined,
  resetSettings: undefined,
  revokeAllTokens: undefined,
  unlinkDiscord: undefined,
  editApeKey: undefined,
  updateCustomTheme: undefined,
  deleteCustomTheme: undefined,
  devGenerateData: undefined,
};

export function showPopup(
  key: PopupKey,
  showParams = [] as string[],
  showOptions: ShowOptions = {},
): void {
  const popup = list[key];
  if (popup === undefined) {
    showErrorNotification("Failed to show popup - popup is not defined");
    return;
  }
  popup.show(showParams, showOptions);
}
