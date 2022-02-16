declare namespace Ape {
  type ClientMethod = (
    endpoint: string,
    config?: RequestOptions
  ) => Promise<Response>;

  interface Client {
    get: ClientMethod;
    post: ClientMethod;
    put: ClientMethod;
    patch: ClientMethod;
    delete: ClientMethod;
  }

  interface RequestOptions {
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

  namespace Endpoints {
    interface Configs {
      getConfig: Endpoint;
    }

    interface Leaderboards {
      getLeaderboard: (
        language: string,
        mode: MonkeyTypes.Mode,
        mode2: string | number,
        skip: number,
        limit: number
      ) => EndpointData;
      getLeaderboardRank: (
        language: string,
        mode: MonkeyTypes.Mode,
        mode2: string | number
      ) => EndpointData;
    }

    interface Presets {
      getPresets: Endpoint;
    }

    interface Psas {
      getPsas: Endpoint;
    }

    interface Quotes {
      getQuotes: Endpoint;
      getQuoteRating: (quote: MonkeyTypes.Quote) => EndpointData;
    }

    interface Users {
      getUserData: Endpoint;
      getUserTags: Endpoint;
      getNameAvailability: (name: string) => EndpointData;
    }

    interface Results {
      getResults: Endpoint;
    }
  }

  type AllEndpoints = Endpoints.Configs &
    Endpoints.Leaderboards &
    Endpoints.Presets &
    Endpoints.Psas &
    Endpoints.Quotes &
    Endpoints.Users &
    Endpoints.Results;
}
