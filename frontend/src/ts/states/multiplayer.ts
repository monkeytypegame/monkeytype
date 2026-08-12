import { createSignal } from "solid-js";
import type { RaceRoom, RacePlayer } from "@monkeytype/schemas/multiplayer";
import type { ServerToClientEvents } from "@monkeytype/schemas/multiplayer-events";
import { getSocket } from "../multiplayer/socket-client";
import { navigationEvent } from "../events/navigation";

export const [getRoom, setRoom] = createSignal<RaceRoom | null>(null);
export const [isRaceModeActive, setRaceModeActive] = createSignal(false);
export const [getRaceWordList, setRaceWordList] = createSignal<string[] | null>(
  null,
);
export const [getRaceCountdown, setRaceCountdown] = createSignal<{
  startsAtServerTime: number;
  seconds: number;
  wordList: string[];
} | null>(null);
export const [getRaceResults, setRaceResults] = createSignal<
  RacePlayer[] | null
>(null);
export const [getRoomError, setRoomError] = createSignal<string | null>(null);

export function resetRaceState(): void {
  setRaceModeActive(false);
  setRaceWordList(null);
  setRaceCountdown(null);
  setRaceResults(null);
}

export function leaveRoom(): void {
  setRoom(null);
  resetRaceState();
}

let listenersInitialized = false;

export function initMultiplayerListeners(): void {
  if (listenersInitialized) return;
  listenersInitialized = true;

  const socket = getSocket();

  const on = <K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K],
  ): void => {
    socket.on(event, handler as never);
  };

  on("room:state", (room) => {
    setRoom(room);
    if (room.status === "lobby") {
      setRaceResults(null);
    }
  });

  on("room:playerJoined", (player) => {
    setRoom((room) => {
      if (room === null) return room;
      const players = room.players.filter((it) => it.uid !== player.uid);
      return { ...room, players: [...players, player] };
    });
  });

  on("room:playerLeft", ({ uid }) => {
    setRoom((room) => {
      if (room === null) return room;
      return {
        ...room,
        players: room.players.map((player) =>
          player.uid === uid ? { ...player, status: "disconnected" } : player,
        ),
      };
    });
  });

  on("room:countdown", (payload) => {
    setRaceCountdown(payload);
    // set the word list and flip race mode on as soon as the countdown
    // starts (not when it ends), so every client can navigate to the test
    // page, warm up language data, and generate the (blurred) test words
    // ahead of the actual "go" moment
    setRaceWordList(payload.wordList);
    setRaceModeActive(true);
  });

  on("room:raceStarted", () => {
    // clears the countdown overlay/blur; race mode itself stays active
    setRaceCountdown(null);
  });

  on("race:playerFinished", ({ uid, finalResult }) => {
    setRoom((room) => {
      if (room === null) return room;
      return {
        ...room,
        players: room.players.map((player) =>
          player.uid === uid ? { ...player, finalResult } : player,
        ),
      };
    });
  });

  on("race:results", ({ players }) => {
    setRaceResults(players);
    setRaceModeActive(false);

    const roomCode = getRoom()?.roomCode;
    if (roomCode !== undefined) {
      navigationEvent.dispatch({
        url: `/multiplayer/${roomCode}`,
        options: { force: true },
      });
    }
  });

  on("room:error", ({ message }) => {
    setRoomError(message);
  });
}
