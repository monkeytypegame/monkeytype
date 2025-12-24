import { getRoom, getSelf } from "./tribe-state";

export function canChangeConfig(override: boolean): boolean {
  const room = getRoom();

  if (room === undefined) return true;

  if (getSelf()?.isLeader) {
    if (room.state !== "LOBBY") return false;
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
