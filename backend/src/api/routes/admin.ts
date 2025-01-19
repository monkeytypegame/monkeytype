// import joi from "joi";

import * as AdminController from "../controllers/admin";
import { adminContract } from "@monkeytype/contracts/admin";
import { initServer } from "@ts-rest/express";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(adminContract, {
  test: {
    handler: async (r) => callController(AdminController.test)(r),
  },
  toggleBan: {
    handler: async (r) => callController(AdminController.toggleBan)(r),
  },
  acceptReports: {
    handler: async (r) => callController(AdminController.acceptReports)(r),
  },
  rejectReports: {
    handler: async (r) => callController(AdminController.rejectReports)(r),
  },
  sendForgotPasswordEmail: {
    handler: async (r) =>
      callController(AdminController.sendForgotPasswordEmail)(r),
  },
});
