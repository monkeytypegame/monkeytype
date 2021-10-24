const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const NewQuotesController = require("../controllers/new-quotes");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/get",
  RateLimit.limit500perhour,
  authenticateRequest,
  NewQuotesController.getQuotes
);

router.post(
  "/add",
  RateLimit.limit60perhour,
  authenticateRequest,
  NewQuotesController.addQuote
);

router.post(
  "/approve",
  RateLimit.limit500perhour,
  authenticateRequest,
  NewQuotesController.approve
);

router.post(
  "/refuse",
  RateLimit.limit500perhour,
  authenticateRequest,
  NewQuotesController.refuse
);

//Add route to allow moderator to edit before submisison

module.exports = router;
