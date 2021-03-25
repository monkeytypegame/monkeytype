export function hide() {
  $("#result .stats .wpm .crown").css("opacity", 0).addClass("hidden");
}

export function show() {
  $("#result .stats .wpm .crown")
    .removeClass("hidden")
    .css("opacity", "0")
    .animate(
      {
        opacity: 1,
      },
      250,
      "easeOutCubic"
    );
}
