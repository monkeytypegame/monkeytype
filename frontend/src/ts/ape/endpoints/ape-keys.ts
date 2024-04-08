const BASE_PATH = "/ape-keys";

export default class ApeKeys {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(): Ape.EndpointResponse<Ape.ApeKeys.GetApeKeys> {
    return await this.httpClient.get(BASE_PATH);
  }

  async generate(
    name: string,
    enabled: boolean
  ): Ape.EndpointResponse<Ape.ApeKeys.GenerateApeKey> {
    const payload = { name, enabled };
    return await this.httpClient.post(BASE_PATH, { payload });
  }

  async update(
    apeKeyId: string,
    updates: { name?: string; enabled?: boolean }
  ): Ape.EndpointResponse<null> {
    const payload = { ...updates };
    const encoded = encodeURIComponent(apeKeyId);
    return await this.httpClient.patch(`${BASE_PATH}/${encoded}`, { payload });
  }

  async delete(apeKeyId: string): Ape.EndpointResponse<null> {
    const encoded = encodeURIComponent(apeKeyId);
    return await this.httpClient.delete(`${BASE_PATH}/${encoded}`);
  }
}
