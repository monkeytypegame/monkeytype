import * as Notifications from "./notifications";
import * as ThemeColors from "./theme-colors";
import Config, * as UpdateConfig from "./config";
import * as DB from "./db";
import * as TestLogic from "./test-logic";
import * as Funbox from "./funbox";
import * as PaceCaret from "./pace-caret";
import * as CustomText from "./custom-text";
import * as Keymap from "./keymap";
import * as Caret from "./caret";
import * as CommandlineLists from "./commandline-lists";
import * as Commandline from "./commandline";
import * as OutOfFocus from "./out-of-focus";
import * as ManualRestart from "./manual-restart-tracker";
import * as PractiseWords from "./practise-words";
import * as Replay from "./replay";
import * as TestStats from "./test-stats";
import * as Misc from "./misc";
import * as TestUI from "./test-ui";
import * as ChallengeController from "./challenge-controller";
import * as RateQuotePopup from "./rate-quote-popup";
import * as UI from "./ui";

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

export function focusWords() {
  if (!$("#wordsWrapper").hasClass("hidden")) {
    $("#wordsInput").focus();
  }
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

function getWordHTML(word) {
  let newlineafter = false;
  let retval = `<div class='word'>`;
  for (let c = 0; c < word.length; c++) {
    if (word.charAt(c) === "\t") {
      retval += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right"></i></letter>`;
    } else if (word.charAt(c) === "\n") {
      newlineafter = true;
      retval += `<letter class='nlChar'><i class="fas fa-angle-down"></i></letter>`;
    } else {
      retval += "<letter>" + word.charAt(c) + "</letter>";
    }
  }
  retval += "</div>";
  if (newlineafter) retval += "<div class='newline'></div>";
  return retval;
}

export function showWords() {
  $("#words").empty();

  let wordsHTML = "";
  if (Config.mode !== "zen") {
    for (let i = 0; i < TestLogic.words.length; i++) {
      wordsHTML += getWordHTML(TestLogic.words.get(i));
    }
  } else {
    wordsHTML =
      '<div class="word">word height</div><div class="word active"></div>';
  }

  $("#words").html(wordsHTML);

  $("#wordsWrapper").removeClass("hidden");
  const wordHeight = $(document.querySelector(".word")).outerHeight(true);
  const wordsHeight = $(document.querySelector("#words")).outerHeight(true);
  if (
    Config.showAllLines &&
    Config.mode != "time" &&
    !(CustomText.isWordRandom && CustomText.word == 0) &&
    !CustomText.isTimeRandom
  ) {
    $("#words").css("height", "auto");
    $("#wordsWrapper").css("height", "auto");
    let nh = wordHeight * 3;

    if (nh > wordsHeight) {
      nh = wordsHeight;
    }
    $(".outOfFocusWarning").css("line-height", nh + "px");
  } else {
    $("#words")
      .css("height", wordHeight * 4 + "px")
      .css("overflow", "hidden");
    $("#wordsWrapper")
      .css("height", wordHeight * 3 + "px")
      .css("overflow", "hidden");
    $(".outOfFocusWarning").css("line-height", wordHeight * 3 + "px");
  }

  if (Config.mode === "zen") {
    $(document.querySelector(".word")).remove();
  } else {
    if (Config.keymapMode === "next") {
      Keymap.highlightKey(
        TestLogic.words
          .getCurrent()
          .substring(
            TestLogic.input.current.length,
            TestLogic.input.current.length + 1
          )
          .toString()
          .toUpperCase()
      );
    }
  }

  updateActiveElement();
  Funbox.toggleScript(TestLogic.words.getCurrent());

  Caret.updatePosition();
}

export function addWord(word) {
  $("#words").append(getWordHTML(word));
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

export async function screenshot() {
  let revealReplay = false;
  function revertScreenshot() {
    $("#notificationCenter").removeClass("hidden");
    $("#commandLineMobileButton").removeClass("hidden");
    $(".pageTest .ssWatermark").addClass("hidden");
    $(".pageTest .ssWatermark").text("monkeytype.com");
    $(".pageTest .buttons").removeClass("hidden");
    if (revealReplay) $("#resultReplay").removeClass("hidden");
    if (firebase.auth().currentUser == null)
      $(".pageTest .loginTip").removeClass("hidden");
  }

  if (!$("#resultReplay").hasClass("hidden")) {
    revealReplay = true;
    Replay.pauseReplay();
  }
  $("#resultReplay").addClass("hidden");
  $(".pageTest .ssWatermark").removeClass("hidden");
  $(".pageTest .ssWatermark").text(
    moment(Date.now()).format("DD MMM YYYY HH:mm") + " | monkeytype.com "
  );
  if (firebase.auth().currentUser != null) {
    $(".pageTest .ssWatermark").text(
      DB.getSnapshot().name +
        " | " +
        moment(Date.now()).format("DD MMM YYYY HH:mm") +
        " | monkeytype.com  "
    );
  }
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
      backgroundColor: await ThemeColors.get("bg"),
      height: sourceHeight + 50,
      width: sourceWidth + 50,
      x: sourceX - 25,
      y: sourceY - 25,
    }).then(function (canvas) {
      canvas.toBlob(function (blob) {
        try {
          if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
            open(URL.createObjectURL(blob));
            revertScreenshot();
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
                Notifications.add("Copied to clipboard", 1, 2);
                revertScreenshot();
              });
          }
        } catch (e) {
          Notifications.add(
            "Error saving image to clipboard: " + e.message,
            -1
          );
          revertScreenshot();
        }
      });
    });
  } catch (e) {
    Notifications.add("Error creating image: " + e.message, -1);
    revertScreenshot();
  }
  setTimeout(() => {
    revertScreenshot();
  }, 3000);
}

export function updateWordElement(showError = !Config.blindMode) {
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
        ret += `<letter class='tabChar correct' style="opacity: 0"><i class="fas fa-long-arrow-alt-right"></i></letter>`;
      } else if (TestLogic.input.current[i] === "\n") {
        newlineafter = true;
        ret += `<letter class='nlChar correct' style="opacity: 0"><i class="fas fa-angle-down"></i></letter>`;
      } else {
        ret += `<letter class="correct">${TestLogic.input.current[i]}</letter>`;
      }
    }
  } else {
    let correctSoFar = false;

    // slice earlier if input has trailing compose characters
    const inputWithoutComposeLength = Misc.trailingComposeChars.test(input)
      ? input.search(Misc.trailingComposeChars)
      : input.length;
    if (
      input.search(Misc.trailingComposeChars) < currentWord.length &&
      currentWord.slice(0, inputWithoutComposeLength) ===
        input.slice(0, inputWithoutComposeLength)
    ) {
      correctSoFar = true;
    }

    let wordHighlightClassString = correctSoFar ? "correct" : "incorrect";
    if (Config.blindMode) {
      wordHighlightClassString = "correct";
    }

    for (let i = 0; i < input.length; i++) {
      let charCorrect = currentWord[i] == input[i];

      let correctClass = "correct";
      if (Config.highlightMode == "off") {
        correctClass = "";
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

      if (
        Misc.trailingComposeChars.test(input) &&
        i > input.search(Misc.trailingComposeChars)
      )
        continue;

      if (charCorrect) {
        ret += `<letter class="${
          Config.highlightMode == "word"
            ? wordHighlightClassString
            : correctClass
        } ${tabChar}${nlChar}">${currentLetter}</letter>`;
      } else if (
        currentLetter !== undefined &&
        Misc.trailingComposeChars.test(input) &&
        i === input.search(Misc.trailingComposeChars)
      ) {
        ret += `<letter class="${
          Config.highlightMode == "word" ? wordHighlightClassString : ""
        } dead">${currentLetter}</letter>`;
      } else if (!showError) {
        if (currentLetter !== undefined) {
          ret += `<letter class="${
            Config.highlightMode == "word"
              ? wordHighlightClassString
              : correctClass
          } ${tabChar}${nlChar}">${currentLetter}</letter>`;
        }
      } else if (currentLetter === undefined) {
        if (!Config.hideExtraLetters) {
          let letter = input[i];
          if (letter == " " || letter == "\t" || letter == "\n") {
            letter = "_";
          }
          ret += `<letter class="${
            Config.highlightMode == "word"
              ? wordHighlightClassString
              : "incorrect"
          } extra ${tabChar}${nlChar}">${letter}</letter>`;
        }
      } else {
        ret +=
          `<letter class="${
            Config.highlightMode == "word"
              ? wordHighlightClassString
              : "incorrect"
          } ${tabChar}${nlChar}">` +
          currentLetter +
          (Config.indicateTypos ? `<hint>${input[i]}</hint>` : "") +
          "</letter>";
      }
    }

    const inputWithSingleComposeLength = Misc.trailingComposeChars.test(input)
      ? input.search(Misc.trailingComposeChars) + 1
      : input.length;
    if (inputWithSingleComposeLength < currentWord.length) {
      for (let i = inputWithSingleComposeLength; i < currentWord.length; i++) {
        if (currentWord[i] === "\t") {
          ret += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right"></i></letter>`;
        } else if (currentWord[i] === "\n") {
          ret += `<letter class='nlChar'><i class="fas fa-angle-down"></i></letter>`;
        } else {
          ret +=
            `<letter class="${
              Config.highlightMode == "word" ? wordHighlightClassString : ""
            }">` +
            currentWord[i] +
            "</letter>";
        }
      }
    }

    if (Config.highlightMode === "letter" && Config.hideExtraLetters) {
      if (input.length > currentWord.length && !Config.blindMode) {
        $(wordAtIndex).addClass("error");
      } else if (input.length == currentWord.length) {
        $(wordAtIndex).removeClass("error");
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

  if (TestLogic.isRepeated && Config.mode !== "quote") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button restart" style="color:var(--error-color);"><i class="fas fa-sync-alt"></i>repeated</div>`
    );
  }

  if (TestLogic.hasTab) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-long-arrow-alt-right"></i>shift + tab to restart</div>`
    );
  }

  if (ChallengeController.active) {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button" commands="commandsChallenges"><i class="fas fa-award"></i>${ChallengeController.active.display}</div>`
    );
  }

  if (Config.mode === "zen") {
    $(".pageTest #testModesNotice").append(
      `<div class="text-button"><i class="fas fa-poll"></i>shift + enter to finish zen </div>`
    );
  }

  // /^[0-9a-zA-Z_.-]+$/.test(name);

  if (
    (/_\d+k$/g.test(Config.language) ||
      /code_/g.test(Config.language) ||
      Config.language == "english_commonly_misspelled") &&
    Config.mode !== "quote"
  ) {
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
    (Config.repeatedPace && TestLogic.isPaceRepeat)
  ) {
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
  $("#resultWordsHistory .words").addClass("rightToLeftTest");
  $("#resultReplay .words").addClass("rightToLeftTest");
}

export function arrangeCharactersLeftToRight() {
  $("#words").removeClass("rightToLeftTest");
  $("#resultWordsHistory .words").removeClass("rightToLeftTest");
  $("#resultReplay .words").removeClass("rightToLeftTest");
}

async function loadWordsHistory() {
  $("#resultWordsHistory .words").empty();
  let wordsHTML = "";
  for (let i = 0; i < TestLogic.input.history.length + 2; i++) {
    let input = TestLogic.input.getHistory(i);
    let word = TestLogic.words.get(i);
    let wordEl = "";
    try {
      if (input === "") throw new Error("empty input word");
      if (
        TestLogic.corrected.getHistory(i) !== undefined &&
        TestLogic.corrected.getHistory(i) !== ""
      ) {
        wordEl = `<div class='word' burst="${
          TestStats.burstHistory[i]
        }" input="${TestLogic.corrected
          .getHistory(i)
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      } else {
        wordEl = `<div class='word' burst="${
          TestStats.burstHistory[i]
        }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
      }
      if (i === TestLogic.input.history.length - 1) {
        //last word
        let wordstats = {
          correct: 0,
          incorrect: 0,
          missed: 0,
        };
        let length = Config.mode == "zen" ? input.length : word.length;
        for (let c = 0; c < length; c++) {
          if (c < input.length) {
            //on char that still has a word list pair
            if (Config.mode == "zen" || input[c] == word[c]) {
              wordstats.correct++;
            } else {
              wordstats.incorrect++;
            }
          } else {
            //on char that is extra
            wordstats.missed++;
          }
        }
        if (wordstats.incorrect !== 0 || Config.mode !== "time") {
          if (Config.mode != "zen" && input !== word) {
            wordEl = `<div class='word error' burst="${
              TestStats.burstHistory[i]
            }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
          }
        }
      } else {
        if (Config.mode != "zen" && input !== word) {
          wordEl = `<div class='word error' burst="${
            TestStats.burstHistory[i]
          }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
        }
      }

      let loop;
      if (Config.mode == "zen" || input.length > word.length) {
        //input is longer - extra characters possible (loop over input)
        loop = input.length;
      } else {
        //input is shorter or equal (loop over word list)
        loop = word.length;
      }

      for (let c = 0; c < loop; c++) {
        let correctedChar;
        try {
          correctedChar = TestLogic.corrected.getHistory(i)[c];
        } catch (e) {
          correctedChar = undefined;
        }
        let extraCorrected = "";
        if (
          c + 1 === loop &&
          TestLogic.corrected.getHistory(i) !== undefined &&
          TestLogic.corrected.getHistory(i).length > input.length
        ) {
          extraCorrected = "extraCorrected";
        }
        if (Config.mode == "zen" || word[c] !== undefined) {
          if (Config.mode == "zen" || input[c] === word[c]) {
            if (correctedChar === input[c] || correctedChar === undefined) {
              wordEl += `<letter class="correct ${extraCorrected}">${input[c]}</letter>`;
            } else {
              wordEl +=
                `<letter class="corrected ${extraCorrected}">` +
                input[c] +
                "</letter>";
            }
          } else {
            if (input[c] === TestLogic.input.current) {
              wordEl +=
                `<letter class='correct ${extraCorrected}'>` +
                word[c] +
                "</letter>";
            } else if (input[c] === undefined) {
              wordEl += "<letter>" + word[c] + "</letter>";
            } else {
              wordEl +=
                `<letter class="incorrect ${extraCorrected}">` +
                word[c] +
                "</letter>";
            }
          }
        } else {
          wordEl += '<letter class="incorrect extra">' + input[c] + "</letter>";
        }
      }
      wordEl += "</div>";
    } catch (e) {
      try {
        wordEl = "<div class='word'>";
        for (let c = 0; c < word.length; c++) {
          wordEl += "<letter>" + word[c] + "</letter>";
        }
        wordEl += "</div>";
      } catch {}
    }
    wordsHTML += wordEl;
  }
  $("#resultWordsHistory .words").html(wordsHTML);
  $("#showWordHistoryButton").addClass("loaded");
  return true;
}

export function toggleResultWords() {
  if (resultVisible) {
    if ($("#resultWordsHistory").stop(true, true).hasClass("hidden")) {
      //show

      if (!$("#showWordHistoryButton").hasClass("loaded")) {
        $("#words").html(
          `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
        );
        loadWordsHistory().then(() => {
          if (Config.burstHeatmap) {
            TestUI.applyBurstHeatmap();
          }
          $("#resultWordsHistory")
            .removeClass("hidden")
            .css("display", "none")
            .slideDown(250, () => {
              if (Config.burstHeatmap) {
                TestUI.applyBurstHeatmap();
              }
            });
        });
      } else {
        if (Config.burstHeatmap) {
          TestUI.applyBurstHeatmap();
        }
        $("#resultWordsHistory")
          .removeClass("hidden")
          .css("display", "none")
          .slideDown(250);
      }
    } else {
      //hide

      $("#resultWordsHistory").slideUp(250, () => {
        $("#resultWordsHistory").addClass("hidden");
      });
    }
  }
}

export function applyBurstHeatmap() {
  if (Config.burstHeatmap) {
    $("#resultWordsHistory .heatmapLegend").removeClass("hidden");

    let burstlist = [...TestStats.burstHistory];

    if (
      TestLogic.input.getHistory(TestLogic.input.getHistory().length - 1)
        .length !== TestLogic.words.getCurrent().length
    ) {
      burstlist = burstlist.splice(0, burstlist.length - 1);
    }

    let median = Misc.median(burstlist);
    let adatm = [];
    burstlist.forEach((burst) => {
      adatm.push(Math.abs(median - burst));
    });
    let step = Misc.mean(adatm);
    let steps = [
      {
        val: 0,
        class: "heatmap-0",
      },
      {
        val: median - step * 1.5,
        class: "heatmap-1",
      },
      {
        val: median - step * 0.5,
        class: "heatmap-2",
      },
      {
        val: median + step * 0.5,
        class: "heatmap-3",
      },
      {
        val: median + step * 1.5,
        class: "heatmap-4",
      },
    ];
    $("#resultWordsHistory .words .word").each((index, word) => {
      let wordBurstVal = parseInt($(word).attr("burst"));
      let cls = "";
      steps.forEach((step) => {
        if (wordBurstVal > step.val) cls = step.class;
      });
      $(word).addClass(cls);
    });
  } else {
    $("#resultWordsHistory .heatmapLegend").addClass("hidden");
    $("#resultWordsHistory .words .word").removeClass("heatmap-0");
    $("#resultWordsHistory .words .word").removeClass("heatmap-1");
    $("#resultWordsHistory .words .word").removeClass("heatmap-2");
    $("#resultWordsHistory .words .word").removeClass("heatmap-3");
    $("#resultWordsHistory .words .word").removeClass("heatmap-4");
  }
}

export function highlightBadWord(index, showError) {
  if (!showError) return;
  $($("#words .word")[index]).addClass("error");
}

$(document.body).on("click", "#saveScreenshotButton", () => {
  screenshot();
});

$(document).on("click", "#testModesNotice .text-button.restart", (event) => {
  TestLogic.restart();
});

$(document).on("click", "#testModesNotice .text-button.blind", (event) => {
  UpdateConfig.toggleBlindMode();
});

$(".pageTest #copyWordsListButton").click(async (event) => {
  try {
    let words;
    if (Config.mode == "zen") {
      words = TestLogic.input.history.join(" ");
    } else {
      words = TestLogic.words
        .get()
        .slice(0, TestLogic.input.history.length)
        .join(" ");
    }
    await navigator.clipboard.writeText(words);
    Notifications.add("Copied to clipboard", 0, 2);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

$(".pageTest #rateQuoteButton").click(async (event) => {
  RateQuotePopup.show(TestLogic.randomQuote);
});

$(".pageTest #toggleBurstHeatmap").click(async (event) => {
  UpdateConfig.setBurstHeatmap(!Config.burstHeatmap);
});

$(".pageTest .loginTip .link").click(async (event) => {
  UI.changePage("login");
});

$(document).on("mouseleave", "#resultWordsHistory .words .word", (e) => {
  $(".wordInputAfter").remove();
});

$("#wpmChart").on("mouseleave", (e) => {
  $(".wordInputAfter").remove();
});

$(document).on("mouseenter", "#resultWordsHistory .words .word", (e) => {
  if (resultVisible) {
    let input = $(e.currentTarget).attr("input");
    let burst = $(e.currentTarget).attr("burst");
    if (input != undefined)
      $(e.currentTarget).append(
        `<div class="wordInputAfter">
          <div class="text">
          ${input
            .replace(/\t/g, "_")
            .replace(/\n/g, "_")
            .replace(/</g, "&lt")
            .replace(/>/g, "&gt")}
          </div>
          <div class="speed">
          ${burst}wpm
          </div>
          </div>`
      );
  }
});

$(document).on("click", "#testModesNotice .text-button", (event) => {
  // console.log("CommandlineLists."+$(event.currentTarget).attr("commands"));
  let commands = CommandlineLists.getList(
    $(event.currentTarget).attr("commands")
  );
  let func = $(event.currentTarget).attr("function");
  if (commands !== undefined) {
    if ($(event.currentTarget).attr("commands") === "commandsTags") {
      CommandlineLists.updateTagCommands();
    }
    CommandlineLists.pushCurrent(commands);
    Commandline.show();
  } else if (func != undefined) {
    eval(func);
  }
});

$("#wordsInput").on("focus", () => {
  if (!resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show(TestLogic.input.current);
});

$("#wordsInput").on("focusout", () => {
  if (!resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.show();
  }
  Caret.hide();
});

$(document).on("keypress", "#restartTestButton", (event) => {
  if (event.key == "Enter") {
    ManualRestart.reset();
    if (
      TestLogic.active &&
      Config.repeatQuotes === "typing" &&
      Config.mode === "quote"
    ) {
      TestLogic.restart(true);
    } else {
      TestLogic.restart();
    }
  }
});

$(document.body).on("click", "#restartTestButton", () => {
  ManualRestart.set();
  if (resultCalculating) return;
  if (
    TestLogic.active &&
    Config.repeatQuotes === "typing" &&
    Config.mode === "quote"
  ) {
    TestLogic.restart(true);
  } else {
    TestLogic.restart();
  }
});

$(document).on("keypress", "#practiseWordsButton", (event) => {
  if (event.keyCode == 13) {
    PractiseWords.showPopup(true);
  }
});

$(document.body).on("click", "#practiseWordsButton", () => {
  // PractiseWords.init();
  PractiseWords.showPopup();
});

$(document).on("keypress", "#nextTestButton", (event) => {
  if (event.keyCode == 13) {
    TestLogic.restart();
  }
});

$(document.body).on("click", "#nextTestButton", () => {
  ManualRestart.set();
  TestLogic.restart();
});

$(document).on("keypress", "#showWordHistoryButton", (event) => {
  if (event.keyCode == 13) {
    toggleResultWords();
  }
});

$(document.body).on("click", "#showWordHistoryButton", () => {
  toggleResultWords();
});

$(document.body).on("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  ManualRestart.set();
  TestLogic.restart(true);
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  if (event.keyCode == 13) {
    TestLogic.restart(true);
  }
});

$("#wordsWrapper").on("click", () => {
  focusWords();
});
