const BASE_PATH = "/presets";

export default function getPresetsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["presets"] {
  async function get(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  async function add(preset: MonkeyTypes.Preset): Ape.EndpointData {
    const payload = {
      name: preset.name,
      config: preset.config,
    };

    return await apeClient.post(BASE_PATH, { payload });
  }

  async function edit(preset: MonkeyTypes.Preset): Ape.EndpointData {
    return await apeClient.patch(BASE_PATH, { payload: preset });
  }

  async function _delete(presetId: string): Ape.EndpointData {
    return await apeClient.delete(`${BASE_PATH}/${presetId}`);
  }

  return { get, add, edit, delete: _delete };
}
