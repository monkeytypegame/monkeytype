import { psasContract } from "@monkeytype/contracts/psas";
import { initServer } from "@ts-rest/express";
import * as PsaController from "../controllers/psa";
import { callController } from "../ts-rest-adapter";
import { recordClientVersion } from "../../middlewares/utility";

const s = initServer();
export default s.router(psasContract, {
  get: {
    middleware: [recordClientVersion()],
    handler: async (r) => callController(PsaController.getPsas)(r),
  },
});
