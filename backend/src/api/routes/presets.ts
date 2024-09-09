import { presetsContract } from "@monkeytype/contracts/presets";
import { initServer } from "@ts-rest/express";
import * as PresetController from "../controllers/preset";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(presetsContract, {
  get: {
    handler: async (r) => callController(PresetController.getPresets)(r),
  },
  add: {
    handler: async (r) => callController(PresetController.addPreset)(r),
  },
  save: {
    handler: async (r) => callController(PresetController.editPreset)(r),
  },
  delete: {
    handler: async (r) => callController(PresetController.removePreset)(r),
  },
});
