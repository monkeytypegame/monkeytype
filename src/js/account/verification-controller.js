import * as CloudFunctions from "./cloud-functions";
import * as Notifications from "./notifications";
import * as Settings from "./settings";
import * as DB from "./db";

export let data = null;
export function set(val) {
  data = val;
}

export function verify(user) {
  Notifications.add("Verifying", 0, 3);
  data.uid = user.uid;
  CloudFunctions.verifyUser(data).then((data) => {
    if (data.data.status === 1) {
      Notifications.add(data.data.message, 1);
      DB.getSnapshot().discordId = data.data.did;
      Settings.updateDiscordSection();
    } else {
      Notifications.add(data.data.message, -1);
    }
  });
}
