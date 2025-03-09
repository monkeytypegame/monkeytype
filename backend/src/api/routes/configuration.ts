import { configurationContract } from "@monkeytype/contracts/configuration";
import { initServer } from "@ts-rest/express";
import * as ConfigurationController from "../controllers/configuration";
import { callController } from "../ts-rest-adapter";

const s = initServer();

export default s.router(configurationContract, {
  get: {
    handler: async (r) =>
      callController(ConfigurationController.getConfiguration)(r),
  },
  update: {
    handler: async (r) =>
      callController(ConfigurationController.updateConfiguration)(r),
  },
  getSchema: {
    handler: async (r) => callController(ConfigurationController.getSchema)(r),
  },
});
