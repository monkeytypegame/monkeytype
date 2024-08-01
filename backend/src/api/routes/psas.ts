import { psaContract } from "@monkeytype/contracts/psas";
import { initServer } from "@ts-rest/express";
import * as RateLimit from "../../middlewares/rate-limit";
import * as PsaController from "../controllers/psa";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(psaContract, {
  get: {
    middleware: [RateLimit.psaGet],
    handler: async (r) => callController(PsaController.getPsas)(r),
  },
});
