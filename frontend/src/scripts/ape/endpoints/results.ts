const BASE_PATH = "/results";

export default function getResultsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["results"] {
  async function get(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  async function save(
    result: MonkeyTypes.Result<MonkeyTypes.Mode>
  ): Ape.EndpointData {
    return await apeClient.post(BASE_PATH, { payload: { result } });
  }

  async function updateTags(
    resultId: string,
    tagIds: string[]
  ): Ape.EndpointData {
    return await apeClient.patch(`${BASE_PATH}/tags`, {
      payload: { resultId, tagIds },
    });
  }

  async function deleteAll(): Ape.EndpointData {
    return await apeClient.delete(BASE_PATH);
  }

  return { get, save, updateTags, deleteAll };
}
