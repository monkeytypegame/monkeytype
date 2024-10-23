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
import * as Strings from "../utils/strings";
import * as JSONData from "../utils/json-data";
import { blendTwoHexColors } from "../utils/colors";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as SlowTimer from "../states/slow-timer";
import * as CompositionState from "../states/composition";
import * as ConfigEvent from "../observables/config-event";
import * as Hangul from "hangul-js";
import { format } from "date-fns/format";
import { isAuthenticated } from "../firebase";
import * as FunboxList from "./funbox/funbox-list";
import { debounce } from "throttle-debounce";
import * as ResultWordHighlight from "../elements/result-word-highlight";
import * as ActivePage from "../states/active-page";
import Format from "../utils/format";
import * as Loader from "../elements/loader";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import {
  TimerColor,
  TimerOpacity,
} from "@monkeytype/contracts/schemas/configs";
import { convertRemToPixels } from "../utils/numbers";

async function gethtml2canvas(): Promise<typeof import("html2canvas").default> {
  return (await import("html2canvas")).default;
}

function createHintsHtml(
  incorrectLtrIndices: number[][],
  activeWordLetters: NodeListOf<Element>,
  inputWord: string
): string {
  const inputChars = Strings.splitIntoCharacters(inputWord);
  let hintsHtml = "";
  for (const adjacentLetters of incorrectLtrIndices) {
    for (const indx of adjacentLetters) {
      const blockLeft = (activeWordLetters[indx] as HTMLElement).offsetLeft;
      const blockWidth = (activeWordLetters[indx] as HTMLElement).offsetWidth;
      const blockIndices = `[${indx}]`;
      const blockChars = inputChars[indx];

      hintsHtml +=
        `<hint data-length=1 data-chars-index=${blockIndices}` +
        ` style="left: ${blockLeft + blockWidth / 2}px;">${blockChars}</hint>`;
    }
  }
  hintsHtml = `<div class="hints">${hintsHtml}</div>`;
  return hintsHtml;
}

async function joinOverlappingHints(
  incorrectLtrIndices: number[][],
  activeWordLetters: NodeListOf<Element>,
  hintElements: HTMLCollection
): Promise<void> {
  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRTL = currentLanguage.rightToLeft;

  let i = 0;
  for (const adjacentLetters of incorrectLtrIndices) {
    for (let j = 0; j < adjacentLetters.length - 1; j++) {
      const block1El = hintElements[i] as HTMLElement;
      const block2El = hintElements[i + 1] as HTMLElement;
      const leftBlock = isLanguageRTL ? block2El : block1El;
      const rightBlock = isLanguageRTL ? block1El : block2El;

      /** HintBlock.offsetLeft is at the center line of corresponding letters
       * then "transform: translate(-50%)" aligns hints with letters */
      if (
        leftBlock.offsetLeft + leftBlock.offsetWidth / 2 >
        rightBlock.offsetLeft - rightBlock.offsetWidth / 2
      ) {
        block1El.dataset["length"] = (
          parseInt(block1El.dataset["length"] ?? "1") +
          parseInt(block2El.dataset["length"] ?? "1")
        ).toString();

        const block1Indices = block1El.dataset["charsIndex"] ?? "[]";
        const block2Indices = block2El.dataset["charsIndex"] ?? "[]";
        block1El.dataset["charsIndex"] =
          block1Indices.slice(0, -1) + "," + block2Indices.slice(1);

        const letter1Index = adjacentLetters[j] ?? 0;
        const newLeft =
          (activeWordLetters[letter1Index] as HTMLElement).offsetLeft +
          (isLanguageRTL
            ? (activeWordLetters[letter1Index] as HTMLElement).offsetWidth
            : 0) +
          (block2El.offsetLeft - block1El.offsetLeft);
        block1El.style.left = newLeft.toString() + "px";

        block1El.insertAdjacentHTML("beforeend", block2El.innerHTML);

        block2El.remove();
        adjacentLetters.splice(j + 1, 1);
        i -= j === 0 ? 1 : 2;
        j -= j === 0 ? 1 : 2;
      }
      i++;
    }
    i++;
  }
}

const debouncedZipfCheck = debounce(250, async () => {
  const supports = await JSONData.checkIfLanguageSupportsZipf(Config.language);
  if (supports === "no") {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language)
      )} does not support Zipf funbox, because the list is not ordered by frequency. Please try another word list.`,
      0,
      {
        duration: 7,
      }
    );
  }
  if (supports === "unknown") {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language)
      )} may not support Zipf funbox, because we don't know if it's ordered by frequency or not. If you would like to add this label, please contact us.`,
      0,
      {
        duration: 7,
      }
    );
  }
});

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (
    (eventKey === "language" || eventKey === "funbox") &&
    Config.funbox.split("#").includes("zipf")
  ) {
    void debouncedZipfCheck();
  }
  if (eventKey === "fontSize" && !nosave) {
    OutOfFocus.hide();
    updateWordsHeight(true);
    void updateWordsInputPosition(true);
  }
  if (
    ["fontSize", "fontFamily", "blindMode", "hideExtraLetters"].includes(
      eventKey
    )
  ) {
    updateHintsPosition().catch((e: unknown) => {
      console.error(e);
    });
  }

  if (eventKey === "theme") void applyBurstHeatmap();

  if (eventValue === undefined) return;
  if (eventKey === "highlightMode") {
    if (ActivePage.get() === "test") updateActiveElement();
  }

  if (
    [
      "highlightMode",
      "blindMode",
      "indicateTypos",
      "tapeMode",
      "hideExtraLetters",
    ].includes(eventKey)
  ) {
    updateWordWrapperClasses();
  }

  if (eventKey === "tapeMode" && !nosave) {
    if (eventValue === "off") {
      $("#words").css("margin-left", "unset");
    } else {
      scrollTape();
    }
  }

  if (typeof eventValue !== "boolean") return;
  if (eventKey === "flipTestColors") flipColors(eventValue);
  if (eventKey === "colorfulMode") colorful(eventValue);
  if (eventKey === "burstHeatmap") void applyBurstHeatmap();
});

export let activeWordElementIndex = 0;
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

export function setActiveWordElementIndex(val: number): void {
  activeWordElementIndex = val;
}

export function setActiveWordTop(val: number): void {
  activeWordTop = val;
}

let restartingResolve: null | ((value?: unknown) => void);
export function setTestRestarting(val: boolean): void {
  testRestarting = val;
  if (val) {
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
  activeWordElementIndex = 0;
}

export function focusWords(): void {
  $("#wordsInput").trigger("focus");
}

export function blurWords(): void {
  $("#wordsInput").trigger("blur");
}

export function updateActiveElement(
  backspace?: boolean,
  initial = false
): void {
  const active = document.querySelector("#words .active");
  if (!backspace) {
    active?.classList.add("typed");
  }
  if (Config.mode === "zen" && backspace) {
    active?.remove();
  } else if (active !== null && !initial) {
    active.classList.remove("active");
  }
  const newActiveWord = document.querySelectorAll("#words .word")[
    activeWordElementIndex
  ] as HTMLElement | undefined;

  if (newActiveWord == undefined) {
    throw new Error("activeWord is undefined - can't update active element");
  }

  newActiveWord.classList.add("active");
  newActiveWord.classList.remove("error");
  newActiveWord.classList.remove("typed");

  activeWordTop = newActiveWord.offsetTop;

  if (!initial && shouldUpdateWordsInputPosition()) {
    void updateWordsInputPosition();
  }
  if (Config.tapeMode !== "off") {
    scrollTape();
  }
}

export async function updateHintsPosition(): Promise<void> {
  if (
    ActivePage.get() !== "test" ||
    resultVisible ||
    Config.indicateTypos !== "below"
  )
    return;

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRTL = currentLanguage.rightToLeft;

  let wordEl: HTMLElement | undefined;
  let letterElements: NodeListOf<Element> | undefined;

  const hintElements = document
    .getElementById("words")
    ?.querySelectorAll("div.word > div.hints > hint");
  for (let i = 0; i < (hintElements?.length ?? 0); i++) {
    const hintEl = hintElements?.[i] as HTMLElement;

    if (!wordEl || hintEl.parentElement?.parentElement !== wordEl) {
      wordEl = hintEl.parentElement?.parentElement as HTMLElement;
      letterElements = wordEl?.querySelectorAll("letter");
    }

    const letterIndices = hintEl.dataset["charsIndex"]
      ?.slice(1, -1)
      .split(",")
      .map((indx) => parseInt(indx));
    const leftmostIndx = isLanguageRTL
      ? parseInt(hintEl.dataset["length"] ?? "1") - 1
      : 0;
    let newLeft = (
      letterElements?.[letterIndices?.[leftmostIndx] ?? 0] as HTMLElement
    ).offsetLeft;
    const lettersWidth =
      letterIndices?.reduce(
        (accum, curr) =>
          accum + (letterElements?.[curr] as HTMLElement).offsetWidth,
        0
      ) ?? 0;
    newLeft += lettersWidth / 2;

    hintEl.style.left = newLeft.toString() + "px";
  }
}

function getWordHTML(word: string): string {
  let newlineafter = false;
  let retval = `<div class='word'>`;
  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.getWordHtml
  );
  const chars = Strings.splitIntoCharacters(word);
  for (const char of chars) {
    if (funbox?.functions?.getWordHtml) {
      retval += funbox.functions.getWordHtml(char, true);
    } else if (char === "\t") {
      retval += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
    } else if (char === "\n") {
      newlineafter = true;
      retval += `<letter class='nlChar'><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
    } else {
      retval += "<letter>" + char + "</letter>";
    }
  }
  retval += "</div>";
  if (newlineafter) retval += "<div class='newline'></div>";
  return retval;
}

function updateWordWrapperClasses(): void {
  if (Config.tapeMode !== "off") {
    $("#words").addClass("tape");
    $("#wordsWrapper").addClass("tape");
  } else {
    $("#words").removeClass("tape");
    $("#wordsWrapper").removeClass("tape");
  }

  if (Config.blindMode) {
    $("#words").addClass("blind");
    $("#wordsWrapper").addClass("blind");
  } else {
    $("#words").removeClass("blind");
    $("#wordsWrapper").removeClass("blind");
  }

  if (Config.indicateTypos === "below") {
    $("#words").addClass("indicateTyposBelow");
    $("#wordsWrapper").addClass("indicateTyposBelow");
  } else {
    $("#words").removeClass("indicateTyposBelow");
    $("#wordsWrapper").removeClass("indicateTyposBelow");
  }

  if (Config.hideExtraLetters) {
    $("#words").addClass("hideExtraLetters");
    $("#wordsWrapper").addClass("hideExtraLetters");
  } else {
    $("#words").removeClass("hideExtraLetters");
    $("#wordsWrapper").removeClass("hideExtraLetters");
  }

  const existing =
    $("#words")
      ?.attr("class")
      ?.split(/\s+/)
      ?.filter((it) => !it.startsWith("highlight-")) ?? [];
  if (Config.highlightMode != null) {
    existing.push("highlight-" + Config.highlightMode.replaceAll("_", "-"));
  }

  $("#words").attr("class", existing.join(" "));

  updateWordsWidth();
  updateWordsHeight(true);
  setTimeout(() => {
    void updateWordsInputPosition(true);
  }, 250);
}

export function showWords(): void {
  $("#words").empty();

  let wordsHTML = "";
  if (Config.mode !== "zen") {
    for (let i = 0; i < TestWords.words.length; i++) {
      wordsHTML += getWordHTML(TestWords.words.get(i));
    }
  } else {
    wordsHTML =
      '<div class="word">word height</div><div class="word active"></div>';
  }

  $("#words").html(wordsHTML);

  updateActiveElement(undefined, true);
  setTimeout(() => {
    void Caret.updatePosition();
  }, 125);

  updateWordWrapperClasses();

  if (Config.mode === "zen") {
    $(document.querySelector(".word") as Element).remove();
  }
}

const posUpdateLangList = ["japanese", "chinese", "korean"];
function shouldUpdateWordsInputPosition(): boolean {
  const language = posUpdateLangList.some((l) => Config.language.startsWith(l));
  return language || (Config.mode !== "time" && Config.showAllLines);
}

export async function updateWordsInputPosition(initial = false): Promise<void> {
  if (ActivePage.get() !== "test") return;
  if (Config.tapeMode !== "off" && !initial) return;

  const currentLanguage = await JSONData.getCurrentLanguage(Config.language);
  const isLanguageRTL = currentLanguage.rightToLeft;

  const el = document.querySelector("#wordsInput") as HTMLElement;
  const activeWord =
    document.querySelectorAll<HTMLElement>("#words .word")[
      activeWordElementIndex
    ];

  if (!activeWord) {
    el.style.top = "0px";
    el.style.left = "0px";
    return;
  }

  const computed = window.getComputedStyle(activeWord);
  const activeWordMargin =
    parseInt(computed.marginTop) + parseInt(computed.marginBottom);

  const letterHeight = convertRemToPixels(Config.fontSize);
  const targetTop =
    activeWord.offsetTop + letterHeight / 2 - el.offsetHeight / 2 + 1; //+1 for half of border

  if (activeWord.offsetWidth < letterHeight) {
    el.style.width = letterHeight + "px";
  } else {
    el.style.width = activeWord.offsetWidth + "px";
  }

  if (Config.tapeMode !== "off") {
    el.style.top = targetTop + "px";
    el.style.left = activeWord.offsetLeft + "px";
    return;
  }

  if (initial) {
    el.style.top = targetTop + letterHeight + activeWordMargin + 4 + "px";
  } else {
    el.style.top = targetTop + "px";
  }

  if (activeWord.offsetWidth < letterHeight && isLanguageRTL) {
    el.style.left = activeWord.offsetLeft - letterHeight + "px";
  } else {
    el.style.left = activeWord.offsetLeft + "px";
  }
}

function updateWordsHeight(force = false): void {
  if (ActivePage.get() !== "test" || resultVisible) return;
  if (!force && Config.mode !== "custom") return;
  $("#wordsWrapper").removeClass("hidden");
  const wordHeight = $(document.querySelector(".word") as Element).outerHeight(
    true
  ) as number;
  const wordsHeight = $(
    document.querySelector("#words") as Element
  ).outerHeight(true) as number;
  if (
    Config.showAllLines &&
    Config.mode !== "time" &&
    CustomText.getLimitMode() !== "time" &&
    CustomText.getLimitValue() !== 0
  ) {
    // overflow-x should not be visible in tape mode, but since showAllLines can't
    // be enabled simultaneously with tape mode we don't need to check it's off
    $("#words")
      .css("height", "auto")
      .css("overflow", "visible clip")
      .css("width", "100%")
      .css("margin-left", "unset");
    $("#wordsWrapper").css("height", "auto").css("overflow", "visible clip");

    let nh = wordHeight * 3;

    if (nh > wordsHeight) {
      nh = wordsHeight;
    }
    $(".outOfFocusWarning").css(
      "margin-top",
      wordHeight + convertRemToPixels(1) / 2 + "px"
    );
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

      const wordComputedStyle = window.getComputedStyle(words[0] as Element);
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

    // $("#words").css("height", "0px");
    // not sure why this was here, wonder if removing it will break anything

    if (Config.tapeMode !== "off") {
      $("#words").css({ overflow: "hidden", width: "200vw" });
      $("#wordsWrapper").css({ overflow: "hidden" });
      scrollTape();
    } else {
      $("#words").css({
        overflow: "visible clip",
        marginLeft: "unset",
        width: "",
      });
      $("#wordsWrapper").css({ overflow: "visible clip" });
    }

    setTimeout(() => {
      $("#words").css("height", finalWordsHeight + "px");
      $("#wordsWrapper").css("height", finalWrapperHeight + "px");
      $(".outOfFocusWarning").css(
        "margin-top",
        finalWrapperHeight / 2 - convertRemToPixels(1) / 2 + "px"
      );
    }, 0);
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
  Loader.show();
  let revealReplay = false;

  let revertCookie = false;
  if (
    Misc.isElementVisible("#cookiesModal") ||
    document.contains(document.querySelector("#cookiesModal"))
  ) {
    revertCookie = true;
  }

  function revertScreenshot(): void {
    Loader.hide();
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
    $("header, footer").removeClass("invisible");
    $("#result").removeClass("noBalloons");
    $(".wordInputHighlight").removeClass("hidden");
    $(".highlightContainer").removeClass("hidden");
    if (revertCookie) $("#cookiesModal").removeClass("hidden");
    if (revealReplay) $("#resultReplay").removeClass("hidden");
    if (!isAuthenticated()) {
      $(".pageTest .loginTip").removeClass("hidden");
    }
    (document.querySelector("html") as HTMLElement).style.scrollBehavior =
      "smooth";
    FunboxList.get(Config.funbox).forEach((f) =>
      f.functions?.applyGlobalCSS?.()
    );
  }

  if (!$("#resultReplay").hasClass("hidden")) {
    revealReplay = true;
    Replay.pauseReplay();
  }
  const dateNow = new Date(Date.now());
  $("#resultReplay").addClass("hidden");
  $(".pageTest .ssWatermark").removeClass("hidden");

  const snapshot = DB.getSnapshot();
  const ssWatermark = [format(dateNow, "dd MMM yyyy HH:mm"), "monkeytype.com"];
  if (snapshot?.name !== undefined) {
    const userText = `${snapshot?.name}${getHtmlByUserFlags(snapshot, {
      iconsOnly: true,
    })}`;
    ssWatermark.unshift(userText);
  }
  $(".pageTest .ssWatermark").html(
    ssWatermark
      .map((el) => `<span>${el}</span>`)
      .join("<span class='pipe'>|</span>")
  );
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
  $("header, footer").addClass("invisible");
  $("#result").addClass("noBalloons");
  $(".wordInputHighlight").addClass("hidden");
  $(".highlightContainer").addClass("hidden");
  if (revertCookie) $("#cookiesModal").addClass("hidden");

  FunboxList.get(Config.funbox).forEach((f) => f.functions?.clearGlobal?.());

  (document.querySelector("html") as HTMLElement).style.scrollBehavior = "auto";
  window.scrollTo({
    top: 0,
  });
  const src = $("#result .wrapper");
  const sourceX = src.offset()?.left ?? 0; /*X position from div#target*/
  const sourceY = src.offset()?.top ?? 0; /*Y position from div#target*/
  const sourceWidth = src.outerWidth(
    true
  ) as number; /*clientWidth/offsetWidth from div#target*/
  const sourceHeight = src.outerHeight(
    true
  ) as number; /*clientHeight/offsetHeight from div#target*/
  try {
    const paddingX = convertRemToPixels(2);
    const paddingY = convertRemToPixels(2);

    const canvas = await (
      await gethtml2canvas()
    )(document.body, {
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
            navigator.userAgent.toLowerCase().includes("firefox") &&
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

export async function updateActiveWordLetters(
  inputOverride?: string
): Promise<void> {
  const input = inputOverride ?? TestInput.input.current;
  const currentWord = TestWords.words.getCurrent();
  if (!currentWord && Config.mode !== "zen") return;
  let ret = "";
  const hintIndices: number[][] = [];

  let newlineafter = false;

  if (Config.mode === "zen") {
    for (const char of TestInput.input.current) {
      if (char === "\t") {
        ret += `<letter class='tabChar correct' style="opacity: 0"><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
      } else if (char === "\n") {
        newlineafter = true;
        ret += `<letter class='nlChar correct' style="opacity: 0"><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
      } else {
        ret += `<letter class="correct">${char}</letter>`;
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
        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
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
        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        koCurrentWord.slice(0, inputWithoutComposeLength) ===
          koInput.slice(0, inputWithoutComposeLength)
      ) {
        correctSoFar = true;
      }
    }

    const funbox = FunboxList.get(Config.funbox).find(
      (f) => f.functions?.getWordHtml
    );

    const inputChars = Strings.splitIntoCharacters(input);
    const currentWordChars = Strings.splitIntoCharacters(currentWord);
    for (let i = 0; i < inputChars.length; i++) {
      const charCorrect = currentWordChars[i] === inputChars[i];

      let currentLetter = currentWordChars[i] as string;
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
        ret += `<letter class="correct ${tabChar}${nlChar}">${currentLetter}</letter>`;
      } else if (
        currentLetter !== undefined &&
        CompositionState.getComposing() &&
        i >= CompositionState.getStartPos() &&
        !(containsKorean && !correctSoFar)
      ) {
        ret += `<letter class="dead">${
          Config.indicateTypos === "replace"
            ? inputChars[i] === " "
              ? "_"
              : inputChars[i]
            : currentLetter
        }</letter>`;
      } else if (currentLetter === undefined) {
        let letter = inputChars[i];
        if (letter === " " || letter === "\t" || letter === "\n") {
          letter = "_";
        }
        ret += `<letter class="incorrect extra ${tabChar}${nlChar}">${letter}</letter>`;
      } else {
        ret +=
          `<letter class="incorrect ${tabChar}${nlChar}">` +
          (Config.indicateTypos === "replace"
            ? inputChars[i] === " "
              ? "_"
              : inputChars[i]
            : currentLetter) +
          "</letter>";
        if (Config.indicateTypos === "below") {
          if (!hintIndices?.length) hintIndices.push([i]);
          else {
            const lastblock = hintIndices[hintIndices.length - 1];
            if (lastblock?.[lastblock.length - 1] === i - 1) lastblock.push(i);
            else hintIndices.push([i]);
          }
        }
      }
    }

    for (let i = inputChars.length; i < currentWordChars.length; i++) {
      const currentLetter = currentWordChars[i];
      if (funbox?.functions?.getWordHtml) {
        ret += funbox.functions.getWordHtml(currentLetter as string, true);
      } else if (currentLetter === "\t") {
        ret += `<letter class='tabChar'><i class="fas fa-long-arrow-alt-right fa-fw"></i></letter>`;
      } else if (currentLetter === "\n") {
        ret += `<letter class='nlChar'><i class="fas fa-level-down-alt fa-rotate-90 fa-fw"></i></letter>`;
      } else {
        ret += `<letter>` + currentLetter + "</letter>";
      }
    }
  }

  const activeWord = document.querySelectorAll("#words .word")?.[
    activeWordElementIndex
  ] as HTMLElement;

  activeWord.innerHTML = ret;

  if (hintIndices?.length) {
    const activeWordLetters = activeWord.querySelectorAll("letter");
    const hintsHtml = createHintsHtml(hintIndices, activeWordLetters, input);
    activeWord.insertAdjacentHTML("beforeend", hintsHtml);
    const hintElements = activeWord.getElementsByTagName("hint");
    await joinOverlappingHints(hintIndices, activeWordLetters, hintElements);
  }

  if (newlineafter) $("#words").append("<div class='newline'></div>");
  if (Config.tapeMode !== "off") {
    scrollTape();
  }
}

export function scrollTape(): void {
  if (ActivePage.get() !== "test" || resultVisible) return;
  const wordsWrapperWidth = (
    document.querySelector("#wordsWrapper") as HTMLElement
  ).offsetWidth;
  let fullWordsWidth = 0;
  const toHide: JQuery[] = [];
  let widthToHide = 0;
  if (activeWordElementIndex > 0) {
    for (let i = 0; i < activeWordElementIndex; i++) {
      const word = document.querySelectorAll("#words .word")[i] as HTMLElement;
      fullWordsWidth += $(word).outerWidth(true) ?? 0;
      const forWordLeft = Math.floor(word.offsetLeft);
      const forWordWidth = Math.floor(word.offsetWidth);
      if (forWordLeft < 0 - forWordWidth) {
        const toPush = $($("#words .word")[i] as HTMLElement);
        toHide.push(toPush);
        widthToHide += toPush.outerWidth(true) ?? 0;
      }
    }
    if (toHide.length > 0) {
      activeWordElementIndex -= toHide.length;
      toHide.forEach((e) => e.remove());
      fullWordsWidth -= widthToHide;
      const currentMargin = parseInt($("#words").css("margin-left"), 10);
      $("#words").css("margin-left", `${currentMargin + widthToHide}px`);
    }
  }
  let currentWordWidth = 0;
  if (Config.tapeMode === "letter") {
    if (TestInput.input.current.length > 0) {
      const words = document.querySelectorAll("#words .word");
      const letters = words[activeWordElementIndex]?.querySelectorAll("letter");
      if (!letters) return;
      for (let i = 0; i < TestInput.input.current.length; i++) {
        const letter = letters[i] as HTMLElement;
        if (
          (Config.blindMode || Config.hideExtraLetters) &&
          letter.classList.contains("extra")
        ) {
          continue;
        }
        currentWordWidth += $(letter).outerWidth(true) ?? 0;
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

export function updatePremid(): void {
  const mode2 = Misc.getMode2(Config, TestWords.currentQuote);
  let fbtext = "";
  if (Config.funbox !== "none") {
    fbtext = " " + Config.funbox.split("#").join(" ");
  }
  $(".pageTest #premidTestMode").text(
    `${Config.mode} ${mode2} ${Strings.getLanguageDisplayString(
      Config.language
    )}${fbtext}`
  );
  $(".pageTest #premidSecondsLeft").text(Config.time);
}

let currentLinesAnimating = 0;

export function lineJump(currentTop: number): void {
  //last word of the line
  if (
    (Config.tapeMode === "off" && currentTestLine > 0) ||
    (Config.tapeMode !== "off" && currentTestLine >= 0)
  ) {
    const hideBound = currentTop;

    const toHide: JQuery[] = [];
    const wordElements = $("#words .word");
    for (let i = 0; i < activeWordElementIndex; i++) {
      const el = $(wordElements[i] as HTMLElement);
      if (el.hasClass("hidden")) continue;
      const forWordTop = Math.floor((el[0] as HTMLElement).offsetTop);
      if (
        forWordTop <
        (Config.tapeMode === "off" ? hideBound - 10 : hideBound + 10)
      ) {
        toHide.push($($("#words .word")[i] as HTMLElement));
      }
    }
    const wordHeight = $(
      document.querySelector(".word") as Element
    ).outerHeight(true) as number;
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
              (document.querySelector("#paceCaret") as HTMLElement)?.offsetTop -
              wordHeight,
          },
          SlowTimer.get() ? 0 : 125
        );

      const newCss: Record<string, string> = {
        marginTop: `-${wordHeight * (currentLinesAnimating + 1)}px`,
      };

      if (Config.tapeMode !== "off") {
        const wordsWrapperWidth = (
          document.querySelector("#wordsWrapper") as HTMLElement
        ).offsetWidth;
        const newMargin = wordsWrapperWidth / 2;
        newCss["marginLeft"] = `${newMargin}px`;
      }
      currentLinesAnimating++;
      $("#words")
        .stop(true, false)
        .animate(newCss, SlowTimer.get() ? 0 : 125, () => {
          currentLinesAnimating = 0;
          activeWordTop = (
            document.querySelectorAll("#words .word")?.[
              activeWordElementIndex
            ] as HTMLElement
          )?.offsetTop;

          activeWordElementIndex -= toHide.length;
          lineTransition = false;
          toHide.forEach((el) => el.remove());
          $("#words").css("marginTop", "0");
        });
    } else {
      toHide.forEach((el) => el.remove());
      activeWordElementIndex -= toHide.length;
      $("#paceCaret").css({
        top:
          (document.querySelector("#paceCaret") as HTMLElement).offsetTop -
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
    const input = TestInput.input.getHistory(i);
    const corrected = TestInput.corrected.getHistory(i);
    const word = TestWords.words.get(i);
    const containsKorean =
      input?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      ) !== null ||
      word?.match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      ) !== null;
    let wordEl = "";
    try {
      if (input === undefined || input === "") {
        throw new Error("empty input word");
      }

      const errorClass = input !== word ? "error" : "";

      if (corrected !== undefined && corrected !== "") {
        const correctedChar = !containsKorean
          ? corrected
          : Hangul.assemble(corrected.split(""));
        wordEl = `<div class='word nocursor ${errorClass}' burst="${
          TestInput.burstHistory[i]
        }" input="${correctedChar
          .replace(/"/g, "&quot;")
          .replace(/ /g, "_")}">`;
      } else {
        wordEl = `<div class='word nocursor ${errorClass}' burst="${
          TestInput.burstHistory[i]
        }" input="${input.replace(/"/g, "&quot;").replace(/ /g, "_")}">`;
      }

      const inputCharacters = Strings.splitIntoCharacters(input);
      const wordCharacters = Strings.splitIntoCharacters(word);
      const correctedCharacters = Strings.splitIntoCharacters(corrected ?? "");

      let loop;
      if (Config.mode === "zen" || input.length > word.length) {
        //input is longer - extra characters possible (loop over input)
        loop = inputCharacters.length;
      } else {
        //input is shorter or equal (loop over word list)
        loop = wordCharacters.length;
      }

      if (corrected === undefined) throw new Error("empty corrected word");

      for (let c = 0; c < loop; c++) {
        let correctedChar;
        try {
          correctedChar = !containsKorean
            ? correctedCharacters[c]
            : Hangul.assemble(corrected.split(""))[c];
        } catch (e) {
          correctedChar = undefined;
        }
        let extraCorrected = "";
        const historyWord: string = !containsKorean
          ? corrected
          : Hangul.assemble(corrected.split(""));
        if (
          c + 1 === loop &&
          historyWord !== undefined &&
          historyWord.length > input.length
        ) {
          extraCorrected = "extraCorrected";
        }
        if (Config.mode === "zen" || wordCharacters[c] !== undefined) {
          if (
            Config.mode === "zen" ||
            inputCharacters[c] === wordCharacters[c]
          ) {
            if (
              correctedChar === inputCharacters[c] ||
              correctedChar === undefined
            ) {
              wordEl += `<letter class="correct ${extraCorrected}">${inputCharacters[c]}</letter>`;
            } else {
              wordEl +=
                `<letter class="corrected ${extraCorrected}">` +
                inputCharacters[c] +
                "</letter>";
            }
          } else {
            if (inputCharacters[c] === TestInput.input.current) {
              wordEl +=
                `<letter class='correct ${extraCorrected}'>` +
                wordCharacters[c] +
                "</letter>";
            } else if (inputCharacters[c] === undefined) {
              wordEl += "<letter>" + wordCharacters[c] + "</letter>";
            } else {
              wordEl +=
                `<letter class="incorrect ${extraCorrected}">` +
                wordCharacters[c] +
                "</letter>";
            }
          }
        } else {
          wordEl +=
            '<letter class="incorrect extra">' +
            inputCharacters[c] +
            "</letter>";
        }
      }
      wordEl += "</div>";
    } catch (e) {
      try {
        wordEl = "<div class='word'>";
        for (const char of word) {
          wordEl += "<letter>" + char + "</letter>";
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

      if ($("#resultWordsHistory .words .word").length === 0) {
        $("#words").html(
          `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
        );
        void loadWordsHistory().then(() => {
          if (Config.burstHeatmap) {
            void applyBurstHeatmap();
          }
          $("#resultWordsHistory")
            .removeClass("hidden")
            .css("display", "none")
            .slideDown(noAnimation ? 0 : 250, () => {
              if (Config.burstHeatmap) {
                void applyBurstHeatmap();
              }
            });
        });
      } else {
        if (Config.burstHeatmap) {
          void applyBurstHeatmap();
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

    const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
    burstlist.forEach((burst, index) => {
      burstlist[index] = Math.round(typingSpeedUnit.fromWpm(burst));
    });

    const themeColors = await ThemeColors.getAll();

    let colors = [
      themeColors.colorfulError,
      blendTwoHexColors(themeColors.colorfulError, themeColors.text, 0.5),
      themeColors.text,
      blendTwoHexColors(themeColors.main, themeColors.text, 0.5),
      themeColors.main,
    ];
    let unreachedColor = themeColors.sub;

    if (themeColors.main === themeColors.text) {
      colors = [
        themeColors.colorfulError,
        blendTwoHexColors(themeColors.colorfulError, themeColors.text, 0.5),
        themeColors.sub,
        blendTwoHexColors(themeColors.sub, themeColors.text, 0.5),
        themeColors.main,
      ];
      unreachedColor = themeColors.subAlt;
    }

    const burstlistSorted = burstlist.sort((a, b) => a - b);
    const burstlistLength = burstlist.length;

    const steps = [
      {
        val: 0,
        colorId: 0,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.15) | 0] as number,
        colorId: 1,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.35) | 0] as number,
        colorId: 2,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.65) | 0] as number,
        colorId: 3,
      },
      {
        val: burstlistSorted[(burstlistLength * 0.85) | 0] as number,
        colorId: 4,
      },
    ];

    steps.forEach((step, index) => {
      const nextStep = steps[index + 1];
      let string = "";
      if (index === 0 && nextStep) {
        string = `<${Math.round(nextStep.val)}`;
      } else if (index === 4) {
        string = `${Math.round(step.val)}+`;
      } else if (nextStep) {
        if (step.val != nextStep.val) {
          string = `${Math.round(step.val)}-${Math.round(nextStep.val) - 1}`;
        } else {
          string = `${Math.round(step.val)}-${Math.round(step.val)}`;
        }
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
        let wordBurstVal = parseInt(wordBurstAttr);
        wordBurstVal = Math.round(
          getTypingSpeedUnit(Config.typingSpeedUnit).fromWpm(wordBurstVal)
        );
        steps.forEach((step) => {
          if (wordBurstVal >= step.val) {
            $(word).addClass("heatmapInherit");
            $(word).css("color", colors[step.colorId] as string);
          }
        });
      }
    });

    $("#resultWordsHistory .heatmapLegend .boxes .box").each((index, box) => {
      $(box).css("background", colors[index] as string);
    });
  } else {
    $("#resultWordsHistory .heatmapLegend").addClass("hidden");
    $("#resultWordsHistory .words .word").removeClass("heatmapInherit");
    $("#resultWordsHistory .words .word").css("color", "");

    $("#resultWordsHistory .heatmapLegend .boxes .box").css("color", "");
  }
}

export function highlightBadWord(index: number): void {
  $($("#words .word")[index] as HTMLElement).addClass("error");
}

export function highlightAllLettersAsCorrect(wordIndex: number): void {
  $($("#words .word")[wordIndex] as HTMLElement)
    .find("letter")
    .addClass("correct");
}

function updateWordsWidth(): void {
  let css: Record<string, string> = {};
  if (Config.tapeMode === "off") {
    if (Config.maxLineWidth === 0) {
      css = {
        "max-width": "100%",
      };
    } else {
      css = {
        "max-width": Config.maxLineWidth + "ch",
      };
    }
  } else {
    if (Config.maxLineWidth === 0) {
      css = {
        "max-width": "100%",
      };
    } else {
      css = {
        "max-width": "100%",
      };
    }
  }
  const el = $("#typingTest");
  el.css(css);
  if (Config.maxLineWidth === 0) {
    el.removeClass("full-width-padding").addClass("content");
  } else {
    el.removeClass("content").addClass("full-width-padding");
  }
}

function updateLiveStatsOpacity(value: TimerOpacity): void {
  $("#barTimerProgress").css("opacity", parseFloat(value as string));
  $("#liveStatsTextTop").css("opacity", parseFloat(value as string));
  $("#liveStatsTextBottom").css("opacity", parseFloat(value as string));
  $("#liveStatsMini").css("opacity", parseFloat(value as string));
}

function updateLiveStatsColor(value: TimerColor): void {
  $("#barTimerProgress").removeClass("timerSub");
  $("#barTimerProgress").removeClass("timerText");
  $("#barTimerProgress").removeClass("timerMain");

  $("#liveStatsTextTop").removeClass("timerSub");
  $("#liveStatsTextTop").removeClass("timerText");
  $("#liveStatsTextTop").removeClass("timerMain");

  $("#liveStatsTextBottom").removeClass("timerSub");
  $("#liveStatsTextBottom").removeClass("timerText");
  $("#liveStatsTextBottom").removeClass("timerMain");

  $("#liveStatsMini").removeClass("timerSub");
  $("#liveStatsMini").removeClass("timerText");
  $("#liveStatsMini").removeClass("timerMain");

  if (value === "main") {
    $("#barTimerProgress").addClass("timerMain");
    $("#liveStatsTextTop").addClass("timerMain");
    $("#liveStatsTextBottom").addClass("timerMain");
    $("#liveStatsMini").addClass("timerMain");
  } else if (value === "sub") {
    $("#barTimerProgress").addClass("timerSub");
    $("#liveStatsTextTop").addClass("timerSub");
    $("#liveStatsTextBottom").addClass("timerSub");
    $("#liveStatsMini").addClass("timerSub");
  } else if (value === "text") {
    $("#barTimerProgress").addClass("timerText");
    $("#liveStatsTextTop").addClass("timerText");
    $("#liveStatsTextBottom").addClass("timerText");
    $("#liveStatsMini").addClass("timerText");
  }
}

$(".pageTest").on("click", "#saveScreenshotButton", () => {
  void screenshot();
});

$(".pageTest #copyWordsListButton").on("click", async () => {
  let words;
  if (Config.mode === "zen") {
    words = TestInput.input.history.join(" ");
  } else {
    words = TestWords.words
      .get()
      .slice(0, TestInput.input.history.length)
      .join(" ");
  }
  await copyToClipboard(words);
});

$(".pageTest #copyMissedWordsListButton").on("click", async () => {
  let words;
  if (Config.mode === "zen") {
    words = TestInput.input.history.join(" ");
  } else {
    words = Object.keys(TestInput.missedWords ?? {}).join(" ");
  }
  await copyToClipboard(words);
});

async function copyToClipboard(content: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content);
    Notifications.add("Copied to clipboard", 0, {
      duration: 2,
    });
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
}

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
    const burst = parseInt($(e.currentTarget).attr("burst") as string);
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
          ${Format.typingSpeed(burst, { showDecimalPlaces: false })}
          ${Config.typingSpeedUnit}
          </div>
          </div>`
      );
    }
  }
});

addEventListener("resize", () => {
  ResultWordHighlight.destroy();
});

$("#wordsInput").on("focus", (e) => {
  const wordsFocused = e.target === document.activeElement;
  if (!wordsFocused) return;
  if (!resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.hide();
  }
  Caret.show(true);
});

$("#wordsInput").on("focusout", () => {
  if (!resultVisible && Config.showOutOfFocusWarning) {
    OutOfFocus.show();
  }
  Caret.hide();
});

$(".pageTest").on("click", "#showWordHistoryButton", () => {
  toggleResultWords();
});

$("#wordsWrapper").on("click", () => {
  focusWords();
});

ConfigEvent.subscribe((key, value) => {
  if (key === "quickRestart") {
    if (value === "off") {
      $(".pageTest #restartTestButton").removeClass("hidden");
    } else {
      $(".pageTest #restartTestButton").addClass("hidden");
    }
  }
  if (key === "maxLineWidth") {
    updateWordsWidth();
  }
  if (key === "timerOpacity") {
    updateLiveStatsOpacity(value as TimerOpacity);
  }
  if (key === "timerColor") {
    updateLiveStatsColor(value as TimerColor);
  }
});
