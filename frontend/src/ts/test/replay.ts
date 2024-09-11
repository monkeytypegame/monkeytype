import config from "../config";
import * as Sound from "../controllers/sound-controller";
import * as TestInput from "./test-input";
import * as Arrays from "../utils/arrays";

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
let replayStartTime = 0;
let replayRecording = true;
let wordPos = 0;
let curPos = 0;
let targetWordPos = 0;
let targetCurPos = 0;
let timeoutList: NodeJS.Timeout[] = [];
let stopwatchList: NodeJS.Timeout[] = [];
const toggleButton = document.getElementById("playpauseReplayButton")
  ?.children[0];

function replayGetWordsList(wordsListFromScript: string[]): void {
  wordsList = wordsListFromScript;
}

function initializeReplayPrompt(): void {
  const replayWordsElement = document.getElementById("replayWords");

  if (replayWordsElement === null) return;

  replayWordsElement.innerHTML = "";
  let wordCount = 0;
  replayData.forEach((item) => {
    //trim wordsList for timed tests
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

  if (toggleButton === undefined) return;

  toggleButton.className = "fas fa-play";
  (toggleButton.parentNode as Element)?.setAttribute(
    "aria-label",
    "Resume replay"
  );
}

function playSound(error = false): void {
  if (error) {
    if (config.playSoundOnError !== "off") {
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
      //if letter is an extra
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
    // remove all letters from cursor to end of word
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

    if (replayWords !== null)
      activeWord = replayWords.children[wordPos] as HTMLElement;

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
      //quickly display everything up to the target
      handleDisplayLogic(item, true);
      startingIndex = i + 1;
    }
  });

  const datatime = replayData[startingIndex]?.time;

  if (datatime === undefined) {
    throw new Error("Failed to load old replay: datatime is undefined");
  }

  const time = Math.floor(datatime / 1000);
  updateStatsString(time);

  return startingIndex;
}

function toggleReplayDisplay(): void {
  if ($("#resultReplay").stop(true, true).hasClass("hidden")) {
    initializeReplayPrompt();
    loadOldReplay();
    //show
    if (!$("#watchReplayButton").hasClass("loaded")) {
      $("#words").html(
        `<div class="preloader"><i class="fas fa-fw fa-spin fa-circle-notch"></i></div>`
      );
      $("#resultReplay")
        .removeClass("hidden")
        .css("display", "none")
        .slideDown(250);
    } else {
      $("#resultReplay")
        .removeClass("hidden")
        .css("display", "none")
        .slideDown(250);
    }
  } else {
    //hide
    if (
      (toggleButton?.parentNode as Element)?.getAttribute("aria-label") !=
      "Start replay"
    ) {
      pauseReplay();
    }
    $("#resultReplay").slideUp(250, () => {
      $("#resultReplay").addClass("hidden");
    });
  }
}

function startReplayRecording(): void {
  if (!$("#resultReplay").stop(true, true).hasClass("hidden")) {
    //hide replay display if user left it open
    toggleReplayDisplay();
  }
  $("#replayStats").text("");
  replayData = [];
  replayStartTime = performance.now();
  replayRecording = true;
  targetCurPos = 0;
  targetWordPos = 0;
}

function stopReplayRecording(): void {
  replayRecording = false;
}

function addReplayEvent(action: ReplayAction, value?: number | string): void {
  if (!replayRecording) {
    return;
  }

  const timeDelta = performance.now() - replayStartTime;
  replayData.push({ action: action, value: value, time: timeDelta });
}

function updateStatsString(time: number): void {
  const wpm = TestInput.wpmHistory[time - 1] ?? 0;
  const statsString = `${wpm}wpm\t${time}s`;
  $("#replayStats").text(statsString);
}

function playReplay(): void {
  curPos = 0;
  wordPos = 0;

  if (toggleButton === undefined) return;

  toggleButton.className = "fas fa-pause";
  (toggleButton.parentNode as Element)?.setAttribute(
    "aria-label",
    "Pause replay"
  );
  initializeReplayPrompt();
  const startingIndex = loadOldReplay();
  const lastTime = replayData[startingIndex]?.time;

  if (lastTime === undefined) {
    throw new Error("Failed to play replay: lastTime is undefined");
  }

  let swTime = Math.round(lastTime / 1000); //starting time
  const swEndTime = Math.round(
    (Arrays.lastElementFromArray(replayData) as Replay).time / 1000
  );
  while (swTime <= swEndTime) {
    const time = swTime;
    stopwatchList.push(
      setTimeout(() => {
        updateStatsString(time);
      }, time * 1000 - lastTime)
    );
    swTime++;
  }
  replayData.forEach((item, i) => {
    if (i < startingIndex) return;
    timeoutList.push(
      setTimeout(() => {
        handleDisplayLogic(item);
      }, item.time - lastTime)
    );
  });
  timeoutList.push(
    setTimeout(() => {
      //after the replay has finished, this will run
      targetCurPos = 0;
      targetWordPos = 0;
      toggleButton.className = "fas fa-play";
      (toggleButton.parentNode as Element).setAttribute(
        "aria-label",
        "Start replay"
      );
    }, (Arrays.lastElementFromArray(replayData) as Replay).time - lastTime)
  );
}

function getReplayExport(): string {
  return JSON.stringify({
    replayData: replayData,
    wordsList: wordsList,
  });
}

$(".pageTest #playpauseReplayButton").on("click", () => {
  if (toggleButton?.className === "fas fa-play") {
    playReplay();
  } else if (toggleButton?.className === "fas fa-pause") {
    pauseReplay();
  }
});

$("#replayWords").on("click", "letter", (event) => {
  //allows user to click on the place they want to start their replay at
  pauseReplay();
  const replayWords = document.querySelector("#replayWords");

  const words = [...(replayWords?.children ?? [])];
  targetWordPos = words.indexOf(event.target.parentNode as HTMLElement);
  const letters = [...(words[targetWordPos] as HTMLElement).children];
  targetCurPos = letters.indexOf(event.target as HTMLElement);

  initializeReplayPrompt();
  loadOldReplay();
});

$(".pageTest").on("click", "#watchReplayButton", () => {
  toggleReplayDisplay();
});

export {
  startReplayRecording,
  stopReplayRecording,
  addReplayEvent,
  replayGetWordsList,
  getReplayExport,
};
