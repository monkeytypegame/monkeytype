import * as Notifications from "../elements/notifications";
import { ShowOptions } from "../utils/animated-modal";
import { SimpleModal } from "../utils/simple-modal";

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
  | "toggleResultSaving"
  | "applyCustomFont"
  | "resetPersonalBests"
  | "resetSettings"
  | "revokeAllTokens"
  | "unlinkDiscord"
  | "editApeKey"
  | "deleteCustomText"
  | "deleteCustomTextLong"
  | "resetProgressCustomTextLong"
  | "updateCustomTheme"
  | "deleteCustomTheme"
  | "devGenerateData"
  | "lbGoToPage";

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
  toggleResultSaving: undefined,
  applyCustomFont: undefined,
  resetPersonalBests: undefined,
  resetSettings: undefined,
  revokeAllTokens: undefined,
  unlinkDiscord: undefined,
  editApeKey: undefined,
  deleteCustomText: undefined,
  deleteCustomTextLong: undefined,
  resetProgressCustomTextLong: undefined,
  updateCustomTheme: undefined,
  deleteCustomTheme: undefined,
  devGenerateData: undefined,
  lbGoToPage: undefined,
};

export function showPopup(
  key: PopupKey,
  showParams = [] as string[],
  showOptions: ShowOptions = {},
): void {
  const popup = list[key];
  if (popup === undefined) {
    Notifications.add("Failed to show popup - popup is not defined", -1);
    return;
  }
  popup.show(showParams, showOptions);
}
