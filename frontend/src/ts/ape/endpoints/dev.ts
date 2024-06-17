const BASE_PATH = "/dev";

export default class Dev {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async generateData(
    params: Ape.Dev.GenerateData
  ): Ape.EndpointResponse<Ape.Dev.GenerateDataResponse> {
    return await this.httpClient.post(BASE_PATH + "/generateData", {
      payload: params,
    });
  }
}
