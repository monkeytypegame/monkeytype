import * as UI from "./ui";

export function updateBar(percentage) {
  $(".pageLoading .fill").width(percentage + "%");
}

export function updateText(text) {
  $(".pageLoading .text").text(text);
}

export function showBar() {
  return new Promise((resolve, reject) => {
    UI.swapElements(
      $(".pageLoading .icon"),
      $(".pageLoading .barWrapper"),
      125,
      () => {
        resolve();
      }
    );
  });
}
