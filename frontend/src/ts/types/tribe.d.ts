declare namespace TribeTypes {
  interface SystemStats {
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
  }

  interface Result {
    wpm: number;
    raw: number;
    acc: number;
    consistency: number;
    testDuration: number;
    charStats: number[];
    chartData: MonkeyTypes.ChartData | "toolong";
    resolve: ResultResolve;
  }

  interface ResultResolve {
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
  }

  interface RoomJoin {
    room: Room;
  }

  interface Room {
    id: string;
    state: number;
    users: {
      [socketId: string]: User;
    };
    size: number;
    isPrivate: boolean;
    name: string;
    config: RoomConfig;
    maxRaw: number;
    maxWpm: number;
    seed: number;
  }

  interface RoomConfig {
    mode: string;
    mode2: number | number[];
    difficulty: string;
    language: string;
    punctuation: boolean;
    numbers: boolean;
    funbox: string;
    lazyMode: boolean;
    stopOnError: string;
    minWpm: number | "off";
    minAcc: number | "off";
    minBurst: number | "off";
    customText: {
      text: string[];
      isWordRandom: boolean;
      isTimeRandom: boolean;
      time: number;
      word: number;
    };
  }

  interface User {
    id: string;
    isLeader?: boolean;
    name: string;
    isReady?: boolean;
    result?: MonkeyTypes.Result;
    progress?: {
      wpmProgress: number;
      wpm: number;
      acc: number;
      progress: number;
    };
    isFinished?: boolean;
    isTyping?: boolean;
    isAfk?: boolean;
    isChatting?: boolean;
    points?: number;
  }

  interface MiniCrowns {
    raw: string;
    wpm: string;
    acc: string;
    consistency: string;
  }
}
