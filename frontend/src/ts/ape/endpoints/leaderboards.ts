const BASE_PATH = "/leaderboards";

interface LeaderboardQuery {
  language: string;
  mode: MonkeyTypes.Mode;
  mode2: string | number;
  isDaily?: boolean;
}

interface LeadeboardQueryWithPagination extends LeaderboardQuery {
  skip?: number;
  limit?: number;
}

export default class Leaderboards {
  constructor(private apeClient: Ape.HttpClient) {
    this.apeClient = apeClient;
  }

  async get(query: LeadeboardQueryWithPagination): Ape.EndpointData {
    const { language, mode, mode2, isDaily, skip = 0, limit = 50 } = query;

    const searchQuery = {
      language,
      mode,
      mode2,
      skip: Math.max(skip, 0),
      limit: Math.max(Math.min(limit, 50), 0),
    };

    const endpointPath = `${BASE_PATH}/${isDaily ? "daily" : ""}`;

    return await this.apeClient.get(endpointPath, { searchQuery });
  }

  async getRank(query: LeaderboardQuery): Ape.EndpointData {
    const { language, mode, mode2, isDaily } = query;

    const searchQuery = {
      language,
      mode,
      mode2,
    };

    const endpointPath = `${BASE_PATH}${isDaily ? "/daily" : ""}/rank`;

    return await this.apeClient.get(endpointPath, { searchQuery });
  }
}
