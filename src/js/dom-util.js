import * as DB from "./db";

export function showBackgroundLoader() {
  $("#backgroundLoader").stop(true, true).fadeIn(125);
}

export function hideBackgroundLoader() {
  $("#backgroundLoader").stop(true, true).fadeOut(125);
}

export function accountIconLoading(truefalse) {
  if (truefalse) {
    $("#top #menu .account .icon").html(
      '<i class="fas fa-fw fa-spin fa-circle-notch"></i>'
    );
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "none");
  } else {
    $("#top #menu .account .icon").html('<i class="fas fa-fw fa-user"></i>');
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "auto");
  }
}

export function swapElements(
  el1,
  el2,
  totalDuration,
  callback = function () {
    return;
  }
) {
  if (
    (el1.hasClass("hidden") && !el2.hasClass("hidden")) ||
    (!el1.hasClass("hidden") && el2.hasClass("hidden"))
  ) {
    //one of them is hidden and the other is visible
    if (el1.hasClass("hidden")) {
      callback();
      return false;
    }
    $(el1)
      .removeClass("hidden")
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        totalDuration / 2,
        () => {
          $(el1).addClass("hidden");
          $(el2)
            .removeClass("hidden")
            .css("opacity", 0)
            .animate(
              {
                opacity: 1,
              },
              totalDuration / 2,
              () => {
                callback();
              }
            );
        }
      );
  } else if (el1.hasClass("hidden") && el2.hasClass("hidden")) {
    //both are hidden, only fade in the second
    $(el2)
      .removeClass("hidden")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        totalDuration,
        () => {
          callback();
        }
      );
  } else {
    callback();
  }
}

export function updateTestModesNotice(
  sameWordset,
  textHasTab,
  paceCaret,
  activeFunBox,
  config
) {
  let anim = false;
  if ($(".pageTest #testModesNotice").text() === "") anim = true;

  $(".pageTest #testModesNotice").empty();

  if (sameWordset) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" function="restartTest()" style="color:var(--error-color);"><i class="fas fa-sync-alt"></i>repeated</div>`
    );
  }

  if (textHasTab) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-long-arrow-alt-right"></i>shift + tab to restart</div>`
    );
  }

  if (config.mode === "zen") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-poll"></i>shift + enter to finish zen </div>`
    );
  }

  // /^[0-9a-zA-Z_.-]+$/.test(name);

  if (/_\d+k$/g.test(config.language) && config.mode !== "quote") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsLanguages"><i class="fas fa-globe-americas"></i>${config.language.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (config.difficulty === "expert") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsDifficulty"><i class="fas fa-star-half-alt"></i>expert</div>`
    );
  } else if (config.difficulty === "master") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsDifficulty"><i class="fas fa-star"></i>master</div>`
    );
  }

  if (config.blindMode) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" function="toggleBlindMode()"><i class="fas fa-eye-slash"></i>blind</div>`
    );
  }

  if (config.paceCaret !== "off") {
    let speed = "";
    try {
      speed = ` (${Math.round(paceCaret.wpm)} wpm)`;
    } catch {}
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsPaceCaret"><i class="fas fa-tachometer-alt"></i>${
        config.paceCaret === "average"
          ? "average"
          : config.paceCaret === "pb"
          ? "pb"
          : "custom"
      } pace${speed}</div>`
    );
  }

  if (config.minWpm !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsMinWpm"><i class="fas fa-bomb"></i>min ${config.minWpmCustomSpeed} wpm</div>`
    );
  }

  if (config.minAcc !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsMinAcc"><i class="fas fa-bomb"></i>min ${config.minAccCustom}% acc</div>`
    );
  }

  if (activeFunBox !== "none") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsFunbox"><i class="fas fa-gamepad"></i>${activeFunBox.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (config.confidenceMode === "on") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsConfidenceMode"><i class="fas fa-backspace"></i>confidence</div>`
    );
  }
  if (config.confidenceMode === "max") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsConfidenceMode"><i class="fas fa-backspace"></i>max confidence</div>`
    );
  }

  if (config.stopOnError != "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsStopOnError"><i class="fas fa-hand-paper"></i>stop on ${config.stopOnError}</div>`
    );
  }

  if (config.layout !== "default") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsLayouts"><i class="fas fa-keyboard"></i>${config.layout}</div>`
    );
  }

  if (config.oppositeShiftMode === "on") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsOppositeShiftMode"><i class="fas fa-exchange-alt"></i>opposite shift</div>`
    );
  }

  let tagsString = "";
  try {
    DB.getSnapshot().tags.forEach((tag) => {
      if (tag.active === true) {
        tagsString += tag.name + ", ";
      }
    });

    if (tagsString !== "") {
      $(".pageTest #testModesNotice").append(
        `<div class="text-button" commands="commandsTags"><i class="fas fa-tag"></i>${tagsString.substring(
          0,
          tagsString.length - 2
        )}</div>`
      );
    }
  } catch {}

  if (anim) {
    $(".pageTest #testModesNotice")
      .css("transition", "none")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125,
        () => {
          $(".pageTest #testModesNotice").css("transition", ".125s");
        }
      );
  }
}
