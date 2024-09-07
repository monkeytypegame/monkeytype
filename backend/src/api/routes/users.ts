import { usersContract } from "@monkeytype/contracts/users";
import { initServer } from "@ts-rest/express";
import { withApeRateLimiter2 as withApeRateLimiter } from "../../middlewares/ape-rate-limit";
import { validate } from "../../middlewares/configuration";
import { checkUserPermissions } from "../../middlewares/permission";
import * as RateLimit from "../../middlewares/rate-limit";
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
    middleware: [RateLimit.userGet],
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
      RateLimit.userSignup,
    ],
    handler: async (r) => callController(UserController.createNewUser)(r),
  },
  getNameAvailability: {
    middleware: [RateLimit.userCheckName],
    handler: async (r) => callController(UserController.checkName)(r),
  },
  delete: {
    middleware: [RateLimit.userDelete],
    handler: async (r) => callController(UserController.deleteUser)(r),
  },
  reset: {
    middleware: [RateLimit.userReset],
    handler: async (r) => callController(UserController.resetUser)(r),
  },
  updateName: {
    middleware: [RateLimit.userUpdateName],
    handler: async (r) => callController(UserController.updateName)(r),
  },
  updateLeaderboardMemory: {
    middleware: [RateLimit.userUpdateLBMemory],
    handler: async (r) => callController(UserController.updateLbMemory)(r),
  },
  updateEmail: {
    middleware: [RateLimit.userUpdateEmail],
    handler: async (r) => callController(UserController.updateEmail)(r),
  },
  updatePassword: {
    middleware: [RateLimit.userUpdateEmail],
    handler: async (r) => callController(UserController.updatePassword)(r),
  },
  getPersonalBests: {
    middleware: [withApeRateLimiter(RateLimit.userGet)],
    handler: async (r) => callController(UserController.getPersonalBests)(r),
  },
  deletePersonalBests: {
    middleware: [RateLimit.userClearPB],
    handler: async (r) => callController(UserController.clearPb)(r),
  },
  optOutOfLeaderboards: {
    middleware: [RateLimit.userOptOutOfLeaderboards],
    handler: async (r) =>
      callController(UserController.optOutOfLeaderboards)(r),
  },
  addResultFilterPreset: {
    middleware: [requireFilterPresetsEnabled, RateLimit.userCustomFilterAdd],
    handler: async (r) =>
      callController(UserController.addResultFilterPreset)(r),
  },
  removeResultFilterPreset: {
    middleware: [requireFilterPresetsEnabled, RateLimit.userCustomFilterRemove],
    handler: async (r) =>
      callController(UserController.removeResultFilterPreset)(r),
  },
  getTags: {
    middleware: [withApeRateLimiter(RateLimit.userTagsGet)],
    handler: async (r) => callController(UserController.getTags)(r),
  },
  createTag: {
    middleware: [RateLimit.userTagsAdd],
    handler: async (r) => callController(UserController.addTag)(r),
  },
  editTag: {
    middleware: [RateLimit.userTagsEdit],
    handler: async (r) => callController(UserController.editTag)(r),
  },
  deleteTag: {
    middleware: [RateLimit.userTagsRemove],
    handler: async (r) => callController(UserController.removeTag)(r),
  },
  deleteTagPersonalBest: {
    middleware: [RateLimit.userTagsClearPB],
    handler: async (r) => callController(UserController.clearTagPb)(r),
  },
  getCustomThemes: {
    middleware: [RateLimit.userCustomThemeGet],
    handler: async (r) => callController(UserController.getCustomThemes)(r),
  },
  addCustomTheme: {
    middleware: [RateLimit.userCustomThemeAdd],
    handler: async (r) => callController(UserController.addCustomTheme)(r),
  },
  deleteCustomTheme: {
    middleware: [RateLimit.userCustomThemeRemove],
    handler: async (r) => callController(UserController.removeCustomTheme)(r),
  },
  editCustomTheme: {
    middleware: [RateLimit.userCustomThemeEdit],
    handler: async (r) => callController(UserController.editCustomTheme)(r),
  },
  getDiscordOAuth: {
    middleware: [requireDiscordIntegrationEnabled, RateLimit.userDiscordLink],
    handler: async (r) => callController(UserController.getOauthLink)(r),
  },
  linkDiscord: {
    middleware: [requireDiscordIntegrationEnabled, RateLimit.userDiscordLink],
    handler: async (r) => callController(UserController.linkDiscord)(r),
  },
  unlinkDiscord: {
    middleware: [RateLimit.userDiscordUnlink],
    handler: async (r) => callController(UserController.unlinkDiscord)(r),
  },
  getStats: {
    middleware: [withApeRateLimiter(RateLimit.userGet)],
    handler: async (r) => callController(UserController.getStats)(r),
  },
  setStreakHourOffset: {
    middleware: [RateLimit.setStreakHourOffset],
    handler: async (r) => callController(UserController.setStreakHourOffset)(r),
  },
  getFavoriteQuotes: {
    middleware: [RateLimit.quoteFavoriteGet],
    handler: async (r) => callController(UserController.getFavoriteQuotes)(r),
  },
  addQuoteToFavorites: {
    middleware: [RateLimit.quoteFavoritePost],
    handler: async (r) => callController(UserController.addFavoriteQuote)(r),
  },
  removeQuoteFromFavorites: {
    middleware: [RateLimit.quoteFavoriteDelete],
    handler: async (r) => callController(UserController.removeFavoriteQuote)(r),
  },
  getProfile: {
    middleware: [
      requireProfilesEnabled,
      withApeRateLimiter(RateLimit.userProfileGet),
    ],
    handler: async (r) => callController(UserController.getProfile)(r),
  },
  updateProfile: {
    middleware: [
      requireProfilesEnabled,
      withApeRateLimiter(RateLimit.userProfileUpdate),
    ],
    handler: async (r) => callController(UserController.updateProfile)(r),
  },
  getInbox: {
    middleware: [requireInboxEnabled, RateLimit.userMailGet],
    handler: async (r) => callController(UserController.getInbox)(r),
  },
  updateInbox: {
    middleware: [requireInboxEnabled, RateLimit.userMailUpdate],
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
      checkUserPermissions(["canReport"], {
        criteria: (user) => {
          return user.canReport !== false;
        },
      }),
      RateLimit.quoteReportSubmit,
    ],
    handler: async (r) => callController(UserController.reportUser)(r),
  },
  verificationEmail: {
    middleware: [RateLimit.userRequestVerificationEmail],
    handler: async (r) =>
      callController(UserController.sendVerificationEmail)(r),
  },
  forgotPasswordEmail: {
    middleware: [RateLimit.userForgotPasswordEmail],
    handler: async (r) =>
      callController(UserController.sendForgotPasswordEmail)(r),
  },
  revokeAllTokens: {
    middleware: [RateLimit.userRevokeAllTokens],
    handler: async (r) => callController(UserController.revokeAllTokens)(r),
  },
  getTestActivity: {
    middleware: [RateLimit.userTestActivity],
    handler: async (r) => callController(UserController.getTestActivity)(r),
  },
  getCurrentTestActivity: {
    middleware: [withApeRateLimiter(RateLimit.userCurrentTestActivity)],
    handler: async (r) =>
      callController(UserController.getCurrentTestActivity)(r),
  },
  getStreak: {
    middleware: [withApeRateLimiter(RateLimit.userStreak)],
    handler: async (r) => callController(UserController.getStreak)(r),
  },
});
