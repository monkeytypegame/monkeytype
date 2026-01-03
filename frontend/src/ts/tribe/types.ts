import { ChartData, CustomTextSettings } from "@monkeytype/schemas/results";
import { configMetadata } from "../config-metadata";
import { Config } from "@monkeytype/schemas/configs";

export type SystemStats = {
  pingStart: number;
  stats: [
    number, // online users
    rooms: {
      mm: [number, number, number, number];
      custom: [number, number];
    },
    queueLengths: [number, number, number, number],
    version: string,
  ];
};

export type Result = {
  wpm: number;
  raw: number;
  acc: number;
  consistency: number;
  testDuration: number;
  charStats: number[];
  chartData: ChartData;
  resolve: ResultResolve;
};

type LoggedInDontSave = {
  login: true;
  bailedOut: boolean;
} & (
  | {
      valid: false;
      invalidReason: string;
    }
  | {
      failed: true;
      failedReason: string;
    }
  // oxlint-disable-next-line no-empty-object-type
  | {}
);

type LoggedInSave = {
  login: true;
  bailedOut: boolean;
} & (
  | {
      saved: true;
      isPb: boolean;
    }
  | {
      saved: false;
      saveFailedMessage: string;
    }
);

type LoggedOut = {
  login: false;
  bailedOut: boolean;
} & (
  | {
      valid: false;
      invalidReason: string;
    }
  | {
      failed: true;
      failedReason: string;
    }
  // oxlint-disable-next-line no-empty-object-type
  | {}
);

export type ResultResolve = LoggedInDontSave | LoggedInSave | LoggedOut;

export type RoomJoin = {
  room: Room;
};

export const ROOM_STATE = {
  LOBBY: "LOBBY",
  RACE_INIT: "RACE_INIT",
  RACE_COUNTDOWN: "RACE_COUNTDOWN",
  RACE_ONGOING: "RACE_ONGOING",
  RACE_ONE_FINISHED: "RACE_ONE_FINISHED",
  RACE_AWAITING_RESULTS: "RACE_AWAITING_RESULTS",
  SHOWING_RESULTS: "SHOWING_RESULTS",
  READY_TO_CONTINUE: "READY_TO_CONTINUE",
} as const;

export type RoomState = (typeof ROOM_STATE)[keyof typeof ROOM_STATE];

export const CLIENT_STATE = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTED: "CONNECTED",
  IN_ROOM: "IN_ROOM",
} as const;

export type ClientState = (typeof CLIENT_STATE)[keyof typeof CLIENT_STATE];

export type PublicRoomData = {
  id: string;
  size: number;
  name: string;
  state: RoomState;
  config: RoomConfig;
};

export type Room = {
  id: string;
  state: RoomState;
  users: {
    [socketId: string]: User;
  };
  size: number;
  updateRate: number;
  isPrivate: boolean;
  name: string;
  config: RoomConfig;
  maxRaw: number;
  maxWpm: number;
  minRaw: number;
  minWpm: number;
  seed: number;
};

type TribeBlockedKeys = {
  [K in keyof typeof configMetadata]: "tribeBlocked" extends keyof (typeof configMetadata)[K]
    ? (typeof configMetadata)[K]["tribeBlocked"] extends true
      ? K
      : never
    : never;
}[keyof typeof configMetadata];

export type RoomConfig = Pick<Config, TribeBlockedKeys> & {
  customText: CustomTextSettings;
};

export type UserProgressOut = {
  wpm: number;
  raw: number;
  acc: number;
  progress: number;
  wordIndex: number;
  letterIndex: number;
  afk: boolean;
};

export type UserProgress = {
  wpm: number;
  raw: number;
  acc: number;
  progress: number;
  wpmProgress: number;
  wordIndex: number;
  letterIndex: number;
  afk: boolean;
};

export type User = {
  id: string;
  isLeader?: boolean;
  name: string;
  isReady?: boolean;
  result?: Result;
  progress?: UserProgress;
  isFinished?: boolean;
  isTyping?: boolean;
  isAfk?: boolean;
  isChatting?: boolean;
  points?: number;
};

export type MiniCrowns = {
  raw: string[];
  wpm: string[];
  acc: string[];
  consistency: string[];
};
