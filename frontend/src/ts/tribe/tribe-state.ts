import TribeSocket from "./tribe-socket";
import * as TribeTypes from "./types";

let state = -1;

let room: TribeTypes.Room | undefined = undefined;

let autoReady = false;

export function setAutoReady(newAutoReady: boolean): void {
  autoReady = newAutoReady;
}

export function getAutoReady(): boolean {
  return autoReady;
}

export function setState(newState: number): void {
  state = newState;
}

/**
 * -1  "error";
 *
 * 1  "connected";
 *
 * 5  "lobby";
 *
 * 10  "preparing race";
 *
 * 11  "race countdown";
 *
 * 12  "race active";
 *
 * 20  "at least one finished";
 *
 * 21  "everyone finished, waiting for everyone ready or view result timer to be over";
 *
 * 22  "everyone ready / timer over";
 */
export function getState(): number {
  return state;
}

export function setRoom(newRoom: TribeTypes.Room | undefined): void {
  room = newRoom;
}

export function getRoom(): TribeTypes.Room | undefined {
  return room;
}

export function getSelf(): TribeTypes.User | undefined {
  return room?.users?.[TribeSocket.getId()];
}

export function isLeader(): boolean {
  return getSelf()?.isLeader ?? false;
}

export function isInARoom(): boolean {
  return getState() >= 5;
}

export function isRaceActive(): boolean {
  const s = getState();
  return s >= 10 && s <= 20;
}

export function canChangeConfig(override: boolean): boolean {
  if (getState() <= 1) return true;
  if (getSelf()?.isLeader) {
    if (getState() !== 5) return false;
    //is leader, allow
    return true;
  } else {
    //not leader, check if its being forced by tribe
    if (override) {
      return true;
    } else {
      return false;
    }
  }
}
