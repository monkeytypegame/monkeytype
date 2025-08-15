import Page from "./page";
import * as Skeleton from "../utils/skeleton";

export async function updateBar(
  percentage: number,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    $(".pageLoading .fill, .pageAccount .preloader .fill")
      .stop(true, false)
      .animate(
        {
          width: percentage + "%",
        },
        duration,
        () => {
          resolve();
        }
      );
  });
}

export function updateText(text: string): void {
  $(".pageLoading .text, .pageAccount .preloader .text").text(text);
}

export function showSpinner(): void {
  $(".pageLoading .preloader .icon").removeClass("hidden");
  $(".pageLoading .preloader .barWrapper").addClass("hidden");
}

export async function showBar(): Promise<void> {
  $(".pageLoading .preloader .icon").addClass("hidden");
  $(".pageLoading .preloader .barWrapper").removeClass("hidden");
}

export const page = new Page({
  id: "loading",
  element: $(".page.pageLoading"),
  path: "/",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLoading");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLoading", "main");
  },
});
