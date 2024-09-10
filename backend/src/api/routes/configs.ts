import { configsContract } from "@monkeytype/contracts/configs";
import { initServer } from "@ts-rest/express";
import * as ConfigController from "../controllers/config";
import { callController } from "../ts-rest-adapter";

const s = initServer();

export default s.router(configsContract, {
  get: {
    handler: async (r) => callController(ConfigController.getConfig)(r),
  },
  save: {
    handler: async (r) => callController(ConfigController.saveConfig)(r),
  },
  delete: {
    handler: async (r) => callController(ConfigController.deleteConfig)(r),
  },
});
