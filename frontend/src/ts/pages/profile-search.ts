import Page from "./page";
import * as Skeleton from "../utils/skeleton";

export const page = new Page({
  name: "profileSearch",
  element: $(".page.pageProfileSearch"),
  path: "/profile",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageProfileSearch");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageProfileSearch", "main");
    $(".page.pageProfileSearch input").val("");
  },
  afterShow: async (): Promise<void> => {
    $(".page.pageProfileSearch input").trigger("focus");
  },
});
