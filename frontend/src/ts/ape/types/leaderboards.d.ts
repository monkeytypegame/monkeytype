/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.Leaderboards {
  interface Query {
    language: string;
    mode: SharedTypes.Config.Mode;
    mode2: string;
    isDaily?: boolean;
    daysBefore?: number;
  }

  interface QueryWithPagination extends Query {
    skip?: number;
    limit?: number;
  }

  type GetLeaderboard = SharedTypes.LeaderboardEntry[];

  type GetRank = {
    minWpm: number;
    count: number;
    rank: number | null;
    entry: SharedTypes.LeaderboardEntry | null;
  };
}
