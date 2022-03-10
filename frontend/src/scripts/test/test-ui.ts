import * as Notifications from "../elements/notifications";
import * as ThemeColors from "../elements/theme-colors";
import Config, * as UpdateConfig from "../config";
import * as DB from "../db";
import * as TestWords from "./test-words";
import * as TestInput from "./test-input";
import * as CustomText from "./custom-text";
import * as Caret from "./caret";
import * as OutOfFocus from "./out-of-focus";
import * as Replay from "./replay";
import * as Misc from "../misc";
import * as SlowTimer from "../states/slow-timer";
import * as ConfigEvent from "../observables/config-event";

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventValue === undefined || typeof eventValue !== "boolean") return;
  if (eventKey === "flipTestColors") flipColors(eventValue);
  if (eventKey === "colorfulMode") colorful(eventValue);
  if (eventKey === "highlightMode") updateWordElement(eventValue);
  if (eventKey === "burstHeatmap") applyBurstHeatmap();
});

export let currentWordElementIndex = 0;
export let resultVisible = false;
export let activeWordTop = 0;
export let testRestarting = false;
export let testRestartingPromise: Promise<unknown>;
export let lineTransition = false;
export let currentTestLine = 0;
export let resultCalculating = false;

export function setResultVisible(val: boolean): void {
  resultVisible = val;
}

export function setCurrentWordElementIndex(val: number): void {
  currentWordElementIndex = val;
}

export function setActiveWordTop(val: number): void {
  activeWordTop = val;
}

let restartingResolve: null | ((value?: unknown) => void);
export function setTestRestarting(val: boolean): void {
  testRestarting = val;
  if (val === true) {
    testRestartingPromise = new Promise((resolve) => {
      restartingResolve = resolve;
    });
  } else {
    if (restartingResolve) restartingResolve();
    restartingResolve = null;
  }
}

export function setResultCalculating(val: boolean): void {
  resultCalculating = val;
}

export function reset(): void {
  currentTestLine = 0;
  currentWordElementIndex = 0;
}

export function focusWords(): void {
  if (!$("#wordsWrapper").hasClass("hidden")) {
    $("#wordsInput").trigger("focus");
  }
}

export function updateActiveElement(backspace?: boolean): void {
  const active = document.querySelector("#words .active");
  if (Config.mode == "zen" && backspace) {
    active?.remove();
  } else if (active !== null) {
    if (Config.highlightMode == "word") {
      active.querySelectorAll("letter").forEach((e) => {
        e.classList.remove("correct");
      });
    }
    active.classList.remove("active");
  }
  try {
    const activeWord =
      document.querySelectorAll("#words .word")[currentWordElementIndex];
    activeWord.classList.add("active");
    activeWord.classList.remove("error");
    activeWordTop = (<HTMLElement>document.querySelector("#words .active"))
      .offsetTop;
    if (Config.highlightMode == "word") {
      activeWord.querySelectorAll("letter").forEach((e) => {
        e.classList.add("correct");
      });
    }
  } catch (e) {}
}

function getWordHTML(word: string): string {
  let newlineafter = false;
  let retval = `<div class='word'>`;
  for (let c = 0; c < word.length; c++) {
    if (Config.funbox === "arrows") {
      if (word.charAt(c) === "↑") {
        retval += `<letter><i class="fas fa-arrow-up"></i></letter>`;
      }
      if (word.charAt(c) === "↓") {
        retval += `<letter><i class="fas fa-arrow-down"></i></letter>`;
      }
      if (word.charAt(c) === "←") {
        retval += `<letter><i class="fas fa-arrow-left"></i></letter>`;
      }
      if (word.charAt(c) === "→") {
        retval += `<letter><i class="fas fa-arrow-right"></i></letter>`;
      }
    } else if (word.charAt(c) === "\t") {
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

export function showWords(): void {
  $("#words").empty();

  let wordsHTML = "";
  if (Config.mode !== "zen") {
    for (let i = 0; i < TestWords.words.length; i++) {
      wordsHTML += getWordHTML(<string>TestWords.words.get(i));
    }
  } else {
    wordsHTML =
      '<div class="word">word height</div><div class="word active"></div>';
  }

  $("#words").html(wordsHTML);

  $("#wordsWrapper").removeClass("hidden");
  const wordHeight = <number>(
    $(<Element>document.querySelector(".word")).outerHeight(true)
  );
  const wordsHeight = <number>(
    $(<Element>document.querySelector("#words")).outerHeight(true)
  );
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
    $(<Element>document.querySelector(".word")).remove();
  }

  updateActiveElement();
  Caret.updatePosition();
}

export function addWord(word: string): void {
  $("#words").append(getWordHTML(word));
}

export function flipColors(tf: boolean): void {
  if (tf) {
    $("#words").addClass("flipped");
  } else {
    $("#words").removeClass("flipped");
  }
}

export function colorful(tc: boolean): void {
  if (tc) {
    $("#words").addClass("colorfulMode");
  } else {
    $("#words").removeClass("colorfulMode");
  }
}

export async function screenshot(): Promise<void> {
  let revealReplay = false;
  function revertScreenshot(): void {
    $("#notificationCenter").removeClass("hidden");
    $("#commandLineMobileButton").removeClass("hidden");
    $(".pageTest .ssWatermark").addClass("hidden");
    $(".pageTest .ssWatermark").text("monkeytype.com");
    $(".pageTest .buttons").removeClass("hidden");
    if (revealReplay) $("#resultReplay").removeClass("hidden");
    if (firebase.auth().currentUser == null) {
      $(".pageTest .loginTip").removeClass("hidden");
    }
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
  const src = $("#middle");
  const sourceX = src.position().left; /*X position from div#target*/
  const sourceY = src.position().top; /*Y position from div#target*/
  const sourceWidth = <number>(
    src.outerWidth(true)
  ); /*clientWidth/offsetWidth from div#target*/
  const sourceHeight = <number>(
    src.outerHeight(true)
  ); /*clientHeight/offsetHeight from div#target*/
  $("#notificationCenter").addClass("hidden");
  $("#commandLineMobileButton").addClass("hidden");
  $(".pageTest .loginTip").addClass("hidden");
  try {
    const paddingX = 50;
    const paddingY = 25;
    html2canvas(document.body, {
      backgroundColor: await ThemeColors.get("bg"),
      width: sourceWidth + paddingX * 2,
      height: sourceHeight + paddingY * 2,
      x: sourceX - paddingX,
      y: sourceY - paddingY,
    }).then((canvas) => {
      canvas.toBlob((blob) => {
        try {
          if (blob === null) return;
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
        } catch (e: any) {
          Notifications.add(
            "Error saving image to clipboard: " + e.message,
            -1
          );
          revertScreenshot();
        }
      });
    });
  } catch (e: any) {
    Notifications.add("Error creating image: " + e.message, -1);
    revertScreenshot();
  }
  setTimeout(() => {
    revertScreenshot();
  }, 3000);
}

export function updateWordElement(showError = !Config.blindMode): void {
  const input = TestInput.input.current;
  const wordAtIndex = <Element>document.querySelector("#words .word.active");
  const currentWord = TestWords.words.getCurrent();
  if (!currentWord && Config.mode !== "zen") return;

  let ret = "";

  let newlineafter = false;

  if (Config.mode === "zen") {
    for (let i = 0; i < TestInput.input.current.length; i++) {
      if (TestInput.input.current[i] === "\t") {
        ret += `<letter class='tabChar correct' style="opacity: 0"><i class="fas fa-long-arrow-alt-right"></i></letter>`;
      } else if (TestInput.input.current[i] === "\n") {
        newlineafter = true;
        ret += `<letter class='nlChar correct' style="opacity: 0"><i class="fas fa-angle-down"></i></letter>`;
      } else {
        ret += `<letter class="correct">${TestInput.input.current[i]}</letter>`;
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
      const charCorrect = currentWord[i] == input[i];

      let correctClass = "correct";
      if (Config.highlightMode == "off") {
        correctClass = "";
      }

      let currentLetter = currentWord[i];
      let tabChar = "";
      let nlChar = "";
      if (Config.funbox === "arrows") {
        if (currentLetter === "↑") {
          currentLetter = `<i class="fas fa-arrow-up"></i>`;
        }
        if (currentLetter === "↓") {
          currentLetter = `<i class="fas fa-arrow-down"></i>`;
        }
        if (currentLetter === "←") {
          currentLetter = `<i class="fas fa-arrow-left"></i>`;
        }
        if (currentLetter === "→") {
          currentLetter = `<i class="fas fa-arrow-right"></i>`;
        }
      } else if (currentLetter === "\t") {
        tabChar = "tabChar";
        currentLetter = `<i class="fas fa-long-arrow-alt-right"></i>`;
      } else if (currentLetter === "\n") {
        nlChar = "nlChar";
        currentLetter = `<i class="fas fa-angle-down"></i>`;
      }

      if (
        Misc.trailingComposeChars.test(input) &&
        i > input.search(Misc.trailingComposeChars)
      ) {
        continue;
      }

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
          (Config.indicateTypos === "replace"
            ? input[i] == " "
              ? "_"
              : input[i]
            : currentLetter) +
          (Config.indicateTypos === "below" ? `<hint>${input[i]}</hint>` : "") +
          "</letter>";
      }
    }

    const inputWithSingleComposeLength = Misc.trailingComposeChars.test(input)
      ? input.search(Misc.trailingComposeChars) + 1
      : input.length;
    if (inputWithSingleComposeLength < currentWord.length) {
      for (let i = inputWithSingleComposeLength; i < currentWord.length; i++) {
        if (Config.funbox === "arrows") {
          if (currentWord[i] === "↑") {
            ret += `<letter><i class="fas fa-arrow-up"></i></letter>`;
          }
          if (currentWord[i] === "↓") {
            ret += `<letter><i class="fas fa-arrow-down"></i></letter>`;
          }
          if (currentWord[i] === "←") {
            ret += `<letter><i class="fas fa-arrow-left"></i></letter>`;
          }
          if (currentWord[i] === "→") {
            ret += `<letter><i class="fas fa-arrow-right"></i></letter>`;
          }
        } else if (currentWord[i] === "\t") {
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

export function lineJump(currentTop: number): void {
  //last word of the line
  if (currentTestLine > 0) {
    const hideBound = currentTop;

    const toHide: JQuery<HTMLElement>[] = [];
    const wordElements = $("#words .word");
    for (let i = 0; i < currentWordElementIndex; i++) {
      if ($(wordElements[i]).hasClass("hidden")) continue;
      const forWordTop = Math.floor(wordElements[i].offsetTop);
      if (forWordTop < hideBound - 10) {
        toHide.push($($("#words .word")[i]));
      }
    }
    const wordHeight = <number>(
      $(<Element>document.querySelector(".word")).outerHeight(true)
    );
    if (Config.smoothLineScroll && toHide.length > 0) {
      lineTransition = true;
      $("#words").prepend(
        `<div class="smoothScroller" style="position: fixed;height:${wordHeight}px;width:100%"></div>`
      );
      $("#words .smoothScroller").animate(
        {
          height: 0,
        },
        SlowTimer.get() ? 0 : 125,
        () => {
          $("#words .smoothScroller").remove();
        }
      );
      $("#paceCaret").animate(
        {
          top:
            (<HTMLElement>document.querySelector("#paceCaret"))?.offsetTop -
            wordHeight,
        },
        SlowTimer.get() ? 0 : 125
      );
      $("#words").animate(
        {
          marginTop: `-${wordHeight}px`,
        },
        SlowTimer.get() ? 0 : 125,
        () => {
          activeWordTop = (<HTMLElement>(
            document.querySelector("#words .active")
          )).offsetTop;

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
        top:
          (<HTMLElement>document.querySelector("#paceCaret")).offsetTop -
          wordHeight,
      });
    }
  }
  currentTestLine++;
}

export function arrangeCharactersRightToLeft(): void {
  $("#words").addClass("rightToLeftTest");
  $("#resultWordsHistory .words").addClass("rightToLeftTest");
  $("#resultReplay .words").addClass("rightToLeftTest");
}

export function arrangeCharactersLeftToRight(): void {
  $("#words").removeClass("rightToLeftTest");
  $("#resultWordsHistory .words").removeClass("rightToLeftTest");
  $("#resultReplay .words").removeClass("rightToLeftTest");
}

async function loadWordsHistory(): Promise<boolean> {
  $("#resultWordsHistory .words").empty();
  let wordsHTML = "";
  for (let i = 0; i < TestInput.input.history.length + 2; i++) {
    const input = <string>TestInput.input.getHistory(i);
    const word = TestWords.words.get(i);
    let wordEl = "";
    try {
      if (input === "") throw new Error("empty input word");
      if (
        TestInput.corrected.getHistory(i) !== undefined &&
        TestInput.corrected.getHistory(i) !== ""
      ) {
        wordEl = `<div class='word' burst="${
          TestInput.burstHistory[i]
        }" input="${TestInput.corrected
          .getHistory(i)
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      } else {
        wordEl = `<div class='word' burst="${
          TestInput.burstHistory[i]
        }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
      }
      if (i === TestInput.input.history.length - 1) {
        //last word
        const wordstats = {
          correct: 0,
          incorrect: 0,
          missed: 0,
        };
        const length = Config.mode == "zen" ? input.length : word.length;
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
              TestInput.burstHistory[i]
            }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
          }
        }
      } else {
        if (Config.mode != "zen" && input !== word) {
          wordEl = `<div class='word error' burst="${
            TestInput.burstHistory[i]
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
          correctedChar = TestInput.corrected.getHistory(i)[c];
        } catch (e) {
          correctedChar = undefined;
        }
        let extraCorrected = "";
        if (
          c + 1 === loop &&
          TestInput.corrected.getHistory(i) !== undefined &&
          TestInput.corrected.getHistory(i).length > input.length
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
            if (input[c] === TestInput.input.current) {
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

export function toggleResultWords(): void {
  if (resultVisible) {
    if ($("#resultWordsHistory").stop(true, true).hasClass("hidden")) {
      //show

      if (!$("#showWordHistoryButton").hasClass("loaded")) {
        $("#words").html(
          `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
        );
        loadWordsHistory().then(() => {
          if (Config.burstHeatmap) {
            applyBurstHeatmap();
          }
          $("#resultWordsHistory")
            .removeClass("hidden")
            .css("display", "none")
            .slideDown(250, () => {
              if (Config.burstHeatmap) {
                applyBurstHeatmap();
              }
            });
        });
      } else {
        if (Config.burstHeatmap) {
          applyBurstHeatmap();
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

export function applyBurstHeatmap(): void {
  if (Config.burstHeatmap) {
    $("#resultWordsHistory .heatmapLegend").removeClass("hidden");

    let burstlist = [...TestInput.burstHistory];

    burstlist = burstlist.filter((x) => x !== Infinity);
    burstlist = burstlist.filter((x) => x < 350);

    if (
      TestInput.input.getHistory(TestInput.input.getHistory().length - 1)
        ?.length !== TestWords.words.getCurrent()?.length
    ) {
      burstlist = burstlist.splice(0, burstlist.length - 1);
    }

    const median = Misc.median(burstlist);
    const adatm: number[] = [];
    burstlist.forEach((burst) => {
      adatm.push(Math.abs(median - burst));
    });
    const step = Misc.mean(adatm);
    const steps = [
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
    $("#resultWordsHistory .words .word").each((_, word) => {
      const wordBurstVal = parseInt(<string>$(word).attr("burst"));
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

export function highlightBadWord(index: number, showError: boolean): void {
  if (!showError) return;
  $($("#words .word")[index]).addClass("error");
}

$(document.body).on("click", "#saveScreenshotButton", () => {
  screenshot();
});

$(document).on("click", "#testModesNotice .text-button.blind", () => {
  UpdateConfig.setBlindMode(!Config.blindMode);
});

$(".pageTest #copyWordsListButton").on("click", async () => {
  try {
    let words;
    if (Config.mode == "zen") {
      words = TestInput.input.history.join(" ");
    } else {
      words = (<string[]>TestWords.words.get())
        .slice(0, TestInput.input.history.length)
        .join(" ");
    }
    await navigator.clipboard.writeText(words);
    Notifications.add("Copied to clipboard", 0, 2);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

$(".pageTest #toggleBurstHeatmap").on("click", async () => {
  UpdateConfig.setBurstHeatmap(!Config.burstHeatmap);
});

$(document).on("mouseleave", "#resultWordsHistory .words .word", () => {
  $(".wordInputAfter").remove();
});

$("#wpmChart").on("mouseleave", () => {
  $(".wordInputAfter").remove();
});

$(document).on("mouseenter", "#resultWordsHistory .words .word", (e) => {
  if (resultVisible) {
    const input = $(e.currentTarget).attr("input");
    const burst = parseInt(<string>$(e.currentTarget).attr("burst"));
    if (input != undefined) {
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
          ${Math.round(Config.alwaysShowCPM ? burst * 5 : burst)}${
          Config.alwaysShowCPM ? "cpm" : "wpm"
        }
          </div>
          </div>`
      );
    }
  }
});

$("#wordsInput").on("focus", () => {
  if (!resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show();
});

$("#wordsInput").on("focusout", () => {
  if (!resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.show();
  }
  Caret.hide();
});

$(document).on("keypress", "#showWordHistoryButton", (event) => {
  if (event.key === "Enter") {
    toggleResultWords();
  }
});

$(document.body).on("click", "#showWordHistoryButton", () => {
  toggleResultWords();
});

$("#wordsWrapper").on("click", () => {
  focusWords();
});
