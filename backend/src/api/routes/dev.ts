import { devContract } from "@monkeytype/contracts/dev";
import { initServer } from "@ts-rest/express";
import { validate } from "../../middlewares/configuration";
import { isDevEnvironment } from "../../utils/misc";
import * as DevController from "../controllers/dev";
import { callController } from "../ts-rest-adapter";

const onlyAvailableOnDev = validate({
  criteria: () => {
    return isDevEnvironment();
  },
  invalidMessage: "Development endpoints are only available in DEV mode.",
});

const s = initServer();

export default s.router(devContract, {
  generateData: {
    middleware: [onlyAvailableOnDev],
    handler: async (r) => callController(DevController.createTestData)(r),
  },
});
