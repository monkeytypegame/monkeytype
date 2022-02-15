const BASE_PATH = "/psas";

export default function getPsasEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Psas {
  async function getPsas(): Promise<Ape.Response> {
    return await apeClient.get(BASE_PATH);
  }

  return { getPsas };
}
