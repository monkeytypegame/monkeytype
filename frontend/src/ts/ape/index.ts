import { envConfig } from "../constants/env-config";
import { buildClient } from "./adapters/ts-rest-adapter";
import { contract } from "@monkeytype/contracts";
import { devContract } from "@monkeytype/contracts/dev";

const BASE_URL = envConfig.backendUrl;

const tsRestClient = buildClient(contract, BASE_URL, 10_000);
const devClient = buildClient(devContract, BASE_URL, 240_000);

// API Endpoints
const Ape = {
  ...tsRestClient,
  dev: devClient,
};

export default Ape;
