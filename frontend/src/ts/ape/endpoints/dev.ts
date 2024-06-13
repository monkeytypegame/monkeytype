const BASE_PATH = "/dev";

export default class Dev {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async addTestData(
    params: Ape.Dev.CreateTestData
  ): Ape.EndpointResponse<Ape.Dev.CreateTestDataResponse> {
    return await this.httpClient.post(BASE_PATH + "/testData", {
      payload: params,
    });
  }
}
