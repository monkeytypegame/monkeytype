import Ape from "../ape";
import Page from "./page";
import * as Misc from "../utils/misc";
// import { Auth } from "../firebase";
import { update } from "../elements/profile";
import * as Notifications from "../elements/notifications";
// import * as PageController from "../controllers/page-controller";

async function hydrateProfile(): Promise<void> {
  // const currentUserId = Auth.currentUser?.uid;
  const userId = Misc.findGetParameter("uid");

  const response = await Ape.users.getProfile(userId);

  if (response.status !== 200) {
    return Notifications.add("Failed to load profile: " + response.message, -1);
  }

  const profileSnapshot: Partial<MonkeyTypes.Snapshot> = {
    // Build snapshot from response here
  };

  update("profile", profileSnapshot);
}

export const page = new Page(
  "profile",
  $(".page.pageProfile"),
  "/profile",
  () => {
    //
  },
  () => {
    //
  },
  async () => {
    await hydrateProfile();
  },
  () => {
    //
  }
);
