const hasAnticheatImplemented = process.env["BYPASS_ANTICHEAT"] === "true";

import {
  CompletedEvent,
  KeyStats,
} from "@monkeytype/contracts/schemas/results";
import Logger from "../utils/logger";

export function implemented(): boolean {
  if (hasAnticheatImplemented) {
    Logger.warning("BYPASS_ANTICHEAT is enabled! Running without anti-cheat.");
  }
  return hasAnticheatImplemented;
}

export function validateResult(
  _result: object,
  _version: string,
  _uaStringifiedObject: string,
  _lbOptOut: boolean
): boolean {
  Logger.warning("No anticheat module found, result will not be validated.");
  return true;
}

export function validateKeys(
  _result: CompletedEvent,
  _keySpacingStats: KeyStats,
  _keyDurationStats: KeyStats,
  _uid: string
): boolean {
  Logger.warning("No anticheat module found, key data will not be validated.");
  return true;
}
