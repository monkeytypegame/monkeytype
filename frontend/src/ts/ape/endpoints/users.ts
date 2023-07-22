const BASE_PATH = "/users";

export default class Users {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async getData(): Ape.EndpointData {
    return await this.httpClient.get(BASE_PATH);
  }

  async create(
    name: string,
    captcha: string,
    email?: string,
    uid?: string
  ): Ape.EndpointData {
    const payload = {
      email,
      name,
      uid,
      captcha,
    };

    return await this.httpClient.post(`${BASE_PATH}/signup`, { payload });
  }

  async getNameAvailability(name: string): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/checkName/${name}`);
  }

  async delete(): Ape.EndpointData {
    return await this.httpClient.delete(BASE_PATH);
  }

  async reset(): Ape.EndpointData {
    return await this.httpClient.patch(`${BASE_PATH}/reset`);
  }

  async optOutOfLeaderboards(): Ape.EndpointData {
    return await this.httpClient.post(`${BASE_PATH}/optOutOfLeaderboards`);
  }

  async updateName(name: string): Ape.EndpointData {
    return await this.httpClient.patch(`${BASE_PATH}/name`, {
      payload: { name },
    });
  }

  async updateLeaderboardMemory<M extends MonkeyTypes.Mode>(
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

    return await this.httpClient.patch(`${BASE_PATH}/leaderboardMemory`, {
      payload,
    });
  }

  async updateEmail(newEmail: string, previousEmail: string): Ape.EndpointData {
    const payload = {
      newEmail,
      previousEmail,
    };

    return await this.httpClient.patch(`${BASE_PATH}/email`, { payload });
  }

  async deletePersonalBests(): Ape.EndpointData {
    return await this.httpClient.delete(`${BASE_PATH}/personalBests`);
  }

  async addResultFilterPreset(
    filter: MonkeyTypes.ResultFilters
  ): Ape.EndpointData {
    return await this.httpClient.post(`${BASE_PATH}/resultFilterPresets`, {
      payload: filter,
    });
  }

  async removeResultFilterPreset(id: string): Ape.EndpointData {
    return await this.httpClient.delete(
      `${BASE_PATH}/resultFilterPresets/${id}`
    );
  }

  async getTags(): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/tags`);
  }

  async createTag(tagName: string): Ape.EndpointData {
    return await this.httpClient.post(`${BASE_PATH}/tags`, {
      payload: { tagName },
    });
  }

  async editTag(tagId: string, newName: string): Ape.EndpointData {
    const payload = {
      tagId,
      newName,
    };

    return await this.httpClient.patch(`${BASE_PATH}/tags`, { payload });
  }

  async deleteTag(tagId: string): Ape.EndpointData {
    return await this.httpClient.delete(`${BASE_PATH}/tags/${tagId}`);
  }

  async deleteTagPersonalBest(tagId: string): Ape.EndpointData {
    return await this.httpClient.delete(
      `${BASE_PATH}/tags/${tagId}/personalBest`
    );
  }

  async getCustomThemes(): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/customThemes`);
  }

  async editCustomTheme(
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
    return await this.httpClient.patch(`${BASE_PATH}/customThemes`, {
      payload,
    });
  }

  async deleteCustomTheme(themeId: string): Ape.EndpointData {
    const payload = {
      themeId: themeId,
    };
    return await this.httpClient.delete(`${BASE_PATH}/customThemes`, {
      payload,
    });
  }

  async addCustomTheme(
    newTheme: Partial<MonkeyTypes.CustomTheme>
  ): Ape.EndpointData {
    const payload = { name: newTheme.name, colors: newTheme.colors };
    return await this.httpClient.post(`${BASE_PATH}/customThemes`, { payload });
  }

  async getOauthLink(): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/discord/oauth`);
  }

  async linkDiscord(
    tokenType: string,
    accessToken: string,
    state: string
  ): Ape.EndpointData {
    return await this.httpClient.post(`${BASE_PATH}/discord/link`, {
      payload: { tokenType, accessToken, state },
    });
  }

  async unlinkDiscord(): Ape.EndpointData {
    return await this.httpClient.post(`${BASE_PATH}/discord/unlink`);
  }

  async addQuoteToFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointData {
    const payload = { language, quoteId };
    return await this.httpClient.post(`${BASE_PATH}/favoriteQuotes`, {
      payload,
    });
  }

  async removeQuoteFromFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointData {
    const payload = { language, quoteId };
    return await this.httpClient.delete(`${BASE_PATH}/favoriteQuotes`, {
      payload,
    });
  }

  async getProfileByUid(uid: string): Promise<Ape.EndpointData> {
    return await this.httpClient.get(`${BASE_PATH}/${uid}/profile?isUid`);
  }

  async getProfileByName(name: string): Promise<Ape.EndpointData> {
    return await this.httpClient.get(`${BASE_PATH}/${name}/profile`);
  }

  async updateProfile(
    profileUpdates: Partial<MonkeyTypes.UserDetails>,
    selectedBadgeId?: number
  ): Promise<Ape.EndpointData> {
    return await this.httpClient.patch(`${BASE_PATH}/profile`, {
      payload: {
        ...profileUpdates,
        selectedBadgeId,
      },
    });
  }

  async getInbox(): Promise<Ape.EndpointData> {
    return await this.httpClient.get(`${BASE_PATH}/inbox`);
  }

  async updateInbox(options: {
    mailIdsToDelete?: string[];
    mailIdsToMarkRead?: string[];
  }): Promise<Ape.EndpointData> {
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
  ): Ape.EndpointData {
    const payload = {
      uid,
      reason,
      comment,
      captcha,
    };

    return await this.httpClient.post(`${BASE_PATH}/report`, { payload });
  }

  async verificationEmail(): Ape.EndpointData {
    return await this.httpClient.get(`${BASE_PATH}/verificationEmail`);
  }

  async forgotPasswordEmail(email: string): Ape.EndpointData {
    return await this.httpClient.post(`${BASE_PATH}/forgotPasswordEmail`, {
      payload: { email },
    });
  }

  async setStreakHourOffset(hourOffset: number): Ape.EndpointData {
    return await this.httpClient.post(`${BASE_PATH}/setStreakHourOffset`, {
      payload: { hourOffset },
    });
  }
}
