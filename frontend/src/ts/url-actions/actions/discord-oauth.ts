// The discord oauth redirect (the account settings' link discord button):
// its hash carries the token. A url action (../action.ts)

import Ape from "../../ape";
import * as DB from "../../db";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { UrlHashAction } from "../action";

// the token is single use, the rest of the hash goes with it
export const discordTokenAction: UrlHashAction = {
  in: "hash",
  param: "access_token",
  failure: "Failed to link Discord",
  apply: async (value, getParam) =>
    applyDiscordToken(decodeDiscordToken(value, getParam)),
};

type DiscordToken = { accessToken: string; tokenType: string; state: string };

/**
 * The redirect's token. `getParam` reads its other hash params. Throws if one
 * is missing.
 */
export function decodeDiscordToken(
  accessToken: string,
  getParam: (param: string) => string | null,
): DiscordToken {
  const tokenType = getParam("token_type");
  const state = getParam("state");
  if (tokenType === null) throw new Error("missing token_type");
  if (state === null) throw new Error("missing state");
  return { accessToken, tokenType, state };
}

/** Links the token's discord account. */
async function applyDiscordToken(token: DiscordToken): Promise<void> {
  showLoaderBar();
  const response = await Ape.users
    .linkDiscord({ body: token })
    .finally(hideLoaderBar);

  if (response.status !== 200) {
    showErrorNotification("Failed to link Discord", { response });
    return;
  }

  if (response.body.data === null) {
    showErrorNotification("Failed to link Discord: data returned was null");
    return;
  }

  showSuccessNotification(response.body.message);

  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const { discordId, discordAvatar } = response.body.data;
  if (discordId !== undefined) {
    snapshot.discordId = discordId;
  }
  if (discordAvatar !== undefined) {
    snapshot.discordAvatar = discordAvatar;
  }

  DB.setSnapshot(snapshot);
}
