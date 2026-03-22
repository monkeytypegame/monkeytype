import { queryClient } from ".";
import {
  getContributorsQueryOptions,
  getSpeedHistogramQueryOptions,
  getSupportersQueryOptions,
  getTypingStatsQueryOptions,
} from "./public";
import { getLeaderboardQueryOptions } from "./leaderboards";

export function prefetchAboutPage(): void {
  void queryClient.prefetchQuery(getContributorsQueryOptions());
  void queryClient.prefetchQuery(getSupportersQueryOptions());
  void queryClient.prefetchQuery(getTypingStatsQueryOptions());
  void queryClient.prefetchQuery(getSpeedHistogramQueryOptions());
}

export function prefetchLeaderboardPage(): void {
  void queryClient.prefetchQuery(
    getLeaderboardQueryOptions({
      type: "allTime",
      mode: "time",
      mode2: "15",
      language: "english",
      friendsOnly: false,
      page: 0,
      previous: false,
    }),
  );
}
