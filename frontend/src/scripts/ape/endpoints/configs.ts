const BASE_PATH = "/configs";

export default function getConfigsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Configs {
  async function getConfig(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  return {
    getConfig,
  };
}
