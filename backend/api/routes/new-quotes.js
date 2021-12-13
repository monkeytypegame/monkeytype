const { authenticateRequest } = require("../../middlewares/auth");
const { Router } = require("express");
const NewQuotesController = require("../controllers/new-quotes");
const RateLimit = require("../../middlewares/rate-limit");

const router = Router();

router.get(
  "/get",
  RateLimit.newQuotesGet,
  authenticateRequest,
  NewQuotesController.getQuotes
);

router.post(
  "/add",
  RateLimit.newQuotesAdd,
  authenticateRequest,
  NewQuotesController.addQuote
);

router.post(
  "/approve",
  RateLimit.newQuotesAction,
  authenticateRequest,
  NewQuotesController.approve
);

router.post(
  "/refuse",
  RateLimit.newQuotesAction,
  authenticateRequest,
  NewQuotesController.refuse
);

//Add route to allow moderator to edit before submisison

module.exports = router;
