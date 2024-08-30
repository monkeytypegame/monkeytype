import Page from "./page";
import * as Skeleton from "../utils/skeleton";

export const page = new Page({
  name: "leaderboards",
  element: $(".page.pageLeaderboards"),
  path: "/leaderboards",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLeaderboards");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLeaderboards", "main");
  },
});

Skeleton.save("pageLeaderboards");
