import crypto from "crypto";
import * as RedisClient from "../init/redis";
import {
  RaceConfig,
  RaceFinalResult,
  RacePlayer,
  RaceRoom,
} from "@monkeytype/schemas/multiplayer";

const NAMESPACE = "monkeytype:multiplayer";
const ROOM_TTL_SECONDS = 2 * 60 * 60; // 2 hours, while a room is active
const FINISHED_ROOM_TTL_SECONDS = 10 * 60; // 10 minutes, once a race is over
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_MAX_ATTEMPTS = 10;

function roomKey(roomCode: string): string {
  return `${NAMESPACE}:room:${roomCode}`;
}

function userCodesKey(uid: string): string {
  return `${NAMESPACE}:usercodes:${uid}`;
}

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[crypto.randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

async function reserveUniqueRoomCode(): Promise<string> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new Error("Redis connection not available");
  }

  for (let attempt = 0; attempt < ROOM_CODE_MAX_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    // "reserve" the key with a placeholder value; the caller overwrites it
    // with the real room JSON immediately after. NX makes the check + claim atomic.
    const reserved = await connection.set(
      roomKey(code),
      "",
      "EX",
      ROOM_TTL_SECONDS,
      "NX",
    );
    if (reserved === "OK") {
      return code;
    }
  }

  throw new Error("Failed to generate a unique room code");
}

export async function createRoom(
  hostUid: string,
  hostName: string,
  config: RaceConfig,
): Promise<RaceRoom> {
  const roomCode = await reserveUniqueRoomCode();

  const room: RaceRoom = {
    roomCode,
    hostUid,
    status: "lobby",
    config,
    wordList: null,
    players: [
      {
        uid: hostUid,
        name: hostName,
        isHost: true,
        isReady: false,
        status: "connected",
        finalResult: null,
      },
    ],
    createdAt: Date.now(),
    raceStartedAt: null,
  };

  await saveRoom(room);
  await addUserRoomCode(hostUid, roomCode);

  return room;
}

export async function getRoom(roomCode: string): Promise<RaceRoom | null> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    return null;
  }

  const raw = await connection.get(roomKey(roomCode));
  if (raw === null || raw === "") {
    return null;
  }

  return JSON.parse(raw) as RaceRoom;
}

export async function saveRoom(room: RaceRoom): Promise<void> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new Error("Redis connection not available");
  }

  const ttl =
    room.status === "finished" ? FINISHED_ROOM_TTL_SECONDS : ROOM_TTL_SECONDS;

  await connection.set(roomKey(room.roomCode), JSON.stringify(room), "EX", ttl);
}

async function addUserRoomCode(uid: string, roomCode: string): Promise<void> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    return;
  }

  await connection.sadd(userCodesKey(uid), roomCode);
  await connection.expire(userCodesKey(uid), ROOM_TTL_SECONDS);
}

export function addPlayer(room: RaceRoom, uid: string, name: string): RaceRoom {
  const existing = room.players.find((player) => player.uid === uid);
  if (existing) {
    existing.status = "connected";
    return room;
  }

  room.players.push({
    uid,
    name,
    isHost: false,
    isReady: false,
    status: "connected",
    finalResult: null,
  });

  return room;
}

export function markPlayerStatus(
  room: RaceRoom,
  uid: string,
  status: RacePlayer["status"],
): RaceRoom {
  const player = room.players.find((it) => it.uid === uid);
  if (player) {
    player.status = status;
  }
  return room;
}

export function recordFinalResult(
  room: RaceRoom,
  uid: string,
  result: RaceFinalResult,
): RaceRoom {
  const player = room.players.find((it) => it.uid === uid);
  if (player) {
    player.finalResult = result;
  }
  return room;
}

export function allConnectedPlayersFinished(room: RaceRoom): boolean {
  const relevantPlayers = room.players.filter(
    (player) => player.status === "connected",
  );
  if (relevantPlayers.length === 0) {
    return true;
  }
  return relevantPlayers.every((player) => player.finalResult !== null);
}
