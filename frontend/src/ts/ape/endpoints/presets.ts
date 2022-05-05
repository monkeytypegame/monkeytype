const BASE_PATH = "/presets";

export default function getPresetsEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["presets"] {
  async function get(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  async function add(
    presetName: string,
    configChanges: MonkeyTypes.ConfigChanges
  ): Ape.EndpointData {
    const payload = {
      name: presetName,
      config: configChanges,
    };

    return await apeClient.post(BASE_PATH, { payload });
  }

  async function edit(
    presetId: string,
    presetName: string,
    configChanges: MonkeyTypes.ConfigChanges
  ): Ape.EndpointData {
    const payload = {
      _id: presetId,
      name: presetName,
      config: configChanges,
    };

    return await apeClient.patch(BASE_PATH, { payload });
  }

  async function _delete(presetId: string): Ape.EndpointData {
    return await apeClient.delete(`${BASE_PATH}/${presetId}`);
  }

  return { get, add, edit, delete: _delete };
}
