import Ape from "../ape";
import * as TestLogic from "../test/test-logic";
import * as WordsGenerator from "../test/words-generator";
import * as JSONData from "../utils/json-data";
import { setConfig } from "../config/setters";
import { navigationEvent } from "../events/navigation";
import { showErrorNotification } from "../states/notifications";
import { connect as connectSocket, getSocket } from "./socket-client";
import {
  getRoom,
  setRoom,
  setRoomError,
  initMultiplayerListeners,
  leaveRoom,
} from "../states/multiplayer";
import type { RaceConfig } from "@monkeytype/schemas/multiplayer";

let raceListenersRegistered = false;

export async function ensureConnected(): Promise<void> {
  await connectSocket();
  initMultiplayerListeners();
  registerRaceListeners();
}

function registerRaceListeners(): void {
  if (raceListenersRegistered) return;
  raceListenersRegistered = true;

  // As soon as the countdown starts (well before "go"), jump to the test
  // page and load the race words there. The words render blurred with a
  // countdown overlay on top (RaceCountdownOverlay.tsx / test-ui.ts) so
  // players can see the game but not read ahead or type early.
  getSocket().on("room:countdown", () => {
    void (async () => {
      applyRaceConfigToLocalConfig();
      navigationEvent.dispatch({ url: "/", options: { force: true } });
      await TestLogic.restart({ noAnim: true, isRaceStart: true });
    })();
  });

  // "go": force every player's timer to start at the exact same instant
  // instead of waiting for each one's own first keystroke, which is what
  // normally starts a test but would let players drift out of sync here.
  getSocket().on("room:raceStarted", () => {
    TestLogic.startTest(performance.now());
  });
}

function applyRaceConfigToLocalConfig(): void {
  const room = getRoom();
  if (room === null) return;
  const { config } = room;

  setConfig("mode", config.mode);
  if (config.mode === "words") {
    setConfig("words", config.words);
  } else {
    setConfig("time", config.time);
  }
  setConfig("language", config.language);
  setConfig("punctuation", config.punctuation);
  setConfig("numbers", config.numbers);
  setConfig("difficulty", config.difficulty);
  // funbox isn't supported in race mode configs, but a funbox left active
  // from a previous solo session could still alter word selection and
  // desync players, so make sure it's off for the duration of the race
  setConfig("funbox", []);
}

export async function createAndJoinRoom(config: RaceConfig): Promise<void> {
  await ensureConnected();

  const response = await Ape.multiplayer.createRoom({ body: { config } });
  if (response.status !== 200) {
    showErrorNotification(response.body.message);
    return;
  }

  await joinRoomByCode(response.body.data.roomCode);
  navigationEvent.dispatch({
    url: `/multiplayer/${response.body.data.roomCode}`,
    options: {},
  });
}

export async function joinRoomByCode(roomCode: string): Promise<void> {
  await ensureConnected();

  return new Promise((resolve, reject) => {
    getSocket().emit("room:join", { roomCode }, (ack) => {
      if (ack.status === "ok") {
        setRoom(ack.data);
        resolve();
      } else {
        setRoomError(ack.message);
        showErrorNotification(ack.message);
        reject(new Error(ack.message));
      }
    });
  });
}

export function setReady(isReady: boolean): void {
  const room = getRoom();
  if (room === null) return;
  getSocket().emit("room:setReady", { roomCode: room.roomCode, isReady });
}

export function updateRaceConfig(config: RaceConfig): void {
  const room = getRoom();
  if (room === null) return;
  getSocket().emit("room:updateConfig", { roomCode: room.roomCode, config });
}

// Generous WPM ceiling used to size the word pool for "time" mode races, so
// a fast typist doesn't visibly exhaust it and wrap back to the start.
const TIME_MODE_WORDS_PER_SECOND_CEILING = 6;

export async function startRace(): Promise<void> {
  const room = getRoom();
  if (room === null) return;

  applyRaceConfigToLocalConfig();

  const { config } = room;
  const targetWordCount =
    config.mode === "words"
      ? config.words
      : config.time * TIME_MODE_WORDS_PER_SECOND_CEILING;

  const language = await JSONData.getLanguage(config.language);

  // generateWords() caps each call at 100 words regardless of how many were
  // asked for, so batch multiple calls together for longer races
  const words: string[] = [];
  while (words.length < targetWordCount) {
    const generated = await WordsGenerator.generateWords(language);
    if (generated.words.length === 0) break;
    words.push(...generated.words);
  }

  const wordList =
    config.mode === "words" ? words.slice(0, targetWordCount) : words;

  getSocket().emit("room:start", {
    roomCode: room.roomCode,
    wordList,
  });
}

export function rematch(): void {
  const room = getRoom();
  if (room === null) return;
  getSocket().emit("room:rematch", { roomCode: room.roomCode });
}

export function leaveCurrentRoom(): void {
  const room = getRoom();
  if (room !== null) {
    getSocket().emit("room:leave", { roomCode: room.roomCode });
  }
  leaveRoom();
}
