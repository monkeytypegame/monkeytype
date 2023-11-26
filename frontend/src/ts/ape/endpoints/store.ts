const BASE_PATH = "/store";
export default class Store {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async createCheckout(item: string): Ape.EndpointResponse {
    const payload = {
      items: [{ lookupKey: item }],
    };

    return await this.httpClient.post(`${BASE_PATH}/checkouts`, { payload });
  }

  async finalizeCheckout(sessionId: string): Ape.EndpointResponse {
    return await this.httpClient.post(
      `${BASE_PATH}/checkouts/${sessionId}`,
      {}
    );
  }
}
