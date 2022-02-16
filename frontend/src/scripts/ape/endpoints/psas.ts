const BASE_PATH = "/psas";

export default function getPsasEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Psas {
  async function getPsas(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  return { getPsas };
}
