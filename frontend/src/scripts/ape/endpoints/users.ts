const BASE_PATH = "/users";

export default function getUsersEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints.Users {
  async function getUserData(): Promise<Ape.Response> {
    return await apeClient.get(BASE_PATH);
  }

  async function getUserTags(): Promise<Ape.Response> {
    return await apeClient.get(`${BASE_PATH}/tags`);
  }

  async function getNameAvailability(name: string): Promise<Ape.Response> {
    return await apeClient.get(`${BASE_PATH}/checkName/${name}`);
  }

  return {
    getUserData,
    getUserTags,
    getNameAvailability,
  };
}
