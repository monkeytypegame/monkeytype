const BASE_PATH = "/ape-keys";

export default class ApeKeys {
  constructor(private apeClient: Ape.HttpClient) {
    this.apeClient = apeClient;
  }

  async get(): Ape.EndpointData {
    return await this.apeClient.get(BASE_PATH);
  }

  async generate(name: string, enabled: boolean): Ape.EndpointData {
    const payload = { name, enabled };
    return await this.apeClient.post(BASE_PATH, { payload });
  }

  async update(
    apeKeyId: string,
    updates: { name?: string; enabled?: boolean }
  ): Ape.EndpointData {
    const payload = { ...updates };
    return await this.apeClient.patch(`${BASE_PATH}/${apeKeyId}`, { payload });
  }

  async delete(apeKeyId: string): Ape.EndpointData {
    return await this.apeClient.delete(`${BASE_PATH}/${apeKeyId}`);
  }
}
