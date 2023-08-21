const BASE_PATH = "/results";

export default class Results {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(): Ape.EndpointResponse {
    return await this.httpClient.get(BASE_PATH);
  }

  async save(
    result: MonkeyTypes.Result<MonkeyTypes.Mode>
  ): Ape.EndpointResponse {
    return await this.httpClient.post(BASE_PATH, {
      payload: { result },
    });
  }

  async updateTags(resultId: string, tagIds: string[]): Ape.EndpointResponse {
    return await this.httpClient.patch(`${BASE_PATH}/tags`, {
      payload: { resultId, tagIds },
    });
  }

  async deleteAll(): Ape.EndpointResponse {
    return await this.httpClient.delete(BASE_PATH);
  }
}
