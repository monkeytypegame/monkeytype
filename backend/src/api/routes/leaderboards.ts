import { initServer } from "@ts-rest/express";
import * as LeaderboardController from "../controllers/leaderboard";
import { leaderboardsContract } from "@monkeytype/contracts/leaderboards";
import { callController } from "../ts-rest-adapter";

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
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboard)(r),
  },
  getDailyRank: {
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboardRank)(r),
  },
  getWeeklyXp: {
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboardResults)(r),
  },
  getWeeklyXpRank: {
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboardRank)(r),
  },
});
