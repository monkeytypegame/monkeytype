import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@monkeytype/schemas/multiplayer-events";
import * as RedisClient from "./redis";
import { socketAuthMiddleware, SocketData } from "./socket-auth";
import { registerRoomHandlers } from "../sockets/room-handlers";
import Logger from "../utils/logger";

export type MultiplayerIO = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

let io: MultiplayerIO | undefined;

const GENERAL_EVENT_LIMIT_PER_SECOND = 20;

export function attachSocketServer(httpServer: HttpServer): MultiplayerIO {
  io = new SocketIOServer(httpServer, {
    cors: { origin: true, credentials: true },
  });

  const connection = RedisClient.getConnection();
  const generalLimiter = connection
    ? new RateLimiterRedis({
        storeClient: connection,
        keyPrefix: "multiplayer-rl-general",
        points: GENERAL_EVENT_LIMIT_PER_SECOND,
        duration: 1,
      })
    : new RateLimiterMemory({
        points: GENERAL_EVENT_LIMIT_PER_SECOND,
        duration: 1,
      });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    Logger.info(`Multiplayer socket connected: ${socket.data.uid}`);

    socket.use((event, next) => {
      generalLimiter
        .consume(socket.data.uid)
        .then(() => next())
        .catch(() => {
          // rate limited: silently drop the event rather than disconnecting,
          // since a burst is likely a slow client tab, not abuse
          next(new Error("rate limited"));
        });
    });

    registerRoomHandlers(io as MultiplayerIO, socket);
  });

  return io;
}

export function getIO(): MultiplayerIO {
  if (!io) {
    throw new Error("Socket.IO server has not been attached yet");
  }
  return io;
}
