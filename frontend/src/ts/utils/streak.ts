import type { Mode } from "@monkeytype/schemas/shared";
import {
  getCurrentDayTimestamp,
  getStartOfDayTimestamp,
  MILISECONDS_IN_HOUR,
  MILLISECONDS_IN_DAY,
  isToday as dateIsToday,
  isYesterday as dateIsYesterday,
} from "@monkeytype/util/date-and-time";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";

import type { SnapshotResult } from "../constants/default-snapshot";

type StreakLastResult = Pick<SnapshotResult<Mode>, "timestamp">;

type StreakSnapshot = {
  streak: number;
  maxStreak: number;
  streakLastResultTimestamp?: number;
  streakHourOffset?: number;
};

export type StreakIndicatorState = {
  show: boolean;
  claimedToday: boolean;
  label?: string;
  hoverText: string;
};

export function formatStreak(length: number): string {
  return `${length} ${length === 1 ? "day" : "days"}`;
}

export function hasClaimedStreakToday(
  lastResult: StreakLastResult | undefined,
  streakHourOffset: number | undefined,
): boolean {
  return (
    lastResult !== undefined &&
    dateIsToday(lastResult.timestamp, streakHourOffset)
  );
}

export function hasLostStreak(
  lastResult: StreakLastResult | undefined,
  streakHourOffset: number | undefined,
): boolean {
  return (
    lastResult !== undefined &&
    !dateIsToday(lastResult.timestamp, streakHourOffset) &&
    !dateIsYesterday(lastResult.timestamp, streakHourOffset)
  );
}

export function getStreakExtraText(
  lastResult: StreakLastResult | undefined,
  streakHourOffset: number | undefined,
): string {
  if (lastResult === undefined) return "";

  let hoverText = "";
  let target = getCurrentDayTimestamp(streakHourOffset) + MILLISECONDS_IN_DAY;
  if (target < Date.now()) {
    target += MILLISECONDS_IN_DAY;
  }
  const timeDif = formatDistanceToNowStrict(target);
  const isToday = dateIsToday(lastResult.timestamp, streakHourOffset);
  const isYesterday = dateIsYesterday(lastResult.timestamp, streakHourOffset);
  const offsetString = isSafeNumber(streakHourOffset)
    ? ` (${streakHourOffset > 0 ? "+" : ""}${streakHourOffset} offset)`
    : "";

  if (isToday) {
    hoverText += `\nClaimed today: yes`;
    hoverText += `\nCome back in: ${timeDif}${offsetString}`;
  } else if (isYesterday) {
    hoverText += `\nClaimed today: no`;
    hoverText += `\nStreak lost in: ${timeDif}${offsetString}`;
  } else {
    const offsetMilis = (streakHourOffset ?? 0) * MILISECONDS_IN_HOUR;
    const lostAt =
      getStartOfDayTimestamp(lastResult.timestamp, offsetMilis) +
      MILLISECONDS_IN_DAY * 2;
    const lostTimeDif = formatDistanceToNowStrict(lostAt);
    hoverText += `\nStreak lost ${lostTimeDif}${offsetString} ago`;
    hoverText += `\nIt will be removed from your profile on the next result save`;
  }

  if (streakHourOffset === undefined) {
    hoverText += `\n\nIf the streak reset time doesn't line up with your timezone, you can change it in Account Settings > Account > Set streak hour offset.`;
  }

  return hoverText;
}

export function getStreakHoverText(args: {
  maxStreak: number;
  lastResult?: StreakLastResult;
  streakHourOffset?: number;
  showExtraText?: boolean;
}): string {
  return `Longest streak: ${formatStreak(args.maxStreak)}${
    args.showExtraText === true
      ? getStreakExtraText(args.lastResult, args.streakHourOffset)
      : ""
  }`;
}

export function getStreakLastResult(
  snapshot: StreakSnapshot,
  lastResult: SnapshotResult<Mode> | undefined,
): StreakLastResult | undefined {
  const timestamp = snapshot.streakLastResultTimestamp ?? lastResult?.timestamp;

  if (timestamp === undefined || timestamp <= 0) {
    return undefined;
  }

  return { timestamp };
}

export function getStreakIndicatorState(
  snapshot: StreakSnapshot | undefined,
  lastResult: SnapshotResult<Mode> | undefined,
): StreakIndicatorState {
  if (snapshot === undefined) {
    return {
      show: false,
      claimedToday: false,
      hoverText: "",
    };
  }

  const hasActiveStreak = snapshot.streak > 0;
  const streakLastResult = getStreakLastResult(snapshot, lastResult);
  const claimedToday =
    hasActiveStreak &&
    hasClaimedStreakToday(streakLastResult, snapshot.streakHourOffset);
  const lostStreak =
    hasActiveStreak &&
    hasLostStreak(streakLastResult, snapshot.streakHourOffset);

  const label = lostStreak ? "0" : `${snapshot.streak}`;

  return {
    show: true,
    claimedToday,
    label,
    hoverText: getStreakHoverText({
      maxStreak: snapshot.maxStreak,
      lastResult: hasActiveStreak ? streakLastResult : undefined,
      streakHourOffset: snapshot.streakHourOffset,
      showExtraText: hasActiveStreak,
    }),
  };
}
