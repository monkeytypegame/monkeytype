import Page from "./page";
import * as Skeleton from "../popups/skeleton";

export const page = new Page(
  "profileSearch",
  $(".page.pageProfileSearch"),
  "/profile",
  async () => {
    //
  },
  async () => {
    Skeleton.remove("pageProfileSearch");
  },
  async () => {
    Skeleton.append("pageProfileSearch", "middle");
    $(".page.pageProfileSearch input").val("");
  },
  async () => {
    $(".page.pageProfileSearch input").focus();
  }
);
