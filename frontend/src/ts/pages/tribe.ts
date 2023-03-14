import Page from "./page";
import * as Tribe from "../tribe/tribe";
import * as TribeState from "../tribe/tribe-state";
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
    TribeChat.reset("lobby");
  },
  async () => {
    if (TribeState.getState() == 5) {
      TribeChat.fill("lobby");
      setTimeout(() => {
        TribeChat.scrollChat();
      }, 50);
    }
  },
  async () => {
    if (TribeState.getState() < 1) {
      Tribe.init();
    }
  }
);
