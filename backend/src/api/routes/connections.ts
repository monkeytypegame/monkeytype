import { connectionsContract } from "@monkeytype/contracts/connections";
import { initServer } from "@ts-rest/express";
import { callController } from "../ts-rest-adapter";

import * as ConnectionsController from "../controllers/connections";

const s = initServer();
export default s.router(connectionsContract, {
  get: {
    handler: async (r) =>
      callController(ConnectionsController.getConnections)(r),
  },
  create: {
    handler: async (r) =>
      callController(ConnectionsController.createConnection)(r),
  },
  delete: {
    handler: async (r) =>
      callController(ConnectionsController.deleteConnection)(r),
  },
  update: {
    handler: async (r) =>
      callController(ConnectionsController.updateConnection)(r),
  },
});
