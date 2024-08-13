import endpoints from "./endpoints";
import { buildHttpClient } from "./adapters/axios-adapter";
import { envConfig } from "../constants/env-config";
import { buildClient } from "./adapters/ts-rest-adapter";
import { contract } from "@monkeytype/contracts";

const API_PATH = "";
const BASE_URL = envConfig.backendUrl;
const API_URL = `${BASE_URL}${API_PATH}`;

const httpClient = buildHttpClient(API_URL, 10_000);
const tsRestClient = buildClient(contract, BASE_URL, 10_000);

// API Endpoints
const Ape = {
  ...tsRestClient,
  users: new endpoints.Users(httpClient),
  results: new endpoints.Results(httpClient),
  quotes: new endpoints.Quotes(httpClient),
  configuration: new endpoints.Configuration(httpClient),
  dev: new endpoints.Dev(buildHttpClient(API_URL, 240_000)),
};

export default Ape;
