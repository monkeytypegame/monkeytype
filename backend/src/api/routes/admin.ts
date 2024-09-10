// import joi from "joi";

import * as AdminController from "../controllers/admin";

import { adminContract } from "@monkeytype/contracts/admin";
import { initServer } from "@ts-rest/express";
import { validate } from "../../middlewares/configuration";
import { callController } from "../ts-rest-adapter";

const commonMiddleware = [
  validate({
    criteria: (configuration) => {
      return configuration.admin.endpointsEnabled;
    },
    invalidMessage: "Admin endpoints are currently disabled.",
  }),
];

const s = initServer();
export default s.router(adminContract, {
  test: {
    middleware: commonMiddleware,
    handler: async (r) => callController(AdminController.test)(r),
  },
  toggleBan: {
    middleware: commonMiddleware,
    handler: async (r) => callController(AdminController.toggleBan)(r),
  },
  acceptReports: {
    middleware: commonMiddleware,
    handler: async (r) => callController(AdminController.acceptReports)(r),
  },
  rejectReports: {
    middleware: commonMiddleware,
    handler: async (r) => callController(AdminController.rejectReports)(r),
  },
  sendForgotPasswordEmail: {
    middleware: commonMiddleware,
    handler: async (r) =>
      callController(AdminController.sendForgotPasswordEmail)(r),
  },
});
