const BASE_PATH = "/results";

export default function getResultsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Results {
  async function getResults(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  return { getResults };
}
