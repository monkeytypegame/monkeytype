import * as Notifications from "./notifications";
import * as Settings from "./settings";
import * as DB from "./db";
import axiosInstance from "./axios-instance";

export let data = null;
export function set(val) {
  data = val;
}

export function verify(user) {
  Notifications.add("Verifying", 0, 3);
  data.uid = user.uid;

  axiosInstance
    .post("/verifyDiscord", {
      data: data,
    })
    .then((response) => {
      if (response.data.status === 1) {
        Notifications.add(response.data.message, 1);
        DB.getSnapshot().discordId = response.data.did;
        Settings.updateDiscordSection();
      } else {
        Notifications.add(response.data.message, -1);
      }
    });
}
