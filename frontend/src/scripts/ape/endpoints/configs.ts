const BASE_PATH = "/configs";

export default function getConfigsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["configs"] {
  async function get(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  async function save(config: MonkeyTypes.Config): Ape.EndpointData {
    return await apeClient.patch(BASE_PATH, { payload: { config } });
  }

  return {
    get,
    save,
  };
}
