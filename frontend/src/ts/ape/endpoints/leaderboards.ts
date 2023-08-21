const BASE_PATH = "/leaderboards";

interface LeaderboardQuery {
  language: string;
  mode: MonkeyTypes.Mode;
  mode2: string;
  isDaily?: boolean;
  daysBefore?: number;
}

interface LeadeboardQueryWithPagination extends LeaderboardQuery {
  skip?: number;
  limit?: number;
}

export default class Leaderboards {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(query: LeadeboardQueryWithPagination): Ape.EndpointResponse {
    const {
      language,
      mode,
      mode2,
      isDaily,
      skip = 0,
      limit = 50,
      daysBefore,
    } = query;
    const includeDaysBefore = isDaily && daysBefore;

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

  async getRank(query: LeaderboardQuery): Ape.EndpointResponse {
    const { language, mode, mode2, isDaily, daysBefore } = query;
    const includeDaysBefore = isDaily && daysBefore;

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
