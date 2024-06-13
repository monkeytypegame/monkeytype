/* eslint-disable @typescript-eslint/no-unused-vars */
// for some reason when using the dot notaion, the types are not being recognized as used
declare namespace Ape.Leaderboards {
  type Query = {
    language: string;
    mode: SharedTypes.Config.Mode;
    mode2: string;
    isDaily?: boolean;
    daysBefore?: number;
  };

  type QueryWithPagination = {
    skip?: number;
    limit?: number;
  } & Query;

  type GetLeaderboard = SharedTypes.LeaderboardEntry[];

  type GetRank = {
    minWpm: number;
    count: number;
    rank: number | null;
    entry: SharedTypes.LeaderboardEntry | null;
  };
}
