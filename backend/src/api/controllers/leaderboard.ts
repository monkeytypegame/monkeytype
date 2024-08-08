import _ from "lodash";
import {
  getCurrentDayTimestamp,
  MILLISECONDS_IN_DAY,
  getCurrentWeekTimestamp,
} from "../../utils/misc";
import { MonkeyResponse, MonkeyResponse2 } from "../../utils/monkey-response";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import MonkeyError from "../../utils/error";
import * as DailyLeaderboards from "../../utils/daily-leaderboards";
import * as WeeklyXpLeaderboard from "../../services/weekly-xp-leaderboard";
import {
  GetDailyLeaderboardQuery,
  GetDailyLeaderboardRankQuery,
  GetLeaderboardQuery,
  GetLeaderboardRankResponse,
  GetLeaderboardResponse as GetLeaderboardResponse,
  LanguageAndModeQuery,
} from "@monkeytype/contracts/leaderboards";
import { Configuration } from "@monkeytype/shared-types";

export async function getLeaderboard(
  req: MonkeyTypes.Request2<GetLeaderboardQuery>
): Promise<GetLeaderboardResponse> {
  const { language, mode, mode2, skip = 0, limit = 50 } = req.query;

  const leaderboard = await LeaderboardsDAL.get(
    mode,
    mode2,
    language,
    skip,
    limit
  );

  if (leaderboard === false) {
    throw new MonkeyError(
      503,
      "Leaderboard is currently updating. Please try again in a few seconds."
    );
  }

  const normalizedLeaderboard = leaderboard.map((it) => _.omit(it, ["_id"]));

  return new MonkeyResponse2("Leaderboard retrieved", normalizedLeaderboard);
}

export async function getRankFromLeaderboard(
  req: MonkeyTypes.Request2<LanguageAndModeQuery>
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

  return new MonkeyResponse2("Rank retrieved", data);
}

function getDailyLeaderboardWithError(
  { language, mode, mode2, daysBefore }: GetDailyLeaderboardRankQuery,
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
  req: MonkeyTypes.Request2<GetDailyLeaderboardQuery>
): Promise<MonkeyResponse> {
  const { skip = 0, limit = 50 } = req.query;

  const dailyLeaderboard = getDailyLeaderboardWithError(
    req.query,
    req.ctx.configuration.dailyLeaderboards
  );

  const minRank = skip;
  const maxRank = minRank + limit - 1;

  const topResults = await dailyLeaderboard.getResults(
    minRank,
    maxRank,
    req.ctx.configuration.dailyLeaderboards,
    req.ctx.configuration.users.premium.enabled
  );

  return new MonkeyResponse("Daily leaderboard retrieved", topResults);
}

export async function getDailyLeaderboardRank(
  req: MonkeyTypes.Request2<GetDailyLeaderboardRankQuery>
): Promise<MonkeyResponse> {
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
  req: MonkeyTypes.Request
): WeeklyXpLeaderboard.WeeklyXpLeaderboard {
  const { weeksBefore } = req.query;

  const normalizedWeeksBefore = parseInt(weeksBefore as string, 10);
  const currentWeekTimestamp = getCurrentWeekTimestamp();
  const weekBeforeTimestamp =
    currentWeekTimestamp - normalizedWeeksBefore * MILLISECONDS_IN_DAY * 7;

  const customTimestamp = _.isNil(weeksBefore) ? -1 : weekBeforeTimestamp;

  const weeklyXpLeaderboard = WeeklyXpLeaderboard.get(
    req.ctx.configuration.leaderboards.weeklyXp,
    customTimestamp
  );
  if (!weeklyXpLeaderboard) {
    throw new MonkeyError(404, "XP leaderboard for this week not found.");
  }

  return weeklyXpLeaderboard;
}

export async function getWeeklyXpLeaderboardResults(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { skip = 0, limit = 50 } = req.query;

  const minRank = parseInt(skip as string, 10);
  const maxRank = minRank + parseInt(limit as string, 10) - 1;

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(req);
  const results = await weeklyXpLeaderboard.getResults(
    minRank,
    maxRank,
    req.ctx.configuration.leaderboards.weeklyXp
  );

  return new MonkeyResponse("Weekly xp leaderboard retrieved", results);
}

export async function getWeeklyXpLeaderboardRank(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;
  console.log("8n8");

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(req);
  const rankEntry = await weeklyXpLeaderboard.getRank(
    uid,
    req.ctx.configuration.leaderboards.weeklyXp
  );

  return new MonkeyResponse("Weekly xp leaderboard rank retrieved", rankEntry);
}
