const BASE_PATH = "/users";

export default function getUsersEndpoints(
  apeClient: Ape.Client
): Ape.Endpoints["users"] {
  async function getData(): Ape.EndpointData {
    return await apeClient.get(BASE_PATH);
  }

  async function create(
    name: string,
    email?: string,
    uid?: string
  ): Ape.EndpointData {
    const payload = {
      email,
      name,
      uid,
    };

    return await apeClient.post(`${BASE_PATH}/signup`, { payload });
  }

  async function getNameAvailability(name: string): Ape.EndpointData {
    return await apeClient.get(`${BASE_PATH}/checkName/${name}`);
  }

  async function _delete(): Ape.EndpointData {
    return await apeClient.delete(BASE_PATH);
  }

  async function updateName(name: string): Ape.EndpointData {
    return await apeClient.patch(`${BASE_PATH}/name`, { payload: { name } });
  }

  async function updateLeaderboardMemory<M extends MonkeyTypes.Mode>(
    mode: string,
    mode2: MonkeyTypes.Mode2<M>,
    language: string,
    rank: number
  ): Ape.EndpointData {
    const payload = {
      mode,
      mode2,
      language,
      rank,
    };

    return await apeClient.patch(`${BASE_PATH}/leaderboardMemory`, { payload });
  }

  async function updateEmail(
    newEmail: string,
    previousEmail: string
  ): Ape.EndpointData {
    const payload = {
      newEmail,
      previousEmail,
    };

    return await apeClient.patch(`${BASE_PATH}/email`, { payload });
  }

  async function deletePersonalBests(): Ape.EndpointData {
    return await apeClient.delete(`${BASE_PATH}/personalBests`);
  }

  async function getTags(): Ape.EndpointData {
    return await apeClient.get(`${BASE_PATH}/tags`);
  }

  async function createTag(tagName: string): Ape.EndpointData {
    return await apeClient.post(`${BASE_PATH}/tags`, { payload: { tagName } });
  }

  async function editTag(tagId: string, newName: string): Ape.EndpointData {
    const payload = {
      tagId,
      newName,
    };

    return await apeClient.patch(`${BASE_PATH}/tags`, { payload });
  }

  async function deleteTag(tagId: string): Ape.EndpointData {
    return await apeClient.delete(`${BASE_PATH}/tags/${tagId}`);
  }

  async function deleteTagPersonalBest(tagId: string): Ape.EndpointData {
    return await apeClient.delete(`${BASE_PATH}/tags/${tagId}/personalBest`);
  }

  async function getCustomThemes(): Ape.EndpointData {
    return await apeClient.get(`${BASE_PATH}/customThemes`);
  }

  async function editCustomTheme(
    themeId: string,
    newTheme: Partial<MonkeyTypes.CustomTheme>
  ): Ape.EndpointData {
    const payload = {
      themeId: themeId,
      theme: {
        name: newTheme.name,
        colors: newTheme.colors,
      },
    };
    return await apeClient.patch(`${BASE_PATH}/customThemes`, { payload });
  }

  async function deleteCustomTheme(themeId: string): Ape.EndpointData {
    const payload = {
      themeId: themeId,
    };
    return await apeClient.delete(`${BASE_PATH}/customThemes`, { payload });
  }

  async function addCustomTheme(
    newTheme: Partial<MonkeyTypes.CustomTheme>
  ): Ape.EndpointData {
    const payload = { name: newTheme.name, colors: newTheme.colors };
    return await apeClient.post(`${BASE_PATH}/customThemes`, { payload });
  }

  async function linkDiscord(data: {
    tokenType: string;
    accessToken: string;
    uid?: string;
  }): Ape.EndpointData {
    return await apeClient.post(`${BASE_PATH}/discord/link`, {
      payload: { data },
    });
  }

  async function unlinkDiscord(): Ape.EndpointData {
    return await apeClient.post(`${BASE_PATH}/discord/unlink`);
  }

  async function addQuoteToFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointData {
    const payload = { language, quoteId };
    return await apeClient.post(`${BASE_PATH}/favoriteQuotes`, { payload });
  }

  async function removeQuoteFromFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointData {
    const payload = { language, quoteId };
    return await apeClient.delete(`${BASE_PATH}/favoriteQuotes`, { payload });
  }

  return {
    getData,
    create,
    getNameAvailability,
    delete: _delete,
    updateName,
    updateLeaderboardMemory,
    updateEmail,
    deletePersonalBests,
    getTags,
    createTag,
    editTag,
    deleteTag,
    deleteTagPersonalBest,
    linkDiscord,
    unlinkDiscord,
    getCustomThemes,
    addCustomTheme,
    editCustomTheme,
    deleteCustomTheme,
    addQuoteToFavorites,
    removeQuoteFromFavorites,
  };
}
