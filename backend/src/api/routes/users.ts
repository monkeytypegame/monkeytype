import { usersContract } from "@monkeytype/contracts/users";
import { initServer } from "@ts-rest/express";
import { validate } from "../../middlewares/configuration";
import * as UserController from "../controllers/user";
import { callController } from "../ts-rest-adapter";

const requireFilterPresetsEnabled = validate({
  criteria: (configuration) => {
    return configuration.results.filterPresets.enabled;
  },
  invalidMessage: "Result filter presets are not available at this time.",
});

const requireDiscordIntegrationEnabled = validate({
  criteria: (configuration) => {
    return configuration.users.discordIntegration.enabled;
  },
  invalidMessage: "Discord integration is not available at this time",
});

const requireProfilesEnabled = validate({
  criteria: (configuration) => {
    return configuration.users.profiles.enabled;
  },
  invalidMessage: "Profiles are not available at this time",
});

const requireInboxEnabled = validate({
  criteria: (configuration) => {
    return configuration.users.inbox.enabled;
  },
  invalidMessage: "Your inbox is not available at this time.",
});

const s = initServer();
export default s.router(usersContract, {
  get: {
    handler: async (r) => callController(UserController.getUser)(r),
  },
  create: {
    middleware: [
      validate({
        criteria: (configuration) => {
          return configuration.users.signUp;
        },
        invalidMessage: "Sign up is temporarily disabled",
      }),
    ],
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
    middleware: [requireFilterPresetsEnabled],
    handler: async (r) =>
      callController(UserController.addResultFilterPreset)(r),
  },
  removeResultFilterPreset: {
    middleware: [requireFilterPresetsEnabled],
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
    middleware: [requireDiscordIntegrationEnabled],
    handler: async (r) => callController(UserController.getOauthLink)(r),
  },
  linkDiscord: {
    middleware: [requireDiscordIntegrationEnabled],
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
    middleware: [requireProfilesEnabled],
    handler: async (r) => callController(UserController.getProfile)(r),
  },
  updateProfile: {
    middleware: [requireProfilesEnabled],
    handler: async (r) => callController(UserController.updateProfile)(r),
  },
  getInbox: {
    middleware: [requireInboxEnabled],
    handler: async (r) => callController(UserController.getInbox)(r),
  },
  updateInbox: {
    middleware: [requireInboxEnabled],
    handler: async (r) => callController(UserController.updateInbox)(r),
  },
  report: {
    middleware: [
      validate({
        criteria: (configuration) => {
          return configuration.quotes.reporting.enabled;
        },
        invalidMessage: "User reporting is unavailable.",
      }),
    ],
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
