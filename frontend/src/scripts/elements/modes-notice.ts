import * as PaceCaret from "../test/pace-caret";
import * as TestState from "../test/test-state";
import * as DB from "../db";
import * as Last10Average from "../elements/last-10-average";
import Config from "../config";
import * as TestWords from "../test/test-words";
import * as ConfigEvent from "../observables/config-event";

ConfigEvent.subscribe((eventKey) => {
  if (
    [
      "difficulty",
      "blindMode",
      "stopOnError",
      "paceCaret",
      "minWpm",
      "minAcc",
      "minBurst",
      "confidenceMode",
      "layout",
      "showAvg",
    ].includes(eventKey)
  ) {
    update();
  }
});

//todo remove when pace caret is converted to ts
type PaceCaretSettings = {
  wpm: number;
};

export async function update(): Promise<void> {
  let anim = false;
  if ($(".pageTest #testModesNotice").text() === "") anim = true;

  $(".pageTest #testModesNotice").empty();

  if (TestState.isRepeated && Config.mode !== "quote") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button restart" style="color:var(--error-color);"><i class="fas fa-sync-alt"></i>repeated</div>`
    );
  }

  if (TestWords.hasTab) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-long-arrow-alt-right"></i>shift + tab to restart</div>`
    );
  }

  if (TestState.activeChallenge) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsChallenges"><i class="fas fa-award"></i>${TestState.activeChallenge.display}</div>`
    );
  }

  if (Config.mode === "zen") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-poll"></i>shift + enter to finish zen </div>`
    );
  }

  $(".pageTest #testModesNotice").append(
    `<div class="text-button" commands="commandsLanguages"><i class="fas fa-globe-americas"></i>${Config.language.replace(
      /_/g,
      " "
    )}</div>`
  );

  if (Config.difficulty === "expert") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsDifficulty"><i class="fas fa-star-half-alt"></i>expert</div>`
    );
  } else if (Config.difficulty === "master") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsDifficulty"><i class="fas fa-star"></i>master</div>`
    );
  }

  if (Config.blindMode) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button blind"><i class="fas fa-eye-slash"></i>blind</div>`
    );
  }

  if (Config.lazyMode) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsLazyMode"><i class="fas fa-couch"></i>lazy</div>`
    );
  }

  if (
    Config.paceCaret !== "off" ||
    (Config.repeatedPace && TestState.isPaceRepeat)
  ) {
    let speed = "";
    try {
      speed = ` (${Math.round(
        (PaceCaret.settings as unknown as PaceCaretSettings).wpm
      )} wpm)`;
    } catch {}
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsPaceCaret"><i class="fas fa-tachometer-alt"></i>${
        Config.paceCaret === "average"
          ? "average"
          : Config.paceCaret === "pb"
          ? "pb"
          : "custom"
      } pace${speed}</div>`
    );
  }

  if (Config.showAvg) {
    const val = Last10Average.get();
    if (firebase.auth().currentUser && val > 0) {
      $(".pageTest #testModesNotice").append(
        `<div class="text-button" commands="commandsShowAvg"><i class="fas fa-tachometer-alt"></i>avg: ${val}wpm</div>`
      );
    }
  }

  if (Config.minWpm !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsMinWpm"><i class="fas fa-bomb"></i>min ${Config.minWpmCustomSpeed} wpm</div>`
    );
  }

  if (Config.minAcc !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsMinAcc"><i class="fas fa-bomb"></i>min ${Config.minAccCustom}% acc</div>`
    );
  }

  if (Config.minBurst !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsMinBurst"><i class="fas fa-bomb"></i>min ${
        Config.minBurstCustomSpeed
      } burst ${Config.minBurst === "flex" ? "(flex)" : ""}</div>`
    );
  }

  if (Config.funbox !== "none") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsFunbox"><i class="fas fa-gamepad"></i>${Config.funbox.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (Config.confidenceMode === "on") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsConfidenceMode"><i class="fas fa-backspace"></i>confidence</div>`
    );
  }
  if (Config.confidenceMode === "max") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsConfidenceMode"><i class="fas fa-backspace"></i>max confidence</div>`
    );
  }

  if (Config.stopOnError != "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsStopOnError"><i class="fas fa-hand-paper"></i>stop on ${Config.stopOnError}</div>`
    );
  }

  if (Config.layout !== "default") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsLayouts"><i class="fas fa-keyboard"></i>emulating ${Config.layout.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (Config.oppositeShiftMode !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsOppositeShiftMode"><i class="fas fa-exchange-alt"></i>opposite shift${
        Config.oppositeShiftMode === "keymap" ? " (keymap)" : ""
      }</div>`
    );
  }

  let tagsString = "";
  try {
    DB.getSnapshot().tags?.forEach((tag) => {
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
