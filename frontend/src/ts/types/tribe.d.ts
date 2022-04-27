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

  interface Room {
    state: number;
    users?: {
      [socketId: string]: User;
    };
  }

  interface User {
    id: string;
    isLeader: boolean;
    name: string;
    isReady: boolean;
  }
}
