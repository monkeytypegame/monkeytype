import joi from "joi";
import { Router } from "express";
import { asyncHandler, validateRequest } from "../../middlewares/api-utils";
import * as ConfigurationController from "../controllers/configuration";

const router = Router();

router.get("/", asyncHandler(ConfigurationController.getConfiguration));

if (process.env.MODE === "dev") {
  router.patch(
    "/",
    validateRequest({
      body: {
        configuration: joi.object(),
      },
    }),
    asyncHandler(ConfigurationController.updateConfiguration)
  );

  router.get("/schema", asyncHandler(ConfigurationController.getSchema));
}

export default router;
