import TribeSocket from "./tribe-socket";

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
