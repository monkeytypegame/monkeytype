export function show(): void {
  // $(".signOut").removeClass("hidden").css("opacity", 1);
  $(".signOut")
    .stop(true, true)
    .removeClass("hidden")
    .css({
      opacity: 0,
      transition: "0s",
    })
    .animate(
      {
        opacity: 1,
      },
      125,
      () => {
        $(".signOut").css({ transition: "0.25s" });
      }
    );
}

export function hide(): void {
  $(".signOut")
    .stop(true, true)
    .css({
      opacity: 1,
      transition: "0s",
    })
    .animate(
      {
        opacity: 0,
      },
      125,
      () => {
        $(".signOut").css({ transition: "0.25s" });
        $(".signOut").addClass("hidden");
      }
    );
  // $(".signOut").css("opacity", 0).addClass("hidden");
}

// $("#liveWpm").removeClass("hidden").css("opacity", 0).animate(
//   {
//     opacity: Config.timerOpacity,
//   },
//   125
// );
