const BASE_PATH = "/configs";

export default class Configs {
  constructor(private apeClient: Ape.HttpClient) {
    this.apeClient = apeClient;
  }

  async get(): Ape.EndpointData {
    return await this.apeClient.get(BASE_PATH);
  }

  async save(config: MonkeyTypes.Config): Ape.EndpointData {
    return await this.apeClient.patch(BASE_PATH, { payload: { config } });
  }
}
