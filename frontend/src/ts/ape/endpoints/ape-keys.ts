const BASE_PATH = "/ape-keys";

export default function getApeKeysEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["apeKeys"] {
  async function get(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  async function generate(name: string, enabled: boolean): Ape.EndpointData {
    const payload = { name, enabled };
    return await apeClient.post(BASE_PATH, { payload });
  }

  async function update(
    apeKeyId: string,
    updates: { name?: string; enabled?: boolean }
  ): Ape.EndpointData {
    const payload = { ...updates };
    return await apeClient.patch(`${BASE_PATH}/${apeKeyId}`, { payload });
  }

  async function _delete(apeKeyId: string): Ape.EndpointData {
    return await apeClient.delete(`${BASE_PATH}/${apeKeyId}`);
  }

  return {
    get,
    generate,
    update,
    delete: _delete,
  };
}
