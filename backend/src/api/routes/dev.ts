import { devContract } from "@aitype/contracts/dev";
import { initServer } from "@ts-rest/express";

import * as DevController from "../controllers/dev";
import { callController } from "../ts-rest-adapter";
import { onlyAvailableOnDev } from "../../middlewares/utility";

const s = initServer();

export default s.router(devContract, {
  generateData: {
    middleware: [onlyAvailableOnDev()],
    handler: async (r) => callController(DevController.createTestData)(r),
  },
});
