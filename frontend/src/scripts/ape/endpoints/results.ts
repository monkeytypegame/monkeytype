const BASE_PATH = "/results";

export default function getResultsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Results {
  async function getResults(): Promise<Ape.Response> {
    return await apeClient.get(BASE_PATH);
  }

  return { getResults };
}
