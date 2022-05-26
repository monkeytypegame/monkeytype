const BASE_PATH = "/leaderboards";

export default function getLeaderboardsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["leaderboards"] {
  async function get(
    query: Ape.EndpointTypes.LeadeboardQueryWithPagination
  ): Ape.EndpointData {
    const { language, mode, mode2, isDaily, skip = 0, limit = 50 } = query;

    const searchQuery = {
      language,
      mode,
      mode2,
      skip: Math.max(skip, 0),
      limit: Math.max(Math.min(limit, 50), 0),
    };

    const endpointPath = `${BASE_PATH}/${isDaily ? "daily" : ""}`;

    return await apeClient.get(endpointPath, { searchQuery });
  }

  async function getRank(
    query: Ape.EndpointTypes.LeaderboardQuery
  ): Ape.EndpointData {
    const { language, mode, mode2, isDaily } = query;

    const searchQuery = {
      language,
      mode,
      mode2,
    };

    const endpointPath = `${BASE_PATH}${isDaily ? "/daily" : ""}/rank`;

    return await apeClient.get(endpointPath, { searchQuery });
  }

  return { get, getRank };
}
