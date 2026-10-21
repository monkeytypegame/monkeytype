import { createStore, produce } from "solid-js/store";

import * as Sound from "../../../../controllers/sound-controller";
import * as Arrays from "../../../../utils/arrays";
import { Config } from "../../../../config/store";
import { getLastEventLog } from "../../../../states/test";
import {
  getEventsForWord,
  getInputFromDom,
} from "../../../../test/events/helpers";
import { getInputHistory, getWpmHistory } from "../../../../test/events/stats";
import { EventLog } from "../../../../test/events/types";

type ReplayLetter = {
  char: string;
  state: "" | "correct" | "incorrect";
  extra: boolean;
};

type ReplayWord = {
  letters: ReplayLetter[];
  error: boolean;
};

type ReplayState = {
  open: boolean;
  playState: "start" | "playing" | "paused";
  words: ReplayWord[];
  stats: string;
};

const [replayState, setReplayState] = createStore<ReplayState>({
  open: false,
  playState: "start",
  words: [],
  stats: "",
});

export { replayState };

function updateReplayWord(index: number, fn: (word: ReplayWord) => void): void {
  setReplayState("words", index, produce(fn));
}

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

// built from the event log on open
let loaded: {
  words: string[];
  actions: Replay[];
  wpmHistory: number[];
} = { words: [], actions: [], wpmHistory: [] };
let wordPos = 0;
let curPos = 0;
let targetWordPos = 0;
let targetCurPos = 0;
let timeoutList: NodeJS.Timeout[] = [];
let stopwatchList: NodeJS.Timeout[] = [];

function getWordsList(eventLog: EventLog): string[] {
  if (eventLog.context.mode === "zen") return getInputHistory(eventLog);
  return eventLog.context.targetWords;
}

function deriveReplayActions(eventLog: EventLog): Replay[] {
  const { events, context } = eventLog;
  const actions: Replay[] = [];
  let prevWordIndex: number | undefined;

  for (const event of events) {
    if (event.type !== "input") continue;
    const wi = event.data.wordIndex;

    if (prevWordIndex !== undefined && wi !== prevWordIndex) {
      if (wi > prevWordIndex) {
        const typed = getInputFromDom(getEventsForWord(events, prevWordIndex));
        const target =
          context.mode === "zen" ? typed : context.targetWords[prevWordIndex];
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
  let wordCount = 0;
  loaded.actions.forEach((item) => {
    if (item.action === "backWord") {
      wordCount--;
    } else if (
      item.action === "submitCorrectWord" ||
      item.action === "submitErrorWord"
    ) {
      wordCount++;
    }
  });
  setReplayState(
    "words",
    loaded.words.slice(0, wordCount + 1).map((word) => ({
      error: false,
      letters: [...word].map((char) => ({ char, state: "", extra: false })),
    })),
  );
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

  if (replayState.playState === "playing") {
    setReplayState("playState", "paused");
  }
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
  if (replayState.words[wordPos] === undefined) return;

  if (item.action === "correctLetter") {
    if (!nosound) playSound();
    const pos = curPos;
    updateReplayWord(wordPos, (word) => {
      const letter = word.letters[pos];
      if (letter !== undefined) letter.state = "correct";
    });
    curPos++;
  } else if (item.action === "incorrectLetter") {
    if (!nosound) playSound(true);
    const pos = curPos;
    updateReplayWord(wordPos, (word) => {
      if (pos >= word.letters.length) {
        word.letters.push({
          char: item.value?.toString() ?? "",
          state: "incorrect",
          extra: true,
        });
      }
      const letter = word.letters[pos];
      if (letter !== undefined) letter.state = "incorrect";
    });
    curPos++;
  } else if (
    item.action === "setLetterIndex" &&
    typeof item.value === "number"
  ) {
    if (!nosound) playSound();
    const pos = item.value;
    curPos = pos;
    updateReplayWord(wordPos, (word) => {
      word.letters = word.letters.slice(0, pos).concat(
        word.letters
          .slice(pos)
          .filter((l) => !l.extra)
          .map((l) => ({ ...l, state: "" })),
      );
    });
  } else if (item.action === "submitCorrectWord") {
    if (!nosound) playSound();
    wordPos++;
    curPos = 0;
  } else if (item.action === "submitErrorWord") {
    if (!nosound) playSound(true);
    updateReplayWord(wordPos, (word) => {
      word.error = true;
    });
    wordPos++;
    curPos = 0;
  } else if (item.action === "backWord") {
    if (!nosound) playSound();
    wordPos--;

    const letters = replayState.words[wordPos]?.letters ?? [];
    curPos = letters.length;
    while (curPos > 0 && letters[curPos - 1]?.state === "") curPos--;
    updateReplayWord(wordPos, (word) => {
      word.error = false;
    });
  }
}

function loadOldReplay(): number {
  let startingIndex = 0;
  curPos = 0;
  wordPos = 0;
  loaded.actions.forEach((item, i) => {
    if (
      wordPos < targetWordPos ||
      (wordPos === targetWordPos && curPos < targetCurPos)
    ) {
      handleDisplayLogic(item, true);
      startingIndex = i + 1;
    }
  });

  const datatime = loaded.actions[startingIndex]?.time;

  if (datatime === undefined) {
    throw new Error("Failed to load old replay: datatime is undefined");
  }

  const time = Math.max(0, Math.floor(datatime / 1000));
  updateStatsString(time);

  return startingIndex;
}

export function toggleReplayDisplay(): void {
  if (!replayState.open) {
    const eventLog = getLastEventLog();
    if (eventLog === null) return;
    loaded = {
      words: getWordsList(eventLog),
      actions: deriveReplayActions(eventLog),
      wpmHistory: getWpmHistory(eventLog),
    };
    targetCurPos = 0;
    targetWordPos = 0;
    initializeReplayPrompt();
    loadOldReplay();
    setReplayState("open", true);
  } else {
    if (replayState.playState === "playing") {
      pauseReplay();
    }
    setReplayState("open", false);
  }
}

export function resetReplay(): void {
  pauseReplay();
  setReplayState({
    open: false,
    playState: "start",
    words: [],
    stats: "",
  });
}

function updateStatsString(time: number): void {
  const wpm = loaded.wpmHistory[time - 1] ?? 0;
  const statsString = `${wpm}wpm\t${time}s`;
  setReplayState("stats", statsString);
}

function playReplay(): void {
  curPos = 0;
  wordPos = 0;

  setReplayState("playState", "playing");
  initializeReplayPrompt();
  const startingIndex = loadOldReplay();
  const lastTime = loaded.actions[startingIndex]?.time;

  if (lastTime === undefined) {
    throw new Error("Failed to play replay: lastTime is undefined");
  }

  let swTime = Math.round(lastTime / 1000);
  const swEndTime = Math.round(
    (Arrays.lastElementFromArray(loaded.actions) as Replay).time / 1000,
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
  loaded.actions.forEach((item, i) => {
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
        setReplayState("playState", "start");
      },
      (Arrays.lastElementFromArray(loaded.actions) as Replay).time - lastTime,
    ),
  );
}

export function togglePlayback(): void {
  if (replayState.playState === "playing") {
    pauseReplay();
  } else {
    playReplay();
  }
}

export function jumpToLetter(wordIndex: number, letterIndex: number): void {
  pauseReplay();
  targetWordPos = wordIndex;
  targetCurPos = letterIndex;
  initializeReplayPrompt();
  loadOldReplay();
}
