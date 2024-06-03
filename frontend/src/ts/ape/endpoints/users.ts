const BASE_PATH = "/users";

export default class Users {
  constructor(private httpClient: Ape.HttpClient) {
    this.httpClient = httpClient;
  }

  async getData(): Ape.EndpointResponse<Ape.Users.GetUser> {
    return await this.httpClient.get(BASE_PATH);
  }

  async create(
    name: string,
    captcha: string,
    email?: string,
    uid?: string
  ): Ape.EndpointResponse<null> {
    const payload = {
      email,
      name,
      uid,
      captcha,
    };

    return await this.httpClient.post(`${BASE_PATH}/signup`, { payload });
  }

  async getNameAvailability(name: string): Ape.EndpointResponse<null> {
    const encoded = encodeURIComponent(name);
    return await this.httpClient.get(`${BASE_PATH}/checkName/${encoded}`);
  }

  async delete(): Ape.EndpointResponse<null> {
    return await this.httpClient.delete(BASE_PATH);
  }

  async reset(): Ape.EndpointResponse<null> {
    return await this.httpClient.patch(`${BASE_PATH}/reset`);
  }

  async optOutOfLeaderboards(): Ape.EndpointResponse<null> {
    return await this.httpClient.post(`${BASE_PATH}/optOutOfLeaderboards`);
  }

  async updateName(name: string): Ape.EndpointResponse<null> {
    return await this.httpClient.patch(`${BASE_PATH}/name`, {
      payload: { name },
    });
  }

  async updateLeaderboardMemory<M extends SharedTypes.Config.Mode>(
    mode: string,
    mode2: SharedTypes.Config.Mode2<M>,
    language: string,
    rank: number
  ): Ape.EndpointResponse<null> {
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
  ): Ape.EndpointResponse<null> {
    const payload = {
      newEmail,
      previousEmail,
    };

    return await this.httpClient.patch(`${BASE_PATH}/email`, { payload });
  }

  async updatePassword(newPassword: string): Ape.EndpointResponse<null> {
    return await this.httpClient.patch(`${BASE_PATH}/password`, {
      payload: { newPassword },
    });
  }

  async deletePersonalBests(): Ape.EndpointResponse<null> {
    return await this.httpClient.delete(`${BASE_PATH}/personalBests`);
  }

  async addResultFilterPreset(
    filter: SharedTypes.ResultFilters
  ): Ape.EndpointResponse<string> {
    return await this.httpClient.post(`${BASE_PATH}/resultFilterPresets`, {
      payload: filter,
    });
  }

  async removeResultFilterPreset(id: string): Ape.EndpointResponse<null> {
    const encoded = encodeURIComponent(id);
    return await this.httpClient.delete(
      `${BASE_PATH}/resultFilterPresets/${encoded}`
    );
  }

  async createTag(tagName: string): Ape.EndpointResponse<SharedTypes.UserTag> {
    return await this.httpClient.post(`${BASE_PATH}/tags`, {
      payload: { tagName },
    });
  }

  async editTag(tagId: string, newName: string): Ape.EndpointResponse<null> {
    const payload = {
      tagId,
      newName,
    };

    return await this.httpClient.patch(`${BASE_PATH}/tags`, { payload });
  }

  async deleteTag(tagId: string): Ape.EndpointResponse<null> {
    const encoded = encodeURIComponent(tagId);
    return await this.httpClient.delete(`${BASE_PATH}/tags/${encoded}`);
  }

  async deleteTagPersonalBest(tagId: string): Ape.EndpointResponse<null> {
    const encoded = encodeURIComponent(tagId);
    return await this.httpClient.delete(
      `${BASE_PATH}/tags/${encoded}/personalBest`
    );
  }

  async getCustomThemes(): Ape.EndpointResponse<SharedTypes.CustomTheme[]> {
    return await this.httpClient.get(`${BASE_PATH}/customThemes`);
  }

  async editCustomTheme(
    themeId: string,
    newTheme: Partial<MonkeyTypes.CustomTheme>
  ): Ape.EndpointResponse<null> {
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

  async deleteCustomTheme(themeId: string): Ape.EndpointResponse<null> {
    const payload = {
      themeId: themeId,
    };
    return await this.httpClient.delete(`${BASE_PATH}/customThemes`, {
      payload,
    });
  }

  async addCustomTheme(
    newTheme: Partial<MonkeyTypes.CustomTheme>
  ): Ape.EndpointResponse<SharedTypes.CustomTheme> {
    const payload = { name: newTheme.name, colors: newTheme.colors };
    return await this.httpClient.post(`${BASE_PATH}/customThemes`, { payload });
  }

  async getOauthLink(): Ape.EndpointResponse<Ape.Users.GetOauthLink> {
    return await this.httpClient.get(`${BASE_PATH}/discord/oauth`);
  }

  async linkDiscord(
    tokenType: string,
    accessToken: string,
    state: string
  ): Ape.EndpointResponse<Ape.Users.LinkDiscord> {
    return await this.httpClient.post(`${BASE_PATH}/discord/link`, {
      payload: { tokenType, accessToken, state },
    });
  }

  async unlinkDiscord(): Ape.EndpointResponse<null> {
    return await this.httpClient.post(`${BASE_PATH}/discord/unlink`);
  }

  async addQuoteToFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointResponse<null> {
    const payload = { language, quoteId };
    return await this.httpClient.post(`${BASE_PATH}/favoriteQuotes`, {
      payload,
    });
  }

  async removeQuoteFromFavorites(
    language: string,
    quoteId: string
  ): Ape.EndpointResponse<null> {
    const payload = { language, quoteId };
    return await this.httpClient.delete(`${BASE_PATH}/favoriteQuotes`, {
      payload,
    });
  }

  async getProfileByUid(
    uid: string
  ): Ape.EndpointResponse<SharedTypes.UserProfile> {
    const encoded = encodeURIComponent(uid);
    return await this.httpClient.get(`${BASE_PATH}/${encoded}/profile?isUid`);
  }

  async getProfileByName(
    name: string
  ): Ape.EndpointResponse<SharedTypes.UserProfile> {
    const encoded = encodeURIComponent(name);
    return await this.httpClient.get(`${BASE_PATH}/${encoded}/profile`);
  }

  async updateProfile(
    profileUpdates: Partial<SharedTypes.UserProfileDetails>,
    selectedBadgeId?: number
  ): Ape.EndpointResponse<null> {
    return await this.httpClient.patch(`${BASE_PATH}/profile`, {
      payload: {
        ...profileUpdates,
        selectedBadgeId,
      },
    });
  }

  async getInbox(): Ape.EndpointResponse<Ape.Users.GetInbox> {
    return await this.httpClient.get(`${BASE_PATH}/inbox`);
  }

  async updateInbox(options: {
    mailIdsToDelete?: string[];
    mailIdsToMarkRead?: string[];
  }): Ape.EndpointResponse<null> {
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
  ): Ape.EndpointResponse<null> {
    const payload = {
      uid,
      reason,
      comment,
      captcha,
    };

    return await this.httpClient.post(`${BASE_PATH}/report`, { payload });
  }

  async verificationEmail(): Ape.EndpointResponse<null> {
    return await this.httpClient.get(`${BASE_PATH}/verificationEmail`);
  }

  async forgotPasswordEmail(email: string): Ape.EndpointResponse<null> {
    return await this.httpClient.post(`${BASE_PATH}/forgotPasswordEmail`, {
      payload: { email },
    });
  }

  async setStreakHourOffset(hourOffset: number): Ape.EndpointResponse<null> {
    return await this.httpClient.post(`${BASE_PATH}/setStreakHourOffset`, {
      payload: { hourOffset },
    });
  }

  async revokeAllTokens(): Ape.EndpointResponse<null> {
    return await this.httpClient.post(`${BASE_PATH}/revokeAllTokens`);
  }

  async getTestActivity(): Ape.EndpointResponse<SharedTypes.CountByYearAndDay> {
    return await this.httpClient.get(`${BASE_PATH}/testActivity`);
  }
}
