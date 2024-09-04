import { initServer } from "@ts-rest/express";
import { validate } from "../../middlewares/configuration";
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
    handler: async (r) =>
      callController(LeaderboardController.getLeaderboard)(r),
  },
  getRank: {
    handler: async (r) =>
      callController(LeaderboardController.getRankFromLeaderboard)(r),
  },
  getDaily: {
    middleware: [requireDailyLeaderboardsEnabled],
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboard)(r),
  },
  getDailyRank: {
    middleware: [requireDailyLeaderboardsEnabled],
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboardRank)(r),
  },
  getWeeklyXp: {
    middleware: [requireWeeklyXpLeaderboardEnabled],
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboardResults)(r),
  },
  getWeeklyXpRank: {
    middleware: [requireWeeklyXpLeaderboardEnabled],
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboardRank)(r),
  },
});
