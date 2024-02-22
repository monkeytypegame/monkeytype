export default class Root {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(): Ape.EndpointResponse<SharedTypes.Configuration> {
    return await this.httpClient.get("/configuration");
  }
}
