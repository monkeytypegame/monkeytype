const BASE_PATH = "/configs";

export default class Configs {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(): Ape.EndpointResponse {
    return await this.httpClient.get(BASE_PATH);
  }

  async save(config: MonkeyTypes.Config): Ape.EndpointResponse {
    return await this.httpClient.patch(BASE_PATH, { payload: { config } });
  }
}
