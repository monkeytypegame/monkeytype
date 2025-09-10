import { friendsContract } from "@monkeytype/contracts/friends";
import { initServer } from "@ts-rest/express";
import { callController } from "../ts-rest-adapter";

import * as FriendsController from "../controllers/friends";

const s = initServer();
export default s.router(friendsContract, {
  getRequests: {
    handler: async (r) => callController(FriendsController.getRequests)(r),
  },
  createRequest: {
    handler: async (r) => callController(FriendsController.createRequest)(r),
  },
  deleteRequest: {
    handler: async (r) => callController(FriendsController.deleteRequest)(r),
  },
  updateRequest: {
    handler: async (r) => callController(FriendsController.updateRequest)(r),
  },
});
