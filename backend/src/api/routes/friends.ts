import { friendsContract } from "@monkeytype/contracts/friends";
import { initServer } from "@ts-rest/express";
import { callController } from "../ts-rest-adapter";

import * as FriendsController from "../controllers/friends";

const s = initServer();
export default s.router(friendsContract, {
  get: {
    handler: async (r) => callController(FriendsController.get)(r),
  },
  create: {
    handler: async (r) => callController(FriendsController.create)(r),
  },
  delete: {
    handler: async (r) => callController(FriendsController.deleteFriend)(r),
  },
});
