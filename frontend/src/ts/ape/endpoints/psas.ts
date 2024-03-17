const BASE_PATH = "/psas";

export default class Psas {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(): Ape.EndpointResponse<SharedTypes.PSA[]> {
    return await this.httpClient.get(BASE_PATH);
  }
}
