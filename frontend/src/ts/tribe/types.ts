import { ChartData } from "@monkeytype/schemas/results";
import { CustomTextSettings } from "../test/custom-text";
import { configMetadata } from "../config-metadata";
import * as ConfigSchemas from "@monkeytype/schemas/configs";

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

export type InputSuggestionEntry = {
  display: string;
  imageIcon?: string;
  faIcon?: string;
  textIcon?: string;
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

export type Room = {
  id: string;
  state: number;
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

export type RoomConfig = Pick<ConfigSchemas.Config, TribeBlockedKeys> & {
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
