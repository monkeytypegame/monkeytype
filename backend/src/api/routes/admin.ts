// import joi from "joi";
import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import {
  asyncHandler,
  checkIfUserIsAdmin,
  validateConfiguration,
} from "../../middlewares/api-utils";
import * as AdminController from "../controllers/admin";

const router = Router();

router.use(
  validateConfiguration({
    criteria: (configuration) => {
      return configuration.admin.endpointsEnabled;
    },
    invalidMessage: "Admin endpoints are currently disabled.",
  })
);

router.get(
  "/",
  authenticateRequest({
    noCache: true,
  }),
  checkIfUserIsAdmin(),
  asyncHandler(AdminController.test)
);

export default router;
