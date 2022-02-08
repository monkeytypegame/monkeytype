import * as UI from "../ui";

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
    UI.swapElements(
      $(".pageLoading .icon"),
      $(".pageLoading .barWrapper"),
      125,
      () => {
        resolve();
      }
    );
    UI.swapElements(
      $(".pageAccount .icon"),
      $(".pageAccount .barWrapper"),
      125,
      () => {
        resolve();
      }
    );
  });
}
