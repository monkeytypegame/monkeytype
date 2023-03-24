// import joi from "joi";
import { Router } from "express";
import { authenticateRequest } from "../../middlewares/auth";
import { asyncHandler, checkIfUserIsAdmin } from "../../middlewares/api-utils";
import * as AdminController from "../controllers/admin";

const router = Router();

router.get(
  "/",
  authenticateRequest({
    noCache: true,
  }),
  checkIfUserIsAdmin(),
  asyncHandler(AdminController.test)
);

export default router;
