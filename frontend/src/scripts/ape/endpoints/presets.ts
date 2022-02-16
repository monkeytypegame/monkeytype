const BASE_PATH = "/presets";

export default function getPresetsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Presets {
  async function getPresets(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  return { getPresets };
}
