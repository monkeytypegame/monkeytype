const BASE_PATH = "/presets";

export default class Presets {
  constructor(private apeClient: Ape.HttpClient) {
    this.apeClient = apeClient;
  }

  async get(): Ape.EndpointData {
    return await this.apeClient.get(BASE_PATH);
  }

  async add(
    presetName: string,
    configChanges: MonkeyTypes.ConfigChanges
  ): Ape.EndpointData {
    const payload = {
      name: presetName,
      config: configChanges,
    };

    return await this.apeClient.post(BASE_PATH, { payload });
  }

  async edit(
    presetId: string,
    presetName: string,
    configChanges: MonkeyTypes.ConfigChanges
  ): Ape.EndpointData {
    const payload = {
      _id: presetId,
      name: presetName,
      config: configChanges,
    };

    return await this.apeClient.patch(BASE_PATH, { payload });
  }

  async delete(presetId: string): Ape.EndpointData {
    return await this.apeClient.delete(`${BASE_PATH}/${presetId}`);
  }
}
