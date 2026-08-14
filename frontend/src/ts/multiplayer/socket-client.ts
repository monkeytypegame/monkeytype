import { io, Socket } from "socket.io-client";
import { envConfig } from "virtual:env-config";
import { getIdToken } from "../firebase";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@monkeytype/schemas/multiplayer-events";

type MultiplayerSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: MultiplayerSocket | null = null;

export async function connect(): Promise<MultiplayerSocket> {
  if (socket !== null) {
    return socket;
  }

  socket = io(envConfig.backendUrl, {
    autoConnect: true,
    // function form: re-invoked on every (re)connection attempt, so a
    // refreshed Firebase token is always used instead of a stale one.
    auth: async (cb) => {
      const token = await getIdToken();
      cb({ token: token ?? "" });
    },
  });

  return socket;
}

export function getSocket(): MultiplayerSocket {
  if (socket === null) {
    throw new Error("Multiplayer socket is not connected");
  }
  return socket;
}

export function disconnect(): void {
  socket?.disconnect();
  socket = null;
}
