import Page from "./page";
import * as Tribe from "../tribe/tribe";
import * as TribeState from "../tribe/tribe-state";
import * as TribeChat from "../tribe/tribe-chat";
import { qsr } from "../utils/dom";
import { CLIENT_STATE } from "../tribe/types";
import tribeSocket from "../tribe/tribe-socket";
import * as TribePagePreloader from "../tribe/pages/tribe-page-preloader";

export const page = new Page({
  id: "tribe",
  element: qsr(".page.pageTribe"),
  path: "/tribe",
  beforeHide: async () => {
    // TODO: Fill it up later
  },
  afterHide: async () => {
    // TODO: Fill it up later
    TribeChat.reset("lobby");
    if (!TribeState.isInARoom()) {
      tribeSocket.disconnect();
      TribePagePreloader.reset();
    }
  },
  beforeShow: async () => {
    if (TribeState.isInARoom()) {
      void TribeChat.fill("lobby").then(() => {
        TribeChat.scrollChat();
      });
    }
  },
  afterShow: async () => {
    if (TribeState.getState() === CLIENT_STATE.DISCONNECTED) {
      void Tribe.init();
    }
  },
});
