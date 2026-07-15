import { PaceCaret } from "@monkeytype/schemas/configs";
import { ValidModeRule } from "@monkeytype/schemas/configuration";

import { get as getServerConfiguration } from "../ape/server-configuration";
import { isAuthenticated } from "../states/core";
import { getCurrentQuote } from "../states/test";
import { getMode2 } from "../utils/misc";
import { getConfig } from "./store";

export type PaceCaretContext = {
  language: string;
  mode: string;
  mode2: string;
};

function matchesRule(value: string, rule: string): boolean {
  return new RegExp(`^${rule}$`).test(value);
}

function hasDailyLeaderboard(context: PaceCaretContext): boolean {
  const daily = getServerConfiguration()?.dailyLeaderboards;
  if (daily === undefined || !daily.enabled) return false;

  return daily.validModeRules.some(
    (rule: ValidModeRule) =>
      matchesRule(context.language, rule.language) &&
      matchesRule(context.mode, rule.mode) &&
      matchesRule(context.mode2, rule.mode2),
  );
}

export function isPaceCaretModeAvailable(
  mode: PaceCaret,
  context: PaceCaretContext,
): boolean {
  if (mode !== "next" && mode !== "nextDaily") return true;
  if (!isAuthenticated()) return false;

  if (mode === "next") {
    return (
      context.language === "english" &&
      context.mode === "time" &&
      (context.mode2 === "15" || context.mode2 === "60")
    );
  }

  return hasDailyLeaderboard(context);
}

export function getPaceCaretContext(): PaceCaretContext {
  return {
    language: getConfig.language,
    mode: getConfig.mode,
    mode2: getMode2(getConfig, getCurrentQuote()),
  };
}
