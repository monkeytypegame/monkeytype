import { CLIENT_VERSION } from "../../version";

const BASE_PATH = "/psas";

export default class Psas {
  constructor(private apeClient: Ape.HttpClient) {
    this.apeClient = apeClient;
  }

  async get(): Ape.EndpointData {
    return await this.apeClient.get(BASE_PATH, {
      headers: {
        "Client-Version": CLIENT_VERSION,
      },
    });
  }
}
