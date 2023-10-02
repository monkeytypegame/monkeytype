// import joi from "joi";
import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import {
  asyncHandler,
  checkIfUserIsAdmin,
  validateConfiguration,
  validateRequest,
} from "../../middlewares/api-utils";
import * as AdminController from "../controllers/admin";
import { adminLimit } from "../../middlewares/rate-limit";
import { toggleBan } from "../controllers/user";
import joi from "joi";

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
  adminLimit,
  authenticateRequest({
    noCache: true,
  }),
  checkIfUserIsAdmin(),
  asyncHandler(AdminController.test)
);

router.post(
  "/toggleBan",
  adminLimit,
  authenticateRequest({
    noCache: true,
  }),
  checkIfUserIsAdmin(),
  validateRequest({
    body: {
      uid: joi.string().required().token(),
    },
  }),
  asyncHandler(toggleBan)
);

export default router;
