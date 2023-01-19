import * as Misc from "../utils/misc";
import Page from "./page";
import * as Skeleton from "../popups/skeleton";

export function updateBar(percentage: number, fast = false): void {
  const speed = fast ? 100 : 1000;
  $(".pageLoading .fill, .pageAccount .fill")
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
    Misc.swapElements(
      $(".pageLoading .preloader .icon"),
      $(".pageLoading .preloader .barWrapper"),
      125,
      async () => {
        resolve();
      }
    );
    Misc.swapElements(
      $(".pageAccount .preloader .icon"),
      $(".pageAccount .preloader .barWrapper"),
      125,
      async () => {
        resolve();
      }
    );
  });
}

export const page = new Page(
  "loading",
  $(".page.pageLoading"),
  "/",
  async () => {
    //
  },
  async () => {
    Skeleton.remove("pageLoading");
  },
  async () => {
    Skeleton.append("pageLoading");
  },
  async () => {
    //
  }
);
