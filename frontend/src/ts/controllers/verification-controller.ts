import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as AccountButton from "../elements/account-button";

interface Data {
  accessToken: string;
  tokenType: string;
}

export let data: Data | null = null;

export function set(val: Data): void {
  data = val;
}

export async function verify(): Promise<void> {
  if (data === null) return;
  Loader.show();

  const { accessToken, tokenType } = data;

  const response = await Ape.users.linkDiscord(tokenType, accessToken);
  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add("Failed to link Discord: " + response.message, -1);
  }

  Notifications.add(response.message, 1);

  const snapshot = DB.getSnapshot();

  const { discordId, discordAvatar } = response.data;
  if (discordId) {
    snapshot.discordId = discordId;
  } else {
    snapshot.discordAvatar = discordAvatar;
  }

  DB.setSnapshot(snapshot);

  AccountButton.update(discordId, discordAvatar);

  Settings.updateDiscordSection();
}
