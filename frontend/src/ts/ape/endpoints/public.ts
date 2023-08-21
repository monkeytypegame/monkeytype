const BASE_PATH = "/public";

interface SpeedStatsQuery {
  language: string;
  mode: string;
  mode2: string;
}

export default class Public {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async getSpeedHistogram(searchQuery: SpeedStatsQuery): Ape.Endpoint {
    return await this.httpClient.get(`${BASE_PATH}/speedHistogram`, {
      searchQuery,
    });
  }

  async getTypingStats(): Ape.Endpoint {
    return await this.httpClient.get(`${BASE_PATH}/typingStats`);
  }
}
