import endpoints from "./endpoints";
import { buildHttpClient } from "./adapters/axios-adapter";

const DEV_SERVER_HOST = "http://localhost:5005";
const PROD_SERVER_HOST = "https://api.monkeytype.com";

const API_PATH = "";
const BASE_URL =
  window.location.hostname === "localhost" ? DEV_SERVER_HOST : PROD_SERVER_HOST;
const API_URL = `${BASE_URL}${API_PATH}`;

const httpClient = buildHttpClient(API_URL, 10000);

// API Endpoints
const Ape = {
  users: new endpoints.Users(httpClient),
  configs: new endpoints.Configs(httpClient),
  results: new endpoints.Results(httpClient),
  psas: new endpoints.Psas(httpClient),
  quotes: new endpoints.Quotes(httpClient),
  leaderboards: new endpoints.Leaderboards(httpClient),
  presets: new endpoints.Presets(httpClient),
  apeKeys: new endpoints.ApeKeys(httpClient),
};

export default Ape;
