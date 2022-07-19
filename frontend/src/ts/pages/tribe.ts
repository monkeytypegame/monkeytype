import Page from "./page";
import * as Tribe from "../tribe/tribe";
import * as TribeChat from "../tribe/tribe-chat";

export const page = new Page(
  "tribe",
  $(".page.pageTribe"),
  "/tribe",
  async () => {
    // TODO: Fill it up later
  },
  async () => {
    // TODO: Fill it up later
  },
  async () => {
    if (Tribe.state == 5) {
      setTimeout(() => {
        TribeChat.scrollChat();
      }, 50);
    }
  },
  async () => {
    if (Tribe.state < 1) {
      Tribe.init();
    }
  }
);
