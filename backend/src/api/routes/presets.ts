import { presetsContract } from "@monkeytype/contracts/presets";
import { initServer } from "@ts-rest/express";
import * as RateLimit from "../../middlewares/rate-limit";
import * as PresetController from "../controllers/preset";
import { callController } from "../ts-rest-adapter";


const s =initServer();
export default s.router(presetsContract, {
  get:  {
    middleware: [  RateLimit.presetsGet],
    handler: async (r)=> callController(PresetController.getPresets)(r),
  },
  add:{middleware: [  RateLimit.presetsAdd],
    handler: async(r)=>callController(PresetController.addPreset)(r),}
    ,
    update: {
      middleware: [  RateLimit.presetsEdit],
      handler: async(r)=>callController(PresetController.editPreset)(r),},
      delete: {
        middleware: [  RateLimit.presetsRemove],
        handler: async(r)=> callController(PresetController.removePreset)(r).}
);
