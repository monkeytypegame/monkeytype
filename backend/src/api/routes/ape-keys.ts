import { apeKeysContract } from "@monkeytype/contracts/ape-keys";
import { initServer } from "@ts-rest/express";
import * as ApeKeyController from "../controllers/ape-key";
import { callController } from "../ts-rest-adapter";
import { checkUserPermissions } from "../../middlewares/permission";
import { validate } from "../../middlewares/configuration";

const commonMiddleware = [
  validate({
    criteria: (configuration) => {
      return configuration.apeKeys.endpointsEnabled;
    },
    invalidMessage: "ApeKeys are currently disabled.",
  }),
  checkUserPermissions(["canManageApeKeys"], {
    criteria: (user) => {
      return user.canManageApeKeys ?? true;
    },
    invalidMessage: "You have lost access to ape keys, please contact support",
  }),
];

const s = initServer();
export default s.router(apeKeysContract, {
  get: {
    middleware: commonMiddleware,
    handler: async (r) => callController(ApeKeyController.getApeKeys)(r),
  },
  add: {
    middleware: commonMiddleware,
    handler: async (r) => callController(ApeKeyController.generateApeKey)(r),
  },
  save: {
    middleware: commonMiddleware,
    handler: async (r) => callController(ApeKeyController.editApeKey)(r),
  },
  delete: {
    middleware: commonMiddleware,
    handler: async (r) => callController(ApeKeyController.deleteApeKey)(r),
  },
});
