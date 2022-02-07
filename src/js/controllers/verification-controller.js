import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as DB from "../db";
import axiosInstance from "../axios-instance";
import * as Loader from "../elements/loader";

export let data = null;
export function set(val) {
  data = val;
}

export async function verify(user) {
  Notifications.add("Linking Discord account", 0, 3);
  Loader.show();
  data.uid = user.uid;
  let response;
  try {
    response = await axiosInstance.post("/user/discord/link", { data: data });
  } catch (e) {
    Loader.hide();
    let msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to link Discord: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    Notifications.add("Accounts linked", 1);
    DB.getSnapshot().discordId = response.data.did;
    Settings.updateDiscordSection();
  }
}
