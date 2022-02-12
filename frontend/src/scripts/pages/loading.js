import * as Misc from "./../misc";
import Page from "./page";

export function updateBar(percentage, fast) {
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

export function updateText(text) {
  $(".pageLoading .text, .pageAccount .text").text(text);
}

export function showBar() {
  return new Promise((resolve, _reject) => {
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
