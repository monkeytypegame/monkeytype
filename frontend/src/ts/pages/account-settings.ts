import Page from "./page";
import * as Skeleton from "../utils/skeleton";

export const page = new Page({
  name: "accountSettings",
  element: $(".page.pageAccountSettings"),
  path: "/account-settings",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageAccountSettings");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageAccountSettings", "main");
  },
});

Skeleton.save("pageAccountSettings");
