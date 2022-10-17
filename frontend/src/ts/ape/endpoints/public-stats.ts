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

  async getSpeedHistogram(searchQuery: SpeedStatsQuery): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/speedHistogram`, {
      searchQuery,
    });
  }

  async getTypingStats(): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/typingStats`);
  }
}
