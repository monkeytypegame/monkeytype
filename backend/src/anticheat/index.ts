import {
  CompletedEvent,
  KeyStats,
} from "@monkeytype/contracts/schemas/results";

export function implemented(): boolean {
  return false;
}

export function validateResult(
  _result: object,
  _version: string,
  _uaStringifiedObject: string,
  _lbOptOut: boolean
): boolean {
  return true;
}

export function validateKeys(
  _result: CompletedEvent,
  _keySpacingStats: KeyStats,
  _keyDurationStats: KeyStats,
  _uid: string
): boolean {
  return true;
}
