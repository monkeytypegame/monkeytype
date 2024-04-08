import * as Misc from "../utils/misc";
import Page from "./page";
import * as Skeleton from "../utils/skeleton";

export function updateBar(percentage: number, fast = false): void {
  const speed = fast ? 100 : 1000;
  $(".pageLoading .fill, .pageAccount .preloader .fill")
    .stop(true, fast)
    .animate(
      {
        width: percentage + "%",
      },
      speed
    );
}

export function updateText(text: string): void {
  $(".pageLoading .text, .pageAccount .preloader .text").text(text);
}

export async function showBar(): Promise<void> {
  return new Promise((resolve) => {
    void Misc.swapElements(
      $(".pageLoading .preloader .icon"),
      $(".pageLoading .preloader .barWrapper"),
      125,
      async () => {
        resolve();
      }
    );
    void Misc.swapElements(
      $(".pageAccount .preloader .icon"),
      $(".pageAccount .preloader .barWrapper"),
      125,
      async () => {
        resolve();
      }
    );
  });
}

export const page = new Page({
  name: "loading",
  element: $(".page.pageLoading"),
  path: "/",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLoading");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLoading", "main");
  },
});
