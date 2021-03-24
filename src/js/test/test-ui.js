import * as Notifications from "./notification-center";
import * as ThemeColors from "./theme-colors";
import Config from "./config";
import * as DB from "./db";
import * as TestLogic from "./test-logic";
import * as Funbox from "./funbox";
import * as PaceCaret from "./pace-caret";

export let currentWordElementIndex = 0;
export let resultVisible = false;
export let activeWordTop = 0;
export let testRestarting = false;
export let lineTransition = false;
export let currentTestLine = 0;
export let resultCalculating = false;

export function setResultVisible(val) {
  resultVisible = val;
}

export function setCurrentWordElementIndex(val) {
  currentWordElementIndex = val;
}

export function setActiveWordTop(val) {
  activeWordTop = val;
}

export function setTestRestarting(val) {
  testRestarting = val;
}

export function setResultCalculating(val) {
  resultCalculating = val;
}

export function reset() {
  currentTestLine = 0;
  currentWordElementIndex = 0;
}

export function updateActiveElement(backspace) {
  let active = document.querySelector("#words .active");
  if (Config.mode == "zen" && backspace) {
    active.remove();
  } else if (active !== null) {
    if (Config.highlightMode == "word") {
      active.querySelectorAll("letter").forEach((e) => {
        e.classList.remove("correct");
      });
    }
    active.classList.remove("active");
  }
  try {
    let activeWord = document.querySelectorAll("#words .word")[
      currentWordElementIndex
    ];
    activeWord.classList.add("active");
    activeWord.classList.remove("error");
    activeWordTop = document.querySelector("#words .active").offsetTop;
    if (Config.highlightMode == "word") {
      activeWord.querySelectorAll("letter").forEach((e) => {
        e.classList.add("correct");
      });
    }
  } catch (e) {}
}

export function flipColors(tf) {
  if (tf) {
    $("#words").addClass("flipped");
  } else {
    $("#words").removeClass("flipped");
  }
}

export function colorful(tc) {
  if (tc) {
    $("#words").addClass("colorfulMode");
  } else {
    $("#words").removeClass("colorfulMode");
  }
}

export function screenshot() {
  $(".pageTest .ssWatermark").removeClass("hidden");
  $(".pageTest .buttons").addClass("hidden");
  let src = $("#middle");
  var sourceX = src.position().left; /*X position from div#target*/
  var sourceY = src.position().top; /*Y position from div#target*/
  var sourceWidth = src.width(); /*clientWidth/offsetWidth from div#target*/
  var sourceHeight = src.height(); /*clientHeight/offsetHeight from div#target*/
  $("#notificationCenter").addClass("hidden");
  $("#commandLineMobileButton").addClass("hidden");
  $(".pageTest .loginTip").addClass("hidden");
  try {
    html2canvas(document.body, {
      backgroundColor: ThemeColors.bg,
      height: sourceHeight + 50,
      width: sourceWidth + 50,
      x: sourceX - 25,
      y: sourceY - 25,
    }).then(function (canvas) {
      canvas.toBlob(function (blob) {
        try {
          if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
            open(URL.createObjectURL(blob));
            $("#notificationCenter").removeClass("hidden");
            $("#commandLineMobileButton").removeClass("hidden");
            $(".pageTest .ssWatermark").addClass("hidden");
            $(".pageTest .buttons").removeClass("hidden");
            if (firebase.auth().currentUser == null)
              $(".pageTest .loginTip").removeClass("hidden");
          } else {
            navigator.clipboard
              .write([
                new ClipboardItem(
                  Object.defineProperty({}, blob.type, {
                    value: blob,
                    enumerable: true,
                  })
                ),
              ])
              .then(() => {
                $("#notificationCenter").removeClass("hidden");
                $("#commandLineMobileButton").removeClass("hidden");
                Notifications.add("Copied to clipboard", 1, 2);
                $(".pageTest .ssWatermark").addClass("hidden");
                $(".pageTest .buttons").removeClass("hidden");
                if (firebase.auth().currentUser == null)
                  $(".pageTest .loginTip").removeClass("hidden");
              });
          }
        } catch (e) {
          $("#notificationCenter").removeClass("hidden");
          $("#commandLineMobileButton").removeClass("hidden");
          Notifications.add(
            "Error saving image to clipboard: " + e.message,
            -1
          );
          $(".pageTest .ssWatermark").addClass("hidden");
          $(".pageTest .buttons").removeClass("hidden");
          if (firebase.auth().currentUser == null)
            $(".pageTest .loginTip").removeClass("hidden");
        }
      });
    });
  } catch (e) {
    $("#notificationCenter").removeClass("hidden");
    $("#commandLineMobileButton").removeClass("hidden");
    Notifications.add("Error creating image: " + e.message, -1);
    $(".pageTest .ssWatermark").addClass("hidden");
    $(".pageTest .buttons").removeClass("hidden");
    if (firebase.auth().currentUser == null)
      $(".pageTest .loginTip").removeClass("hidden");
  }
}

export function updateWordElement(showError) {
  // if (Config.mode == "zen") return;

  let input = TestLogic.input.current;
  let wordAtIndex;
  let currentWord;
  wordAtIndex = document.querySelector("#words .word.active");
  currentWord = TestLogic.words.getCurrent();
  let ret = "";

  let newlineafter = false;

  if (Config.mode === "zen") {
    for (let i = 0; i < TestLogic.input.current.length; i++) {
      if (TestLogic.input.current[i] === "\t") {
        ret += `<letter class='tabChar correct'><i class="fas fa-long-arrow-alt-right"></i></letter>`;
      } else if (TestLogic.input.current[i] === "\n") {
        newlineafter = true;
        ret += `<letter class='nlChar correct'><i class="fas fa-angle-down"></i></letter>`;
      } else {
        ret +=
          `<letter class="correct">` + TestLogic.input.current[i] + `</letter>`;
      }
    }
  } else {
    if (Config.highlightMode == "word") {
      //only for word highlight

      let correctSoFar = false;
      if (currentWord.slice(0, input.length) == input) {
        // this is when input so far is correct
        correctSoFar = true;
      }
      let classString = correctSoFar ? "correct" : "incorrect";
      if (Config.blindMode) {
        classString = "correct";
      }

      //show letters in the current word
      for (let i = 0; i < currentWord.length; i++) {
        ret += `<letter class="${classString}">` + currentWord[i] + `</letter>`;
      }

      //show any extra letters if hide extra letters is disabled
      if (
        TestLogic.input.current.length > currentWord.length &&
        !Config.hideExtraLetters
      ) {
        for (
          let i = currentWord.length;
          i < TestLogic.input.current.length;
          i++
        ) {
          let letter = TestLogic.input.current[i];
          if (letter == " ") {
            letter = "_";
          }
          ret += `<letter class="${classString}">${letter}</letter>`;
        }
      }
    } else {
      for (let i = 0; i < input.length; i++) {
        let charCorrect;
        if (currentWord[i] == input[i]) {
          charCorrect = true;
        } else {
          charCorrect = false;
        }

        let currentLetter = currentWord[i];
        let tabChar = "";
        let nlChar = "";
        if (currentLetter === "\t") {
          tabChar = "tabChar";
          currentLetter = `<i class="fas fa-long-arrow-alt-right"></i>`;
        } else if (currentLetter === "\n") {
          nlChar = "nlChar";
          currentLetter = `<i class="fas fa-angle-down"></i>`;
        }

        if (charCorrect) {
          ret += `<letter class="correct ${tabChar}${nlChar}">${currentLetter}</letter>`;
        } else {
          // if (Config.difficulty == "master") {
          //   if (!TestUI.resultVisible) {
          //     failTest();
          //   }
          // }
          if (!showError) {
            if (currentLetter !== undefined) {
              ret += `<letter class="correct ${tabChar}${nlChar}">${currentLetter}</letter>`;
            }
          } else {
            if (currentLetter == undefined) {
              if (!Config.hideExtraLetters) {
                let letter = input[i];
                if (letter == " " || letter == "\t" || letter == "\n") {
                  letter = "_";
                }
                ret += `<letter class="incorrect extra ${tabChar}${nlChar}">${letter}</letter>`;
              }
            } else {
              ret +=
                `<letter class="incorrect ${tabChar}${nlChar}">` +
                currentLetter +
                (Config.indicateTypos ? `<hint>${input[i]}</hint>` : "") +
                "</letter>";
            }
          }
        }
      }

      if (input.length < currentWord.length) {
        for (let i = input.length; i < currentWord.length; i++) {
          if (currentWord[i] === "\t") {
            ret += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right"></i></letter>`;
          } else if (currentWord[i] === "\n") {
            ret += `<letter class='nlChar'><i class="fas fa-angle-down"></i></letter>`;
          } else {
            ret += "<letter>" + currentWord[i] + "</letter>";
          }
        }
      }
    }
  }
  wordAtIndex.innerHTML = ret;
  if (newlineafter) $("#words").append("<div class='newline'></div>");
}

export function lineJump(currentTop) {
  //last word of the line
  if (currentTestLine > 0) {
    let hideBound = currentTop;

    let toHide = [];
    let wordElements = $("#words .word");
    for (let i = 0; i < currentWordElementIndex; i++) {
      if ($(wordElements[i]).hasClass("hidden")) continue;
      let forWordTop = Math.floor(wordElements[i].offsetTop);
      if (forWordTop < hideBound - 10) {
        toHide.push($($("#words .word")[i]));
      }
    }
    const wordHeight = $(document.querySelector(".word")).outerHeight(true);
    if (Config.smoothLineScroll && toHide.length > 0) {
      lineTransition = true;
      $("#words").prepend(
        `<div class="smoothScroller" style="position: fixed;height:${wordHeight}px;width:100%"></div>`
      );
      $("#words .smoothScroller").animate(
        {
          height: 0,
        },
        125,
        () => {
          $("#words .smoothScroller").remove();
        }
      );
      $("#paceCaret").animate(
        {
          top: document.querySelector("#paceCaret").offsetTop - wordHeight,
        },
        125
      );
      $("#words").animate(
        {
          marginTop: `-${wordHeight}px`,
        },
        125,
        () => {
          activeWordTop = document.querySelector("#words .active").offsetTop;

          currentWordElementIndex -= toHide.length;
          lineTransition = false;
          toHide.forEach((el) => el.remove());
          $("#words").css("marginTop", "0");
        }
      );
    } else {
      toHide.forEach((el) => el.remove());
      currentWordElementIndex -= toHide.length;
      $("#paceCaret").css({
        top: document.querySelector("#paceCaret").offsetTop - wordHeight,
      });
    }
  }
  currentTestLine++;
}

export function updateModesNotice() {
  let anim = false;
  if ($(".pageTest #testModesNotice").text() === "") anim = true;

  $(".pageTest #testModesNotice").empty();

  if (TestLogic.isRepeated) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" function="restartTest()" style="color:var(--error-color);"><i class="fas fa-sync-alt"></i>repeated</div>`
    );
  }

  if (TestLogic.hasTab) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-long-arrow-alt-right"></i>shift + tab to restart</div>`
    );
  }

  if (Config.mode === "zen") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-poll"></i>shift + enter to finish zen </div>`
    );
  }

  // /^[0-9a-zA-Z_.-]+$/.test(name);

  if (/_\d+k$/g.test(Config.language) && Config.mode !== "quote") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsLanguages"><i class="fas fa-globe-americas"></i>${Config.language.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

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
      `<div class="text-button" function="toggleBlindMode()"><i class="fas fa-eye-slash"></i>blind</div>`
    );
  }

  if (Config.paceCaret !== "off") {
    let speed = "";
    try {
      speed = ` (${Math.round(PaceCaret.settings.wpm)} wpm)`;
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

  if (Funbox.active !== "none") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsFunbox"><i class="fas fa-gamepad"></i>${Funbox.active.replace(
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
      `<div class="text-button" commands="commandsLayouts"><i class="fas fa-keyboard"></i>${Config.layout}</div>`
    );
  }

  if (Config.oppositeShiftMode === "on") {
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

export function arrangeCharactersRightToLeft() {
  $("#words").addClass("rightToLeftTest");
}

export function arrangeCharactersLeftToRight() {
  $("#words").removeClass("rightToLeftTest");
}

$(document.body).on("click", "#copyResultToClipboardButton", () => {
  screenshot();
});
