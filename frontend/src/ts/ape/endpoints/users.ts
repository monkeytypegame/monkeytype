const BASE_PATH = "/users";

export default class Users {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async getData(): Ape.EndpointResponse {
    return await this.httpClient.get(BASE_PATH);
  }

  async create(
    name: string,
    captcha: string,
    email?: string,
    uid?: string
  ): Ape.EndpointResponse {
    const payload = {
      email,
      name,
      uid,
      captcha,
    };

    return await this.httpClient.post(`${BASE_PATH}/signup`, { payload });
  }

  async getNameAvailability(name: string): Ape.EndpointResponse {
    return await this.httpClient.get(`${BASE_PATH}/checkName/${name}`);
  }

  async delete(): Ape.EndpointResponse {
    return await this.httpClient.delete(BASE_PATH);
  }

  async reset(): Ape.EndpointResponse {
    return await this.httpClient.patch(`${BASE_PATH}/reset`);
  }

  async optOutOfLeaderboards(): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/optOutOfLeaderboards`);
  }

  async updateName(name: string): Ape.EndpointResponse {
    return await this.httpClient.patch(`${BASE_PATH}/name`, {
      payload: { name },
    });
  }

  async updateLeaderboardMemory<M extends MonkeyTypes.Mode>(
    mode: string,
    mode2: MonkeyTypes.Mode2<M>,
    language: string,
    rank: number
  ): Ape.EndpointResponse {
    const payload = {
      mode,
      mode2,
      language,
      rank,
    };

    return await this.httpClient.patch(`${BASE_PATH}/leaderboardMemory`, {
      payload,
    });
  }

  async updateEmail(
    newEmail: string,
    previousEmail: string
  ): Ape.EndpointResponse {
    const payload = {
      newEmail,
      previousEmail,
    };

    return await this.httpClient.patch(`${BASE_PATH}/email`, { payload });
  }

  async deletePersonalBests(): Ape.EndpointResponse {
    return await this.httpClient.delete(`${BASE_PATH}/personalBests`);
  }

  async addResultFilterPreset(
    filter: MonkeyTypes.ResultFilters
  ): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/resultFilterPresets`, {
      payload: filter,
    });
  }

  async removeResultFilterPreset(id: string): Ape.EndpointResponse {
    return await this.httpClient.delete(
      `${BASE_PATH}/resultFilterPresets/${id}`
    );
  }

  async createTag(tagName: string): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/tags`, {
      payload: { tagName },
    });
  }

  async editTag(tagId: string, newName: string): Ape.EndpointResponse {
    const payload = {
      tagId,
      newName,
    };

    return await this.httpClient.patch(`${BASE_PATH}/tags`, { payload });
  }

  async deleteTag(tagId: string): Ape.EndpointResponse {
    return await this.httpClient.delete(`${BASE_PATH}/tags/${tagId}`);
  }

  async deleteTagPersonalBest(tagId: string): Ape.EndpointResponse {
    return await this.httpClient.delete(
      `${BASE_PATH}/tags/${tagId}/personalBest`
    );
  }

  async getCustomThemes(): Ape.EndpointResponse {
    return await this.httpClient.get(`${BASE_PATH}/customThemes`);
  }

  async editCustomTheme(
    themeId: string,
    newTheme: Partial<MonkeyTypes.CustomTheme>
  ): Ape.EndpointResponse {
    const payload = {
      themeId: themeId,
      theme: {
        name: newTheme.name,
        colors: newTheme.colors,
      },
    };
    return await this.httpClient.patch(`${BASE_PATH}/customThemes`, {
      payload,
    });
  }

  async deleteCustomTheme(themeId: string): Ape.EndpointResponse {
    const payload = {
      themeId: themeId,
    };
    return await this.httpClient.delete(`${BASE_PATH}/customThemes`, {
      payload,
    });
  }

  async addCustomTheme(
    newTheme: Partial<MonkeyTypes.CustomTheme>
  ): Ape.EndpointResponse {
    const payload = { name: newTheme.name, colors: newTheme.colors };
    return await this.httpClient.post(`${BASE_PATH}/customThemes`, { payload });
  }

  async getOauthLink(): Ape.EndpointResponse {
    return await this.httpClient.get(`${BASE_PATH}/discord/oauth`);
  }

  async linkDiscord(
    tokenType: string,
    accessToken: string,
    state: string
  ): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/discord/link`, {
      payload: { tokenType, accessToken, state },
    });
  }

  async unlinkDiscord(): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/discord/unlink`);
  }

  async addQuoteToFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointResponse {
    const payload = { language, quoteId };
    return await this.httpClient.post(`${BASE_PATH}/favoriteQuotes`, {
      payload,
    });
  }

  async removeQuoteFromFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointResponse {
    const payload = { language, quoteId };
    return await this.httpClient.delete(`${BASE_PATH}/favoriteQuotes`, {
      payload,
    });
  }

  async getProfileByUid(uid: string): Promise<Ape.EndpointResponse> {
    return await this.httpClient.get(`${BASE_PATH}/${uid}/profile?isUid`);
  }

  async getProfileByName(name: string): Promise<Ape.EndpointResponse> {
    return await this.httpClient.get(`${BASE_PATH}/${name}/profile`);
  }

  async updateProfile(
    profileUpdates: Partial<MonkeyTypes.UserDetails>,
    selectedBadgeId?: number
  ): Promise<Ape.EndpointResponse> {
    return await this.httpClient.patch(`${BASE_PATH}/profile`, {
      payload: {
        ...profileUpdates,
        selectedBadgeId,
      },
    });
  }

  async getInbox(): Promise<Ape.EndpointResponse> {
    return await this.httpClient.get(`${BASE_PATH}/inbox`);
  }

  async updateInbox(options: {
    mailIdsToDelete?: string[];
    mailIdsToMarkRead?: string[];
  }): Promise<Ape.EndpointResponse> {
    const payload = {
      mailIdsToDelete: options.mailIdsToDelete,
      mailIdsToMarkRead: options.mailIdsToMarkRead,
    };
    return await this.httpClient.patch(`${BASE_PATH}/inbox`, { payload });
  }

  async report(
    uid: string,
    reason: string,
    comment: string,
    captcha: string
  ): Ape.EndpointResponse {
    const payload = {
      uid,
      reason,
      comment,
      captcha,
    };

    return await this.httpClient.post(`${BASE_PATH}/report`, { payload });
  }

  async verificationEmail(): Ape.EndpointResponse {
    return await this.httpClient.get(`${BASE_PATH}/verificationEmail`);
  }

  async forgotPasswordEmail(email: string): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/forgotPasswordEmail`, {
      payload: { email },
    });
  }

  async setStreakHourOffset(hourOffset: number): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/setStreakHourOffset`, {
      payload: { hourOffset },
    });
  }

  async revokeAllTokens(): Ape.EndpointResponse {
    return await this.httpClient.post(`${BASE_PATH}/revokeAllTokens`);
  }
}
