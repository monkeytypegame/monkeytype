import { Socket } from "socket.io";
import * as UserDAL from "../dal/user";
import * as Multiplayer from "../utils/multiplayer";
import Logger from "../utils/logger";
import { getErrorMessage } from "../utils/error";
import { RaceConfigSchema } from "@monkeytype/schemas/multiplayer";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@monkeytype/schemas/multiplayer-events";
import { MultiplayerIO } from "../init/socket";
import { SocketData } from "../init/socket-auth";

export type RoomSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

const COUNTDOWN_SECONDS = 10;
const RACE_FINISH_TIMEOUT_BUFFER_MS = 60_000;
const RACE_FINISH_TIMEOUT_MAX_MS = 5 * 60_000;

// per-room, in-memory only: the finish-timeout handle for the room.
const finishTimeoutByRoom = new Map<string, NodeJS.Timeout>();

async function getDisplayName(uid: string): Promise<string> {
  try {
    const user = await UserDAL.getPartialUser(uid, "multiplayer", ["name"]);
    return user.name;
  } catch {
    return "unknown";
  }
}

function clearRoomTimers(roomCode: string): void {
  const timeout = finishTimeoutByRoom.get(roomCode);
  if (timeout) {
    clearTimeout(timeout);
    finishTimeoutByRoom.delete(roomCode);
  }
}

async function finishRaceIfDone(
  io: MultiplayerIO,
  roomCode: string,
): Promise<void> {
  const room = await Multiplayer.getRoom(roomCode);
  if (room === null || room.status === "finished") {
    return;
  }

  if (!Multiplayer.allConnectedPlayersFinished(room)) {
    return;
  }

  room.status = "finished";
  await Multiplayer.saveRoom(room);
  clearRoomTimers(roomCode);
  io.to(roomCode).emit("race:results", { players: room.players });
}

export function registerRoomHandlers(
  io: MultiplayerIO,
  socket: RoomSocket,
): void {
  const uid = socket.data.uid;

  socket.on("room:join", (payload, ack) => {
    void (async () => {
      try {
        const room = await Multiplayer.getRoom(payload.roomCode);
        if (room === null) {
          ack({ status: "error", message: "Room not found" });
          return;
        }

        const name = await getDisplayName(uid);
        const updated = Multiplayer.addPlayer(room, uid, name);
        await Multiplayer.saveRoom(updated);

        await socket.join(updated.roomCode);
        socket.data.roomCode = updated.roomCode;

        const player = updated.players.find((it) => it.uid === uid);
        if (player) {
          socket.to(updated.roomCode).emit("room:playerJoined", player);
        }

        ack({ status: "ok", data: updated });
      } catch (error) {
        Logger.error(`room:join failed: ${getErrorMessage(error)}`);
        ack({ status: "error", message: "Failed to join room" });
      }
    })();
  });

  socket.on("room:leave", (payload) => {
    void handleLeave(io, socket, payload.roomCode);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    if (roomCode !== undefined && roomCode !== "") {
      void handleLeave(io, socket, roomCode);
    }
  });

  socket.on("room:updateConfig", (payload) => {
    void (async () => {
      const room = await Multiplayer.getRoom(payload.roomCode);
      if (room === null || room.hostUid !== uid || room.status !== "lobby") {
        return;
      }

      const parsed = RaceConfigSchema.safeParse(payload.config);
      if (!parsed.success) {
        socket.emit("room:error", {
          message: "Invalid race config",
          code: "invalid_config",
        });
        return;
      }

      room.config = parsed.data;
      await Multiplayer.saveRoom(room);
      io.to(room.roomCode).emit("room:state", room);
    })();
  });

  socket.on("room:setReady", (payload) => {
    void (async () => {
      const room = await Multiplayer.getRoom(payload.roomCode);
      if (room === null) return;

      const player = room.players.find((it) => it.uid === uid);
      if (!player) return;

      player.isReady = payload.isReady;
      await Multiplayer.saveRoom(room);
      io.to(room.roomCode).emit("room:state", room);
    })();
  });

  socket.on("room:rematch", (payload) => {
    void (async () => {
      const room = await Multiplayer.getRoom(payload.roomCode);
      if (room === null || room.hostUid !== uid || room.status !== "finished") {
        return;
      }

      room.status = "lobby";
      room.wordList = null;
      room.raceStartedAt = null;
      for (const player of room.players) {
        player.isReady = false;
        player.finalResult = null;
      }

      await Multiplayer.saveRoom(room);
      io.to(room.roomCode).emit("room:state", room);
    })();
  });

  socket.on("room:start", (payload) => {
    void (async () => {
      const room = await Multiplayer.getRoom(payload.roomCode);
      if (room === null || room.hostUid !== uid || room.status !== "lobby") {
        return;
      }

      const connectedPlayers = room.players.filter(
        (player) => player.status === "connected",
      );
      const allReady = connectedPlayers.every((player) => player.isReady);
      if (!allReady || payload.wordList.length === 0) {
        socket.emit("room:error", {
          message: "All players must be ready to start",
          code: "not_ready",
        });
        return;
      }

      room.status = "countdown";
      room.wordList = payload.wordList;
      await Multiplayer.saveRoom(room);

      const startsAtServerTime = Date.now() + COUNTDOWN_SECONDS * 1000;
      io.to(room.roomCode).emit("room:countdown", {
        startsAtServerTime,
        wordList: payload.wordList,
        seconds: COUNTDOWN_SECONDS,
      });

      setTimeout(() => {
        void (async () => {
          const startedRoom = await Multiplayer.getRoom(room.roomCode);
          if (startedRoom?.status !== "countdown") {
            return;
          }
          startedRoom.status = "racing";
          startedRoom.raceStartedAt = Date.now();
          await Multiplayer.saveRoom(startedRoom);

          io.to(room.roomCode).emit("room:raceStarted", {
            wordList: startedRoom.wordList ?? [],
            raceStartedAt: startedRoom.raceStartedAt,
          });

          const finishTimeoutMs = Math.min(
            startedRoom.config.mode === "time"
              ? startedRoom.config.time * 1000 * 2
              : RACE_FINISH_TIMEOUT_BUFFER_MS * 2,
            RACE_FINISH_TIMEOUT_MAX_MS,
          );
          const timeout = setTimeout(() => {
            void finishRaceIfDone(io, room.roomCode);
          }, finishTimeoutMs);
          finishTimeoutByRoom.set(room.roomCode, timeout);
        })();
      }, COUNTDOWN_SECONDS * 1000);
    })();
  });

  socket.on("race:finish", (payload) => {
    void (async () => {
      const room = await Multiplayer.getRoom(payload.roomCode);
      if (room === null) return;

      const finalResult = {
        wpm: payload.wpm,
        rawWpm: payload.rawWpm,
        acc: payload.acc,
        consistency: payload.consistency,
        charStats: payload.charStats,
        finishedAt: Date.now(),
      };

      const updated = Multiplayer.recordFinalResult(room, uid, finalResult);
      await Multiplayer.saveRoom(updated);

      io.to(payload.roomCode).emit("race:playerFinished", {
        uid,
        finalResult,
      });

      await finishRaceIfDone(io, payload.roomCode);
    })();
  });
}

async function handleLeave(
  io: MultiplayerIO,
  socket: RoomSocket,
  roomCode: string,
): Promise<void> {
  const uid = socket.data.uid;
  await socket.leave(roomCode);

  const room = await Multiplayer.getRoom(roomCode);
  if (room === null) return;

  const updated = Multiplayer.markPlayerStatus(room, uid, "disconnected");

  // host disconnected pre-race: promote the next connected player
  if (
    updated.hostUid === uid &&
    updated.status === "lobby" &&
    updated.players.some((p) => p.status === "connected" && p.uid !== uid)
  ) {
    const newHost = updated.players.find(
      (p) => p.status === "connected" && p.uid !== uid,
    );
    if (newHost) {
      updated.hostUid = newHost.uid;
      newHost.isHost = true;
      const oldHost = updated.players.find((p) => p.uid === uid);
      if (oldHost) oldHost.isHost = false;
    }
  }

  await Multiplayer.saveRoom(updated);
  io.to(roomCode).emit("room:playerLeft", { uid });

  if (updated.status === "racing") {
    await finishRaceIfDone(io, roomCode);
  }
}
