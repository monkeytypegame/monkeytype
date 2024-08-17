import { Configuration } from "@monkeytype/contracts/schemas/configurations";

export default class Root {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(): Ape.EndpointResponse<Configuration> {
    return await this.httpClient.get("/configuration");
  }
}
