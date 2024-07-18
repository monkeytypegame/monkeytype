import { Router } from "express";
import * as PsaController from "../controllers/psa.js";
import * as RateLimit from "../../middlewares/rate-limit.js";
import { asyncHandler } from "../../middlewares/utility.js";

const router = Router();

router.get("/", RateLimit.psaGet, asyncHandler(PsaController.getPsas));

export default router;
