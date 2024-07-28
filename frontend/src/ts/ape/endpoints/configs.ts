import { Config } from "@monkeytype/shared-types/config";

const BASE_PATH = "/configs";

export default class Configs {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(): Ape.EndpointResponse<Ape.Configs.GetConfig> {
    return await this.httpClient.get(BASE_PATH);
  }

  async save(config: Config): Ape.EndpointResponse<Ape.Configs.PostConfig> {
    return await this.httpClient.patch(BASE_PATH, { payload: { config } });
  }
}
