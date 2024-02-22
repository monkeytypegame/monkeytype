const BASE_PATH = "/leaderboards";

export default class Leaderboards {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(
    query: Ape.Leaderboards.QueryWithPagination
  ): Ape.EndpointResponse<Ape.Leaderboards.GetLeaderboard> {
    const {
      language,
      mode,
      mode2,
      isDaily,
      skip = 0,
      limit = 50,
      daysBefore,
    } = query;
    const includeDaysBefore = (isDaily ?? false) && (daysBefore ?? 0) > 0;

    const searchQuery = {
      language,
      mode,
      mode2,
      skip: Math.max(skip, 0),
      limit: Math.max(Math.min(limit, 50), 0),
      ...(includeDaysBefore && { daysBefore }),
    };

    const endpointPath = `${BASE_PATH}/${isDaily ? "daily" : ""}`;

    return await this.httpClient.get(endpointPath, { searchQuery });
  }

  async getRank(
    query: Ape.Leaderboards.Query
  ): Ape.EndpointResponse<Ape.Leaderboards.GetRank> {
    const { language, mode, mode2, isDaily, daysBefore } = query;
    const includeDaysBefore = (isDaily ?? false) && (daysBefore ?? 0) > 0;

    const searchQuery = {
      language,
      mode,
      mode2,
      ...(includeDaysBefore && { daysBefore }),
    };

    const endpointPath = `${BASE_PATH}${isDaily ? "/daily" : ""}/rank`;

    return await this.httpClient.get(endpointPath, { searchQuery });
  }
}
