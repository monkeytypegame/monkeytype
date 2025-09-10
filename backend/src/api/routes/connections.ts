import { connectionsContract } from "@monkeytype/contracts/connections";
import { initServer } from "@ts-rest/express";
import { callController } from "../ts-rest-adapter";

import * as ConnectionsController from "../controllers/connections";

const s = initServer();
export default s.router(connectionsContract, {
  get: {
    handler: async (r) => callController(ConnectionsController.getRequests)(r),
  },
  create: {
    handler: async (r) =>
      callController(ConnectionsController.createRequest)(r),
  },
  delete: {
    handler: async (r) =>
      callController(ConnectionsController.deleteRequest)(r),
  },
  update: {
    handler: async (r) =>
      callController(ConnectionsController.updateRequest)(r),
  },
});
