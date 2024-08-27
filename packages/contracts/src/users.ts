import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  CommonResponses,
  EndpointMetadata,
  MonkeyResponseSchema,
  responseWithData,
  responseWithNullableData,
} from "./schemas/api";
import {
  CustomThemeNameSchema,
  CustomThemeSchema,
  FavoriteQuotesSchema,
  MonkeyMailSchema,
  ResultFiltersSchema,
  StreakHourOffsetSchema,
  TagNameSchema,
  UserProfileDetailsSchema,
  UserProfileSchema,
  UserSchema,
  UserTagSchema,
} from "./schemas/users";
import { Mode2Schema, ModeSchema, PersonalBestsSchema } from "./schemas/shared";
import { IdSchema, LanguageSchema } from "./schemas/util";
import { CustomThemeColorsSchema } from "./schemas/configs";
import { QuoteIdSchema } from "./schemas/quotes";

export const GetUserResponseSchema = responseWithData(UserSchema);
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;

const UserNameSchema = z
  .string()
  .min(1)
  .max(16)
  .regex(/^[\da-zA-Z_-]+$/); //todo profanity

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: UserNameSchema,
  uid: z.string(), //defined by firebase, no validation should be applied
  captcha: z.string(), //defined by google recaptcha, no validation should be applied
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const CheckNamePathParametersSchema = z.object({
  name: UserNameSchema,
});
export type CheckNamePathParameters = z.infer<
  typeof CheckNamePathParametersSchema
>;

export const UpdateUserNameRequestSchema = z.object({
  name: UserNameSchema,
});
export type UpdateUserNameRequest = z.infer<typeof UpdateUserNameRequestSchema>;

export const UpdateLeaderboardMemoryRequestSchema = z.object({
  mode: ModeSchema,
  mode2: Mode2Schema,
  language: LanguageSchema,
  rank: z.number().int().nonnegative(),
});
export type UpdateLeaderboardMemoryRequest = z.infer<
  typeof UpdateLeaderboardMemoryRequestSchema
>;

export const UpdateEmailRequestSchema = z.object({
  newEmail: z.string().email(),
  previousEmail: z.string().email(),
});
export type UpdateEmailRequestSchema = z.infer<typeof UpdateEmailRequestSchema>;

export const UpdatePasswordRequestSchema = z.object({
  newPassword: z.string().min(6),
});
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;

export const GetPersonalBestsQuerySchema = z.object({
  mode: ModeSchema,
  mode2: Mode2Schema,
});
export type GetPersonalBestsQuery = z.infer<typeof GetPersonalBestsQuerySchema>;

export const GetPersonalBestsResponseSchema =
  responseWithNullableData(PersonalBestsSchema);
export type GetPersonalBestsResponse = z.infer<
  typeof GetPersonalBestsResponseSchema
>;

export const AddResultFilterPresetRequestSchema = ResultFiltersSchema;
export type AddResultFilterPresetRequest = z.infer<
  typeof AddResultFilterPresetRequestSchema
>;
export const AddResultFilterPresetResponseSchema = responseWithData(
  IdSchema.describe("Id of the created result filter preset")
);
export type AddResultFilterPresetResponse = z.infer<
  typeof AddResultFilterPresetResponseSchema
>;

export const RemoveResultFilterPresetPathParamsSchema = z.object({
  presetId: IdSchema,
});
export type RemoveResultFilterPresetPathParams = z.infer<
  typeof RemoveResultFilterPresetPathParamsSchema
>;

export const GetTagsResponseSchema = responseWithData(z.array(UserTagSchema));
export type GetTagsResponse = z.infer<typeof GetTagsResponseSchema>;

export const AddTagRequestSchema = z.object({
  tagName: TagNameSchema,
});
export type AddTagRequest = z.infer<typeof AddTagRequestSchema>;

export const AddTagResponseSchema = responseWithData(UserTagSchema);
export type AddTagResponse = z.infer<typeof AddTagRequestSchema>;

export const EditTagRequestSchema = z.object({
  tagId: IdSchema,
  newName: TagNameSchema,
});

export const TagIdPathParamsSchema = z.object({
  tagId: IdSchema,
});
export type TagIdPathParams = z.infer<typeof TagIdPathParamsSchema>;

export const GetCustomThemesResponseSchema = responseWithData(
  z.array(CustomThemeSchema)
);
export type GetCustomThemesResponse = z.infer<
  typeof GetCustomThemesResponseSchema
>;

export const AddCustomThemeRequestSchema = z.object({
  name: CustomThemeNameSchema,
  colors: CustomThemeColorsSchema,
});
export type AddCustomThemeRequest = z.infer<typeof AddCustomThemeRequestSchema>;

export const AddCustomThemeResponseSchema = responseWithData(
  CustomThemeSchema.pick({ _id: true, name: true })
);
export type AddCustomThemeResponse = z.infer<
  typeof AddCustomThemeResponseSchema
>;

export const DeleteCustomThemeRequestSchema = z.object({
  themeId: IdSchema,
});
export type DeleteCustomThemeRequest = z.infer<
  typeof DeleteCustomThemeRequestSchema
>;

export const EditCustomThemeRequstSchema = z.object({
  themeId: IdSchema,
  theme: CustomThemeSchema.pick({ name: true, colors: true }),
});
export type EditCustomThemeRequst = z.infer<typeof EditCustomThemeRequstSchema>;

export const GetDiscordOauthLinkResponseSchema = responseWithData(
  z.object({
    url: z.string().url(),
  })
);
export type GetDiscordOauthLinkResponse = z.infer<
  typeof GetDiscordOauthLinkResponseSchema
>;

export const LinkDiscordRequestSchema = z.object({
  tokenType: z.string(),
  accessToken: z.string(),
  state: z.string().length(20),
});
export type LinkDiscordRequest = z.infer<typeof LinkDiscordRequestSchema>;

export const LinkDiscordResponseSchema = responseWithData(
  UserSchema.pick({ discordId: true, discordAvatar: true })
);

export const GetStatsResponseSchema = responseWithData(
  UserSchema.pick({
    completedTests: true,
    startedTests: true,
    timeTyping: true,
  })
);
export type GetStatsResponse = z.infer<typeof GetStatsResponseSchema>;

export const SetStreakHourOffsetRequestSchema = z.object({
  hourOffset: StreakHourOffsetSchema,
});
export type SetStreakHourOffsetRequest = z.infer<
  typeof SetStreakHourOffsetRequestSchema
>;

export const GetFavoriteQuotesResponseSchema =
  responseWithData(FavoriteQuotesSchema);
export type GetFavoriteQuotesResponse = z.infer<
  typeof GetFavoriteQuotesResponseSchema
>;

export const AddFavoriteQuoteRequestSchema = z.object({
  language: LanguageSchema,
  quoteId: QuoteIdSchema,
});
export type AddFavoriteQuoteRequest = z.infer<
  typeof AddFavoriteQuoteRequestSchema
>;

export const RemoveFavoriteQuoteRequestSchema = z.object({
  language: LanguageSchema,
  quoteId: QuoteIdSchema,
});
export type RemoveFavoriteQuoteRequest = z.infer<
  typeof RemoveFavoriteQuoteRequestSchema
>;

export const GetProfilePathParamsSchema = z.object({
  uidOrName: z.string(),
});
export type GetProfilePathParams = z.infer<typeof GetProfilePathParamsSchema>;

export const GetProfileQuerySchema = z.object({
  isUid: z
    .literal("")
    .transform((it) => it === "")
    .transform(Boolean)
    .or(z.boolean()),
});
export type GetProfileQuery = z.infer<typeof GetProfileQuerySchema>;

export const GetProfileResponseSchema = responseWithData(UserProfileSchema);
export type GetProfileResponse = z.infer<typeof GetProfileResponseSchema>;

export const UpdateUserProfileRequestSchema = UserProfileDetailsSchema;
export type UpdateUserProfileRequest = z.infer<
  typeof UpdateUserProfileRequestSchema
>;

export const UpdateUserProfileResponseSchema = responseWithData(
  UserProfileDetailsSchema
);
export type UpdateUserProfileResponse = z.infer<
  typeof UpdateUserProfileResponseSchema
>;

export const GetUserInboxResponseSchema = responseWithData(
  z.object({
    inbox: z.array(MonkeyMailSchema),
    maxMail: z.number().int(),
  })
);
export type GetUserInboxResponse = z.infer<typeof GetUserInboxResponseSchema>;

export const UpdateUserInboxRequestSchema = z.object({
  mailIdsToDelete: z.array(z.string().uuid()).min(0).optional(),
  mailIdsToRead: z.array(z.string().uuid()).min(0).optional(),
});
export type UpdateUserInboxRequest = z.infer<
  typeof UpdateUserInboxRequestSchema
>;

const c = initContract();

export const usersContract = c.router(
  {
    get: {
      summary: "get user",
      description: "Get a user's data.",
      method: "GET",
      path: "",
      responses: {
        200: GetUserResponseSchema,
      },
    },
    create: {
      summary: "create user",
      description: "Creates a new user",
      method: "POST",
      path: "/signup",
      body: CreateUserRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getNameAvailability: {
      summary: "check name",
      description: "Checks to see if a username is available",
      method: "GET",
      path: "/checkName:name",
      pathParams: CheckNamePathParametersSchema.strict(),
      responses: {
        200: MonkeyResponseSchema.describe("Name is available"),
        400: MonkeyResponseSchema.describe("Name is not available"),
      },
      metadata: {
        authenticationOptions: {
          isPublic: true,
        },
      } as EndpointMetadata,
    },
    delete: {
      summary: "delete user",
      description: "Deletes a user's account",
      method: "DELETE",
      path: "",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    reset: {
      summary: "reset user",
      description: "Completely resets a user's account to a blank state",
      method: "PATCH",
      path: "/reset",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    updateName: {
      summary: "update username",
      description: "Updates a user's name",
      method: "PATCH",
      path: "/name",
      body: UpdateUserNameRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    updateLeaderboardMemory: {
      summary: "update lbMemory",
      description: "Updates a user's cached leaderboard state",
      method: "PATCH",
      path: "/leaderboardMemory",
      body: UpdateLeaderboardMemoryRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    updateEmail: {
      summary: "update email",
      description: "Updates a user's email",
      method: "PATCH",
      path: "/email",
      body: UpdateEmailRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    updatePassword: {
      summary: "update password",
      description: "Updates a user's email",
      method: "PATCH",
      path: "/password",
      body: UpdatePasswordRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    getPersonalBests: {
      summary: "get personal bests",
      description: "Get user's personal bests",
      method: "GET",
      path: "/personalBests",
      query: GetPersonalBestsQuerySchema.strict(),
      responses: {
        200: GetPersonalBestsResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          acceptApeKeys: true,
        },
      } as EndpointMetadata,
    },
    deletePersonalBests: {
      summary: "delete personal bests",
      description: "Deletes a user's personal bests",
      method: "DELETE",
      path: "/personalBests",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    optOutOfLeaderboards: {
      summary: "leaderboards opt out",
      description: "Opt out of the leaderboards",
      method: "POST",
      path: "/optOutOfLeaderboards",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          requireFreshToken: true,
        },
      } as EndpointMetadata,
    },
    addResultFilterPreset: {
      summary: "add result filter preset",
      description: "Add a result filter preset",
      method: "POST",
      path: "/resultFilterPresets",
      body: AddResultFilterPresetRequestSchema.strict(),
      responses: {
        200: AddResultFilterPresetResponseSchema,
      },
    },
    removeResultFilterPreset: {
      summary: "remove result filter preset",
      description: "Remove a result filter preset",
      method: "DELETE",
      path: "/resultFilterPresets/:presetId",
      pathParams: RemoveResultFilterPresetPathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getTags: {
      summary: "get tags",
      description: "Get the users tags",
      method: "GET",
      path: "/tags",
      responses: {
        200: GetTagsResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          acceptApeKeys: true,
        },
      } as EndpointMetadata,
    },
    createTag: {
      summary: "add tag",
      description: "Add a tag for the current user",
      method: "POST",
      path: "/tags",
      body: AddTagRequestSchema.strict(),
      responses: {
        200: AddTagResponseSchema,
      },
    },
    editTag: {
      summary: "edit tag",
      description: "Edit a tag",
      method: "PATCH",
      path: "/tags",
      body: EditTagRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    deleteTag: {
      summary: "delete tag",
      description: "Delete a tag",
      method: "DELETE",
      path: "/tags/:tagId",
      pathParams: TagIdPathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    deleteTagPersonalBest: {
      summary: "delete tag PBs",
      description: "Delete personal bests of a tag",
      method: "DELETE",
      path: "/tags/:tagId/personalBest",
      pathParams: TagIdPathParamsSchema.strict(),
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getCustomThemes: {
      summary: "get custom themes",
      description: "Get custom themes for the current user",
      method: "GET",
      path: "/customThemes",
      responses: {
        200: GetCustomThemesResponseSchema,
      },
    },
    addCustomTheme: {
      summary: "add custom themes",
      description: "Add a custom theme for the current user",
      method: "POST",
      path: "/customThemes",
      body: AddCustomThemeRequestSchema.strict(),
      responses: {
        200: AddCustomThemeResponseSchema,
      },
    },
    deleteCustomTheme: {
      summary: "delete custom themes",
      description: "Delete a custom theme",
      method: "DELETE",
      path: "/customThemes",
      body: DeleteCustomThemeRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    editCustomTheme: {
      summary: "edit custom themes",
      description: "Edit a custom theme",
      method: "PATCH",
      path: "/customThemes",
      body: EditCustomThemeRequstSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getDiscordOAuth: {
      summary: "discord oauth",
      description: "Start OAuth authentication with discord",
      method: "GET",
      path: "/discord/oauth",
      responses: {
        200: GetDiscordOauthLinkResponseSchema,
      },
    },
    linkDiscord: {
      summary: "link with discord",
      description: "Links a user's account with a discord account",
      method: "POST",
      path: "/discord/link",
      body: LinkDiscordRequestSchema.strict(),
      responses: {
        200: LinkDiscordResponseSchema,
      },
    },
    unlinkDiscord: {
      summary: "unlink discord",
      description: "Unlinks a user's account with a discord account",
      method: "POST",
      path: "/discord/unlink",
      body: c.noBody(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getStats: {
      summary: "get stats",
      description: "Gets a user's typing stats data",
      method: "GET",
      path: "/stats",
      responses: {
        200: GetStatsResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          acceptApeKeys: true,
        },
      } as EndpointMetadata,
    },
    setStreakHourOffset: {
      summary: "set streak hour offset",
      description: "Sets a user's streak hour offset",
      method: "POST",
      path: "/setStreakHourOffset",
      body: SetStreakHourOffsetRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getFavoriteQuotes: {
      summary: "get favorite quotes",
      description: "Gets a user's favorite quotes",
      method: "GET",
      path: "/favoriteQuotes",
      responses: {
        200: GetFavoriteQuotesResponseSchema,
      },
    },
    addQuoteToFavorites: {
      summary: "add favorite quotes",
      description: "Add a quote to the user's favorite quotes",
      method: "POST",
      path: "/favoriteQuotes",
      body: AddFavoriteQuoteRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    removeQuoteFromFavorites: {
      summary: "remove favorite quotes",
      description: "Remove a quote to the user's favorite quotes",
      method: "DELETE",
      path: "/favoriteQuotes",
      body: RemoveFavoriteQuoteRequestSchema.strict(),
      responses: {
        200: MonkeyResponseSchema,
      },
    },
    getProfile: {
      summary: "get profile",
      description: "Gets a user's profile",
      method: "GET",
      path: "/:uidOrName/profile",
      pathParams: GetProfilePathParamsSchema.strict(),
      query: GetProfileQuerySchema.strict(),
      responses: {
        200: GetProfileResponseSchema,
      },
      metadata: {
        authenticationOptions: {
          isPublic: true,
        },
      } as EndpointMetadata,
    },
    updateProfile: {
      summary: "update profile",
      description: "Update a user's profile",
      method: "PATCH",
      path: "/profile",
      body: UpdateUserProfileRequestSchema.strict(),
      responses: {
        200: UpdateUserProfileResponseSchema,
      },
    },
    getInbox: {
      summary: "get inbox",
      description: "Gets the user's inbox",
      method: "GET",
      path: "/inbox",
      responses: {
        200: GetUserInboxResponseSchema,
      },
    },
    updateInbox: {
      summary: "update inbox",
      description: "Updates the user's inbox",
      method: "PATCH",
      body: UpdateUserInboxRequestSchema.strict(),
      path: "/inbox",
      responses: {
        200: MonkeyResponseSchema,
      },
    },
  },
  {
    pathPrefix: "/users",
    strictStatusCodes: true,
    metadata: {
      openApiTags: "users",
    } as EndpointMetadata,

    commonResponses: CommonResponses,
  }
);
