import type {
  RaceConfig,
  RaceRoom,
  RacePlayer,
  RaceFinalResult,
} from "./multiplayer";

export type AckResult<T> =
  | { status: "ok"; data: T }
  | { status: "error"; message: string };

export type RaceFinishPayload = {
  roomCode: string;
} & Omit<RaceFinalResult, "finishedAt">;

/** Events sent from the browser to the server. */
export type ClientToServerEvents = {
  "room:join": (
    payload: { roomCode: string },
    ack: (res: AckResult<RaceRoom>) => void,
  ) => void;
  "room:leave": (payload: { roomCode: string }) => void;
  "room:updateConfig": (payload: {
    roomCode: string;
    config: RaceConfig;
  }) => void;
  "room:setReady": (payload: { roomCode: string; isReady: boolean }) => void;
  "room:start": (payload: { roomCode: string; wordList: string[] }) => void;
  "room:rematch": (payload: { roomCode: string }) => void;
  "race:finish": (payload: RaceFinishPayload) => void;
};

/** Events sent from the server to the browser. */
export type ServerToClientEvents = {
  "room:state": (room: RaceRoom) => void;
  "room:playerJoined": (player: RacePlayer) => void;
  "room:playerLeft": (payload: { uid: string }) => void;
  "room:countdown": (payload: {
    startsAtServerTime: number;
    seconds: number;
    wordList: string[];
  }) => void;
  "room:raceStarted": (payload: {
    wordList: string[];
    raceStartedAt: number;
  }) => void;
  "race:playerFinished": (payload: {
    uid: string;
    finalResult: RaceFinalResult;
  }) => void;
  "race:results": (payload: { players: RacePlayer[] }) => void;
  "room:error": (payload: { message: string; code: string }) => void;
};
