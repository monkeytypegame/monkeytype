import _ from "lodash";
import { MonkeyResponse } from "../../utils/monkey-response";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import MonkeyError from "../../utils/error";
import * as DailyLeaderboards from "../../utils/daily-leaderboards";
import * as WeeklyXpLeaderboard from "../../services/weekly-xp-leaderboard";
import {
  DailyLeaderboardQuery,
  GetDailyLeaderboardQuery,
  GetDailyLeaderboardRankQuery,
  GetDailyLeaderboardResponse,
  GetLeaderboardDailyRankResponse,
  GetLeaderboardQuery,
  GetLeaderboardRankQuery,
  GetLeaderboardRankResponse,
  GetLeaderboardResponse,
  GetWeeklyXpLeaderboardQuery,
  GetWeeklyXpLeaderboardRankQuery,
  GetWeeklyXpLeaderboardRankResponse,
  GetWeeklyXpLeaderboardResponse,
} from "@monkeytype/contracts/leaderboards";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import {
  getCurrentDayTimestamp,
  getCurrentWeekTimestamp,
  MILLISECONDS_IN_DAY,
} from "@monkeytype/util/date-and-time";
import { MonkeyRequest } from "../types";

export async function getLeaderboard(
  req: MonkeyRequest<GetLeaderboardQuery>
): Promise<GetLeaderboardResponse> {
  const { language, mode, mode2, page, pageSize } = req.query;

  const leaderboard = await LeaderboardsDAL.get(
    mode,
    mode2,
    language,
    page,
    pageSize
  );

  if (leaderboard === false) {
    throw new MonkeyError(
      503,
      "Leaderboard is currently updating. Please try again in a few seconds."
    );
  }

  const count = await LeaderboardsDAL.getCount(mode, mode2, language);
  const normalizedLeaderboard = leaderboard.map((it) => _.omit(it, ["_id"]));

  return new MonkeyResponse("Leaderboard retrieved", {
    count,
    entries: normalizedLeaderboard,
    pageSize,
  });
}

export async function getRankFromLeaderboard(
  req: MonkeyRequest<GetLeaderboardRankQuery>
): Promise<GetLeaderboardRankResponse> {
  const { language, mode, mode2 } = req.query;
  const { uid } = req.ctx.decodedToken;

  const data = await LeaderboardsDAL.getRank(mode, mode2, language, uid);
  if (data === false) {
    throw new MonkeyError(
      503,
      "Leaderboard is currently updating. Please try again in a few seconds."
    );
  }

  return new MonkeyResponse("Rank retrieved", data);
}

function getDailyLeaderboardWithError(
  { language, mode, mode2, daysBefore }: DailyLeaderboardQuery,
  config: Configuration["dailyLeaderboards"]
): DailyLeaderboards.DailyLeaderboard {
  const customTimestamp =
    daysBefore === undefined
      ? -1
      : getCurrentDayTimestamp() - daysBefore * MILLISECONDS_IN_DAY;

  const dailyLeaderboard = DailyLeaderboards.getDailyLeaderboard(
    language,
    mode,
    mode2,
    config,
    customTimestamp
  );
  if (!dailyLeaderboard) {
    throw new MonkeyError(404, "There is no daily leaderboard for this mode");
  }

  return dailyLeaderboard;
}

export async function getDailyLeaderboard(
  req: MonkeyRequest<GetDailyLeaderboardQuery>
): Promise<GetDailyLeaderboardResponse> {
  const { page, pageSize } = req.query;

  const dailyLeaderboard = getDailyLeaderboardWithError(
    req.query,
    req.ctx.configuration.dailyLeaderboards
  );

  const results = await dailyLeaderboard.getResults(
    page,
    pageSize,
    req.ctx.configuration.dailyLeaderboards,
    req.ctx.configuration.users.premium.enabled
  );

  const minWpm = await dailyLeaderboard.getMinWpm(
    req.ctx.configuration.dailyLeaderboards
  );

  const count = await dailyLeaderboard.getCount();

  return new MonkeyResponse("Daily leaderboard retrieved", {
    entries: results,
    minWpm,
    count,
    pageSize,
  });
}

export async function getDailyLeaderboardRank(
  req: MonkeyRequest<GetDailyLeaderboardRankQuery>
): Promise<GetLeaderboardDailyRankResponse> {
  const { uid } = req.ctx.decodedToken;

  const dailyLeaderboard = getDailyLeaderboardWithError(
    req.query,
    req.ctx.configuration.dailyLeaderboards
  );

  const rank = await dailyLeaderboard.getRank(
    uid,
    req.ctx.configuration.dailyLeaderboards
  );

  return new MonkeyResponse("Daily leaderboard rank retrieved", rank);
}

function getWeeklyXpLeaderboardWithError(
  config: Configuration["leaderboards"]["weeklyXp"],
  weeksBefore?: number
): WeeklyXpLeaderboard.WeeklyXpLeaderboard {
  const customTimestamp =
    weeksBefore === undefined
      ? -1
      : getCurrentWeekTimestamp() - weeksBefore * MILLISECONDS_IN_DAY * 7;

  const weeklyXpLeaderboard = WeeklyXpLeaderboard.get(config, customTimestamp);
  if (!weeklyXpLeaderboard) {
    throw new MonkeyError(404, "XP leaderboard for this week not found.");
  }

  return weeklyXpLeaderboard;
}

export async function getWeeklyXpLeaderboardResults(
  req: MonkeyRequest<GetWeeklyXpLeaderboardQuery>
): Promise<GetWeeklyXpLeaderboardResponse> {
  const { page, pageSize, weeksBefore } = req.query;

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
    req.ctx.configuration.leaderboards.weeklyXp,
    weeksBefore
  );
  const results = await weeklyXpLeaderboard.getResults(
    page,
    pageSize,
    req.ctx.configuration.leaderboards.weeklyXp,
    req.ctx.configuration.users.premium.enabled
  );

  const count = await weeklyXpLeaderboard.getCount();

  return new MonkeyResponse("Weekly xp leaderboard retrieved", {
    entries: results,
    count,
    pageSize,
  });
}

export async function getWeeklyXpLeaderboardRank(
  req: MonkeyRequest<GetWeeklyXpLeaderboardRankQuery>
): Promise<GetWeeklyXpLeaderboardRankResponse> {
  const { uid } = req.ctx.decodedToken;

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(
    req.ctx.configuration.leaderboards.weeklyXp,
    req.query.weeksBefore
  );
  const rankEntry = await weeklyXpLeaderboard.getRank(
    uid,
    req.ctx.configuration.leaderboards.weeklyXp
  );

  return new MonkeyResponse("Weekly xp leaderboard rank retrieved", rankEntry);
}
