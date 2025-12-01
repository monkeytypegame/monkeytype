import { ChartData } from "@monkeytype/schemas/results";

export type SystemStats = {
  pingStart: number;
  stats: [
    number, // online users
    rooms: {
      mm: [number, number, number, number];
      custom: [number, number];
    },
    queueLengths: [number, number, number, number],
    version: string
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

export type ResultResolve = {
  login?: boolean;
  saved?: boolean;
  failed?: boolean;
  afk?: boolean;
  repeated?: boolean;
  failedReason?: string;
  valid?: boolean;
  tooShort?: boolean;
  saveFailedMessage?: string;
  isPb?: boolean;
  bailedOut?: boolean;
};

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

export type RoomConfig = {
  mode: string;
  mode2: string | number | number[];
  difficulty: string;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  funbox: string[];
  lazyMode: boolean;
  stopOnError: string;
  minWpm: number | "off";
  minAcc: number | "off";
  minBurst: number | "off";
  //todo fix
  // customText: {
  //   text: string[];
  //   isWordRandom: boolean;
  //   isTimeRandom: boolean;
  //   time: number;
  //   word: number;
  // };
  isInfiniteTest: boolean;
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
