import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as DB from "../db";
import axiosInstance from "../axios-instance";
import * as Loader from "../elements/loader";
import { AxiosError } from "axios";

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
  let response;
  try {
    response = await axiosInstance.post("/user/discord/link", { data: data });
  } catch (error) {
    Loader.hide();
    const e = error as AxiosError;
    const msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to link Discord: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    Notifications.add("Accounts linked", 1);
    const snapshot = DB.getSnapshot();

    snapshot.discordId = response.data.did;

    DB.setSnapshot(snapshot);
    Settings.updateDiscordSection();
  }
}
