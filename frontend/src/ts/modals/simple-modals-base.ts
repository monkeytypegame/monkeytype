import { showErrorNotification } from "../states/notifications";
import { ShowOptions } from "../utils/animated-modal";
import { SimpleModal } from "../elements/simple-modal";

export type PopupKey =
  | "deleteAccount"
  | "resetAccount"
  | "optOutOfLeaderboards"
  | "resetPersonalBests"
  | "revokeAllTokens"
  | "unlinkDiscord"
  | "editApeKey"
  | "updateCustomTheme"
  | "deleteCustomTheme"
  | "devGenerateData";

export const list: Record<PopupKey, SimpleModal | undefined> = {
  deleteAccount: undefined,
  resetAccount: undefined,
  optOutOfLeaderboards: undefined,
  resetPersonalBests: undefined,
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
