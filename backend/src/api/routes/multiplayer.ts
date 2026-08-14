import { multiplayerContract } from "@monkeytype/contracts/multiplayer";
import { initServer } from "@ts-rest/express";
import * as MultiplayerController from "../controllers/multiplayer";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(multiplayerContract, {
  createRoom: {
    handler: async (r) => callController(MultiplayerController.createRoom)(r),
  },
  getRoom: {
    handler: async (r) => callController(MultiplayerController.getRoom)(r),
  },
});
