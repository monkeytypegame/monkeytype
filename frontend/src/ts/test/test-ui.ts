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
import * as Misc from "../utils/misc";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as SlowTimer from "../states/slow-timer";
import * as CompositionState from "../states/composition";
import * as ConfigEvent from "../observables/config-event";
import * as Hangul from "hangul-js";
import format from "date-fns/format";
import { Auth } from "../firebase";
import { skipXpBreakdown } from "../elements/account-button";
import * as FunboxList from "./funbox/funbox-list";
import { debounce } from "throttle-debounce";
import * as ResultWordHighlight from "../elements/result-word-highlight";

const debouncedZipfCheck = debounce(250, () => {
  Misc.checkIfLanguageSupportsZipf(Config.language).then((supports) => {
    if (supports === "no") {
      Notifications.add(
        `${Misc.capitalizeFirstLetter(
          Config.language.replace(/_/g, " ")
        )} does not support Zipf funbox, because the list is not ordered by frequency. Please try another word list.`,
        0,
        {
          duration: 7,
        }
      );
    }
    if (supports === "unknown") {
      Notifications.add(
        `${Misc.capitalizeFirstLetter(
          Config.language.replace(/_/g, " ")
        )} may not support Zipf funbox, because we don't know if it's ordered by frequency or not. If you would like to add this label, please contact us.`,
        0,
        {
          duration: 7,
        }
      );
    }
  });
});

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (
    (eventKey === "language" || eventKey === "funbox") &&
    Config.funbox.split("#").includes("zipf")
  ) {
    debouncedZipfCheck();
  }
  if (eventKey === "fontSize" && !nosave) {
    setTimeout(() => {
      updateWordsHeight(true);
      updateWordsInputPosition(true);
    }, 0);
  }

  if (eventKey === "theme") applyBurstHeatmap();

  if (eventValue === undefined) return;
  if (eventKey === "highlightMode") {
    highlightMode(eventValue as MonkeyTypes.HighlightMode);
    updateActiveElement();
  }

  if (typeof eventValue !== "boolean") return;
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

export function updateActiveElement(
  backspace?: boolean,
  initial = false
): void {
  const active = document.querySelector("#words .active");
  if (Config.mode === "zen" && backspace) {
    active?.remove();
  } else if (active !== null) {
    if (Config.highlightMode === "word") {
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
    if (Config.highlightMode === "word") {
      activeWord.querySelectorAll("letter").forEach((e) => {
        e.classList.add("correct");
      });
    }
  } catch (e) {}
  if (!initial && shouldUpdateWordsInputPosition()) {
    updateWordsInputPosition();
  }
}

function getWordHTML(word: string): string {
  let newlineafter = false;
  let retval = `<div class='word'>`;
  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.getWordHtml
  );
  for (let c = 0; c < word.length; c++) {
    if (funbox?.functions?.getWordHtml) {
      retval += funbox.functions.getWordHtml(word.charAt(c), true);
    } else if (word.charAt(c) === "\t") {
      retval += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
    } else if (word.charAt(c) === "\n") {
      newlineafter = true;
      retval += `<letter class='nlChar'><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
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

  if (Config.tapeMode !== "off") {
    $("#words").addClass("tape");
    $("#wordsWrapper").addClass("tape");
  } else {
    $("#words").removeClass("tape");
    $("#wordsWrapper").removeClass("tape");
  }

  if (Config.indicateTypos === "below") {
    $("#words").addClass("indicateTyposBelow");
    $("#wordsWrapper").addClass("indicateTyposBelow");
  } else {
    $("#words").removeClass("indicateTyposBelow");
    $("#wordsWrapper").removeClass("indicateTyposBelow");
  }

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

  updateWordsHeight(true);
  updateActiveElement(undefined, true);
  Caret.updatePosition();
  updateWordsInputPosition(true);
}

const posUpdateLangList = ["japanese", "chinese", "korean"];
function shouldUpdateWordsInputPosition(): boolean {
  const language = posUpdateLangList.some((l) => Config.language.startsWith(l));
  return language || (Config.mode !== "time" && Config.showAllLines);
}

export function updateWordsInputPosition(initial = false): void {
  if (Config.tapeMode !== "off" && !initial) return;
  const el = document.querySelector("#wordsInput") as HTMLElement;
  const activeWord = document.querySelector(
    "#words .active"
  ) as HTMLElement | null;

  if (!activeWord) {
    el.style.top = "0px";
    el.style.left = "0px";
    return;
  }

  const computed = window.getComputedStyle(activeWord);
  const activeWordMargin =
    parseInt(computed.marginTop) + parseInt(computed.marginBottom);

  const wordsWrapperTop =
    (document.querySelector("#wordsWrapper") as HTMLElement | null)
      ?.offsetTop || 0;

  if (Config.tapeMode !== "off") {
    el.style.top =
      wordsWrapperTop +
      activeWord.offsetHeight +
      activeWordMargin * 0.25 +
      -el.offsetHeight +
      "px";
    el.style.left = activeWord.offsetLeft + "px";
    return;
  }

  if (
    initial &&
    !posUpdateLangList.some((l) => Config.language.startsWith(l))
  ) {
    el.style.left = "0px";
    el.style.top =
      wordsWrapperTop +
      activeWord.offsetHeight * 2 +
      activeWordMargin * 1.5 +
      -el.offsetHeight +
      "px";
  } else {
    el.style.left = activeWord.offsetLeft + "px";
    el.style.top =
      activeWord.offsetTop -
      activeWordMargin +
      wordsWrapperTop +
      activeWord.offsetHeight +
      activeWordMargin +
      -el.offsetHeight +
      "px";
  }
}

function updateWordsHeight(force = false): void {
  if (!force && Config.mode !== "custom") return;
  $("#wordsWrapper").removeClass("hidden");
  const wordHeight = <number>(
    $(<Element>document.querySelector(".word")).outerHeight(true)
  );
  const wordsHeight = <number>(
    $(<Element>document.querySelector("#words")).outerHeight(true)
  );
  if (
    Config.showAllLines &&
    Config.mode !== "time" &&
    !(CustomText.isWordRandom && CustomText.word === 0) &&
    !CustomText.isTimeRandom
  ) {
    $("#words")
      .css("height", "auto")
      .css("overflow", "hidden")
      .css("width", "100%")
      .css("margin-left", "unset");
    $("#wordsWrapper").css("height", "auto").css("overflow", "hidden");

    let nh = wordHeight * 3;

    if (nh > wordsHeight) {
      nh = wordsHeight;
    }
    $(".outOfFocusWarning").css("line-height", nh + "px");
  } else {
    let finalWordsHeight: number, finalWrapperHeight: number;

    if (Config.tapeMode !== "off") {
      finalWordsHeight = wordHeight * 2;
      finalWrapperHeight = wordHeight;
    } else {
      let lines = 0;
      let lastHeight = 0;
      let wordIndex = 0;
      const words = document.querySelectorAll("#words .word");
      let wrapperHeight = 0;

      const wordComputedStyle = window.getComputedStyle(words[0]);
      const wordTopMargin = parseInt(wordComputedStyle.marginTop);
      const wordBottomMargin = parseInt(wordComputedStyle.marginBottom);

      while (lines < 3) {
        const word = words[wordIndex] as HTMLElement | null;
        if (!word) break;
        const height = word.offsetTop;
        if (height > lastHeight) {
          lines++;
          wrapperHeight += word.offsetHeight + wordTopMargin + wordBottomMargin;
          lastHeight = height;
        }
        wordIndex++;
      }

      if (lines < 3) wrapperHeight = wrapperHeight * (3 / lines);

      const wordsHeight = (wrapperHeight / 3) * 4;

      finalWordsHeight = wordsHeight;
      finalWrapperHeight = wrapperHeight;
    }

    $("#words")
      .css("height", finalWordsHeight + "px")
      .css("overflow", "hidden");

    if (Config.tapeMode !== "off") {
      $("#words").css("width", "200%").css("margin-left", "50%");
    } else {
      $("#words").css("width", "100%").css("margin-left", "unset");
    }

    $("#wordsWrapper")
      .css("height", finalWrapperHeight + "px")
      .css("overflow", "hidden");
    $(".outOfFocusWarning").css("line-height", finalWrapperHeight + "px");
  }

  if (Config.mode === "zen") {
    $(<Element>document.querySelector(".word")).remove();
  }
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

let firefoxClipboardNotificatoinShown = false;
export async function screenshot(): Promise<void> {
  let revealReplay = false;

  let revertCookie = false;
  if (
    Misc.isElementVisible("#cookiePopupWrapper") ||
    document.contains(document.querySelector("#cookiePopupWrapper"))
  ) {
    revertCookie = true;
  }

  function revertScreenshot(): void {
    $("#ad-result-wrapper").removeClass("hidden");
    $("#ad-result-small-wrapper").removeClass("hidden");
    $("#testConfig").removeClass("hidden");
    $(".pageTest .screenshotSpacer").remove();
    $("#notificationCenter").removeClass("hidden");
    $("#commandLineMobileButton").removeClass("hidden");
    $(".pageTest .ssWatermark").addClass("hidden");
    $(".pageTest .ssWatermark").text("monkeytype.com");
    $(".pageTest .buttons").removeClass("hidden");
    $("noscript").removeClass("hidden");
    $("#nocss").removeClass("hidden");
    $("#top, #bottom").removeClass("invisible");
    $("#result").removeClass("noBalloons");
    if (revertCookie) $("#cookiePopupWrapper").removeClass("hidden");
    if (revealReplay) $("#resultReplay").removeClass("hidden");
    if (!Auth?.currentUser) {
      $(".pageTest .loginTip").removeClass("hidden");
    }
    (document.querySelector("html") as HTMLElement).style.scrollBehavior =
      "smooth";
  }

  if (!$("#resultReplay").hasClass("hidden")) {
    revealReplay = true;
    Replay.pauseReplay();
  }
  const dateNow = new Date(Date.now());
  $("#resultReplay").addClass("hidden");
  $(".pageTest .ssWatermark").removeClass("hidden");
  $(".pageTest .ssWatermark").text(
    format(dateNow, "dd MMM yyyy HH:mm") + " | monkeytype.com "
  );
  if (Auth?.currentUser) {
    $(".pageTest .ssWatermark").text(
      DB.getSnapshot()?.name +
        " | " +
        format(dateNow, "dd MMM yyyy HH:mm") +
        " | monkeytype.com  "
    );
  }
  $(".pageTest .buttons").addClass("hidden");
  $("#notificationCenter").addClass("hidden");
  $("#commandLineMobileButton").addClass("hidden");
  $(".pageTest .loginTip").addClass("hidden");
  $("noscript").addClass("hidden");
  $("#nocss").addClass("hidden");
  $("#ad-result-wrapper").addClass("hidden");
  $("#ad-result-small-wrapper").addClass("hidden");
  $("#testConfig").addClass("hidden");
  $(".page.pageTest").prepend("<div class='screenshotSpacer'></div>");
  $("#top, #bottom").addClass("invisible");
  $("#result").addClass("noBalloons");
  if (revertCookie) $("#cookiePopupWrapper").addClass("hidden");

  (document.querySelector("html") as HTMLElement).style.scrollBehavior = "auto";
  window.scrollTo({
    top: 0,
  });
  const src = $("#result");
  const sourceX = src.offset()?.left ?? 0; /*X position from div#target*/
  const sourceY = src.offset()?.top ?? 0; /*Y position from div#target*/
  const sourceWidth = <number>(
    src.outerWidth(true)
  ); /*clientWidth/offsetWidth from div#target*/
  const sourceHeight = <number>(
    src.outerHeight(true)
  ); /*clientHeight/offsetHeight from div#target*/
  try {
    const paddingX = Misc.convertRemToPixels(2);
    const paddingY = Misc.convertRemToPixels(2);
    const canvas = await html2canvas(document.body, {
      backgroundColor: await ThemeColors.get("bg"),
      width: sourceWidth + paddingX * 2,
      height: sourceHeight + paddingY * 2,
      x: sourceX - paddingX,
      y: sourceY - paddingY,
    });
    canvas.toBlob(async (blob) => {
      try {
        if (blob === null) {
          throw new Error("Could not create image, blob is null");
        }
        const clipItem = new ClipboardItem(
          Object.defineProperty({}, blob.type, {
            value: blob,
            enumerable: true,
          })
        );
        await navigator.clipboard.write([clipItem]);
        Notifications.add("Copied to clipboard", 1, {
          duration: 2,
        });
      } catch (e) {
        console.error("Error while saving image to clipboard", e);
        if (blob) {
          //check if on firefox
          if (
            navigator.userAgent.toLowerCase().indexOf("firefox") > -1 &&
            !firefoxClipboardNotificatoinShown
          ) {
            firefoxClipboardNotificatoinShown = true;
            Notifications.add(
              "On Firefox you can enable the asyncClipboard.clipboardItem permission in about:config to enable copying straight to the clipboard",
              0,
              {
                duration: 10,
              }
            );
          }

          Notifications.add(
            "Could not save image to clipboard. Opening in new tab instead (make sure popups are allowed)",
            0,
            {
              duration: 5,
            }
          );
          open(URL.createObjectURL(blob));
        } else {
          Notifications.add(
            Misc.createErrorMessage(e, "Error saving image to clipboard"),
            -1
          );
        }
      }
      revertScreenshot();
    });
  } catch (e) {
    Notifications.add(Misc.createErrorMessage(e, "Error creating image"), -1);
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
        ret += `<letter class='tabChar correct' style="opacity: 0"><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
      } else if (TestInput.input.current[i] === "\n") {
        newlineafter = true;
        ret += `<letter class='nlChar correct' style="opacity: 0"><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
      } else {
        ret += `<letter class="correct">${TestInput.input.current[i]}</letter>`;
      }
    }
  } else {
    let correctSoFar = false;

    const containsKorean = TestInput.input.getKoreanStatus();

    if (!containsKorean) {
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
    } else {
      // slice earlier if input has trailing compose characters
      const koCurrentWord: string = Hangul.disassemble(currentWord).join("");
      const koInput: string = Hangul.disassemble(input).join("");
      const inputWithoutComposeLength: number = Misc.trailingComposeChars.test(
        input
      )
        ? input.search(Misc.trailingComposeChars)
        : koInput.length;
      if (
        input.search(Misc.trailingComposeChars) <
          Hangul.d(koCurrentWord).length &&
        koCurrentWord.slice(0, inputWithoutComposeLength) ===
          koInput.slice(0, inputWithoutComposeLength)
      ) {
        correctSoFar = true;
      }
    }

    let wordHighlightClassString = correctSoFar ? "correct" : "incorrect";

    if (Config.blindMode) {
      wordHighlightClassString = "correct";
    }

    const funbox = FunboxList.get(Config.funbox).find(
      (f) => f.functions?.getWordHtml
    );
    for (let i = 0; i < input.length; i++) {
      const charCorrect = currentWord[i] === input[i];

      let correctClass = "correct";
      if (Config.highlightMode === "off") {
        correctClass = "";
      }

      let currentLetter = currentWord[i];
      let tabChar = "";
      let nlChar = "";
      if (funbox?.functions?.getWordHtml) {
        const cl = funbox.functions.getWordHtml(currentLetter);
        if (cl !== "") {
          currentLetter = cl;
        }
      } else if (currentLetter === "\t") {
        tabChar = "tabChar";
        currentLetter = `<i class="fas fa-long-arrow-alt-right fa-fw"></i>`;
      } else if (currentLetter === "\n") {
        nlChar = "nlChar";
        currentLetter = `<i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i>`;
      }

      if (charCorrect) {
        ret += `<letter class="${
          Config.highlightMode === "word"
            ? wordHighlightClassString
            : correctClass
        } ${tabChar}${nlChar}">${currentLetter}</letter>`;
      } else if (
        currentLetter !== undefined &&
        CompositionState.getComposing() &&
        i >= CompositionState.getStartPos() &&
        !(containsKorean && !correctSoFar)
      ) {
        ret += `<letter class="${
          Config.highlightMode === "word" ? wordHighlightClassString : ""
        } dead">${currentLetter}</letter>`;
      } else if (!showError) {
        if (currentLetter !== undefined) {
          ret += `<letter class="${
            Config.highlightMode === "word"
              ? wordHighlightClassString
              : correctClass
          } ${tabChar}${nlChar}">${currentLetter}</letter>`;
        }
      } else if (currentLetter === undefined) {
        if (!Config.hideExtraLetters) {
          let letter = input[i];
          if (letter === " " || letter === "\t" || letter === "\n") {
            letter = "_";
          }
          ret += `<letter class="${
            Config.highlightMode === "word"
              ? wordHighlightClassString
              : "incorrect"
          } extra ${tabChar}${nlChar}">${letter}</letter>`;
        }
      } else {
        ret +=
          `<letter class="${
            Config.highlightMode === "word"
              ? wordHighlightClassString
              : "incorrect"
          } ${tabChar}${nlChar}">` +
          (Config.indicateTypos === "replace"
            ? input[i] === " "
              ? "_"
              : input[i]
            : currentLetter) +
          (Config.indicateTypos === "below" ? `<hint>${input[i]}</hint>` : "") +
          "</letter>";
      }
    }

    for (let i = input.length; i < currentWord.length; i++) {
      if (funbox?.functions?.getWordHtml) {
        ret += funbox.functions.getWordHtml(currentWord[i], true);
      } else if (currentWord[i] === "\t") {
        ret += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
      } else if (currentWord[i] === "\n") {
        ret += `<letter class='nlChar'><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
      } else {
        ret +=
          `<letter class="${
            Config.highlightMode === "word" ? wordHighlightClassString : ""
          }">` +
          currentWord[i] +
          "</letter>";
      }
    }

    if (Config.highlightMode === "letter" && Config.hideExtraLetters) {
      if (input.length > currentWord.length && !Config.blindMode) {
        wordAtIndex.classList.add("error");
      } else if (input.length === currentWord.length) {
        wordAtIndex.classList.remove("error");
      }
    }
  }
  wordAtIndex.innerHTML = ret;
  if (newlineafter) $("#words").append("<div class='newline'></div>");
}

export function scrollTape(): void {
  const wordsWrapperWidth = (<HTMLElement>(
    document.querySelector("#wordsWrapper")
  )).offsetWidth;
  let fullWordsWidth = 0;
  const toHide: JQuery<HTMLElement>[] = [];
  let widthToHide = 0;
  if (currentWordElementIndex > 0) {
    for (let i = 0; i < currentWordElementIndex; i++) {
      const word = <HTMLElement>document.querySelectorAll("#words .word")[i];
      fullWordsWidth += $(word).outerWidth(true) ?? 0;
      const forWordLeft = Math.floor(word.offsetLeft);
      const forWordWidth = Math.floor(word.offsetWidth);
      if (forWordLeft < 0 - forWordWidth) {
        const toPush = $($("#words .word")[i]);
        toHide.push(toPush);
        widthToHide += toPush.outerWidth(true) ?? 0;
      }
    }
    if (toHide.length > 0) {
      currentWordElementIndex -= toHide.length;
      toHide.forEach((e) => e.remove());
      fullWordsWidth -= widthToHide;
      const currentMargin = parseInt($("#words").css("margin-left"), 10);
      $("#words").css("margin-left", `${currentMargin + widthToHide}px`);
    }
  }
  let currentWordWidth = 0;
  if (Config.tapeMode === "letter") {
    if (TestInput.input.current.length > 0) {
      for (let i = 0; i < TestInput.input.current.length; i++) {
        const words = document.querySelectorAll("#words .word");
        currentWordWidth +=
          $(
            words[currentWordElementIndex].querySelectorAll("letter")[i]
          ).outerWidth(true) ?? 0;
      }
    }
  }
  const newMargin = wordsWrapperWidth / 2 - (fullWordsWidth + currentWordWidth);
  if (Config.smoothLineScroll) {
    $("#words")
      .stop(true, false)
      .animate(
        {
          marginLeft: newMargin,
        },
        SlowTimer.get() ? 0 : 125
      );
  } else {
    $("#words").css("margin-left", `${newMargin}px`);
  }
}

let currentLinesAnimating = 0;

export function lineJump(currentTop: number): void {
  //last word of the line
  if (
    (Config.tapeMode === "off" && currentTestLine > 0) ||
    (Config.tapeMode !== "off" && currentTestLine >= 0)
  ) {
    const hideBound = currentTop;

    const toHide: JQuery<HTMLElement>[] = [];
    const wordElements = $("#words .word");
    for (let i = 0; i < currentWordElementIndex; i++) {
      if ($(wordElements[i]).hasClass("hidden")) continue;
      const forWordTop = Math.floor(wordElements[i].offsetTop);
      if (
        forWordTop <
        (Config.tapeMode === "off" ? hideBound - 10 : hideBound + 10)
      ) {
        toHide.push($($("#words .word")[i]));
      }
    }
    const wordHeight = <number>(
      $(<Element>document.querySelector(".word")).outerHeight(true)
    );
    if (Config.smoothLineScroll && toHide.length > 0) {
      lineTransition = true;
      const smoothScroller = $("#words .smoothScroller");
      if (smoothScroller.length === 0) {
        $("#words").prepend(
          `<div class="smoothScroller" style="position: fixed;height:${wordHeight}px;width:100%"></div>`
        );
      } else {
        smoothScroller.css(
          "height",
          `${(smoothScroller.outerHeight(true) ?? 0) + wordHeight}px`
        );
      }
      $("#words .smoothScroller")
        .stop(true, false)
        .animate(
          {
            height: 0,
          },
          SlowTimer.get() ? 0 : 125,
          () => {
            $("#words .smoothScroller").remove();
          }
        );
      $("#paceCaret")
        .stop(true, false)
        .animate(
          {
            top:
              (<HTMLElement>document.querySelector("#paceCaret"))?.offsetTop -
              wordHeight,
          },
          SlowTimer.get() ? 0 : 125
        );

      const newCss: { [key: string]: string } = {
        marginTop: `-${wordHeight * (currentLinesAnimating + 1)}px`,
      };

      if (Config.tapeMode !== "off") {
        const wordsWrapperWidth = (<HTMLElement>(
          document.querySelector("#wordsWrapper")
        )).offsetWidth;
        const newMargin = wordsWrapperWidth / 2;
        newCss["marginLeft"] = `${newMargin}px`;
      }
      currentLinesAnimating++;
      $("#words")
        .stop(true, false)
        .animate(newCss, SlowTimer.get() ? 0 : 125, () => {
          currentLinesAnimating = 0;
          activeWordTop = (<HTMLElement>(
            document.querySelector("#words .active")
          )).offsetTop;

          currentWordElementIndex -= toHide.length;
          lineTransition = false;
          toHide.forEach((el) => el.remove());
          $("#words").css("marginTop", "0");
        });
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
  updateWordsHeight();
}

export function setRightToLeft(isEnabled: boolean): void {
  if (isEnabled) {
    $("#words").addClass("rightToLeftTest");
    $("#resultWordsHistory .words").addClass("rightToLeftTest");
    $("#resultReplay .words").addClass("rightToLeftTest");
  } else {
    $("#words").removeClass("rightToLeftTest");
    $("#resultWordsHistory .words").removeClass("rightToLeftTest");
    $("#resultReplay .words").removeClass("rightToLeftTest");
  }
}

export function setLigatures(isEnabled: boolean): void {
  if (isEnabled) {
    $("#words").addClass("withLigatures");
    $("#resultWordsHistory .words").addClass("withLigatures");
    $("#resultReplay .words").addClass("withLigatures");
  } else {
    $("#words").removeClass("withLigatures");
    $("#resultWordsHistory .words").removeClass("withLigatures");
    $("#resultReplay .words").removeClass("withLigatures");
  }
}

async function loadWordsHistory(): Promise<boolean> {
  $("#resultWordsHistory .words").empty();
  let wordsHTML = "";
  for (let i = 0; i < TestInput.input.history.length + 2; i++) {
    const input = <string>TestInput.input.getHistory(i);
    const word = TestWords.words.get(i);
    const containsKorean =
      input?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      ) ||
      word?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      );
    let wordEl = "";
    try {
      if (input === "") throw new Error("empty input word");
      if (
        TestInput.corrected.getHistory(i) !== undefined &&
        TestInput.corrected.getHistory(i) !== ""
      ) {
        const correctedChar = !containsKorean
          ? TestInput.corrected.getHistory(i)
          : Hangul.assemble(TestInput.corrected.getHistory(i).split(""));
        wordEl = `<div class='word nocursor' burst="${
          TestInput.burstHistory[i]
        }" input="${correctedChar
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      } else {
        wordEl = `<div class='word nocursor' burst="${
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
        const length = Config.mode === "zen" ? input.length : word.length;
        for (let c = 0; c < length; c++) {
          if (c < input.length) {
            //on char that still has a word list pair
            if (Config.mode === "zen" || input[c] === word[c]) {
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
          if (Config.mode !== "zen" && input !== word) {
            wordEl = `<div class='word nocursor error' burst="${
              TestInput.burstHistory[i]
            }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
          }
        }
      } else {
        if (Config.mode !== "zen" && input !== word) {
          wordEl = `<div class='word nocursor error' burst="${
            TestInput.burstHistory[i]
          }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
        }
      }

      let loop;
      if (Config.mode === "zen" || input.length > word.length) {
        //input is longer - extra characters possible (loop over input)
        loop = input.length;
      } else {
        //input is shorter or equal (loop over word list)
        loop = word.length;
      }
      for (let c = 0; c < loop; c++) {
        let correctedChar;
        try {
          correctedChar = !containsKorean
            ? TestInput.corrected.getHistory(i)[c]
            : Hangul.assemble(TestInput.corrected.getHistory(i).split(""))[c];
        } catch (e) {
          correctedChar = undefined;
        }
        let extraCorrected = "";
        const historyWord: string = !containsKorean
          ? TestInput.corrected.getHistory(i)
          : Hangul.assemble(TestInput.corrected.getHistory(i).split(""));
        if (
          c + 1 === loop &&
          historyWord !== undefined &&
          historyWord.length > input.length
        ) {
          extraCorrected = "extraCorrected";
        }
        if (Config.mode === "zen" || word[c] !== undefined) {
          if (Config.mode === "zen" || input[c] === word[c]) {
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

export function toggleResultWords(noAnimation = false): void {
  if (resultVisible) {
    ResultWordHighlight.updateToggleWordsHistoryTime();
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
            .slideDown(noAnimation ? 0 : 250, () => {
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
          .slideDown(noAnimation ? 0 : 250);
      }
    } else {
      //hide

      $("#resultWordsHistory").slideUp(250, () => {
        $("#resultWordsHistory").addClass("hidden");
      });
    }
  }
}

export async function applyBurstHeatmap(): Promise<void> {
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

    const themeColors = await ThemeColors.getAll();

    let colors = [
      themeColors.colorfulError,
      Misc.blendTwoHexColors(themeColors.colorfulError, themeColors.text, 0.5),
      themeColors.text,
      Misc.blendTwoHexColors(themeColors.main, themeColors.text, 0.5),
      themeColors.main,
    ];
    let unreachedColor = themeColors.sub;

    if (themeColors.main === themeColors.text) {
      colors = [
        themeColors.colorfulError,
        Misc.blendTwoHexColors(
          themeColors.colorfulError,
          themeColors.text,
          0.5
        ),
        themeColors.sub,
        Misc.blendTwoHexColors(themeColors.sub, themeColors.text, 0.5),
        themeColors.main,
      ];
      unreachedColor = themeColors.subAlt;
    }

    const steps = [
      {
        val: 0,
        colorId: 0,
      },
      {
        val: median - step * 1.5,
        colorId: 1,
      },
      {
        val: median - step * 0.5,
        colorId: 2,
      },
      {
        val: median + step * 0.5,
        colorId: 3,
      },
      {
        val: median + step * 1.5,
        colorId: 4,
      },
    ];

    steps.forEach((step, index) => {
      let string = "";
      if (index === 0) {
        string = `<${Math.round(steps[index + 1].val)}`;
      } else if (index === 4) {
        string = `${Math.round(step.val - 1)}+`;
      } else {
        string = `${Math.round(step.val)}-${
          Math.round(steps[index + 1].val) - 1
        }`;
      }

      $("#resultWordsHistory .heatmapLegend .box" + index).html(
        `<div>${string}</div>`
      );
    });

    $("#resultWordsHistory .words .word").each((_, word) => {
      const wordBurstAttr = $(word).attr("burst");
      if (wordBurstAttr === undefined) {
        $(word).css("color", unreachedColor);
      } else {
        const wordBurstVal = parseInt(<string>wordBurstAttr);
        steps.forEach((step) => {
          if (wordBurstVal >= step.val) {
            $(word).addClass("heatmapInherit");
            $(word).css("color", colors[step.colorId]);
          }
        });
      }
    });

    $("#resultWordsHistory .heatmapLegend .boxes .box").each((index, box) => {
      $(box).css("background", colors[index]);
    });
  } else {
    $("#resultWordsHistory .heatmapLegend").addClass("hidden");
    $("#resultWordsHistory .words .word").removeClass("heatmapInherit");
    $("#resultWordsHistory .words .word").css("color", "");

    $("#resultWordsHistory .heatmapLegend .boxes .box").css("color", "");
  }
}

export function highlightBadWord(index: number, showError: boolean): void {
  if (!showError) return;
  $($("#words .word")[index]).addClass("error");
}

export function highlightMode(mode?: MonkeyTypes.HighlightMode): void {
  const existing =
    $("#words")
      ?.attr("class")
      ?.split(/\s+/)
      ?.filter((it) => !it.startsWith("highlight-")) || [];
  if (mode != null) {
    existing.push("highlight-" + mode.replaceAll("_", "-"));
  }

  $("#words").attr("class", existing.join(" "));
}

$(".pageTest").on("click", "#saveScreenshotButton", () => {
  screenshot();
});

$("#saveScreenshotButton").on("keypress", (e) => {
  if (e.key === "Enter") {
    screenshot();
  }
});

$(".pageTest #copyWordsListButton").on("click", async () => {
  try {
    let words;
    if (Config.mode === "zen") {
      words = TestInput.input.history.join(" ");
    } else {
      words = (<string[]>TestWords.words.get())
        .slice(0, TestInput.input.history.length)
        .join(" ");
    }
    await navigator.clipboard.writeText(words);
    Notifications.add("Copied to clipboard", 0, {
      duration: 2,
    });
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

$(".pageTest #toggleBurstHeatmap").on("click", async () => {
  UpdateConfig.setBurstHeatmap(!Config.burstHeatmap);
  ResultWordHighlight.destroy();
});

$(".pageTest #resultWordsHistory").on("mouseleave", ".words .word", () => {
  $(".wordInputHighlight").remove();
});

$(".pageTest #result #wpmChart").on("mouseleave", () => {
  ResultWordHighlight.setIsHoverChart(false);
  ResultWordHighlight.clear();
});

$(".pageTest #result #wpmChart").on("mouseenter", () => {
  ResultWordHighlight.setIsHoverChart(true);
});

$(".pageTest #resultWordsHistory").on("mouseenter", ".words .word", (e) => {
  if (resultVisible) {
    const input = $(e.currentTarget).attr("input");
    const burst = parseInt(<string>$(e.currentTarget).attr("burst"));
    if (input !== undefined) {
      $(e.currentTarget).append(
        `<div class="wordInputHighlight withSpeed">
          <div class="text">
          ${input
            .replace(/\t/g, "_")
            .replace(/\n/g, "_")
            .replace(/</g, "&lt")
            .replace(/>/g, "&gt")}
          </div>
          <div class="speed">
          ${Math.round(
            getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(burst)
          )}${Config.typingSpeedUnit}
          </div>
          </div>`
      );
    }
  }
});

addEventListener("resize", () => {
  ResultWordHighlight.destroy();
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

$(".pageTest").on("click", "#showWordHistoryButton", () => {
  toggleResultWords();
});

$("#wordsWrapper").on("click", () => {
  focusWords();
});

$(document).on("keypress", () => {
  if (resultVisible) {
    skipXpBreakdown();
  }
});
