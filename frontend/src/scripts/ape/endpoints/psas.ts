const BASE_PATH = "/psas";

export default function getPsasEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["psas"] {
  async function get(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  return { get };
}
