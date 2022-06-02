import { CLIENT_VERSION } from "../../version";

const BASE_PATH = "/results";

export default class Results {
  constructor(private apeClient: Ape.HttpClient) {
    this.apeClient = apeClient;
  }

  async get(): Ape.EndpointData {
    return await this.apeClient.get(BASE_PATH);
  }

  async save(result: MonkeyTypes.Result<MonkeyTypes.Mode>): Ape.EndpointData {
    return await this.apeClient.post(BASE_PATH, {
      payload: { result },
      headers: { "Client-Version": CLIENT_VERSION },
    });
  }

  async updateTags(resultId: string, tagIds: string[]): Ape.EndpointData {
    return await this.apeClient.patch(`${BASE_PATH}/tags`, {
      payload: { resultId, tagIds },
    });
  }

  async deleteAll(): Ape.EndpointData {
    return await this.apeClient.delete(BASE_PATH);
  }
}
