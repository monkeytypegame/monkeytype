declare namespace Ape {
  type ClientMethod = (
    endpoint: string,
    config?: RequestOptions
  ) => Promise<Response>;

  interface ApiResponse {
    message: string;
    data: any | null;
  }

  interface Client {
    get: ClientMethod;
    post: ClientMethod;
    put: ClientMethod;
    patch: ClientMethod;
    delete: ClientMethod;
  }

  type MethodTypes = keyof Client;

  interface RequestOptions {
    headers?: Record<string, string>;
    searchQuery?: Record<string, any>;
    payload?: any;
  }

  interface Response {
    status: number;
    message: string;
    data?: any;
  }

  type EndpointData = Promise<Response>;
  type Endpoint = () => EndpointData;

  interface Endpoints {
    configs: {
      get: Endpoint;
      save: (config: MonkeyTypes.Config) => EndpointData;
    };

    leaderboards: {
      get: (
        language: string,
        mode: MonkeyTypes.Mode,
        mode2: string | number,
        skip: number,
        limit?: number
      ) => EndpointData;
      getRank: (
        language: string,
        mode: MonkeyTypes.Mode,
        mode2: string | number
      ) => EndpointData;
    };

    presets: {
      get: Endpoint;
      add: (
        presetName: string,
        configChanges: MonkeyTypes.ConfigChanges
      ) => EndpointData;
      edit: (
        presetId: string,
        presetName: string,
        configChanges: MonkeyTypes.ConfigChanges
      ) => EndpointData;
      delete: (presetId: string) => EndpointData;
    };

    psas: {
      get: Endpoint;
    };

    quotes: {
      get: Endpoint;
      submit: (
        text: string,
        source: string,
        language: string,
        captcha: string
      ) => EndpointData;
      approveSubmission: (
        quoteSubmissionId: string,
        editText?: string,
        editSource?: string
      ) => EndpointData;
      rejectSubmission: (quoteSubmissionId: string) => EndpointData;
      getRating: (quote: MonkeyTypes.Quote) => EndpointData;
      addRating: (quote: MonkeyTypes.Quote, rating: number) => EndpointData;
      report: (
        quoteId: string,
        quoteLanguage: string,
        reason: string,
        comment: string,
        captcha: string
      ) => EndpointData;
    };

    users: {
      getData: Endpoint;
      create: (name: string, email?: string, uid?: string) => EndpointData;
      getNameAvailability: (name: string) => EndpointData;
      delete: Endpoint;
      updateName: (name: string) => EndpointData;
      updateLeaderboardMemory: <M extends MonkeyTypes.Mode>(
        mode: string,
        mode2: MonkeyTypes.Mode2<M>,
        language: string,
        rank: number
      ) => EndpointData;
      updateEmail: (newEmail: string, previousEmail: string) => EndpointData;
      deletePersonalBests: Endpoint;
      getCustomThemes: () => EndpointData;
      addCustomTheme: (
        newTheme: Partial<MonkeyTypes.CustomTheme>
      ) => EndpointData;
      editCustomTheme: (
        themeId: string,
        newTheme: Partial<MonkeyTypes.CustomTheme>
      ) => EndpointData;
      deleteCustomTheme: (themeId: string) => EndpointData;
      getTags: Endpoint;
      createTag: (tagName: string) => EndpointData;
      editTag: (tagId: string, newName: string) => EndpointData;
      deleteTag: (tagId: string) => EndpointData;
      deleteTagPersonalBest: (tagId: string) => EndpointData;
      linkDiscord: (data: {
        tokenType: string;
        accessToken: string;
        uid?: string;
      }) => EndpointData;
      unlinkDiscord: Endpoint;
      addQuoteToFavorites: (language: string, quoteId: string) => EndpointData;
      removeQuoteFromFavorites: (
        language: string,
        quoteId: string
      ) => EndpointData;
    };

    results: {
      get: Endpoint;
      save: (result: MonkeyTypes.Result<MonkeyTypes.Mode>) => EndpointData;
      updateTags: (resultId: string, tagIds: string[]) => EndpointData;
      deleteAll: Endpoint;
    };

    apeKeys: {
      get: Endpoint;
      generate: (name: string, enabled: boolean) => EndpointData;
      update: (
        apeKeyId: string,
        updates: { name?: string; enabled?: boolean }
      ) => EndpointData;
      delete: (apeKeyId: string) => EndpointData;
    };
  }
}
