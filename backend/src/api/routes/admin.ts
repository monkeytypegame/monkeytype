// import joi from "joi";
import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import {
  asyncHandler,
  checkIfUserIsAdmin,
  validateConfiguration,
} from "../../middlewares/api-utils";
import * as AdminController from "../controllers/admin";
import { onePerMin } from "../../middlewares/rate-limit";
import { toggleBan } from "../controllers/user";

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
  onePerMin,
  authenticateRequest({
    noCache: true,
  }),
  checkIfUserIsAdmin(),
  asyncHandler(AdminController.test)
);

router.post(
  "/toggleBan",
  onePerMin,
  authenticateRequest({
    noCache: true,
  }),
  checkIfUserIsAdmin(),
  asyncHandler(toggleBan)
);

export default router;
