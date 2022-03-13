import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as DB from "../db";
import * as Loader from "../elements/loader";

type Data = {
  accessToken: string;
  tokenType: string;
  uid?: string;
};

export let data: Data | null = null;

export function set(val: Data): void {
  data = val;
}

export async function verify(uid: string): Promise<void> {
  if (data === null) return;
  Notifications.add("Linking Discord account", 0, 3);
  Loader.show();
  data.uid = uid;

  const response = await Ape.users.linkDiscord(data);

  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add("Failed to link Discord: " + response.message, -1);
  }

  Notifications.add("Accounts linked", 1);

  const snapshot = DB.getSnapshot();
  snapshot.discordId = response.data.did;
  DB.setSnapshot(snapshot);

  Settings.updateDiscordSection();
}
