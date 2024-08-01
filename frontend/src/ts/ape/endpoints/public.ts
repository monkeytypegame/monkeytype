import {
  TypingStats,
  SpeedHistogram,
} from "@monkeytype/contracts/schemas/public";

const BASE_PATH = "/public";

type SpeedStatsQuery = {
  language: string;
  mode: string;
  mode2: string;
};

export default class Public {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async getSpeedHistogram(
    searchQuery: SpeedStatsQuery
  ): Ape.EndpointResponse<SpeedHistogram> {
    return await this.httpClient.get(`${BASE_PATH}/speedHistogram`, {
      searchQuery,
    });
  }

  async getTypingStats(): Ape.EndpointResponse<TypingStats> {
    return await this.httpClient.get(`${BASE_PATH}/typingStats`);
  }
}
