import endpoints from "./endpoints";
import { buildHttpClient } from "./adapters/axios-adapter";
import { envConfig } from "../constants/env-config";
import { buildClient } from "./adapters/ts-rest-adapter";
import { contract } from "@monkeytype/contracts";
import { devContract } from "@monkeytype/contracts/dev";

const API_PATH = "";
const BASE_URL = envConfig.backendUrl;
const API_URL = `${BASE_URL}${API_PATH}`;

const httpClient = buildHttpClient(API_URL, 10_000);
const tsRestClient = buildClient(contract, BASE_URL, 10_000);
const devClient = buildClient(devContract, BASE_URL, 240_000);

// API Endpoints
const Ape = {
  ...tsRestClient,
  users: new endpoints.Users(httpClient),
  dev: devClient,
};

export default Ape;
