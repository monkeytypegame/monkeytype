import * as Misc from "../utils/misc";
import Page from "./page";

export function updateBar(percentage: number, fast?: boolean): void {
  const speed = fast ? 100 : 1000;
  $(".pageLoading .fill, .pageAccount .fill")
    .stop(true, true)
    .animate(
      {
        width: percentage + "%",
      },
      speed
    );
}

export function updateText(text: string): void {
  $(".pageLoading .text, .pageAccount .text").text(text);
}

export function showBar(): Promise<void> {
  return new Promise((resolve) => {
    Misc.swapElements(
      $(".pageLoading .icon"),
      $(".pageLoading .barWrapper"),
      125,
      () => {
        resolve();
      }
    );
    Misc.swapElements(
      $(".pageAccount .icon"),
      $(".pageAccount .barWrapper"),
      125,
      () => {
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
    //
  },
  () => {
    //
  },
  () => {
    //
  }
);
