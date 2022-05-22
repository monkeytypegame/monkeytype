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
    minWpm: string;
    minAcc: string;
    minBurst: string;
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
