import * as PsaController from "../controllers/psa";
import * as RateLimit from "../../middlewares/rate-limit";
import { asyncHandler } from "../../middlewares/api-utils";
import { Router } from "express";

const router = Router();

router.get("/", RateLimit.psaGet, asyncHandler(PsaController.getPsas));

export default router;
