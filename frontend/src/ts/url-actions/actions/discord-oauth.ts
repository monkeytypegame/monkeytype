// The discord oauth redirect (the account settings' link discord button):
// its hash carries the token. A url action (../action.ts)

import Ape from "../../ape";
import { setDiscordLink } from "../../collections/user";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { z } from "zod";

import { defineHashAction } from "../action";

// the oauth redirect's hash params
const DiscordTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  state: z.string(),
});

// the token is single use, the rest of the hash goes with it
export const discordTokenAction = defineHashAction({
  in: "hash",
  param: "access_token",
  failure: "Failed to link Discord",
  schema: DiscordTokenSchema,
  apply: applyDiscordToken,
});

/** Links the token's discord account. */
async function applyDiscordToken(
  token: z.infer<typeof DiscordTokenSchema>,
): Promise<void> {
  showLoaderBar();
  const response = await Ape.users
    .linkDiscord({
      body: {
        accessToken: token.access_token,
        tokenType: token.token_type,
        state: token.state,
      },
    })
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

  setDiscordLink(response.body.data);
}
