import { apeKeysContract } from "@monkeytype/contracts/ape-keys";
import { initServer } from "@ts-rest/express";
import * as ApeKeyController from "../controllers/ape-key";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(apeKeysContract, {
  get: {
    handler: async (r) => callController(ApeKeyController.getApeKeys)(r),
  },
  add: {
    handler: async (r) => callController(ApeKeyController.generateApeKey)(r),
  },
  save: {
    handler: async (r) => callController(ApeKeyController.editApeKey)(r),
  },
  delete: {
    handler: async (r) => callController(ApeKeyController.deleteApeKey)(r),
  },
});
