import TribeSocket from "./tribe-socket";

let state = -1;

let room: TribeTypes.Room | undefined = undefined;

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
