import { CLIENT_VERSION } from "../../version";

const BASE_PATH = "/public-stats";

interface SpeedStatsQuery {
  language: string;
  mode: string;
  mode2: string;
}

export default class PublicStats {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async getSpeedStats(searchQuery: SpeedStatsQuery): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/speed`, {
      searchQuery,
      headers: {
        "Client-Version": CLIENT_VERSION,
      },
    });
  }
}
