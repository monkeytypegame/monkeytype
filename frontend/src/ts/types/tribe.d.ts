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
    state: number;
    users: {
      [socketId: string]: User;
    };
    size: number;
    isPrivate: boolean;
    name: string;
    config: unknown;
    maxRaw: number;
    maxWpm: number;
  }

  interface User {
    id: string;
    isLeader?: boolean;
    name: string;
    isReady?: boolean;
    result?: MonkeyTypes.Result;
    progress?: {
      wpmProgress: number;
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
