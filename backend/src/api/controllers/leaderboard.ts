import _ from "lodash";
import {
  getCurrentDayTimestamp,
  MILLISECONDS_IN_DAY,
  getCurrentWeekTimestamp,
} from "../../utils/misc";
import { MonkeyResponse } from "../../utils/monkey-response";
import * as LeaderboardsDAL from "../../dal/leaderboards";
import MonkeyError from "../../utils/error";
import * as DailyLeaderboards from "../../utils/daily-leaderboards";
import * as WeeklyXpLeaderboard from "../../services/weekly-xp-leaderboard";

export async function getLeaderboard(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2, skip, limit = 50 } = req.query;

  const queryLimit = Math.min(parseInt(limit as string, 10), 50);

  const leaderboard = await LeaderboardsDAL.get(
    mode as string,
    mode2 as string,
    language as string,
    parseInt(skip as string, 10),
    queryLimit
  );

  if (leaderboard === false) {
    return new MonkeyResponse(
      "Leaderboard is currently updating. Please try again in a few seconds.",
      null,
      503
    );
  }

  const normalizedLeaderboard = leaderboard.map((it) => _.omit(it, ["_id"]));

  return new MonkeyResponse("Leaderboard retrieved", normalizedLeaderboard);
}

export async function getRankFromLeaderboard(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { language, mode, mode2 } = req.query;
  const { uid } = req.ctx.decodedToken;

  const data = await LeaderboardsDAL.getRank(
    mode as string,
    mode2 as string,
    language as string,
    uid
  );
  if (data === false) {
    return new MonkeyResponse(
      "Leaderboard is currently updating. Please try again in a few seconds.",
      null,
      503
    );
  }

  return new MonkeyResponse("Rank retrieved", data);
}

function getDailyLeaderboardWithError(
  req: MonkeyTypes.Request
): DailyLeaderboards.DailyLeaderboard {
  const { language, mode, mode2, daysBefore } = req.query;

  const normalizedDayBefore = parseInt(daysBefore as string, 10);
  const currentDayTimestamp = getCurrentDayTimestamp();
  const dayBeforeTimestamp =
    currentDayTimestamp - normalizedDayBefore * MILLISECONDS_IN_DAY;

  const customTimestamp = _.isNil(daysBefore) ? -1 : dayBeforeTimestamp;

  const dailyLeaderboard = DailyLeaderboards.getDailyLeaderboard(
    language as string,
    mode as string,
    mode2 as string,
    req.ctx.configuration.dailyLeaderboards,
    customTimestamp
  );
  if (!dailyLeaderboard) {
    throw new MonkeyError(404, "There is no daily leaderboard for this mode");
  }

  return dailyLeaderboard;
}

export async function getDailyLeaderboard(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { skip = 0, limit = 50 } = req.query;

  const dailyLeaderboard = getDailyLeaderboardWithError(req);

  const minRank = parseInt(skip as string, 10);
  const maxRank = minRank + parseInt(limit as string, 10) - 1;

  const topResults = await dailyLeaderboard.getResults(
    minRank,
    maxRank,
    req.ctx.configuration.dailyLeaderboards,
    req.ctx.configuration.users.premium.enabled
  );

  return new MonkeyResponse("Daily leaderboard retrieved", topResults);
}

export async function getDailyLeaderboardRank(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const dailyLeaderboard = getDailyLeaderboardWithError(req);

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

  const weeklyXpLeaderboard = getWeeklyXpLeaderboardWithError(req);
  const rankEntry = await weeklyXpLeaderboard.getRank(
    uid,
    req.ctx.configuration.leaderboards.weeklyXp
  );

  return new MonkeyResponse("Weekly xp leaderboard rank retrieved", rankEntry);
}
