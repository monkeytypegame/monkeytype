import { CLIENT_VERSION } from "../../version";

const BASE_PATH = "/psas";

export default class Psas {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(adChoice: string): Ape.EndpointData {
    return await this.httpClient.get(BASE_PATH, {
      headers: {
        "Client-Version": CLIENT_VERSION,
      },
      searchQuery: {
        adChoice,
      },
    });
  }
}
