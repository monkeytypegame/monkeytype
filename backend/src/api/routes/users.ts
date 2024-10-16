import { usersContract } from "@monkeytype/contracts/users";
import { initServer } from "@ts-rest/express";
import * as UserController from "../controllers/user";
import { callController } from "../ts-rest-adapter";
import { getProfileImage } from "../../services/profile-image";

const s = initServer();
export default s.router(usersContract, {
  get: {
    handler: async (r) => callController(UserController.getUser)(r),
  },
  create: {
    handler: async (r) => callController(UserController.createNewUser)(r),
  },
  getNameAvailability: {
    handler: async (r) => callController(UserController.checkName)(r),
  },
  delete: {
    handler: async (r) => callController(UserController.deleteUser)(r),
  },
  reset: {
    handler: async (r) => callController(UserController.resetUser)(r),
  },
  updateName: {
    handler: async (r) => callController(UserController.updateName)(r),
  },
  updateLeaderboardMemory: {
    handler: async (r) => callController(UserController.updateLbMemory)(r),
  },
  updateEmail: {
    handler: async (r) => callController(UserController.updateEmail)(r),
  },
  updatePassword: {
    handler: async (r) => callController(UserController.updatePassword)(r),
  },
  getPersonalBests: {
    handler: async (r) => callController(UserController.getPersonalBests)(r),
  },
  deletePersonalBests: {
    handler: async (r) => callController(UserController.clearPb)(r),
  },
  optOutOfLeaderboards: {
    handler: async (r) =>
      callController(UserController.optOutOfLeaderboards)(r),
  },
  addResultFilterPreset: {
    handler: async (r) =>
      callController(UserController.addResultFilterPreset)(r),
  },
  removeResultFilterPreset: {
    handler: async (r) =>
      callController(UserController.removeResultFilterPreset)(r),
  },
  getTags: {
    handler: async (r) => callController(UserController.getTags)(r),
  },
  createTag: {
    handler: async (r) => callController(UserController.addTag)(r),
  },
  editTag: {
    handler: async (r) => callController(UserController.editTag)(r),
  },
  deleteTag: {
    handler: async (r) => callController(UserController.removeTag)(r),
  },
  deleteTagPersonalBest: {
    handler: async (r) => callController(UserController.clearTagPb)(r),
  },
  getCustomThemes: {
    handler: async (r) => callController(UserController.getCustomThemes)(r),
  },
  addCustomTheme: {
    handler: async (r) => callController(UserController.addCustomTheme)(r),
  },
  deleteCustomTheme: {
    handler: async (r) => callController(UserController.removeCustomTheme)(r),
  },
  editCustomTheme: {
    handler: async (r) => callController(UserController.editCustomTheme)(r),
  },
  getDiscordOAuth: {
    handler: async (r) => callController(UserController.getOauthLink)(r),
  },
  linkDiscord: {
    handler: async (r) => callController(UserController.linkDiscord)(r),
  },
  unlinkDiscord: {
    handler: async (r) => callController(UserController.unlinkDiscord)(r),
  },
  getStats: {
    handler: async (r) => callController(UserController.getStats)(r),
  },
  setStreakHourOffset: {
    handler: async (r) => callController(UserController.setStreakHourOffset)(r),
  },
  getFavoriteQuotes: {
    handler: async (r) => callController(UserController.getFavoriteQuotes)(r),
  },
  addQuoteToFavorites: {
    handler: async (r) => callController(UserController.addFavoriteQuote)(r),
  },
  removeQuoteFromFavorites: {
    handler: async (r) => callController(UserController.removeFavoriteQuote)(r),
  },
  getProfile: {
    handler: async (r) => callController(UserController.getProfile)(r),
  },
  updateProfile: {
    handler: async (r) => callController(UserController.updateProfile)(r),
  },
  getProfileImage: {
    // @ts-expect-error  Contract has the body as string for the frontend but Buffer on the backend.
    handler: async (r) => {
      const profile = await UserController.getProfileFromQuery(
        r.req.params.uidOrName,
        r.req.query.isUid
      );
      const body = await getProfileImage(profile);
      r.res.setHeader("Cache-Control", "max-age=21600"); //six hours
      return { status: 200, body };
    },
  },
  getInbox: {
    handler: async (r) => callController(UserController.getInbox)(r),
  },
  updateInbox: {
    handler: async (r) => callController(UserController.updateInbox)(r),
  },
  report: {
    handler: async (r) => callController(UserController.reportUser)(r),
  },
  verificationEmail: {
    handler: async (r) =>
      callController(UserController.sendVerificationEmail)(r),
  },
  forgotPasswordEmail: {
    handler: async (r) =>
      callController(UserController.sendForgotPasswordEmail)(r),
  },
  revokeAllTokens: {
    handler: async (r) => callController(UserController.revokeAllTokens)(r),
  },
  getTestActivity: {
    handler: async (r) => callController(UserController.getTestActivity)(r),
  },
  getCurrentTestActivity: {
    handler: async (r) =>
      callController(UserController.getCurrentTestActivity)(r),
  },
  getStreak: {
    handler: async (r) => callController(UserController.getStreak)(r),
  },
});
