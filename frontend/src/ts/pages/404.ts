import Page from "./page";
import * as Skeleton from "../utils/skeleton";

export const page = new Page({
  name: "404",
  element: $(".page.page404"),
  path: "/404",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("page404");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("page404", "main");
  },
});

Skeleton.save("page404");
