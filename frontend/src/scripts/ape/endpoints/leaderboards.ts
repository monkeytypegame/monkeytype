const BASE_PATH = "/leaderboards";

export default function getLeaderboardsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Leaderboards {
  async function getLeaderboard(
    language: string,
    mode: MonkeyTypes.Mode,
    mode2: string | number,
    skip = 0,
    limit = 50
  ): Ape.EndpointData {
    const searchQuery = {
      language,
      mode,
      mode2,
      skip,
      limit: Math.max(Math.min(limit, 50), 0),
    };

    return await apeClient.get(BASE_PATH, { searchQuery });
  }

  async function getLeaderboardRank(
    language: string,
    mode: MonkeyTypes.Mode,
    mode2: string | number
  ): Ape.EndpointData {
    const searchQuery = {
      language,
      mode,
      mode2,
    };

    return await apeClient.get(`${BASE_PATH}/rank`, { searchQuery });
  }

  return { getLeaderboard, getLeaderboardRank };
}
