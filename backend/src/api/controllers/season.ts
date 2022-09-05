import _ from "lodash";
import MonkeyError from "../../utils/error";
import { MonkeyResponse } from "../../utils/monkey-response";
import { getWeeklySeason, WeeklySeason } from "../../services/weekly-seasons";
import { getCurrentWeekTimestamp, MILLISECONDS_IN_DAY } from "../../utils/misc";

function getWeeklySeasonWithError(req: MonkeyTypes.Request): WeeklySeason {
  const { weeksBefore } = req.query;

  const normalizedWeeksBefore = parseInt(weeksBefore as string, 10);
  const currentDayTimestamp = getCurrentWeekTimestamp();
  const weekBeforeTimestamp =
    currentDayTimestamp - normalizedWeeksBefore * MILLISECONDS_IN_DAY;

  const customTimestamp = _.isNil(weeksBefore) ? -1 : weekBeforeTimestamp;

  const weeklySeason = getWeeklySeason(
    req.ctx.configuration.seasons.weekly,
    customTimestamp
  );
  if (!weeklySeason) {
    throw new MonkeyError(404, "There is no season for this week.");
  }

  return weeklySeason;
}

export async function getWeeklySeasonResults(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { skip = 0, limit = 50 } = req.query;

  const minRank = parseInt(skip as string, 10);
  const maxRank = minRank + parseInt(limit as string, 10) - 1;

  const weeklySeason = getWeeklySeasonWithError(req);
  const results = await weeklySeason.getResults(
    minRank,
    maxRank,
    req.ctx.configuration.seasons.weekly
  );

  return new MonkeyResponse("Weekly season retrieved", results);
}

export async function getWeeklySeasonRank(
  req: MonkeyTypes.Request
): Promise<MonkeyResponse> {
  const { uid } = req.ctx.decodedToken;

  const weeklySeason = getWeeklySeasonWithError(req);
  const rankEntry = await weeklySeason.getRank(
    uid,
    req.ctx.configuration.seasons.weekly
  );

  return new MonkeyResponse("Weekly season rank retrieved", rankEntry);
}
