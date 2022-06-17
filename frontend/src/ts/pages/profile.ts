import Ape from "../ape";
import Page from "./page";
import * as Misc from "../utils/misc";
import * as Profile from "../elements/profile";
import * as PbTables from "../account/pb-tables";
import * as Notifications from "../elements/notifications";

async function hydrateProfile(): Promise<void> {
  const userId = Misc.findGetParameter("uid");

  const response = await Ape.users.getProfile(userId ?? "");

  if (response.status !== 200) {
    $(".page.pageProfile .failedToLoad").removeClass("hidden");
    return Notifications.add("Failed to load profile: " + response.message, -1);
  }

  Profile.update("profile", response.data);
  PbTables.update(response.data.personalBests, true);

  $(".page.pageProfile .content").removeClass("hidden");
}

export const page = new Page(
  "profile",
  $(".page.pageProfile"),
  "/profile",
  () => {
    $(".page.pageProfile .failedToLoad").addClass("hidden");
    $(".page.pageProfile .content").addClass("hidden");
  },
  () => {
    //
  },
  () => {
    //
  },
  async () => {
    await hydrateProfile();
  }
);
