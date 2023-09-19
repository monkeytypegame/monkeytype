import Page from "./page";
import * as Skeleton from "../popups/skeleton";

export const page = new Page(
  "404",
  $(".page.page404"),
  "/404",
  async () => {
    //
  },
  async () => {
    Skeleton.remove("page404");
  },
  async () => {
    Skeleton.append("page404", "main");
  },
  async () => {
    //
  }
);

Skeleton.save("page404");
