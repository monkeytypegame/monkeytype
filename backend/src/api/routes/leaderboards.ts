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
  getNext: {
    handler: async (r) =>
      callController(LeaderboardController.getNextLeaderboardWpm)(r),
  },
  getDaily: {
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboard)(r),
  },
  getDailyRank: {
    handler: async (r) =>
      callController(LeaderboardController.getDailyLeaderboardRank)(r),
  },
  getDailyNext: {
    handler: async (r) =>
      callController(LeaderboardController.getNextDailyLeaderboardWpm)(r),
  },
  getWeeklyXp: {
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboard)(r),
  },
  getWeeklyXpRank: {
    handler: async (r) =>
      callController(LeaderboardController.getWeeklyXpLeaderboardRank)(r),
  },
});
