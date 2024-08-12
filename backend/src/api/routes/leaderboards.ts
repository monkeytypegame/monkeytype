import { initServer } from "@ts-rest/express";
import { withApeRateLimiter } from "../../middlewares/ape-rate-limit";
import { validate } from "../../middlewares/configuration";
import * as RateLimit from "../../middlewares/rate-limit";
import * as LeaderboardController from "../controllers/leaderboard";

import { leaderboardsContract } from "@monkeytype/contracts/leaderboards";
import { callController } from "../ts-rest-adapter";

const requireDailyLeaderboardsEnabled = validate({
  criteria: (configuration) => {
    return configuration.dailyLeaderboards.enabled;
  },
  invalidMessage: "Daily leaderboards are not available at this time.",
});

const requireWeeklyXpLeaderboardEnabled = validate({
  criteria: (configuration) => {
    return configuration.leaderboards.weeklyXp.enabled;
  },
  invalidMessage: "Weekly XP leaderboards are not available at this time.",
});

const s = initServer();
export default s.router(leaderboardsContract, {
  get: {
    middleware: [RateLimit.leaderboardsGet],
    handler: async (r) =>
      callController(LeaderboardController.getLeaderboard)(r),
  },
  getRank: {
    middleware: [withApeRateLimiter(RateLimit.leaderboardsGet)],
    handler: async (r) =>
      callController(LeaderboardController.getRankFromLeaderboard)(r),
  },
  getDaily: {
    middleware: [requireDailyLeaderboardsEnabled, RateLimit.leaderboardsGet],
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboard)(r),
  },
  getDailyRank: {
    middleware: [requireDailyLeaderboardsEnabled, RateLimit.leaderboardsGet],
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboardRank)(r),
  },
  getWeeklyXp: {
    middleware: [requireWeeklyXpLeaderboardEnabled, RateLimit.leaderboardsGet],
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboardResults)(r),
  },
  getWeeklyXpRank: {
    middleware: [requireWeeklyXpLeaderboardEnabled, RateLimit.leaderboardsGet],
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboardRank)(r),
  },
});
