import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Mode, Mode2 } from "./types/interfaces";

const DEV_SERVER_HOST = "http://localhost:5005";
const PROD_SERVER_HOST = "https://api.monkeytype.com";

interface ApeClientConfig {
  baseUrl: string;
  apiPath: string;
  timeout: number;
}

interface ApeClientRequestOptions {
  searchQuery?: Record<string, any>;
  payload?: any;
}

class Ape {
  apiUrl: string;
  axiosClient: AxiosInstance;

  constructor(clientConfig: ApeClientConfig) {
    this.apiUrl = `${clientConfig.baseUrl}${clientConfig.apiPath}`;
    this.axiosClient = axios.create({
      baseURL: this.apiUrl,
      timeout: clientConfig.timeout,
    });
  }

  async buildRequestConfig(
    config: ApeClientRequestOptions
  ): Promise<Partial<AxiosRequestConfig>> {
    const currentUser = firebase.auth().currentUser;
    const idToken = currentUser && (await currentUser.getIdToken());

    return {
      params: config.searchQuery,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: idToken && `Bearer ${idToken}`,
      },
    };
  }

  async get(endpoint: string, config = {}) {
    const requestConfig = await this.buildRequestConfig(config);
    return await this.axiosClient.get(endpoint, requestConfig);
  }

  // API Endpoints

  async getUserData() {
    return await this.get("/user");
  }

  async getUserTags() {
    return await this.get("/user/tags");
  }

  async getConfig() {
    return await this.get("/config");
  }

  async getPresets() {
    return await this.get("/presets");
  }

  async getResults() {
    return await this.get("/results");
  }

  async getPsa() {
    return await this.get("/psa");
  }

  async getQuotes() {
    return await this.get("/quotes");
  }

  async getQuoteRating(quoteId: Mode, language: string) {
    const searchQuery = {
      quoteId,
      language,
    };

    return await this.get("/quotes/rating", { searchQuery });
  }

  async getLeaderboard(
    language: string,
    mode: Mode,
    mode2: Mode2,
    skip = 0,
    limit = 50
  ) {
    const searchQuery = {
      language,
      mode,
      mode2,
      skip,
      limit: Math.max(Math.min(limit, 50), 0),
    };

    return await this.get("/leaderboard", { searchQuery });
  }

  async getLeaderboardRank(language: string, mode: Mode, mode2: Mode2) {
    const searchQuery = {
      language,
      mode,
      mode2,
    };

    return await this.get("/leaderboard/rank", { searchQuery });
  }
}

const sharedApe = new Ape({
  baseUrl:
    window.location.hostname === "localhost"
      ? DEV_SERVER_HOST
      : PROD_SERVER_HOST,
  apiPath: "",
  timeout: 10000,
});

export default sharedApe;
