import * as Sound from "../controllers/sound-controller";
import * as Arrays from "../utils/arrays";
import { qs, qsr } from "../utils/dom";
import { Config } from "../config/store";
import * as TestWords from "./test-words";
import { getInputEvents, getInputForWord } from "./events/data";
import { getInputHistory, getWpmHistory } from "./events/stats";

type ReplayAction =
  | "correctLetter"
  | "incorrectLetter"
  | "backWord"
  | "submitCorrectWord"
  | "submitErrorWord"
  | "setLetterIndex";

type Replay = {
  action: ReplayAction;
  value?: string | number;
  time: number;
};

let wordsList: string[] = [];
let replayData: Replay[] = [];
let wpmHistory: number[] = [];
let wordPos = 0;
let curPos = 0;
let targetWordPos = 0;
let targetCurPos = 0;
let timeoutList: NodeJS.Timeout[] = [];
let stopwatchList: NodeJS.Timeout[] = [];

const toggleButton = (): Element | undefined =>
  document.getElementById("playpauseReplayButton")?.children[0];

const replayEl = qsr(".pageTest #resultReplay");

function getWordsList(): string[] {
  if (Config.mode === "zen") return getInputHistory();
  return TestWords.words.list.slice();
}

function deriveReplayActions(): Replay[] {
  const events = getInputEvents();
  const actions: Replay[] = [];
  let prevWordIndex: number | undefined;

  for (const event of events) {
    const wi = event.data.wordIndex;

    if (prevWordIndex !== undefined && wi !== prevWordIndex) {
      if (wi > prevWordIndex) {
        const typed = getInputForWord(prevWordIndex);
        const target =
          Config.mode === "zen"
            ? typed
            : TestWords.words.getText(prevWordIndex);
        const correct = typed === target;
        actions.push({
          action: correct ? "submitCorrectWord" : "submitErrorWord",
          time: event.testMs,
        });
      } else {
        actions.push({ action: "backWord", time: event.testMs });
      }
    }

    if (
      event.data.inputType === "insertText" ||
      event.data.inputType === "insertCompositionText"
    ) {
      if (event.data.inputStopped) {
        prevWordIndex = wi;
        continue;
      }
      actions.push({
        action: event.data.correct ? "correctLetter" : "incorrectLetter",
        value: event.data.data,
        time: event.testMs,
      });
    } else if (
      event.data.inputType === "deleteContentBackward" ||
      event.data.inputType === "deleteWordBackward"
    ) {
      if (prevWordIndex !== undefined && wi < prevWordIndex) {
        // word transition already emitted backWord above
      } else {
        const newCharIndex =
          event.data.inputValue !== undefined
            ? event.data.inputValue.length
            : event.data.charIndex;
        actions.push({
          action: "setLetterIndex",
          value: newCharIndex,
          time: event.testMs,
        });
      }
    }

    prevWordIndex = wi;
  }

  return actions;
}

function initializeReplayPrompt(): void {
  const replayWordsElement = document.getElementById("replayWords");

  if (replayWordsElement === null) return;

  replayWordsElement.innerHTML = "";
  let wordCount = 0;
  replayData.forEach((item) => {
    if (item.action === "backWord") {
      wordCount--;
    } else if (
      item.action === "submitCorrectWord" ||
      item.action === "submitErrorWord"
    ) {
      wordCount++;
    }
  });
  wordsList.forEach((word, i) => {
    if (i > wordCount) return;
    const x = document.createElement("div");
    x.className = "word";
    for (const letter of word) {
      const elem = document.createElement("letter");
      elem.innerHTML = letter;
      x.appendChild(elem);
    }
    replayWordsElement.appendChild(x);
  });
}

export function pauseReplay(): void {
  timeoutList.forEach((item) => {
    clearTimeout(item);
  });
  timeoutList = [];
  stopwatchList.forEach((item) => {
    clearTimeout(item);
  });
  stopwatchList = [];
  targetCurPos = curPos;
  targetWordPos = wordPos;

  const btn = toggleButton();
  if (btn === undefined) return;

  btn.className = "fas fa-play";
  (btn.parentNode as Element)?.setAttribute("aria-label", "Resume replay");
}

function playSound(error = false): void {
  if (error) {
    if (Config.playSoundOnError !== "off") {
      void Sound.playError();
    } else {
      void Sound.playClick();
    }
  } else {
    void Sound.playClick();
  }
}

function handleDisplayLogic(item: Replay, nosound = false): void {
  let activeWord = document.getElementById("replayWords")?.children[wordPos];

  if (activeWord === undefined) return;

  if (item.action === "correctLetter") {
    if (!nosound) playSound();
    activeWord.children[curPos]?.classList.add("correct");
    curPos++;
  } else if (item.action === "incorrectLetter") {
    if (!nosound) playSound(true);
    let myElement;
    if (curPos >= activeWord.children.length) {
      myElement = document.createElement("letter");
      myElement?.classList.add("extra");
      myElement.innerHTML = item.value?.toString() ?? "";
      activeWord.appendChild(myElement);
    }
    myElement = activeWord.children[curPos];
    myElement?.classList.add("incorrect");
    curPos++;
  } else if (
    item.action === "setLetterIndex" &&
    typeof item.value === "number"
  ) {
    if (!nosound) playSound();
    curPos = item.value;
    for (const myElement of [...activeWord.children].slice(curPos)) {
      if (myElement?.classList.contains("extra")) {
        myElement.remove();
      } else {
        myElement.className = "";
      }
    }
  } else if (item.action === "submitCorrectWord") {
    if (!nosound) playSound();
    wordPos++;
    curPos = 0;
  } else if (item.action === "submitErrorWord") {
    if (!nosound) playSound(true);
    activeWord?.classList.add("error");
    wordPos++;
    curPos = 0;
  } else if (item.action === "backWord") {
    if (!nosound) playSound();
    wordPos--;

    const replayWords = document.getElementById("replayWords");

    if (replayWords !== null) {
      activeWord = replayWords.children[wordPos] as HTMLElement;
    }

    curPos = activeWord.children.length;
    while (activeWord.children[curPos - 1]?.className === "") curPos--;
    activeWord?.classList.remove("error");
  }
}

function loadOldReplay(): number {
  let startingIndex = 0;
  curPos = 0;
  wordPos = 0;
  replayData.forEach((item, i) => {
    if (
      wordPos < targetWordPos ||
      (wordPos === targetWordPos && curPos < targetCurPos)
    ) {
      handleDisplayLogic(item, true);
      startingIndex = i + 1;
    }
  });

  const datatime = replayData[startingIndex]?.time;

  if (datatime === undefined) {
    throw new Error("Failed to load old replay: datatime is undefined");
  }

  const time = Math.max(0, Math.floor(datatime / 1000));
  updateStatsString(time);

  return startingIndex;
}

function toggleReplayDisplay(): void {
  if (replayEl.isHidden()) {
    refreshReplayFromEvents();
    initializeReplayPrompt();
    loadOldReplay();
    void replayEl.slideDown(250);
  } else {
    if (
      (toggleButton()?.parentNode as Element)?.getAttribute("aria-label") !==
      "Start replay"
    ) {
      pauseReplay();
    }
    void replayEl.slideUp(250);
  }
}

function refreshReplayFromEvents(): void {
  wordsList = getWordsList();
  replayData = deriveReplayActions();
  wpmHistory = getWpmHistory();
  targetCurPos = 0;
  targetWordPos = 0;
}

function updateStatsString(time: number): void {
  const wpm = wpmHistory[time - 1] ?? 0;
  const statsString = `${wpm}wpm\t${time}s`;
  qs("#replayStats")?.setText(statsString);
}

function playReplay(): void {
  curPos = 0;
  wordPos = 0;

  const btn = toggleButton();
  if (btn === undefined) return;

  btn.className = "fas fa-pause";
  (btn.parentNode as Element)?.setAttribute("aria-label", "Pause replay");
  initializeReplayPrompt();
  const startingIndex = loadOldReplay();
  const lastTime = replayData[startingIndex]?.time;

  if (lastTime === undefined) {
    throw new Error("Failed to play replay: lastTime is undefined");
  }

  let swTime = Math.round(lastTime / 1000);
  const swEndTime = Math.round(
    (Arrays.lastElementFromArray(replayData) as Replay).time / 1000,
  );
  while (swTime <= swEndTime) {
    const time = swTime;
    stopwatchList.push(
      setTimeout(
        () => {
          updateStatsString(time);
        },
        time * 1000 - lastTime,
      ),
    );
    swTime++;
  }
  replayData.forEach((item, i) => {
    if (i < startingIndex) return;
    timeoutList.push(
      setTimeout(() => {
        handleDisplayLogic(item);
      }, item.time - lastTime),
    );
  });
  timeoutList.push(
    setTimeout(
      () => {
        targetCurPos = 0;
        targetWordPos = 0;
        btn.className = "fas fa-play";
        (btn.parentNode as Element).setAttribute("aria-label", "Start replay");
      },
      (Arrays.lastElementFromArray(replayData) as Replay).time - lastTime,
    ),
  );
}

qs(".pageTest #playpauseReplayButton")?.on("click", () => {
  const btn = toggleButton();
  if (btn?.className === "fas fa-play") {
    playReplay();
  } else if (btn?.className === "fas fa-pause") {
    pauseReplay();
  }
});

qs("#replayWords")?.onChild("click", "letter", (event) => {
  pauseReplay();
  const replayWords = qs("#replayWords");

  const words = [...(replayWords?.native?.children ?? [])];
  targetWordPos =
    words?.indexOf(
      (event.childTarget as HTMLElement).parentNode as HTMLElement,
    ) ?? 0;

  const letters = [...(words[targetWordPos] as HTMLElement).children];
  targetCurPos = letters?.indexOf(event.childTarget as HTMLElement) ?? 0;

  initializeReplayPrompt();
  loadOldReplay();
});

qs(".pageTest")?.onChild("click", "#watchReplayButton", () => {
  toggleReplayDisplay();
});
