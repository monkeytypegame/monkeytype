import * as TribeTypes from "./types";

let socketId: string | undefined = undefined;
let state: TribeTypes.ClientState = "DISCONNECTED";
let room: TribeTypes.Room | undefined = undefined;
let autoReady = false;

export function setSocketId(newSocketId: string | undefined): void {
  socketId = newSocketId;
}

export function setAutoReady(newAutoReady: boolean): void {
  autoReady = newAutoReady;
}

export function getAutoReady(): boolean {
  return autoReady;
}

export function setState(newState: TribeTypes.ClientState): void {
  state = newState;
}

export function getState(): TribeTypes.ClientState {
  return state;
}

export function setRoom(newRoom: TribeTypes.Room | undefined): void {
  room = newRoom;
}

export function getRoom(): TribeTypes.Room | undefined {
  return room;
}

export function getRoomState(): TribeTypes.RoomState | undefined {
  return room?.state;
}

export function getSelf(): TribeTypes.User | undefined {
  if (socketId === undefined) return undefined;
  return room?.users?.[socketId];
}

export function isLeader(): boolean {
  return getSelf()?.isLeader ?? false;
}

export function isInARoom(): boolean {
  return getRoom() !== undefined;
}

export function isRaceActive(): boolean {
  const s = getRoom()?.state;
  if (s === undefined) return false;
  return [
    // "RACE_INIT",
    // "RACE_COUNTDOWN",
    "RACE_ONGOING",
    "RACE_ONE_FINISHED",
  ].includes(s);
}

export function isDisconnected(): boolean {
  return getState() === "DISCONNECTED";
}
