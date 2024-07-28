import { DBResult, Result } from "@monkeytype/shared-types";
import { Mode } from "@monkeytype/shared-types/config";

const BASE_PATH = "/results";

export default class Results {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async get(offset?: number): Ape.EndpointResponse<DBResult<Mode>[]> {
    return await this.httpClient.get(BASE_PATH, { searchQuery: { offset } });
  }

  async save(
    result: Result<Mode>
  ): Ape.EndpointResponse<Ape.Results.PostResult> {
    return await this.httpClient.post(BASE_PATH, {
      payload: { result },
    });
  }

  async updateTags(
    resultId: string,
    tagIds: string[]
  ): Ape.EndpointResponse<Ape.Results.PatchResult> {
    return await this.httpClient.patch(`${BASE_PATH}/tags`, {
      payload: { resultId, tagIds },
    });
  }

  async deleteAll(): Ape.EndpointResponse<Ape.Results.DeleteAll> {
    return await this.httpClient.delete(BASE_PATH);
  }
}
